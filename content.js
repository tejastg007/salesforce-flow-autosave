(function () {
	"use strict";

	// Set to false before publishing to the Web Store
	const DEBUG = true;

	const log = {
		info: (...args) => {
			if (DEBUG) console.log("[FlowSaver]", ...args);
		},
		error: (...args) => {
			console.error("[FlowSaver] Error:", ...args);
		},
	};

	log.info("Salesforce Flow Saver extension content script injected.");

	// DOM Selector Constants
	const SELECTORS = {
		save: "lightning-button.test-toolbar-save button",
		saveAsNew:
			"lightning-button-group.test-toolbar-save-as-button-group lightning-button.test-toolbar-saveas-new-version button",
		activate: "lightning-button.test-toolbar-activate button",
		rightPanel: "builder_platform_interaction-right-panel",
		activeModal: ".uiPanelManager2 .uiModal",
	};

	let saveButtonRef = null;
	let saveAsNewVersionButtonRef = null;
	let activateButtonRef = null;

	let isSaveEnabled = null;
	let isSaveAsNewVersionEnabled = null;
	let isActivateEnabled = null;
	let isFlowActive = null;

	let isSaving = false;
	let hasNotifiedReadOnlyUnsaved = false;
	let freshFlowTimerStart = null;
	let hasNotifiedFreshUnsaved = false;

	let autoSaveEnabled = true;
	let saveInterval = 3;
	let pollIntervalId = null;

	/**
	 * Helper to check if a DOM element is currently enabled.
	 * Salesforce components often use aria-disabled="true" or disabled.
	 * @param {HTMLElement} button
	 * @returns {boolean}
	 */
	function isEnabled(button) {
		if (!button) return false;
		return !(
			button.hasAttribute("disabled") ||
			button.disabled === true ||
			button.getAttribute("aria-disabled") === "true"
		);
	}

	/**
	 * Helper to resolve, track, and handle unmounting of page buttons.
	 * @param {HTMLElement|null} ref - Current stored reference
	 * @param {string} selector - Selector to query the button
	 * @param {string} name - User-friendly name for logging
	 * @param {Function} onLost - Callback executed when the element is removed from DOM
	 * @returns {HTMLElement|null}
	 */
	function resolveButton(ref, selector, name, onLost) {
		let btn = ref && ref.isConnected ? ref : null;

		if (!btn) {
			btn = document.querySelector(selector);
			if (btn) {
				log.info(`${name} found`);
			}
		}

		if (ref && !ref.isConnected) {
			log.info(`${name} lost (removed from DOM).`);
			if (onLost) onLost();
			return null;
		}

		return btn || ref;
	}

	/**
	 * Dynamically injects and displays a floating toast warning on the viewport.
	 * Remains visible until the user clicks the close (✕) button.
	 * @param {string} message
	 */
	function showWarningToast(message) {
		let container = document.getElementById("flow-saver-toast-container");
		if (!container) {
			container = document.createElement("div");
			container.id = "flow-saver-toast-container";
			document.body.appendChild(container);
		}

		const toast = document.createElement("div");
		toast.className = "flow-saver-toast";

		// Set initial hidden state for animation transition
		toast.style.opacity = "0";
		toast.style.transform = "translateY(20px)";

		toast.innerHTML = `
      <div class="flow-saver-toast-content">
        <span class="flow-saver-toast-icon">⚠️</span>
        <span class="flow-saver-toast-text">${message}</span>
      </div>
      <button class="flow-saver-toast-close">✕</button>
    `;

		toast.querySelector(".flow-saver-toast-close").onclick = () => {
			toast.classList.add("flow-saver-toast-fadeout");
			toast.addEventListener("transitionend", () => {
				toast.remove();
			});
		};

		container.appendChild(toast);

		// Trigger slide/fade-in animation
		requestAnimationFrame(() => {
			toast.style.opacity = "";
			toast.style.transform = "";
		});
	}

	/**
	 * Checks if the configuration right-panel or edit modal is currently open in the DOM.
	 * @returns {boolean}
	 */
	function isEditorElementOpen() {
		const rightPanel = document.querySelector(SELECTORS.rightPanel);
		const modal = document.querySelector(SELECTORS.activeModal);

		if (rightPanel) {
			log.info("Auto-save deferred: right configuration panel is open.");
			return true;
		}
		if (modal) {
			log.info("Auto-save deferred: edit modal is open.");
			return true;
		}
		return false;
	}

	/**
	 * Periodically checks the states of the Save, Save As New Version, and Activate buttons.
	 */
	function checkButtonState() {
		log.info(`polled ...`);
		if (document.hidden) return;

		// 1. Resolve and Track Save Button
		saveButtonRef = resolveButton(saveButtonRef, SELECTORS.save, "Save button", () => {
			isSaveEnabled = null;
			isSaving = false;
		});

		// 2. Resolve and Track Save as New Version Button
		saveAsNewVersionButtonRef = resolveButton(
			saveAsNewVersionButtonRef,
			SELECTORS.saveAsNew,
			"Save as New Version button",
			() => {
				isSaveAsNewVersionEnabled = null;
			},
		);

		// 3. Resolve and Track Activate Button
		activateButtonRef = resolveButton(activateButtonRef, SELECTORS.activate, "Activate button", () => {
			isActivateEnabled = null;
			isFlowActive = null;
		});

		// Capture current states
		const currentSaveEnabled = isEnabled(saveButtonRef);
		const currentSaveAsNewEnabled = isEnabled(saveAsNewVersionButtonRef);
		const currentActivateEnabled = isEnabled(activateButtonRef);

		let currentFlowActive = false;
		if (activateButtonRef) {
			const text = (activateButtonRef.textContent || "").trim().toLowerCase();
			const title = (activateButtonRef.getAttribute("title") || "").trim().toLowerCase();
			currentFlowActive = text.includes("deactivate") || title.includes("deactivate");
		}

		// Track state modifications for logging
		if (currentSaveAsNewEnabled !== isSaveAsNewVersionEnabled) {
			isSaveAsNewVersionEnabled = currentSaveAsNewEnabled;
			log.info(isSaveAsNewVersionEnabled ? "Save as New Version is enabled" : "Save as New Version is disabled");
		}

		if (currentActivateEnabled !== isActivateEnabled || currentFlowActive !== isFlowActive) {
			isActivateEnabled = currentActivateEnabled;
			isFlowActive = currentFlowActive;
			const statusStr = isFlowActive ? "Active" : "Inactive";
			const enableStr = isActivateEnabled ? "enabled" : "disabled";
			log.info(`Activate button is ${enableStr} (Flow state: ${statusStr})`);
		}

		// -- RULE 1: Auto-Click Save when enabled --
		if (currentSaveEnabled) {
			if (autoSaveEnabled && !isSaving) {
				if (isEditorElementOpen()) {
					// Defer save until editing elements are closed
					return;
				}

				log.info("Save is enabled - clicking button");
				isSaving = true;
				isSaveEnabled = true;

				// Apply a visual green glow pulse to the Save button
				saveButtonRef.classList.add("flow-saver-pulse");
				setTimeout(() => {
					if (saveButtonRef) {
						saveButtonRef.classList.remove("flow-saver-pulse");
					}
				}, 800);

				saveButtonRef.click();

				// Send a message to background.js to record the tab-specific save time
				chrome.runtime.sendMessage({ action: "save_timestamp", time: Date.now() });
			}
		} else {
			if (isSaveEnabled !== false) {
				isSaveEnabled = false;
				isSaving = false;
				log.info("Save is disabled");
			}
		}

		// -- RULE 2: Detect unsaved changes in a read-only flow and alert user once --
		const isUnsavedReadOnlyState =
			activateButtonRef && !currentActivateEnabled && !currentSaveEnabled && currentSaveAsNewEnabled;

		if (isUnsavedReadOnlyState) {
			if (!hasNotifiedReadOnlyUnsaved) {
				log.info("Unsaved changes detected in read-only flow version. Notifying user.");
				showWarningToast(
					'Unsaved changes detected. Since this version is read-only, please click "Save As New Version" to save your changes.',
				);
				hasNotifiedReadOnlyUnsaved = true;
			}
		} else {
			// Reset notification latch when the flow changes to an editable version, or changes are saved
			if (hasNotifiedReadOnlyUnsaved) {
				hasNotifiedReadOnlyUnsaved = false;
			}
		}

		// -- RULE 3: Detect if fresh flow is unsaved for 30s --
		const isFreshUnsaved = currentSaveEnabled && !currentSaveAsNewEnabled && !currentActivateEnabled;
		if (isFreshUnsaved) {
			if (!freshFlowTimerStart) {
				freshFlowTimerStart = Date.now();
			} else if (Date.now() - freshFlowTimerStart >= 30000) {
				if (!hasNotifiedFreshUnsaved) {
					log.info("Unsaved fresh flow detected for 30s. Notifying user.");
					showWarningToast("Flow has unsaved changes. Please save your flow!");
					hasNotifiedFreshUnsaved = true;
				}
			}
		} else {
			freshFlowTimerStart = null;
			hasNotifiedFreshUnsaved = false;
		}
	}

	// Helper to start or reschedule the polling timer loop
	function startPolling(intervalSeconds) {
		if (pollIntervalId) {
			clearInterval(pollIntervalId);
		}
		const ms = (intervalSeconds || 3) * 1000;
		pollIntervalId = setInterval(checkButtonState, ms);
		log.info(`Polling loop scheduled every ${intervalSeconds || 3} seconds.`);
	}

	// Listen to configuration changes in real-time
	chrome.storage.onChanged.addListener((changes, areaName) => {
		if (areaName !== "local") return;

		if (changes.autoSaveEnabled !== undefined) {
			autoSaveEnabled = changes.autoSaveEnabled.newValue !== false;
			log.info(`Auto-save toggle updated in storage: ${autoSaveEnabled}`);
		}

		if (changes.saveInterval !== undefined) {
			saveInterval = changes.saveInterval.newValue || 3;
			log.info(`Save interval speed updated in storage: ${saveInterval}s`);
			startPolling(saveInterval);
		}
	});

	// Load initial settings and trigger startup polling
	chrome.storage.local.get(["autoSaveEnabled", "saveInterval"], (data) => {
		autoSaveEnabled = data.autoSaveEnabled !== false;
		saveInterval = data.saveInterval || 3;
		startPolling(saveInterval);
	});
})();
