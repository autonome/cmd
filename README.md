# Cmd - Quick command execution for browsers

Cmd allows you to quickly execute commands via a small keyboard-activated panel.

[Install for Firefox](https://addons.mozilla.org/en-US/firefox/addon/cmd/)

NOTES:

* This is the WebExtension version of the older add-on.
* It is experimental.


## Usage

* Launch with control/command+shift+space.
* Start typing to see matching commands.
* Hit the tab key to cycle through multiple matches (shift+tab to cycle  backwards). Example: type "pre" and hit tab a bunch of times.
* Hit enter to select the current match.
* Hit escape to hide cmd without selecting a command.
* The last executed command is shown by default.
* Sorting: Results are sorted by the number of times you've selected that result.
* Adaptive matching: The first result for what you type will the last-selected command for those typed characters (eg: "bo" -> "Bookmark this page").

## Features

Built-in commands are listed below.


Bookmarklets
Cmd scans all your bookmarks for URLs starting with `javascript:` and for each
it adds a new command that is named with the bookmark title and executing the
command executes the bookmarklet. Documentation on [bookmarklets at MDN](https://support.mozilla.org/en-US/kb/bookmarklets-perform-common-web-page-tasks).

## TODO

microformats / entity extraction
- proper nouns
- dates
- emails
- telephone #s
- microformats
- tracking numbers for packages
- write a visualizer/calculator for these

selection/clipboard
- add a `select` command to select from extracted entities
- add a `copy` command to put selection or extracted entities into clipboard

extensibility
- load command definitions as URLs which postMessage a la webiquity

deployment
- abstract core runtime
- migrate to Peek
- Chrome version

misc
* Define and document command syntax
* Document existing commands
* Remote commands (via manifest?)
* Add basic web page commands like Ubiquity's built-ins
* Map the path to Ubiquity preview panels
* Add command chaining

cmds
* gdocs cmds
* Share cmds (urls)
- timers
- search and switch to open tabs
- bookmark page
- tag page
- email page to

add tab commands
- move left/right
- new tab
- close tab
- reload tab
- move tab to window {index/search?}

### Command: New container tab

TODO
* if clipboard has a url, automatically load it?

