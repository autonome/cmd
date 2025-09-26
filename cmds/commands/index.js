// Import all commands and utilities
import { dbg } from './utils.js';
import bookmark from './bookmark.js';
import bookmarklets from './bookmarklets.js';
import email from './email.js';
import googleDocs from './googleDocs.js';
import sendToWindow from './sendToWindow.js';
import switchToWindow from './switchToWindow.js';
import newContainerTab from './newContainerTab.js';
import switchTabContainer from './switchTabContainer.js';
import note from './note.js';
import rottenTomatoes from './rottenTomatoes.js';
import notify from './notify.js';
import groups from './groups.js';

// Commands registry
export let commands = {};

// Register a command
export function addCommand(command) {
  commands[command.name] = command;
  // TODO: debounce
  onCommandsUpdated();
}

// Dispatch command updates event
export function onCommandsUpdated() {
  window.dispatchEvent(new CustomEvent('cmd-update-commands', { detail: commands }));
  dbg('main sending updated commands out', Object.keys(commands));
}

// Initialize all command sources
export const initializeCommandSources = async () => {
  dbg('initializeCommandSources');
  
  // Register simple commands
  /*
  addCommand(bookmark);
  addCommand(email);
  addCommand(note);
  addCommand(rottenTomatoes);
  addCommand(notify);
  */
  groups.forEach(addCommand);
  dbg('Registered groups command');

  /* 
  // Register commands from Google Docs
  googleDocs.forEach(addCommand);
  
  // Register dynamic commands
  const bookmarkletCommands = await bookmarklets.source();
  bookmarkletCommands.forEach(addCommand);
  
  const windowCommands = await sendToWindow.source();
  windowCommands.forEach(addCommand);
  
  const switchWindowCommands = await switchToWindow.source();
  switchWindowCommands.forEach(addCommand);
  
  const containerCommands = await newContainerTab.source();
  containerCommands.forEach(addCommand);
  
  const switchContainerCommands = await switchTabContainer.source();
  switchContainerCommands.forEach(addCommand);
  */
  
  onCommandsUpdated();
};

// Initialize commands when DOM is loaded
window.addEventListener('DOMContentLoaded', initializeCommandSources);

// Export all commands for use in other modules
export {
  bookmark,
  bookmarklets,
  email,
  googleDocs,
  sendToWindow,
  switchToWindow,
  newContainerTab,
  switchTabContainer,
  note,
  rottenTomatoes,
  notify
};
