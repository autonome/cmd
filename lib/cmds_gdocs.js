
exports.commands = new Promise(function(resolve, reject) {

  var commands = []
  var docs = [
    {
      cmd: 'new google doc',
      url: 'http://docs.google.com/document/create?hl=en'
    },
    {
      cmd: 'new google sheet',
      url: 'http://spreadsheets.google.com/ccc?new&hl=en'
    }
  ].forEach(function(doc) {
    commands.push({
      name: doc.cmd,
      execute: function() {
        require('sdk/tabs').open(doc.url)
      }
    })
  })

  resolve(commands)
})
