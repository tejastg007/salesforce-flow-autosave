# Save and Save As New Version Conditions

## Activate Button States

The **Activate** button has three possible states:

1. **Active State**

   * The button displays **"Deactivate"** with a red background.
   * This indicates that the current flow version is active.

2. **Inactive State**

   * The button displays **"Activate"** with a blue background.
   * This indicates that the flow is either intentionally deactivated or has never been activated.

3. **Disabled State**

   * The button is disabled when the flow contains unsaved changes.
   * The user must save the flow or create a new version before it can be activated again.

---

## Salesforce Button Behaviour

These are the standard Salesforce rules governing the button states.

### 1. New Flow

* Create a new flow.
* Make any change.

Button states:

* **Save:** Enabled
* **Save As New Version:** Disabled
* **Activate:** Disabled

---

### 2. Flow Saved for the First Time

Save the flow with a name.

Button states:

* **Save:** Disabled
* **Save As New Version:** Enabled
* **Activate:** Enabled

---

### 3. Flow Activated

Activate the flow.

Button states:

* **Save:** Disabled
* **Save As New Version:** Enabled
* **Activate:** Changes to **"Deactivate"** since the current version is now active.

---

### 4. Changes Made to an Active Flow

Make any modification to the active flow.

Button states:

* **Save:** Disabled
* **Save As New Version:** Enabled
* **Activate:** Disabled

This happens because changes made to an active flow cannot be saved into the current version. A new version must be created.

---

### 5. New Version Created

Create a new version of the flow.

Button states immediately after creation:

* **Save:** Disabled (since there are no new changes)
* **Save As New Version:** Enabled
* **Activate:** Enabled

If you make any subsequent changes to this new version:

* **Save**: Enabled (the extension will automatically save changes to the current version)
* **Save As New Version**: Enabled
* **Activate**: Disabled (due to unsaved changes)

---

### 6. Flow Deactivated and Modified

Deactivate an active flow version and make a modification.

Button states:

* **Save:** Disabled (once a version is activated, it remains permanently read-only even after deactivation)
* **Save As New Version:** Enabled
* **Activate:** Disabled (due to unsaved changes)

The extension will treat this the same as an active flow with modifications, prompting the user via toast notification to click "Save As New Version".

---

## Save Logic

The extension should click the **Save** button only when the flow is in an inactive state, which means the **Activate** button is either:

* Disabled, or
* Displays the text **"Activate"**.

If the button displays **"Deactivate"**, the current flow version is active, and it cannot be saved into the existing version.

---

## Unsaved Changes in an Active Flow

When changes are made to an active flow:

* The **Save** button becomes disabled.
* The **Activate** button becomes disabled.
* Only **Save As New Version** remains enabled.

In this situation, the extension should notify the user that the flow contains unsaved changes and that a new version must be created before those changes can be saved.

---

## Deferred Save When Element Editor is Open

When creating or editing an element in the flow builder, Salesforce opens a configuration view:
* **Auto-Layout**: Opens a right configuration panel (`builder_platform_interaction-right-panel`).
* **Free-Form Layout**: Opens an edit modal (`.uiPanelManager2 .uiModal`).

**Rule**: If either the right panel or the modal is present in the DOM, the auto-save click action is deferred (skipped). 

**Rationale**: Saving a flow while a new element's configuration is open will cause Salesforce to auto-assign default or random API names for the element. By deferring the save click, we wait for the user to finish customizing and close the editor before auto-saving.

