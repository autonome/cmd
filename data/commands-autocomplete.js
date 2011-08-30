window.addEventListener("DOMContentLoaded", function() {
  window.removeEventListener("DOMContentLoaded", arguments.callee, false);
  var cmd = document.getElementById("cmd");

  // handle messages from jetpack code
  self.on("message", function(msg) {
    msg = JSON.parse(msg);
    if (msg.completed) {
      if (msg.typed) {
        cmd.innerHTML = generateUnderlined(msg.completed, msg.typed);
      }
      else {
        cmd.innerHTML = msg.completed;
      }
      cmd.style.color = "white";
    }
    else if (msg.typed) {
      cmd.innerHTML = msg.typed;
      cmd.style.color = "red";
    }
  });

  // sent init message to jetpack code
  //postMessage(JSON.stringify({init: true}));
}, false);

function generateUnderlined(wholeString, subString) {
  let startIndex = wholeString.toLowerCase().indexOf(subString.toLowerCase());
  let endIndex = startIndex + subString.length;
  // occurs at beginning
  if (startIndex === 0) {
    return "<span class='typed'>" + subString + "</span>" + 
           "<span>" + wholeString.substring(subString.length) + "</span>";
  }
  // occurs in middle
  else if (endIndex != wholeString.length) {
    return "<span>" + wholeString.substring(0, startIndex) + "</span>" + 
           "<span class='typed'>" + wholeString.substring(startIndex, startIndex + subString.length) + "</span>" +
           "<span>" + wholeString.substring(endIndex) + "</span>";
  }
  // occurs at the end
  else {
    return "<span>" + wholeString.substring(0, startIndex) + "</span>" + 
           "<span class='typed'>" + subString + "</span>";
  }
}
