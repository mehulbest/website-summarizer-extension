# 📄 Website Summarizer Extension by mehulbest

A lightweight, open-source Chrome extension that instantly summarizes any webpage — no API keys, no accounts, no internet connection required for summarization.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Manifest](https://img.shields.io/badge/manifest-v3-orange)

---

## ✨ Features

- **One-click summarization** — click the extension icon, hit Summarize
- **100% local processing** — no external APIs, no data sent anywhere
- **Smart extraction** — ignores nav bars, ads, footers, and focuses on real content
- **Extractive AI summarization** — TF-scored sentence ranking algorithm
- **Copy to clipboard** — copy the summary with one click
- **Clean dark UI** — minimal, readable popup design
- **Works on most websites** — news, blogs, articles, documentation

---

## 🚀 Installation (Developer Mode)

> **No Chrome Web Store needed** — load directly from source.

### Step 1 — Download the extension

```bash
git clone https://github.com/mehulbest/website-summarizer-extension.git
```

Or [Download ZIP](https://github.com/mehulbest/website-summarizer-extension/archive/refs/heads/main.zip) and extract it.

### Step 2 — Open Chrome Extensions

Open Chrome and go to:
```
chrome://extensions
```

Or navigate via: **Menu → More Tools → Extensions**

### Step 3 — Enable Developer Mode

Toggle **"Developer mode"** ON (top-right corner of the Extensions page).

### Step 4 — Load the extension

Click **"Load unpacked"** and select the `website-summarizer-extension` folder.

### Step 5 — Use it!

Navigate to any webpage → click the extension icon in your toolbar → click **"Summarize This Page"**.

---

## 🗂️ Project Structure

```
website-summarizer-extension/
├── manifest.json      # Chrome Extension config (Manifest V3)
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic + local summarization algorithm
├── content.js         # Injected script — extracts page text
├── styles.css         # Popup styling (dark theme)
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## ⚙️ How It Works

1. **Text Extraction** (`content.js`)
   - Injected into every webpage
   - Targets semantic elements: `<article>`, `<main>`, `[role="main"]`
   - Strips noise: navbars, footers, ads, scripts
   - Returns clean, readable text to the popup

2. **Local Summarization** (`popup.js → summarizeText()`)
   - Splits text into sentences
   - Builds a word-frequency map (TF-style, stop words excluded)
   - Scores each sentence by relevance + position
   - Returns top-5 most important sentences in original order
   - Displayed as bullet points — no API call needed

3. **Popup UI** (`popup.html` + `styles.css`)
   - Shows current page domain
   - Summarize button triggers extraction + summarization
   - Summary renders with copy button and word count
   - Error states handled gracefully

---

## 🔒 Privacy

- **No data leaves your browser.** The extension never sends your page content to any server.
- No analytics, no tracking, no accounts.
- All summarization runs locally using JavaScript.

---

## 🛣️ Roadmap / Future Improvements

- [ ] Adjustable summary length (3 / 5 / 7 sentences)
- [ ] Highlight key terms in the summary
- [ ] Dark/light theme toggle
- [ ] Support for PDFs
- [ ] Export summary as `.txt` or `.md`
- [ ] Optional: Cloud AI summarization via open API (user provides own key)
- [ ] Firefox support (WebExtensions compatible)

---

## 📦 Dependencies

**None.** This extension uses zero external dependencies or npm packages.

- Pure JavaScript (ES2020)
- Chrome Extensions API (Manifest V3)
- Google Fonts (Sora + JetBrains Mono) — loaded from CDN in popup only

---

## 📄 License

MIT License — free to use, modify, and distribute.

See [LICENSE](LICENSE) for full text.

---

## 👤 Credits

**Built by [mehulbest](https://github.com/mehulbest)**

> Open source. No tracking. No nonsense. Just summaries.
