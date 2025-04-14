# Cmd - Quick command execution for browsers

Cmd allows you to quickly execute commands via a small keyboard-activated panel.

[Install for Firefox](https://addons.mozilla.org/en-US/firefox/addon/cmd/)

NOTES:

* This is the WebExtension version of the older add-on.
* It is experimental.
* Commands are organized as ES modules in the `/cmds/commands/` directory.
* Each command is exported as a default export with a standard format.
* Command modules are loaded when the popup is opened.


## Usage

### Basic Usage
* Launch with control/command+shift+space.
* Start typing to see matching commands.
* Hit the tab key to cycle through multiple matches (shift+tab to cycle backwards). Example: type "pre" and hit tab a bunch of times.
* Hit enter to select the current match.
* Hit escape to hide cmd without selecting a command.
* The last executed command is shown by default.

### Advanced Features
* **Command Parameters**: Type a command followed by text to pass parameters. For example: 
  * "Rotten Tomatoes Inception" - searches for "Inception" on Rotten Tomatoes
  * "Email page to user@example.com" - emails the current page to the specified address
  * "notify Hello world" - displays a notification with "Hello world"
* **Selection Context**: Commands can use text you've selected on the webpage. If you select text before running Cmd, commands can operate on that selection.
* **Sorting**: Results are sorted by the number of times you've selected that result.
* **Adaptive Matching**: The first result for what you type will be the last-selected command for those typed characters (e.g., "bo" -> "Bookmark this page").

## Creating Commands

Commands follow a standard ESM export format. There are two types of commands:

1. **Simple commands** - These have a fixed name and execute function:
```javascript
// Example simple command in /cmds/commands/myCommand.js
export default {
  name: 'My Command Name',
  async execute(cmd) {
    // Command code goes here
    // cmd contains: typed, search, selection
  }
};
```

2. **Dynamic commands** - These generate multiple commands from a source:
```javascript
// Example dynamic command in /cmds/commands/myDynamicCommand.js
export default {
  name: 'myDynamicCommand',
  async source() {
    // Fetch data or enumerate items
    const items = await fetchItems();
    
    // Return an array of command objects
    return items.map(item => ({
      name: `My Command: ${item.name}`,
      async execute(cmd) {
        // Command code goes here
      }
    }));
  }
};
```

Add your new command to `/cmds/commands/index.js` to make it available.

## Supported Commands

The following commands are currently supported:

### Bookmark Commands
- **bookmark current page**: Creates a bookmark of the current page.
- **Bookmarklets**: All bookmarks with URLs starting with `javascript:` are available as commands. Type any part of the bookmark name to find them. Documentation on [bookmarklets at MDN](https://support.mozilla.org/en-US/kb/bookmarklets-perform-common-web-page-tasks).

### Container Commands
- **New container tab: [container]**: Opens a new tab in the specified container.
- **Switch container to: [container]**: Reopens the current tab in the specified container.

### Google Docs Commands
- **New Google doc**: Opens a new Google Docs document.
- **New Google sheet**: Opens a new Google Sheets spreadsheet.

### Window Management Commands
- **Switch to window: [window]**: Switches focus to the specified window.
- **Move to window: [window]**: Moves the current tab to the specified window.

### Search and Content Commands
- **Rotten Tomatoes**: Searches Rotten Tomatoes for the selected text or parameter provided.
- **Email page to**: Emails the current page to the specified email address.

### Utility Commands
- **notify**: Creates a browser notification with the selected text or parameter provided.
- **note**: Creates a stored note from the provided text.

## TODO

### Structure and Architecture
- Move command execution to background script
- Add command parameters API
- Add command feedback and preview panels
- Add command chaining

### Content Processing
- Generalize passing context to commands
- Generalize processing of page content (move out of cs/)

### Entity Extraction
- Extract proper nouns
- Extract dates
- Extract emails and phone numbers
- Extract microformats
- Extract tracking numbers for packages
- Add visualizer/calculator for extracted entities

### Selection and Clipboard
- Add a `select` command to select from extracted entities
- Add a `copy` command to put selection or extracted entities into clipboard

### Extensibility
- Load command definitions from URLs via postMessage
- Support remote commands via manifest
- Support command contributions from other extensions

### Deployment
- Add Chrome support
- Package for distribution

### Command Features
- Add command screenshots (especially for window switching)
- Add command suggestions based on context
- Add adaptive matching improvements

### New Commands
- Add search and switch to open tabs
- Add tab management commands (move, new, close, reload)
- Add timers
- Add share commands (social media, messaging)
- Add tag page command
- Add advanced tab commands:
  - Move tab left/right
  - Close tab
  - Reload tab
  - Duplicate tab

### Container Tab Improvements
- Add option to load clipboard URL automatically when creating container tabs

