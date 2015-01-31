// NOW
// TODO: configurable shortcut
// TODO: adaptive matching (incrementing)
// TODO: fix font in 29+

// FUTURE
// TODO: add support for registering new commands at runtime
// TODO: support selection feedback ranking
// TODO: support remembering last-executed command across restarts
// TODO: better fix for overflow text


let cmd = null,
    commands = [],
    active = false,
    typed = "",
    matches = [],
    matchIndex = 0,
    lastExecuted = "";

// set up match ranking storage
if (!localStorage.cmdMatchCounts)
  localStorage.cmdMatchCounts = {};

function updateMatchCount(alias) {
  localStorage.cmdMatchCounts[alias]++;
}

// set up adaptive match storage
if (!localStorage.cmdMatchFeedback)
  localStorage.cmdMatchFeedback = {};

function updateMatchFeedback(typed, alias) {
  localStorage.cmdMatchFeedback[typed] = alias;
}

self.port.on('show', function() {
  onVisibilityChange()
})

window.addEventListener("DOMContentLoaded", function() {
  window.removeEventListener("DOMContentLoaded", arguments.callee, false)
  cmd = document.getElementById("cmd")
  self.port.on('commands', function(msg) {
    commands = commands.concat(msg.commands)
  })
}, false)

function execute(alias) {
  self.port.emit('execute', {
    alias: alias
  });
}

function generateUnderlined(wholeString, subString) {
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

function onKeyPress(e) {
  //console.log('onKeyUp', String.fromCharCode(e.which), 'active?', active)
  //console.log(e.which, e.altKey, e.ctrlKey, e.shiftKey, e.metaKey)
  if (!active) {
    return;
  }

  e.preventDefault();

  // if user pressed return, attempt to execute command
  //console.log('RETURN?', e.which == e.DOM_VK_RETURN, hasModifier(e))
  if (e.which == e.DOM_VK_RETURN && !hasModifier(e)) {
    let alias = matches[matchIndex];
    if (commands.indexOf(alias) > -1) {
      execute(alias);
      lastExecuted = alias;
      updateMatchCount(alias);
      updateMatchFeedback(typed, alias);
      typed = "";
      // ONLY IF OWN WINDOW
      //window.close();
    }
  }

  // attempt to complete typed characters to a command
  else if (!hasModifier(e) && !isModifier(e) && !isIgnorable(e)) {
    //console.log('active, no modifier, is not a modifier and not ignorable')
    // correct on backspace
    if (e.which == 8)
      typed = typed.substring(0, typed.length - 1);
    // otherwise add typed character to buffer
    else {
      //console.log('updating', String.fromCharCode(e.which))
      typed += String.fromCharCode(e.which);
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

  // tab -> shift to next result
  // shift + tab -> shift to previous result
  else if (e.keyCode == e.DOM_VK_TAB) {
    //console.log('tab')
    if (e.shiftKey && matchIndex)
      update(typed, matches[--matchIndex]);
    else if (matchIndex + 1 < matches.length)
      update(typed, matches[++matchIndex]);
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

function onVisibilityChange() {
  //console.log('onVisibilityChange')
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
//document.addEventListener("visibilitychange", onVisibilityChange, false);

function update(typed, completed) {
  //console.log('update', typed, completed)
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

function findMatchingCommands(text) {
  let match = null,
      count = commands.length,
      matches = [];

  // basic index search
  // TODO: wat. fix this shit.
  for (var i = 0; i < count; i++) {
    if (commands[i].toLowerCase().indexOf(typed.toLowerCase()) != -1)
      matches.push(commands[i]);
  }

  // sort by match count
  matches.sort(function(a, b) {
    var aCount = localStorage.cmdMatchCounts[a] || 0;
    var bCount = localStorage.cmdMatchCounts[b] || 0;
    return bCount - aCount;
  })

  // insert adaptive feedback
  if (localStorage.cmdMatchFeedback[typed]) {
    //console.log('ADAPT!')
    matches.unshift(localStorage.cmdMatchFeedback[typed])
  }

  return matches;
}


// Google Docs
