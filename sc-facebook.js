;(function() {
	
	
	
	// Listen for share button clicks
	var share = {};
	var isDataFromModal = false;
	
	// Dictionary of selectors
	var selectors = {
		
		// .userContentWrapper - new FB news feed, 3/2014
		timelineItem: [
			'.genericStreamStory',
			'.fbTimelineUnit',
			'.UIStandardFrame_Content',
			'.fbPhotoSnowlift',
			'.userContentWrapper',
			'.timelineUnitContainer',
			'.tickerDialogContent > .commentable_item' // target the ticker posts' contents - 11/18/15
		].join(', '),
		
		via: [
			'.passiveName',
			'.actorName',
			'.unitHeader',
			'#fbPhotoPageAuthorName a'
		].join(', '),
		
		// .tlTxFe is used on new timeline
		text: [
			'.userContent',
			// photo caption
			'.text_exposed_root',
			// Above video
			'.aboveUnitContent',
			'.messageBody',
			'.tlTxFe',
			'.caption',
			'.fbPhotosPhotoCaption',
		].join(', '),
		
		thumb: [
			'img._46-i',
			'.uiScaledImageContainer:not(.fbStoryAttachmentImage) img',
			'.uiPhotoThumb img',
			'.photoUnit img',
			'.fbPhotoImage',
			'.spotlight'
		].join(', '),
		
		videoThumb: 'video ~ div > img',
		
		// a.shareLink - page timelines, 3/2014
		// .shareLink a:not([href="#"]) - small embeds on user timeline, ex. YouTube, 3/2014
		// ._52c6 - new newsfeed links, 3/2014
		// a.uiVideoLink - video modal link
		anchor: [
			'a.shareMediaLink',
			'.uiAttachmentTitle a',
			'a.externalShareUnit',
			'a.shareLink',
			'a.uiVideoLink',
			'.shareLink a:not([href="#"])',
			'._52c6:not(.UFIContainer ._52c6)',
		].join(', '),
		
		// A backup, slower selector logic
		anchorSecondary: 'a[target="_blank"]:not([data-appname]):not(.userContent a):not(.UFIContainer a)'
		
	};
	
	// TODO
	//  - Fix status updates w/ articles inline? Chris Day's profile
	function getClosestShareData(elem) {
		
		var parent = $(elem).closest(selectors.timelineItem);
		
		// reset share object on every 'share' button click
		var share = {};
		
		// find the name of the person that shared the attachment
		share.via = $(selectors.via, parent).first().text();
		
		// find the message for this attachment, or if none use the attachment caption
		share.text = $(selectors.text, parent).first().text();
		
		var $thumb = $(selectors.thumb, parent).first();
		var image;
		
		// Make sure retrieved images are part of the post, not comments below
		if (!$thumb.closest('.UFIContainer').length) {
			var $fullSizeThumbHolder = $thumb.closest('a');
			var $fullSizeThumbMatches = /(?:;|&)src=([^&]+)&/i.exec($fullSizeThumbHolder.attr('ajaxify'));
			var $fullSizeThumb = $fullSizeThumbMatches && $fullSizeThumbMatches[1] && decodeURIComponent($fullSizeThumbMatches[1]);
			
			if ($fullSizeThumb) image = $fullSizeThumb; // Give priority to largest image if found
			else image = $thumb.attr('src');
		}
		
		var $videoThumb = $(selectors.videoThumb, parent);
		var $anchor = $(selectors.anchor, parent);
		
		// If we can't find it, try this alternate, slower search looking for external links
		if ($anchor.length === 0) {
			// We exclude the update's written text that may contain possible links = .userContent
			// and we exclude any possible links to an app that was used to post this, ex. Buffer
			$anchor = $(selectors.anchorSecondary, parent);
		}
		
		var url = $anchor.attr('href');
		
		// find picture status
		if ( image ) {
			share.picture = image;
			
			// Disable this until we add sharing to the image modal
			// share.url = $('a.uiPhotoThumb, a.photo', parent).attr('href');
			share.placement = 'facebook-timeline-picture';
			
			// The link to the video in video posts can change a bit between regular video
			// posts, "X liked Y's video", and "X shared Y's video". Since there's no reliable
			// enough way to get the video link based on class names / other DOM cues, we're
			// fetching it by going over all the post's links.
			// Facebook video links can look like 'facebook.com/username/videos/0123456789/'
			// and 'facebook.com/video.php?v=0123456789'
			} else if ($videoThumb.length) {
			var $postLinks = parent.find('a');
			var videoLinkRegex = /(?:\/videos\/\d+\/)|(?:\/video\.php\?v=\d+)/i;
			var videoLink;
			
			$postLinks.each(function() {
				var href = $(this).attr('href') || '';
				if (videoLinkRegex.test(href)) videoLink = href;
			});
			
			if (videoLink) share.url = videoLink;
			if (share.url && share.url[0] == '/') share.url = 'https://facebook.com' + share.url;
			
			share.placement = 'facebook-timeline-video';
			} else if (url) {
			// find link status
			if ( url[0] === '/' ) url = 'https://facebook.com' + url;
			share.url = url;
			share.placement = 'facebook-timeline-link';
			} else {
			// standard text status
			share.placement = 'facebook-timeline-status';
		}
		
		// Sometimes, href attributes are dynamically updated by Facebook, so we
		// have to extract the url from a string that looks like "https://www.facebook.
		// com/l.php?u=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DBF9TjbdJyUE&h=aAQ[…]"
		if (share.url && share.url.indexOf('facebook.com/l.php?') > -1) {
			var urlMatches = share.url.match(/u=([^&]+)/i); // Capture url inside the u= param
			if (urlMatches) share.url = decodeURIComponent(urlMatches[1]);
		}
		
		return share;
	}
	
	var config = {};
	config.base = "https://facebook.com";
	config.time = {
		reload: 800
	};
	config.buttons = [
		
		{
			// Sociocaster link under timeline post content: Like · Comment · Share · Buffer
			name: 'timeline-post-buffer',
			text: 'Sociocaster',
			container: '.commentable_item',
			// after: '.share_action_link',
			// Adjustment made w/ Timeline adjustments noticed by Joel Mar 26 2015
			// [href^="/ajax/sharer"] selector added on 11/18/15 following Facebook markup
			// change (all classes are now mangled).
			// .share_action_link selector added on 1/11/16 following Fb markup change
			after: function($container) {
				var $shareBtn = $container.find('.share_root, .share_action_link, [href^="/ajax/sharer"]').first();
				// share_action_link's parent, only if the par is div.uiPopover
				if ($shareBtn.parent().hasClass('uiPopover')) return $shareBtn.parent();
				return $shareBtn;
			},
			default: [].join(''),
			create: function(btnConfig) {
				
				var span = document.createElement('span');
				var button = document.createElement('a');
				
				button.setAttribute('style', btnConfig.default);
				button.setAttribute('class', 'sc-facebook-newsfeed-post-embed');
				button.setAttribute('href', '#');
				button.textContent = btnConfig.text;
				
				var spacer = document.createElement('span');
				spacer.appendChild(document.createTextNode(' \u00A0')); // A space, followed by a nbsp
				spacer.setAttribute('class', 'sc-facebook-newsfeed-embed-spacer');
				
				span.appendChild(spacer);
				span.appendChild(button);
				
				return span;
			},
			data: function (elem) {
				
				var $elem = $(elem);
				var share = getClosestShareData(elem);
				
				return share;
			},
			clear: function() {
				share = {};
			}
			
		}
		
	];
	
	var scEmbed = function scEmbed() {
		
		var insertButtons = function () {
			
			config.buttons.forEach(function(btnConfig, i){
				
				// Container can be a selector or a function that returns a
				// jQuery object
				var $container = typeof btnConfig.container === 'function' ?
				btnConfig.container( btnConfig ) :
				$(btnConfig.container);
				
				$container.each(function () {
					
					var $container = $(this);
					
					if ( $container.hasClass('sc-inserted') ) return;
					
					$container.addClass('sc-inserted');
					
					var btn = btnConfig.create(btnConfig);
					
					// EXT
					if ( btnConfig.after ) {
						if (typeof btnConfig.after === 'function') {
							btnConfig.after($container).after(btn);
							} else {
							$container.find(btnConfig.after).after(btn);
						}
						} else if ( btnConfig.before ) {
						$container.find(btnConfig.before).before(btn);
						} else {
						$container.append(btn);
					}
					
					if ( !! btnConfig.activator ) btnConfig.activator(btn, btnConfig);
					
					if ( !! btnConfig.lastly ) btnConfig.lastly(btn, btnConfig);
					
					var getData = btnConfig.data;
					var clearData = btnConfig.clear;
					
					var clearcb = function () {};
					
					$(btn).click(function (e) {
						clearcb = function () { // allow clear to be called for this button
							if ( !! clearData ) clearData(btn);
						};
						//xt.port.emit("buffer_click", getData(btn));
						//
						var contentData = getData(btn);
						
						if(typeof contentData.picture !== 'undefined'){
							injectPoster('',contentData.picture,contentData.text);
							console.log('picture')
						}
						else if(typeof contentData.url !== 'undefined'){
							injectPoster(contentData.url,'',contentData.text);
							console.log('url')
						}
						else{
							injectPoster('','',contentData.text);
							console.log('text')
						}
						console.log(contentData)
						e.preventDefault();
					});
					
					chrome.runtime.onMessage.addListener(
					function(request, sender, sendResponse) {
						
						if (request.action == "close-sociocaster-overlay"){
							clearcb();
							
							clearcb = function () {};
						}
						sendResponse({farewell: "goodbye"});
					}
					);
					
					//xt.port.on("buffer_embed_clear", function () {
					//	clearcb();
					// prevent clear from being called again, until the button is clicked again
					//	clearcb = function () {};
				//});
			});
		});
	};
	
	insertButtons();
	
	
	setTimeout(scEmbed, config.time.reload);
};

scEmbed();
/*
chrome.storage.sync.get({
	isImageEnable: true,
	isFacebookEnable: true
	}, function(items) {
	if(items.isFacebookEnable){
		
		scEmbed();
	}
	
});

*/


}());
