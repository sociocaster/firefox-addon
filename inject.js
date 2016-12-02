/**
	* This is a list of domains that have a strict Content Security Policy
	* This is a temporary work around while we figure out a long term solution
*/
var CSPWhitelist = [
	'twitter.com',
	'github.com',
	'gist.github.com',
	'education.github.com',
	'medium.com',
	'www.npmjs.org',
	'www.npmjs.com',
	'www.flickr.com',
	'www.oculus.com',
	'letsecure.me'
];



var injectPoster = function(link,picture,message){
	
	
	var domain = window.location.hostname;
	if(CSPWhitelist.indexOf(domain) > -1){
		
		openPopup(link,picture,message)
		
		}else{
		
		var shouldContinue = ensureOnlyOneOverlayOpen()
		if(shouldContinue){
			
			var iframe = document.createElement('iframe');
			// Must be declared at web_accessible_resources in manifest.json
			
			if(link !== '')
			iframe.src = 'https://sociocaster.com/external?open=extension&link='+encodeURIComponent(link)+'&message='+encodeURIComponent(document.title);
			else if(picture !== '')
			iframe.src = 'https://sociocaster.com/external?open=extension&picture='+encodeURIComponent(picture)	+'&message='+encodeURIComponent(message);
			else if(message !== '')
			iframe.src = 'https://sociocaster.com/external?open=extension&message='+encodeURIComponent(message);
			
			iframe.id = 'sociocaster-overlay'
			// Some styles for a fancy sidebar
			iframe.style.cssText = 'border: none !important; height: 100% !important; width: 100% !important; position: fixed !important; z-index: 2147483646 !important; top: 0px !important; left: 0px !important; display: block !important; max-width: 100% !important; max-height: 100% !important; padding: 0px !important; background-image: none; background-attachment: initial !important; background-color: rgba(245, 245, 245, 0.741176) !important; background-size: 40px !important; background-origin: initial !important; background-clip: initial !important; background-position: 50% 50% !important; background-repeat: no-repeat !important;';
			document.body.appendChild(iframe);
			
		}
		
	}
}

function ensureOnlyOneOverlayOpen() {
	// State can't be saved in this script, since it gets re-executed multiple times by some browsers
	// (e.g. Firefox), so we rely on the DOM instead.
	var isOverlayOpen = function() { return !!$('#sociocaster-overlay').length };
	
	if (!isOverlayOpen()) return true;
	
	// If the open intent comes from somewhere else, discard any hidden overlay and open a new one
	closePopup();
	
	return true;
};



function closePopup() {
    $('#sociocaster-overlay').remove();
	
    window.focus();
}

function openPopup(link,picture,message){
	var url = ''
	if(link !== '')
	url = 'https://sociocaster.com/external?open=extension&link='+encodeURIComponent(link)+'&message='+encodeURIComponent(document.title);
	else if(picture !== '')
	url = 'https://sociocaster.com/external?open=extension&picture='+encodeURIComponent(picture)	+'&message='+encodeURIComponent(message);
	else if(message !== '')
	url = 'https://sociocaster.com/external?open=extension&message='+encodeURIComponent(message);
	
	
	window.open(url, 'sociocaster_sharer')
	
	
}


chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse) {
    //console.log(sender.tab ?
	//"from a content script:" + sender.tab.url :
	//"from the extension");
	//console.log(sender)
    if (request.action == "open-sociocaster-overlay"){
		injectPoster(request.tab.url,'','');
	}
	sendResponse({farewell: "goodbye"});
}
);


window.addEventListener("message", receiveMessage, false);
function receiveMessage(event)
{
	
	if(event.data == 'sociocaster_post_creator_closed'){
		closePopup();
		chrome.runtime.sendMessage({action: "close-sociocaster-overlay"}, function(response) {
			//console.log(response.farewell);
		});
	}
	//console.log(event)
	// Do we trust the sender of this message?  (might be
	// different from what we originally opened, for example).
	//if (event.origin !== "http://example.org")
    //return;
	
	// event.source is popup
	// event.data is "hi there yourself!  the secret response is: rheeeeet!"
}