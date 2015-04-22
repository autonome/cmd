// NOW
// TODO: sessions

// FUTURE
// TODO: configurable shortcut
// TODO: remember last-executed command across restarts
// TODO: better visual fix for overflow text
// TODO: store adaptive matching data in add-on, not localStorage


var cmd = null,
    commands = [], // array of command names
    active = false, // is ui visible
    typed = '', // text typed by user so far, if any
    matches = [], // array of commands matching the typed text
    matchIndex = 0, // index of ???
    lastExecuted = ''; // text last typed by user when last they hit return

// set up match ranking storage
if (!localStorage.cmdMatchCounts)
  localStorage.cmdMatchCounts = {};

// set up adaptive match storage
if (!localStorage.cmdMatchFeedback)
  localStorage.cmdMatchFeedback = {};

function onVisibilityChange() {
  window.focus()
  if (document.hidden) {
    active = false
  }
  else {
    active = true
    // panel is visible, so initialize input box
    update("", lastExecuted || "Type a command...");
  }
}

self.port.on('show', function() {
  onVisibilityChange()
})

self.port.on('hide', function() {
  typed = ''
})


window.addEventListener('DOMContentLoaded', function() {
  window.removeEventListener('DOMContentLoaded', arguments.callee, false)
  cmd = document.getElementById('cmd')
  self.port.on('commands', function(msg) {
    commands = msg.commands
  })
}, false)

function execute(name, typed) {
  self.port.emit('execute', {
    name: name,
    typed: typed
  });
}

function findMatchingCommands(text) {
  var count = commands.length,
      matches = [];

  // Iterate over all commands, searching for matches
  for (var i = 0; i < count; i++) {
    // Match when:
    // 1. typed string is anywhere in a command name
    // 2. command name is at beginning of typed string
    //    (eg: for command input - "weather san diego")
    if (commands[i].toLowerCase().indexOf(typed.toLowerCase()) != -1 ||
        typed.toLowerCase().indexOf(commands[i].toLowerCase()) === 0) {
      matches.push(commands[i]);
    }
  }

  // sort by match count
  matches.sort(function(a, b) {
    var aCount = localStorage.cmdMatchCounts[a] || 0;
    var bCount = localStorage.cmdMatchCounts[b] || 0;
    return bCount - aCount;
  })

  // insert adaptive feedback
  if (localStorage.cmdMatchFeedback[typed]) {
    matches.unshift(localStorage.cmdMatchFeedback[typed])
  }

  return matches;
}

function updateMatchFeedback(typed, name) {
  localStorage.cmdMatchFeedback[typed] = name;
}

function updateMatchCount(name) {
  localStorage.cmdMatchCounts[name]++;
}

function onKeyPress(e) {
  //console.log('onKeyUp', String.fromCharCode(e.which), 'active?', active)
  //console.log('?', e.key, e.which, e.altKey, e.ctrlKey, e.shiftKey, e.metaKey)
  if (!active) {
    return;
  }

  e.preventDefault();

  // if user pressed return, attempt to execute command
  if (e.key == 'Enter' && !hasModifier(e)) {
    var name = matches[matchIndex];
    if (commands.indexOf(name) > -1) {
      execute(name, typed);
      lastExecuted = name;
      updateMatchCount(name);
      updateMatchFeedback(typed, name);
      typed = "";
      // ONLY IF OWN WINDOW
      //window.close();
    }
  }
  // attempt to complete typed characters to a command
  // or do other modifications based on user typed keys
  else if (!hasModifier(e) && !isModifier(e) && !isIgnorable(e)) {
    //console.log('active, no modifier, is not a modifier and not ignorable')

    // correct on backspace
    if (e.key == 'Backspace') {
      typed = typed.substring(0, typed.length - 1);
    }
    // otherwise add typed character to buffer
    else {
      //console.log('updating', String.fromCharCode(e.which))
      //typed += String.fromCharCode(e.which);
      typed += e.key
    }

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
  // if up arrow and currently visible command is not first, select one previous
  else if (e.key == 'ArrowUp' && matchIndex) {
    update(typed, matches[--matchIndex]);
  }
  // if down array and there are more matches, select the next one
  else if (e.key == 'ArrowDown' && matchIndex + 1 < matches.length) {
    update(typed, matches[++matchIndex]);
  }
  // Old behavior on tab:
  // tab -> shift to next result
  // shift + tab -> shift to previous result
  // New behavior on tab:
  // autocomplete to the matched command
  // which allows easy adding onto a command name
  // without having to type all the same visible text
  else if (e.key == 'Tab') {
    typed = matches[matchIndex]
    update(typed, matches[matchIndex]);
    /*
    if (e.shiftKey && matchIndex)
      update(typed, matches[--matchIndex]);
    else if (matchIndex + 1 < matches.length)
      update(typed, matches[++matchIndex]);
    */
  }
}
window.addEventListener("keypress", onKeyPress, false);

function hasModifier(e) {
  return e.altKey || e.ctrlKey || e.shiftKey || e.metaKey
}
function isModifier(e) {
  return [e.altKey, e.ctrlKey, e.shiftKey, e.metaKey].indexOf(e.which) != -1
}
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

function update(typed, completed) {
  var cmd = document.querySelector("#cmd")
  var str = ''
  if (completed) {
    str = generateUnderlined(completed, typed);
  }
  // no match
  else if (typed) {
    str = typed;
  }
  cmd.innerHTML = str
}

// completed, typed
function generateUnderlined(wholeString, subString) {
  // user already matched a commmand and added params
  if (subString.length > wholeString.length &&
      subString.indexOf(wholeString) === 0) {
    return subString;
  }
  var startIndex = wholeString.toLowerCase().indexOf(subString.toLowerCase());
  var endIndex = startIndex + subString.length;
  var str = ''
  // substring is empty
  if (!subString) {
    str = "<span>" + wholeString + "</span>"
  }
  // occurs at beginning
  else if (startIndex === 0) {
    str = "<span class='typed'>" + subString + "</span>" + 
          "<span class='completed'>" + wholeString.substring(subString.length) + "</span>";
  }
  // occurs in middle
  else if (endIndex != wholeString.length) {
    str = "<span class='completed'>" + wholeString.substring(0, startIndex) + "</span>" + 
          "<span class='typed'>" + wholeString.substring(startIndex, startIndex + subString.length) + "</span>" +
          "<span class='completed'>" + wholeString.substring(endIndex) + "</span>";
  }
  // occurs at the end
  else {
    str = "<span class='completed'>" + wholeString.substring(0, startIndex) + "</span>" + 
          "<span class='typed'>" + subString + "</span>";
  }
  return str;
}
