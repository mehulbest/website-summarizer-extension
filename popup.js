/**
 * Website Summarizer Extension by mehulbest
 * popup.js — Controls the extension popup UI
 *
 * Flow:
 *  1. On load → show current page domain
 *  2. User clicks "Summarize" → inject content.js if needed, extract page text
 *  3. Run local summarization algorithm on extracted text
 *  4. Display summary in popup with word count meta
 *  5. Allow user to copy summary to clipboard
 */

// ─── DOM References ────────────────────────────────────────────
const summarizeBtn  = document.getElementById('summarizeBtn');
const loadingArea   = document.getElementById('loadingArea');
const summaryArea   = document.getElementById('summaryArea');
const summaryContent= document.getElementById('summaryContent');
const summaryMeta   = document.getElementById('summaryMeta');
const errorArea     = document.getElementById('errorArea');
const errorText     = document.getElementById('errorText');
const retryBtn      = document.getElementById('retryBtn');
const copyBtn       = document.getElementById('copyBtn');
const copyLabel     = document.getElementById('copyLabel');
const pageDomain    = document.getElementById('pageDomain');

// ─── On Popup Load ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Show the current tab's domain in the page info bar
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const url = new URL(tab.url);
      pageDomain.textContent = url.hostname || tab.url;
    }
  } catch {
    pageDomain.textContent = 'Unknown page';
  }
});

// ─── Summarize Button Click ────────────────────────────────────
summarizeBtn.addEventListener('click', handleSummarize);
retryBtn.addEventListener('click', handleSummarize);

async function handleSummarize() {
  showState('loading');

  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) throw new Error('No active tab found.');

    // Check if we can inject into this page
    const url = tab.url || '';
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('edge://') || url === '') {
      throw new Error("Can't summarize browser system pages. Try navigating to a website first.");
    }

    // Inject content.js programmatically (in case it hasn't loaded yet)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    // Send message to content.js to extract text
    const response = await sendMessageToTab(tab.id, { action: 'extractText' });

    if (!response || !response.success) {
      throw new Error(response?.error || 'Could not extract page content.');
    }

    const { text, title, wordCount } = response;

    if (!text || text.trim().length < 100) {
      throw new Error('This page has too little readable content to summarize.');
    }

    // Generate summary using local algorithm
    const summary = summarizeText(text);

    if (!summary || summary.length === 0) {
      throw new Error('Could not generate a summary for this page.');
    }

    // Display the summary
    displaySummary(summary, { wordCount, title });

  } catch (err) {
    showError(err.message || 'An unexpected error occurred.');
  }
}

// ─── Message Helper ────────────────────────────────────────────
function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// ─── Summarization Algorithm ───────────────────────────────────
/**
 * summarizeText(text)
 * A lightweight, open-source extractive summarization algorithm.
 *
 * How it works:
 *  1. Split text into sentences
 *  2. Score each sentence by:
 *     - Word frequency (TF-style scoring)
 *     - Sentence position (earlier = slightly higher score)
 *     - Sentence length penalty (avoid too short/long)
 *  3. Pick top-N sentences
 *  4. Return them in original order as bullet points
 *
 * No external APIs needed — runs 100% locally in the browser.
 *
 * @param {string} text - Raw page text
 * @param {number} numSentences - How many key sentences to return (default 5)
 * @returns {string[]} Array of key sentences
 */
function summarizeText(text, numSentences = 5) {
  // ── Step 1: Split into sentences ──
  // Handle common sentence endings: . ! ?
  const rawSentences = text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 30 && s.length < 600); // filter too short or too long

  if (rawSentences.length === 0) return [];

  // If very short content, return as-is
  if (rawSentences.length <= numSentences) return rawSentences.slice(0, numSentences);

  // ── Step 2: Word frequency map (stop words excluded) ──
  const STOP_WORDS = new Set([
    'the','a','an','and','or','but','in','on','at','to','for','of','with',
    'by','from','is','was','are','were','be','been','being','have','has',
    'had','do','does','did','will','would','could','should','may','might',
    'this','that','these','those','it','its','i','we','you','he','she','they',
    'as','if','so','about','up','out','into','over','after','than','then',
    'also','not','no','more','one','two','just','can','all'
  ]);

  const wordFreq = {};
  const allWords = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];

  allWords.forEach(word => {
    if (!STOP_WORDS.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  // Normalize frequencies to 0–1
  const maxFreq = Math.max(...Object.values(wordFreq), 1);
  Object.keys(wordFreq).forEach(w => wordFreq[w] /= maxFreq);

  // ── Step 3: Score sentences ──
  const scored = rawSentences.map((sentence, index) => {
    const words = sentence.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const relevantWords = words.filter(w => !STOP_WORDS.has(w));

    // Sum of word frequencies in this sentence
    const freqScore = relevantWords.reduce((sum, word) => sum + (wordFreq[word] || 0), 0);

    // Normalize by sentence word count (avoid favoring long sentences)
    const normalizedScore = relevantWords.length > 0 ? freqScore / relevantWords.length : 0;

    // Position bonus: first 20% of sentences get a small boost
    const positionBonus = index < rawSentences.length * 0.2 ? 0.15 : 0;

    return {
      sentence,
      score: normalizedScore + positionBonus,
      index
    };
  });

  // ── Step 4: Pick top-N sentences, return in original order ──
  const topSentences = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, numSentences)
    .sort((a, b) => a.index - b.index) // restore original order
    .map(item => item.sentence);

  return topSentences;
}

// ─── Display Summary ───────────────────────────────────────────
function displaySummary(sentences, { wordCount, title }) {
  // Render as a bullet list
  const ul = document.createElement('ul');
  sentences.forEach(sentence => {
    const li = document.createElement('li');
    li.textContent = sentence;
    ul.appendChild(li);
  });

  summaryContent.innerHTML = '';
  summaryContent.appendChild(ul);

  // Meta info
  summaryMeta.textContent = `${wordCount.toLocaleString()} words on page · ${sentences.length} key points`;

  // Store plain text for copy
  summaryContent.dataset.plainText = sentences.map((s, i) => `${i + 1}. ${s}`).join('\n');

  showState('summary');
}

// ─── Copy Button ───────────────────────────────────────────────
copyBtn.addEventListener('click', async () => {
  const text = summaryContent.dataset.plainText;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    copyBtn.classList.add('copied');
    copyLabel.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyLabel.textContent = 'Copy';
    }, 2000);
  } catch {
    copyLabel.textContent = 'Failed';
    setTimeout(() => { copyLabel.textContent = 'Copy'; }, 2000);
  }
});

// ─── UI State Management ───────────────────────────────────────
function showState(state) {
  // Hide all dynamic sections
  loadingArea.style.display   = 'none';
  summaryArea.style.display   = 'none';
  errorArea.style.display     = 'none';
  summarizeBtn.disabled       = false;

  switch (state) {
    case 'loading':
      loadingArea.style.display  = 'flex';
      summarizeBtn.disabled      = true;
      break;
    case 'summary':
      summaryArea.style.display  = 'block';
      break;
    case 'error':
      errorArea.style.display    = 'flex';
      break;
  }
}

function showError(message) {
  errorText.textContent = message;
  showState('error');
}
