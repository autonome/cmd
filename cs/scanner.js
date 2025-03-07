const port = browser.runtime.connect({ name: 'cmd-popup' });

const onConnected = port => {
  // Each time popup loads, scan the page
  // and send everything back
  scan(port);
};

browser.runtime.onConnect.addListener(onConnected);

const scan = port => {
  // Send current selection
  const sel = getSelectionText();
  port.postMessage({ selection: sel });

  // Send any microformats
  const res = Microformats.get();
  if (res.items.length > 0) {
    port.postMessage({ microformats: res });
  }
};

function getSelectionText() {
  let text = '';
  if (window.getSelection) {
    text = window.getSelection().toString();
  } else if (document.selection && document.selection.type != 'Control') {
    text = document.selection.createRange().text;
  }
  return text;
}
