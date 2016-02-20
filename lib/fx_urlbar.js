function currentAndFutureWindows(func) {
  var windows = require('sdk/windows').browserWindows,
      { viewFor } = require("sdk/view/core");
  for (let window of windows) {
    func(viewFor(window));
  }
  windows.on('open', function(window) {
    func(viewFor(window));
  });
}

exports.setText = function(text) {
  currentAndFutureWindows(function(win) {
    var existing = win.document.querySelector('#cmd-session')
    if (existing) {
      existing.setAttribute('value', text)
    }
    else {
      var XUL = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
          hbox = win.document.createElementNS(XUL, 'hbox'),
          label = win.document.createElementNS(XUL, 'label')
      label.setAttribute('id', 'cmd-session')
      label.setAttribute('value', text)
      label.style.opacity = '0.4'
      hbox.appendChild(label)
      var icons = win.document.querySelector('#urlbar-icons')
      icons.parentNode.insertBefore(hbox, icons)
    }
  })
}
