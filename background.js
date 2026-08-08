// Listen for commands registered in manifest.json
chrome.commands.onCommand.addListener((command) => {
	if (command === "reload-extension") {
		console.log("Reloading extension...");
		chrome.runtime.reload();
	}
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "save_timestamp" && sender.tab) {
		const tabId = sender.tab.id;
		const timestamp = message.time || Date.now();
		chrome.storage.local.set({ [`lastSaved_${tabId}`]: timestamp }, () => {
			if (chrome.runtime.lastError) {
				console.error("Error saving timestamp:", chrome.runtime.lastError);
			}
		});
	}
});

// Clean up tab-specific temporary save times when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
	chrome.storage.local.remove(`lastSaved_${tabId}`, () => {
		if (chrome.runtime.lastError) {
			console.error("Error cleaning up tab storage:", chrome.runtime.lastError);
		}
	});
});
