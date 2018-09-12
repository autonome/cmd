/*
 
TODO: NOW
* fix style
* listen for click events, focus events, and close UI
* store state data in add-on, not localStorage

TODO: NEXT
* move tab to window command
* switch to window command
* add to Pocket command
* command suggestions (listed below - eg, see windows)

TODO: FUTURE
* remember last-executed command across restarts
* sessions
* configurable shortcut
* better visual fix for overflow text
* commands that identify things in the page and act on them (locations, events, people)

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
  let old = document.querySelector('#cmdContainer.cmdExtension');
  if (old) {
    shutdown();
  }

  // Outermost invisible container
  // Full page height and width
  let container = document.createElement('div');
  container.id = 'cmdContainer';
  container.setAttribute('style', 'all: initial;');
  //container.style.all = 'revert';
  container.classList.add('cmdExtension');
  await css(container, {
    position: 'fixed',
    zIndex: 9999,
    top: 0, left: 0,
    height: '100%', width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  });

  // Visible container
  let cmd = document.createElement('div');
  cmd.id = 'cmd';
  //cmd.setAttribute('style', 'all: initial;');
  cmd.classList.add('cmdExtension');
  await css(cmd, {
    height: '3rem',
    width: '30rem',
    backgroundColor: 'yellow',
    marginTop: '-10rem',
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
  //input.setAttribute('style', 'all: initial;');
  let props = {
    height: '3rem',
    width: '100%',
    backgroundColor: 'yellow',
    lineHeight: '2rem',
    color: 'pink',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    fontSize: '2rem'
  };
  let str = Object.keys(props).map(key=>key + ':"' + props[key] + '"').join(';');
  input.setAttribute('style', str);
  input.classList.add('cmdExtension');
  await css(input, {
    all: 'initial',
    height: '3rem',
    width: '100%',
    backgroundColor: 'yellow',
    lineHeight: '2rem',
    color: 'pink',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    fontSize: '2rem'
  });
  cmd.appendChild(input);

  document.body.appendChild(container);

  // add event listeners
  document.addEventListener('keyup', onKeyup, true);
  document.addEventListener('keypress', onKeyDummyStop, true);
  document.addEventListener('keydown', onKeyDummyStop, true);
  document.addEventListener('input', onKeyDummyStop, true);
}

render();

async function css(el, props) {
  Object.keys(props).forEach(p => el.style[p] = props[p]);
  //Object.keys(props).forEach(p => el.style.setProperty(p, props[p], 'important'));
}

function execute(name, typed) {
  msgPort.postMessage({
    action: 'execute',
    name: name,
    typed: typed
  });
}

function findMatchingCommands(text) {
  const r = true;
  r || console.log('findMatchingCommands', text, state.commands);
  var count = state.commands.length,
      matches = [];

  // Iterate over all commands, searching for matches
  for (var i = 0; i < count; i++) {
    // Match when:
    // 1. typed string is anywhere in a command name
    // 2. command name is at beginning of typed string
    //    (eg: for command input - "weather san diego")
    r || console.log('testing option...', state.commands[i])
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
  console.log('content-script shutdown');
  let container = document.querySelector('#cmdContainer.cmdExtension');
  if (container) {
    document.body.removeChild(container);
  }
  document.removeEventListener('keyup', onKeyup);
  document.removeEventListener('keypress', onKeyDummyStop);
  document.removeEventListener('keydown', onKeyDummyStop);
  document.removeEventListener('input', onKeyDummyStop);
}

function onKeyDummyStop(e) {
  e.preventDefault();
}

async function onKeyup(e) {
  const r = true;
  e.preventDefault();

  if (isModifier(e)) {
    return;
  }

  r || console.log('onKeyup', e.key, e.which)
  r || console.log('hasModifier', hasModifier(e), 'isModifier', isModifier(e), 'isIgnorable', isIgnorable(e));

  e.preventDefault();

  // if user pressed escape, go away
  if (e.key == 'Escape' && !hasModifier(e)) {
    r || console.log('onKeyUp: escape!');
    shutdown();
  }

  // if user pressed return, attempt to execute command
  else if (e.key == 'Enter' && !hasModifier(e)) {
    r || console.log('onKeyUp: enter!', state.typed);
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
    r || console.log('LEGIT... no modifier, is not a modifier and not ignorable')

    // correct on backspace
    if (e.key == 'Backspace') {
      r || console.log('back', state.typed);
      if (state.typed.length > 0) {
        r || console.log('back, no typed tho');
        state.typed = state.typed.substring(0, state.typed.length - 1);
      }
    }
    // otherwise add typed character to buffer
    else {
      r || console.log('updating', e.key);
      state.typed += e.key
    }

    // search, and update UI
    state.matches = findMatchingCommands(state.typed);
    if (state.matches.length) {
      r || console.log('matches!', state.matches);
      update(state.typed, state.matches[0]);
      state.matchIndex = 0;
    }
    else {
      r || console.log('no matches for ', state.typed);
      update(state.typed);
    }
  }

  // if up arrow and currently visible command is not first, select one previous
  else if (e.key == 'ArrowUp' && state.matchIndex) {
    r || console.log('onKeyUp: arrow up!');
    update(state.typed, state.matches[--state.matchIndex]);
  }

  // if down arrow and there are more matches, select the next one
  else if (e.key == 'ArrowDown' && state.matchIndex + 1 < state.matches.length) {
    r || console.log('onKeyUp: arrow down!');
    update(state.typed, state.matches[++state.matchIndex]);
  }

  // Old behavior on tab:
  // tab -> shift to next result
  // shift + tab -> shift to previous result
  // New behavior on tab:
  // autocomplete to the matched command
  // which allows easy adding onto a command name
  // without having to type all the same visible text
  else if (e.key == 'Tab' && state.matches) {
    r || console.log('onKeyUp: tab!');
    state.typed = state.matches[state.matchIndex]
    update(state.typed, state.matches[state.matchIndex]);
    //if (e.shiftKey && matchIndex)
    //  update(state.typed, state.matches[--state.matchIndex]);
    //else if (state.matchIndex + 1 < state.matches.length)
    //  update(state.typed, state.matches[++state.matchIndex]);
  }
}

function hasModifier(e) {
  return e.altKey || e.ctrlKey || e.metaKey;
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
  const r = true;
  r || console.log('update', typed, completed);
  let str = ''
  if (completed) {
    str = generateUnderlined(typed, completed);
  }
  // no match
  else if (typed) {
    str = typed;
  }
  let parser = new DOMParser();
  let doc = parser.parseFromString(str, 'text/html');

  let input = document.querySelector('#input.cmdExtension');
  if (input.firstElementChild)
    input.removeChild(input.firstElementChild);
  input.appendChild(doc.firstElementChild);
}

// completed, typed
function generateUnderlined(typed, match) {
  const r = true;
  r || console.log('generateUnderlined', typed, match);
  // user already matched a commmand and added params
  /*
  if (match.length > typed.length &&
      match.indexOf(typed) === 0) {
    return match;
  }
  */

  var startIndex = typed.toLowerCase().indexOf(match.toLowerCase());
  if (startIndex == -1 && match) {
    startIndex = match.toLowerCase().indexOf(typed.toLowerCase());
    if (startIndex == -1) {
      return typed;
    }
  }
  var endIndex = startIndex + match.length;
  console.log('startIndex', startIndex, 'endIndex', endIndex);
  var str = ''

  // substring is empty
  if (!match) {
    str = '<span>' + typed + '</span>'
  }
  // occurs at beginning
  else if (startIndex === 0) {
    r || console.log('start');
    str = '<span style="text-decoration: underline;">' + match + '</span>' +
          '<span style="color: #6E6E6E;">' + typed.substring(match.length) + '</span>';
  }
  // occurs in middle
  else if (endIndex != typed.length) {
    r || console.log('middle');
    str = "<span class='completed'>" + typed.substring(0, startIndex) + "</span>" +
          "<span class='typed'>" + typed.substring(startIndex, startIndex + match.length) + "</span>"
          "<span class='completed'>" + typed.substring(endIndex) + "</span>";
  }
  // occurs at the end
  else {
    r || console.log('end');
    str = "<span class='completed'>" + typed.substring(0, startIndex) + "</span>" +
          "<span class='typed'>" + match + "</span>";
  }
  return str;
}

})();
