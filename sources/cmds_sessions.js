/*

Concepts:
* default session, named "default"
* can open and close named sessions
* all sessions autosave their state
* can delete named sessions, but not default

Commands
* send current tab to named session
* send all tabs in window to named session
* rename current session
* delete current session (sends you back to default, cannot delete default)

MVP
* save existing tab set as "default" session
* command: "save session as {name}" (saves w/ name)
* start a new named session with "<new session> {name}"
* switch between sessions with "<open session> {name}"
* command for "move page to session {name}"
* save session at shutdown
* make session name visible somewhere
* TODO: figure out session overwrites

Migration
* Import existing tab groups as named sessions

Tabdeath
* hide tab bar (add a command)
* <esc> to view all pages in session
* <esc> again to view all sessions
* mouse, arrow keys and tab to navigate sessions/pages
* <enter> on selected session/page to open
* cli also works in these views

*/

// Event handling boilerplate
// When regenerating commands, do:
//  emit(exports, 'commands', commands)
var { emit, on, once, off } = require("sdk/event/core");
exports.on = on.bind(null, exports)
exports.removeListener = function removeListener(type, listener) {
  off(exports, type, listener);
}

// SessionStore service
const {Cc, Ci} = require('chrome')
var ss = Cc["@mozilla.org/browser/sessionstore;1"].
         getService(Ci.nsISessionStore)

// Initialize storage
var storage = require("sdk/simple-storage").storage
if (!storage.sessions)
  storage.sessions = {}
if (!storage.lastActiveSessionName)
  storage.lastActiveSessionName = 'default'

console.log('inited - sessions:', storage.lastActiveSessionName)

function updateUI() {
  require('./fx_urlbar').setText('(Session: ' + storage.lastActiveSessionName + ')')
}

// Switch to a session with the given name
// Handles saving current session
function switchSession(name) {
  // do nothing if user chose same session
  if (storage.lastActiveSessionName == name) {
    notify('You are already in that session, silly!')
  }
  else {
    // store existing session
    storage.sessions[storage.lastActiveSessionName] = ss.getBrowserState()
    // get named session || empty
    var session = storage.sessions[name] || {}
    // record name
    storage.lastActiveSessionName = name
    // restore session
    ss.setBrowserState(session)
    // update ui
    updateUI(name)
    // notify
    notify('Switched to session: ' + name)
    // update our command list in cmd UI
    flagForUpdate()
  }
}

// Notification utility
function notify(text) {
  require('sdk/notifications').notify({
    title: 'cmd->sessions',
    text: text
  })
}

function flagForUpdate() {
  require('sdk/timers').setTimeout(generateCommands, 0)
}

function generateCommands() {
  var commands = []
  // Command: Save session as... {name}
  commands.push({
    name: 'Save a copy of session as...',
    execute: function(typed) {
      var name = typed.replace(this.name, '').trim().split(' ').shift()
      //console.log('Saving session', name)
      if (name) {
        storage.sessions[name] = ss.getBrowserState()
        notify('Session saved as ' + name)
        flagForUpdate() 
      }
      else {
        notify('You need to give a session name!')
      }
    }
  })
  // Command: Start new session named... {name}
  commands.push({
    name: 'Enter new empty session named...',
    execute: function(typed) {
      var name = typed.replace(this.name, '').trim().split(' ').shift()
      if (name) {
        storage.sessions[name] = JSON.stringify({
          "windows":[
            {"tabs":[
              {"entries":[{"url":"about:newtab","title":"Index of /","ID":1,"docshellID":1,"docIdentifier":1,"persist":true}],
               "lastAccessed":1428629527947,"hidden":false,"attributes":{},"index":1}
            ],"selected":1,"_closedTabs":[],"busy":false,"width":1021,"height":558,"screenX":4,"screenY":23,"sizemode":"normal"}],"selectedWindow":1,"_closedWindows":[],"session":{"lastUpdate":1428629545004,"startTime":1428629523011,"recentCrashes":0},
          "global":{}})
        switchSession(name)
        notify('Created new session - ' + name)
      }
      else {
        notify('You need to name the session you want to enter!')
      }
    }
  })
  Object.keys(storage.sessions).forEach(function(name) {
    commands.push({
      name: 'Switch to session: ' + name,
      execute: function() {
        switchSession(name)
        notify('Switched to session - ' + name)
      }
    })
    commands.push({
      name: 'Send tab to session: ' + name,
      execute: function() {
        // Get tab session data
        var { viewFor } = require('sdk/view/core')
        var tabs = require('sdk/tabs')
        var tabData = JSON.parse(ss.getTabState(viewFor(tabs.activeTab)))
        var session = JSON.parse(storage.sessions[name])
        session.windows[0].tabs.push(tabData)
        storage.sessions[name] = JSON.stringify(session)
        tabs.activeTab.close() 
        notify('Sent active tab to session - ' + name)
      }
    })
    commands.push({
      name: 'Permanently delete session: ' + name,
      execute: function() {
        if (storage.lastActiveSession == name) {
          notify('You cannot delete the session you are in!')
        }
        else {
          delete storage.sessions[name]
          flagForUpdate() 
        }
        notify('Deleted session - ' + name)
      }
    })
  })
  // Send notification to listeners
  emit(exports, 'commands', commands)
  return commands;
}

// Exports
exports.commands = new Promise(function(resolve, reject) {
  resolve(generateCommands())
})

require('sdk/system/unload').when(function() {
  var currentSessionName = storage.lastActiveSessionName || 'default-' + Date.now()
  storage.sessions[currentSessionName] = ss.getBrowserState()
  console.log('saving session!', currentSessionName)
  //console.log('SESSION at close', currentSessionName, storage.sessions[currentSessionName])
})
