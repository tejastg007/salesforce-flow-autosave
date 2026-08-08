document.addEventListener("DOMContentLoaded", () => {
	const toggle = document.getElementById("auto-save-toggle");
	const intervalInput = document.getElementById("save-interval");
	const lastSavedText = document.getElementById("last-saved-time");
	const statusIcon = document.getElementById("status-icon");
	const statusDot = document.getElementById("status-dot");

	let activeTabId = null;
	let isFlowTab = false;

	// 1. Find the active tab in the current window
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		if (tabs.length === 0) return;
		const activeTab = tabs[0];
		activeTabId = activeTab.id;

		// Check if the tab is on a Salesforce Flow Builder page
		isFlowTab = activeTab.url && activeTab.url.includes("/builder_platform_interaction/");

		if (!isFlowTab) {
			// If not a Flow page, show icon as inactive/grayscale and disable settings
			statusIcon.classList.add("inactive-icon");
			statusDot.classList.add("inactive");
			toggle.disabled = true;
			intervalInput.disabled = true;
			lastSavedText.textContent = "N/A (Not a Flow tab)";
			return;
		}

		// 2. Load stored settings and tab-specific timestamp
		chrome.storage.local.get(["autoSaveEnabled", "saveInterval", `lastSaved_${activeTabId}`], (data) => {
			const enabled = data.autoSaveEnabled !== false; // defaults to true
			const interval = data.saveInterval || 60; // defaults to 60s
			const lastSaved = data[`lastSaved_${activeTabId}`];

			toggle.checked = enabled;
			intervalInput.value = interval;
			updateStatusIcon(enabled);
			updateLastSavedDisplay(lastSaved);
		});
	});

	// Helper to update the icon's grayscale visual state
	function updateStatusIcon(isEnabled) {
		if (!isFlowTab) return;
		if (isEnabled) {
			statusIcon.classList.remove("inactive-icon");
			statusDot.classList.remove("inactive");
		} else {
			statusIcon.classList.add("inactive-icon");
			statusDot.classList.add("inactive");
		}
	}

	// Helper to format and display the saved timestamp
	function updateLastSavedDisplay(timestamp) {
		if (!isFlowTab) return;
		if (timestamp) {
			const date = new Date(timestamp);
			lastSavedText.textContent = date.toLocaleTimeString();
		} else {
			lastSavedText.textContent = "Never";
		}
	}

	// 3. Listen for changes in the popup controls and save to storage
	toggle.addEventListener("change", () => {
		const isEnabled = toggle.checked;
		updateStatusIcon(isEnabled);
		chrome.storage.local.set({ autoSaveEnabled: isEnabled });
	});

	intervalInput.addEventListener("change", () => {
		let val = parseInt(intervalInput.value, 10);
		if (isNaN(val) || val < 1) {
			val = 1;
			intervalInput.value = 1;
		} else if (val > 60) {
			val = 60;
			intervalInput.value = 60;
		}
		chrome.storage.local.set({ saveInterval: val });
	});

	// 4. Listen for real-time changes in storage (e.g. from content.js)
	chrome.storage.onChanged.addListener((changes, areaName) => {
		if (areaName !== "local" || !activeTabId) return;

		const savedKey = `lastSaved_${activeTabId}`;
		if (changes[savedKey]) {
			updateLastSavedDisplay(changes[savedKey].newValue);
		}
	});
});
