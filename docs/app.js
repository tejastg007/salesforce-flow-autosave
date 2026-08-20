// Salesforce Flow Auto-Saver Landing Page Logic

document.addEventListener('DOMContentLoaded', () => {
    // Simulator configuration data
    const statesData = {
        'new': {
            saveBtnClass: 'builder-btn primary',
            saveAsBtnClass: 'builder-btn disabled',
            activateBtnClass: 'builder-btn disabled',
            activateText: 'Activate',
            decisionClass: 'auto-save',
            badgeText: 'AUTO-SAVING ACTION',
            statusText: 'SAVING ACTIVE',
            titleText: 'Auto-Save Click Triggered!',
            descText: 'The extension detects that changes are active and the Save button is enabled. It automatically clicks Save for you.',
            explanationText: 'A brand new flow is created, or changes are made to a draft. Since there is no active version conflict, the extension clicks the standard Save button.'
        },
        'saved': {
            saveBtnClass: 'builder-btn disabled',
            saveAsBtnClass: 'builder-btn',
            activateBtnClass: 'builder-btn primary',
            activateText: 'Activate',
            decisionClass: 'defer-state',
            badgeText: 'AUTO-SAVING ACTION',
            statusText: 'IDLE',
            titleText: 'Save Cycle Idle',
            descText: 'No changes detected. The Save button is disabled, so the extension does not trigger any action.',
            explanationText: 'Immediately after saving the flow for the first time, all modifications are saved. The system is fully synced and waits for your next edit.'
        },
        'activated': {
            saveBtnClass: 'builder-btn disabled',
            saveAsBtnClass: 'builder-btn',
            activateBtnClass: 'builder-btn danger',
            activateText: 'Deactivate',
            decisionClass: 'defer-state',
            badgeText: 'AUTO-SAVING ACTION',
            statusText: 'IDLE',
            titleText: 'Save Cycle Idle',
            descText: 'The active version is write-protected. Since there are no modifications, the extension rests idle.',
            explanationText: 'When a flow version is active, Salesforce marks it as read-only. Standard saves cannot overwrite it, so the button remains disabled.'
        },
        'active-modified': {
            saveBtnClass: 'builder-btn disabled',
            saveAsBtnClass: 'builder-btn primary',
            activateBtnClass: 'builder-btn disabled',
            activateText: 'Activate',
            decisionClass: 'warning-state',
            badgeText: 'TOAST NOTIFICATION',
            statusText: 'ACTION REQUIRED',
            titleText: "Prompt: Save As New Version",
            descText: 'Since the flow is active, modifications cannot be auto-saved to the current version. The extension alerts you via toast to create a New Version.',
            explanationText: 'When you edit a flow that is active, Salesforce requires a new version. The extension detects this button state and displays a warning to prevent lost work.'
        },
        'new-version': {
            saveBtnClass: 'builder-btn disabled',
            saveAsBtnClass: 'builder-btn',
            activateBtnClass: 'builder-btn primary',
            activateText: 'Activate',
            decisionClass: 'defer-state',
            badgeText: 'AUTO-SAVING ACTION',
            statusText: 'IDLE',
            titleText: 'Save Cycle Idle',
            descText: 'The new version is created. Since no modifications have occurred yet in this new version, the extension remains idle.',
            explanationText: 'A new version acts as a draft. The moment you make a modification in this draft, the Save button will become active, and auto-saving will resume.'
        },
        'deactivated-modified': {
            saveBtnClass: 'builder-btn disabled',
            saveAsBtnClass: 'builder-btn primary',
            activateBtnClass: 'builder-btn disabled',
            activateText: 'Activate',
            decisionClass: 'warning-state',
            badgeText: 'TOAST NOTIFICATION',
            statusText: 'ACTION REQUIRED',
            titleText: "Prompt: Save As New Version",
            descText: 'Salesforce permanently locks flow versions once they have been activated, even if deactivated. The extension detects this and prompts you to create a New Version.',
            explanationText: 'Once a flow version has been activated, it is forever read-only in Salesforce. Deactivating it does not unlock it. A New Version must be saved.'
        }
    };

    // DOM Elements for simulator
    const mockBtnSave = document.getElementById('mock-btn-save');
    const mockBtnSaveAs = document.getElementById('mock-btn-save-as');
    const mockBtnActivate = document.getElementById('mock-btn-activate');
    const mockDecisionBox = document.getElementById('mock-decision-box');
    const mockDecisionBadge = document.getElementById('mock-decision-badge');
    const mockDecisionStatus = document.getElementById('mock-decision-status');
    const mockDecisionTitle = document.getElementById('mock-decision-title');
    const mockDecisionDesc = document.getElementById('mock-decision-desc');
    const mockExplanationText = document.getElementById('mock-explanation-text');
    const stateButtons = document.querySelectorAll('.state-btn');

    // Update function for simulator UI
    function updateSimulator(stateKey) {
        const data = statesData[stateKey];
        if (!data) return;

        // Update button states classes and texts
        mockBtnSave.className = data.saveBtnClass;
        mockBtnSaveAs.className = data.saveAsBtnClass;
        mockBtnActivate.className = data.activateBtnClass;
        mockBtnActivate.innerText = data.activateText;

        // Reset and apply decision box states
        mockDecisionBox.className = 'decision-box ' + data.decisionClass;
        mockDecisionBadge.innerText = data.badgeText;
        mockDecisionStatus.innerText = data.statusText;
        mockDecisionTitle.innerText = data.titleText;
        mockDecisionDesc.innerText = data.descText;

        // Update explanation
        mockExplanationText.innerText = data.explanationText;
    }

    // Bind state button clicks
    stateButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all state buttons
            stateButtons.forEach(b => b.classList.remove('active'));
            // Add active to current
            btn.classList.add('active');
            
            // Get state key and update mockup
            const stateKey = btn.getAttribute('data-state');
            updateSimulator(stateKey);
        });
    });

    // Run initial update for 'new'
    updateSimulator('new');

    // Add scroll animation effect on navbar
    const nav = document.getElementById('main-nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.style.padding = '10px 0';
            nav.style.background = 'rgba(6, 9, 16, 0.9)';
            nav.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
        } else {
            nav.style.padding = '16px 0';
            nav.style.background = 'rgba(10, 14, 23, 0.7)';
            nav.style.boxShadow = 'none';
        }
    });

    // Smooth scroll for nav items and buttons
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
