// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
	
	chrome.tabs.sendMessage(tab.id, {action : 'open-sociocaster-overlay' , tab : tab}, function(response) {
		console.log(response.farewell);
	});
});

/**
// Inject code from the first element of the content script list
var injectButtonCode = function (id) {
	var scripts = chrome.manifest.content_scripts[0].js;
	// Programmatically inject each script
	scripts.forEach(function (script) {
		chrome.tabs.executeScript(id, {
			file: script
		});
	});
};

chrome.runtime.onInstalled.addListener(function(details){
	if (details.reason == "install"){
		chrome.windows.getAll({
			populate: true
			}, function (windows) {
			windows.forEach(function (currentWindow) {
				currentWindow.tabs.forEach(function (currentTab) {
					// Skip chrome:// and https:// pages
					if( ! currentTab.url.match(/(chrome|https):\/\//gi) ) {
						injectButtonCode(currentTab.id);
					}
				});
			});
			// Open the guide
			chrome.tabs.create({
				url: 'https://sociocaster.com/extra/chrome',
				active: true
			});
		});
		} else if (details.reason == "update"){
		// Nothing to do here, yet...
	}
});
**/