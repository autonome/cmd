# Cmd - Quick command execution for browsers

Cmd allows you to quickly execute commands via a small keyboard-activated panel.

[Install for Firefox](https://addons.mozilla.org/en-US/firefox/addon/cmd/)

NOTES:

* This is the WebExtension version of the older add-on.
* It is experimental.
* It only supports execution of [bookmarklets](https://support.mozilla.org/en-US/kb/bookmarklets-perform-common-web-page-tasks) at this time.

## Usage and features:

* Launch with control/command+shift+space.
* Start typing to see matching commands.
* Hit the tab key to cycle through multiple matches (shift+tab to cycle  backwards). Example: type "pre" and hit tab a bunch of times.
* Hit enter to select the current match.
* Hit escape to hide cmd without selecting a command.
* The last executed command is shown by default.
* Sorting: Results are sorted by the number of times you've selected that result.
* Adaptive matching: The first result for what you type will the last-selected command for those typed characters (eg: "bo" -> "Bookmark this page").

## Log

### Next version (iow, done but not on AMO yet)

* Add other basic built-ins like "bookmark", "email page to"

## TODO

* Why no work on Github?
* Fix underlining - define behavior, what should be underlined?
* gdocs cmds
* Share cmds (urls)
* Define and document command syntax
* Document existing commands
* Remote commands (via manifest?)
* Add basic web page commands like Ubiquity's built-ins
* Map the path to Ubiquity preview panels
* Add command chaining
