// background.js - NEXUS AI Service Worker

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'EXTRACT_PAGE_CONTEXT') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) {
        sendResponse({ success: false, error: 'No active tab found.' });
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { action: 'READ_DOM' }, (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message || 'Failed to communicate with content script.',
          });
        } else {
          sendResponse({ success: true, data: response });
        }
      });
    });
    return true; // async messaging channel
  }

  if (request.action === 'EXECUTE_AUTOMATION') {
    const token = request.token;
    fetch('http://localhost:5000/api/tasks/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ command: request.command }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.message });
      });

    return true; // async messaging channel
  }
});
