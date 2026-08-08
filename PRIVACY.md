# Privacy Policy for Salesforce Flow Auto-Saver

This Privacy Policy explains how **Salesforce Flow Auto-Saver** handles information when you use the extension.

## 1. No Data Collection
Salesforce Flow Auto-Saver does not collect, store, or transmit any personal data, user credentials, browsing history, or Salesforce metadata. 

## 2. Local-Only Execution
All operations performed by the extension occur strictly within your local browser:
* The configuration settings (e.g., auto-save toggle, interval delay) are saved locally on your device using Chrome's native `chrome.storage.local` API.
* The automatic saving actions run exclusively as local content scripts in your browser tab.
* No data is ever sent to external servers, third parties, or the extension developers.

## 3. Permissions Used and Rationale
The extension requests minimal permissions to function:
* **`storage`**: Used to save extension configurations (e.g., auto-save toggle status and interval speed) and tab-specific save timestamps locally in your browser.
* **`activeTab`**: Used to verify if the current active tab is a Salesforce Flow page, allowing the extension to enable or disable popup control settings accordingly. It does not track or store your browsing history.

## 4. Changes to This Policy
We may update this Privacy Policy from time to time. Any changes will be posted on this page.

## 5. Contact
If you have any questions about this Privacy Policy, please open an issue on the project's repository.
