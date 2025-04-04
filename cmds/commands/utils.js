// Utility functions for commands

// Debug utility
export const DEBUG = 1;

export function dbg(...args) {
  if (DEBUG === 1) {
    console.log(...args);
  }
}

// Notification utility
export function notify(title, content) {
  browser.notifications.create({
    type: 'basic',
    iconUrl: browser.runtime.getURL('images/icon.png'),
    title,
    message: content
  });
}