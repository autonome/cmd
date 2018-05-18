// Event handling boilerplate
// When regenerating commands, do:
//  emit(exports, 'commands', commands)
var { emit, on, once, off } = require("sdk/event/core");
exports.on = on.bind(null, exports);
exports.removeListener = function removeListener(type, listener) {
  off(exports, type, listener);
};

var bookmarks = require("sdk/places/bookmarks")

exports.commands = new Promise(function(resolve, reject) {

  // Query for matching title and url contains with "javascript:"
  var query = { query: 'javascript:' }

  // TODO: query by url doesn't return javascript scheme bookmarks
  //var query = { url: 'javascript:' }

  bookmarks.search(query).on('end', function (results) {
    // filter out all bookmarklets by checking that the
    // url *starts* with javascript scheme.
    var bookmarklets = results.filter(function(result) {
      return result.url.indexOf('javascript:') === 0
    })

    var commands = bookmarklets.map(function(bookmarklet) {
      return {
        name: bookmarklet.title + ' (bookmarklet)',
        execute: function() {
          require('sdk/tabs').activeTab.url = bookmarklet.url
        }
      }
    })

    emit(exports, 'commands', commands)
    resolve(commands)
  })
})
