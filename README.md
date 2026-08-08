# Salesforce Flow Auto-Saver

A lightweight Chrome Extension (Manifest V3) designed to automatically save your Salesforce Flows when changes are detected. It eliminates the need to manually click the Save button while you work in the Salesforce Flow Builder.

For details on the state machine, button interactions, and deferred save rules, see [SAVE_RULES.md](SAVE_RULES.md).

## Features

- **Automatic Saving**: Periodically polls the Salesforce Flow Builder page to check the status of the **Save** button and automatically clicks it when enabled.
- **Smart Save Logic**:
  - Automatically defers saving when element configuration modals or side panels are open to prevent Salesforce from auto-assigning default API names.
  - Detects active flow states and prompts the user to "Save As New Version" instead of attempting to overwrite an active version.
- **Developer Reload Shortcut**: Reload the extension instantly in Chrome by pressing `Ctrl + Shift + E`.

## Roadmap

- [x] Auto-saving flows (Completed)
- [ ] Dark mode for flows
- [ ] Easy search for flows
- [ ] Advanced filters for flow search
- [ ] Highlight unused variables/resources
