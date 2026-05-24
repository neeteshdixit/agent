// content.js - NEXUS AI DOM Context Extractor

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'READ_DOM') {
    const context = {
      title: document.title,
      url: window.location.href,
      extractedAt: new Date().toISOString(),
      app: 'unknown',
      details: {},
    };

    if (window.location.host.includes('mail.google.com')) {
      context.app = 'gmail';
      // Parse visible emails in inbox if possible
      const emailRows = document.querySelectorAll('tr.zA');
      const emails = Array.from(emailRows).slice(0, 5).map((row) => {
        const sender = row.querySelector('.zF')?.textContent || 'Unknown';
        const subject = row.querySelector('.bog')?.textContent || 'No Subject';
        return { sender, subject };
      });
      context.details = { emails };
    } else if (window.location.host.includes('web.whatsapp.com')) {
      context.app = 'whatsapp';
      // Parse active chat details
      const activeChatTitle = document.querySelector('header [title]')?.getAttribute('title') || 'None';
      context.details = { activeChat: activeChatTitle };
    }

    sendResponse(context);
  }
});
