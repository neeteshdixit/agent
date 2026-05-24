// popup.js - NEXUS AI UI Logic

document.addEventListener('DOMContentLoaded', () => {
  const tokenInput = document.getElementById('jwt-token');
  const commandInput = document.getElementById('operator-command');
  const runBtn = document.getElementById('run-btn');
  const pageTitle = document.getElementById('page-title');
  const pageUrl = document.getElementById('page-url');
  const resultBox = document.getElementById('result-box');

  // 1. Retrieve stored credentials/JWT
  chrome.storage.local.get(['jwt_token'], (res) => {
    if (res.jwt_token) {
      tokenInput.value = res.jwt_token;
    }
  });

  // 2. Fetch current tab DOM context via background.js
  chrome.runtime.sendMessage({ action: 'EXTRACT_PAGE_CONTEXT' }, (response) => {
    if (response && response.success && response.data) {
      pageTitle.textContent = response.data.title || 'No active webpage title';
      pageUrl.textContent = response.data.url || '';
    } else {
      pageTitle.textContent = 'Standard Browser Tab';
      pageUrl.textContent = 'Navigate to Gmail or WhatsApp for enhanced context.';
    }
  });

  // 3. Save JWT token on input change
  tokenInput.addEventListener('input', () => {
    chrome.storage.local.set({ jwt_token: tokenInput.value });
  });

  // 4. Submit Command to backend
  runBtn.addEventListener('click', () => {
    const command = commandInput.value.trim();
    if (!command) {
      showResult('Please enter a command to execute.', false);
      return;
    }

    runBtn.disabled = true;
    runBtn.textContent = 'Executing...';
    resultBox.style.display = 'none';

    chrome.runtime.sendMessage(
      {
        action: 'EXECUTE_AUTOMATION',
        command,
        token: tokenInput.value.trim(),
      },
      (response) => {
        runBtn.disabled = false;
        runBtn.textContent = 'Execute Task';

        if (response && response.success) {
          const task = response.data?.task;
          const status = task?.status || 'completed';
          const msg = response.data?.task?.result?.message || 'Task successfully initiated.';
          showResult(`[${status.toUpperCase()}] ${msg}`, status === 'completed');
        } else {
          showResult(response?.error || 'Failed to connect to NEXUS AI backend.', false);
        }
      }
    );
  });

  function showResult(message, isSuccess) {
    resultBox.textContent = message;
    resultBox.className = 'result-panel ' + (isSuccess ? 'result-success' : 'result-error');
    resultBox.style.display = 'block';
  }
});
