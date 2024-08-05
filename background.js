let isActive = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOGGLE_ACTIVE") {
    isActive = !isActive;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: setActiveState,
        args: [isActive],
      });
    });
    sendResponse({ isActive });
  } else if (message.type === "DOWNLOAD_DATA") {
    const url = `data:text/plain;charset=utf-8,${encodeURIComponent(
      message.data
    )}`;
    chrome.downloads.download({
      url,
      filename: message.filename,
    });
  } else if (message.type === "DOWNLOAD_HTML_REPORT") {
    const url = `data:text/html;charset=utf-8,${encodeURIComponent(
      message.data
    )}`;
    chrome.downloads.download({
      url,
      filename: message.filename,
    });
  } else if (message.type === "GET_TAB_URL") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ url: tabs[0].url });
    });
    return true; // Will respond asynchronously.
  } else if (message.type === "CAPTURE_SCREENSHOT") {
    chrome.tabs.captureVisibleTab(null, {}, (dataUrl) => {
      sendResponse({ screenshot: dataUrl });
    });
    return true; // Will respond asynchronously.
  }
});

function setActiveState(active) {
  window.isActive = active;
}
