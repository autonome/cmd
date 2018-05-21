/*
 
TODO: NOW
* store state data in add-on, not localStorage

TODO: FUTURE
* remember last-executed command across restarts
* sessions
* configurable shortcut
* better visual fix for overflow text

*/

(async () => {

let state = {
  commands: [], // array of command names
  matches: [], // array of commands matching the typed text
  matchIndex: 0, // index of ???
  matchCounts: {}, // match counts - selectedcommand:numberofselections
  matchFeedback: {}, // adaptive matching - partiallytypedandselected:fullname
  typed: '', // text typed by user so far, if any
  lastExecuted: '' // text last typed by user when last they hit return
};

let msgPort = null;

browser.runtime.onConnect.addListener(function(port) {
  port.onMessage.addListener(msg => {
    if (msg.commands) {
      console.log('got commands');
      state.commands = msg.commands;
    }
  });
  msgPort = port;
});

async function render() {
  let old = document.querySelector('#cmdContainer');
  if (old) {
    return;
  }

  // Outermost invisible container
  let container = document.createElement('div');
  container.id = 'cmdContainer';
  await css(container, {
    position: 'absolute',
    zIndex: 9999,
    top: 0, left: 0,
    height: '100%', width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '"Avenir", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
  });

  // Visible container
  let cmd = document.createElement('div');
  cmd.id = 'cmd';
  await css(cmd, {
    height: '3rem',
    width: '30rem',
    lineHeight: '3rem',
    backgroundColor: 'yellow',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    borderRadius: '0.2rem',
    filter: 'drop-shadow(0.2rem 0.2rem 0.2rem silver)'
  });
  container.appendChild(cmd);

  // Where text is shown
  let input = document.createElement('div');
  input.id = 'input';
  await css(input, {
    color: '#6E6E6E',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    fontSize: '2rem'
  });
  cmd.appendChild(input);

  document.body.appendChild(container);

  // add event listeners
  document.addEventListener('keyup', onKeyup, false);
}

render();

async function css(el, props) {
  Object.keys(props).forEach(p => el.style[p] = props[p]);
}

function execute(name, typed) {
  msgPort.postMessage({
    action: 'execute',
    name: name,
    typed: typed
  });
}

function findMatchingCommands(text) {
  console.log('findMatchingCommands', text, state.commands);
  var count = state.commands.length,
      matches = [];

  // Iterate over all commands, searching for matches
  for (var i = 0; i < count; i++) {
    // Match when:
    // 1. typed string is anywhere in a command name
    // 2. command name is at beginning of typed string
    //    (eg: for command input - "weather san diego")
    console.log('testing option...', state.commands[i])
    if (state.commands[i].toLowerCase().indexOf(state.typed.toLowerCase()) != -1 ||
        state.typed.toLowerCase().indexOf(state.commands[i].toLowerCase()) === 0) {
      matches.push(state.commands[i]);
    }
  }

  // sort by match count
  state.matches.sort(function(a, b) {
    var aCount = state.matchCounts[a] || 0;
    var bCount = state.matchCounts[b] || 0;
    return bCount - aCount;
  })

  // insert adaptive feedback
  if (state.matchFeedback[state.typed]) {
    state.matches.unshift(state.matchFeedback[state.typed])
  }

  return matches;
}

function updateMatchFeedback(typed, name) {
  state.matchFeedback[typed] = name;
}

function updateMatchCount(name) {
  if (!state.matchCounts[name]);
    state.matchCounts[name] = 0;
  state.matchCounts[name]++;
}

async function shutdown() {
  console.log('shutdown');
  let container = document.querySelector('#cmdContainer');
  if (container) {
    document.body.removeChild(container);
  }
  document.removeEventListener('keyup', onKeyup);
}

async function onKeyup(e) {

  if (isModifier(e)) {
    return;
  }

  console.log('onKeyup', e.key, e.which, hasModifier(e))
  e.preventDefault();
  
  // if user pressed escape, go away
  if (e.key == 'Escape' && !hasModifier(e)) {
    shutdown();
  }

  // if user pressed return, attempt to execute command
  else if (e.key == 'Enter' && !hasModifier(e)) {
    let name = state.matches[state.matchIndex];
    if (state.commands.indexOf(name) > -1) {
      shutdown();
      execute(name, state.typed);
      state.lastExecuted = name;
      updateMatchCount(name);
      updateMatchFeedback(state.typed, name);
      state.typed = '';
    }
  }

  // attempt to complete typed characters to a command
  // or do other modifications based on user typed keys
  else if (!hasModifier(e) && !isModifier(e) && !isIgnorable(e)) {
    console.log('LEGIT... no modifier, is not a modifier and not ignorable')

    // correct on backspace
    if (e.key == 'Backspace') {
      console.log('back', state.typed);
      if (state.typed.length > 0) {
        console.log('back, no typed tho');
        state.typed = state.typed.substring(0, state.typed.length - 1);
      }
    }
    // otherwise add typed character to buffer
    else {
      console.log('updating', e.key);
      state.typed += e.key
    }

    // search, and update UI
    state.matches = findMatchingCommands(state.typed);
    if (state.matches.length) {
      console.log('matches!', state.matches);
      update(state.typed, state.matches[0]);
      state.matchIndex = 0;
    }
    else {
      console.log('no matches for ', state.typed);
      update(state.typed);
    }
  }

  // if up arrow and currently visible command is not first, select one previous
  else if (e.key == 'ArrowUp' && state.matchIndex) {
    update(state.typed, state.matches[--state.matchIndex]);
  }

  // if down arrow and there are more matches, select the next one
  else if (e.key == 'ArrowDown' && state.matchIndex + 1 < state.matches.length) {
    update(state.typed, state.matches[++state.matchIndex]);
  }

  // Old behavior on tab:
  // tab -> shift to next result
  // shift + tab -> shift to previous result
  // New behavior on tab:
  // autocomplete to the matched command
  // which allows easy adding onto a command name
  // without having to type all the same visible text
  else if (e.key == 'Tab') {
    state.typed = state.matches[state.matchIndex]
    update(state.typed, state.matches[state.matchIndex]);
    //if (e.shiftKey && matchIndex)
    //  update(state.typed, state.matches[--state.matchIndex]);
    //else if (state.matchIndex + 1 < state.matches.length)
    //  update(state.typed, state.matches[++state.matchIndex]);
  }
}

function hasModifier(e) {
  return e.altKey || e.ctrlKey || e.shiftKey || e.metaKey
}

function isModifier(e) {
  return ['Alt', 'Control', 'Shift', 'Meta'].indexOf(e.key) != -1;
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
    case 224: //meta 
    case 0:
      return true;
      break;
    default:
      return false;
  }
}

function update(typed, completed) {
  let str = ''
  if (completed) {
    str = generateUnderlined(completed, typed);
  }
  // no match
  else if (typed) {
    str = typed;
  }
  let cmd = document.querySelector('#input');
  let parser = new DOMParser();
  let doc = parser.parseFromString(str, 'text/html');
  if (cmd.children.length)
    cmd.removeChild(cmd.children[0]);
  cmd.appendChild(doc.firstElementChild);
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
    str = '<span>' + wholeString + '</span>'
  }
  // occurs at beginning
  else if (startIndex === 0) {
    str = '<span style="text-decoration: underline;">' + subString + '</span>' + 
          '<span style="color: #6E6E6E;">' + wholeString.substring(subString.length) + '</span>';
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

})();
