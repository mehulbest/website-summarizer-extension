/**
 * Website Summarizer Extension by mehulbest
 * content.js — Injected into every webpage to extract readable text content
 *
 * Strategy:
 *  1. Try <article> or [role="main"] semantic elements first
 *  2. Fall back to <main>, then <body>
 *  3. Strip noise: nav, footer, ads, scripts, styles
 *  4. Return a cleaned, trimmed text string
 */

/**
 * extractPageText()
 * Extracts the most meaningful readable text from the current page.
 * @returns {{ text: string, title: string, wordCount: number }}
 */
function extractPageText() {
  // Tags to remove before extracting text (noise elements)
  const NOISE_SELECTORS = [
    'nav', 'footer', 'header', 'aside',
    'script', 'style', 'noscript',
    '.ad', '.ads', '.advertisement', '.sidebar',
    '.cookie-banner', '.popup', '.modal',
    '[role="navigation"]', '[role="complementary"]',
    '[aria-hidden="true"]'
  ];

  // Clone the body so we don't mutate the real page
  const clone = document.body.cloneNode(true);

  // Remove noise elements from clone
  NOISE_SELECTORS.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Try to find the best content container (semantic first)
  let contentEl =
    clone.querySelector('article') ||
    clone.querySelector('[role="main"]') ||
    clone.querySelector('main') ||
    clone.querySelector('.post-content') ||
    clone.querySelector('.article-body') ||
    clone.querySelector('.entry-content') ||
    clone;

  // Extract and clean the text
  let rawText = contentEl.innerText || contentEl.textContent || '';

  // Normalize whitespace: collapse multiple spaces/newlines
  let cleanText = rawText
    .replace(/\t/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Word count for meta info
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

  return {
    text: cleanText,
    title: document.title || 'Untitled Page',
    wordCount
  };
}

/**
 * Listen for messages from popup.js
 * When popup sends "extractText", extract and return the page text.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractText') {
    try {
      const result = extractPageText();
      sendResponse({ success: true, ...result });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }

  // Must return true to allow async sendResponse
  return true;
});
