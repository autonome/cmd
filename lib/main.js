// NOW
// TODO: configurable shortcut
// TODO: adaptive matching (incrementing)

// FUTURE
// TODO: add support for registering new commands at runtime
// TODO: support selection feedback ranking
// TODO: support remembering last-executed command across restarts
// TODO: better fix for overflow text

// populate command list
let cmds = {};
let cmdAliases = [];
require("commands").search("", function(command) {
  cmds[command.alias] = command;
  cmdAliases.push(command.alias);
});

// set up match ranking storage
let Storage = require('simple-storage').storage;
if (!Storage.cmdMatchCounts)
  Storage.cmdMatchCounts = {};
function updateMatchCount(alias) Storage.cmdMatchCounts[alias]++

// set up adaptive match storage
let Storage = require('simple-storage').storage;
if (!Storage.cmdMatchFeedback)
  Storage.cmdMatchFeedback = {};
function updateMatchFeedback(typed, alias) Storage.cmdMatchFeedback[typed] = alias

let active = false;
let typed = "";
let matches = [];
let matchIndex = 0;
let lastExecuted = "";

const panels = require("panel");
let cmdWidget = panels.Panel({
  label: "Cmds",
  width: 350,
  height: 54,
  contentURL: require("self").data.url("commands-autocomplete.html"),
  contentScriptFile: require("self").data.url("commands-autocomplete.js"),
  contentScriptWhen: "ready",
  onShow: function() {
    active = true;
  },
  onHide: function() {
    active = false;
    typed = "";
  },
});

function update(typed, completed) {
  cmdWidget.postMessage(JSON.stringify({typed: typed, completed: completed}));
}

function findMatchingCommands(text) {
  let match = null, count = cmdAliases.length, matches = [];

  // basic index search
  for (var i = 0; i < count; i++) {
    if (cmdAliases[i].toLowerCase().indexOf(typed.toLowerCase()) != -1)
      matches.push(cmdAliases[i]);
  }

  // sort by match count
  matches.sort(function(a, b) {
    var aCount = Storage.cmdMatchCounts[a] || 0;
    var bCount = Storage.cmdMatchCounts[b] || 0;
    return bCount - aCount;
  });

  // insert adaptive feedback
  if (Storage.cmdMatchFeedback[typed])
    matches.unshift(Storage.cmdMatchFeedback[typed]);

  return matches;
}

function hasModifier(e) e.altKey || e.ctrlKey || e.shiftKey || e.metaKey
function isModifier(e) [e.altKey, e.ctrlKey, e.shiftKey, e.metaKey].indexOf(e.which) != -1
function isIgnorable(e) {
  switch(e.which) {
    case 38: //up arrow  
    case 40: //down arrow 
    case 37: //left arrow 
    case 39: //right arrow 
    case 33: //page up  
    case 34: //page down  
    case 36: //home  
    case 35: //end                  
    case 13: //enter  
    case 9:  //tab  
    case 27: //esc  
    case 16: //shift  
    case 17: //ctrl  
    case 18: //alt  
    case 20: //caps lock 
    // we handle this for editing
    //case 8:  //backspace  
    // need to handle for editing also?
    case 46: //delete 
    case 0:
      return true;
      break;
    default:
      return false;
  }
}

function onKeyPress(e) {
  if (active)
    e.preventDefault();

  // show ui on cmd+shift+; (colon)
  if (!active && e.metaKey && e.which == 58) {
    update("", lastExecuted || "Type a command...");
    cmdWidget.show();
  }

  // if user pressed return, attempt to execute command
  else if (active && e.which == e.DOM_VK_RETURN && !hasModifier(e)) {
    let alias = matches[matchIndex];
    if (cmds[ alias ]) {
      cmds[alias].execute();
      lastExecuted = alias;
      updateMatchCount(alias);
      updateMatchFeedback(typed, alias);
      typed = "";
      cmdWidget.hide();
    }
  }

  // attempt to complete typed command
  else if (active && !hasModifier(e) && !isModifier(e) && !isIgnorable(e)) {
    // correct on backspace
    if (e.which == 8)
      typed = typed.substring(0, typed.length - 1);
    // otherwise add typed character to buffer
    else
      typed += String.fromCharCode(e.which);

    // search, and update UI
    matches = findMatchingCommands(typed);
    if (matches.length) {
      update(typed, matches[0]);
      matchIndex = 0;
    }
    else {
      update(typed);
    }
  }

  // tab -> shift to next result
  // shift + tab -> shift to previous result
  else if (active && e.keyCode == e.DOM_VK_TAB) {
    if (e.shiftKey && matchIndex)
      update(typed, matches[--matchIndex]);
    else if (matchIndex + 1 < matches.length)
      update(typed, matches[++matchIndex]);
  }
}

// add shortcut listener to all current and future windows
const wu = require("window-utils");
new wu.WindowTracker({
  onTrack: function (window) {
    window.document.addEventListener("keypress", onKeyPress, true);
  },
  onUntrack: function (window) {
    window.document.removeEventListener("keypress", onKeyPress, true);
  }
});

