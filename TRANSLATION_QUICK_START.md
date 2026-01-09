# 🌐 Translation System - Quick Start Guide

## 🚀 Getting Started (30 seconds)

### In Main App (index.html)
1. Open your app (index.html)
2. Type in chat: `/translate help`
3. Follow the prompts!

### In Demo Page
1. Open `regulatory-translation-demo.html` in your browser
2. Text is pre-loaded - just select a language
3. Click "🌐 Translate" or "🔄 Compare"

---

## 📝 Basic Commands

### Translate Current Document
```
/translate Spanish       # Translate to Spanish
/translate French        # Translate to French
/translate Arabic        # Translate to Arabic
/translate zh            # Translate to Chinese (using code)
```

### Compare Translations (Gemini vs Claude)
```
/translate compare Spanish    # Get both translations
/translate compare French     # Compare side-by-side
```

### Configure
```
/translate model gemini       # Use Gemini 3.0 Pro
/translate model claude       # Use Claude Sonnet 4.5
/translate model opus         # Use Claude Opus 4
```

### Discover Languages
```
/translate list              # Show all 50+ languages
/translate list Europe       # Show European languages
/translate list Asia         # Show Asian languages
```

---

## 🎯 Common Workflows

### Workflow 1: Generate & Translate
```
1. /regulatory generate          # Generate regulatory response
2. /translate Spanish            # Translate it
```

### Workflow 2: Compare Quality
```
1. /regulatory generate
2. /translate compare French     # See Gemini vs Claude
3. Choose the best one
```

### Workflow 3: Multi-Language
```
1. /regulatory generate
2. /translate Spanish
3. /translate French
4. /translate German
```

---

## 🌍 Popular Languages

| Language | Command | Native Name |
|----------|---------|-------------|
| Spanish | `/translate Spanish` | Español |
| French | `/translate French` | Français |
| German | `/translate German` | Deutsch |
| Chinese | `/translate Chinese` | 简体中文 |
| Japanese | `/translate Japanese` | 日本語 |
| Arabic | `/translate Arabic` | العربية |
| Russian | `/translate Russian` | Русский |
| Portuguese | `/translate Portuguese` | Português |

---

## 🤖 AI Models

### Gemini 3.0 Pro (Default)
- **Best for:** Technical accuracy, complex documents
- **Strengths:** Advanced reasoning, context preservation
- **Use when:** You need precise technical translations

### Claude Sonnet 4.5
- **Best for:** Legal tone, formal language
- **Strengths:** Legal precision, cultural sensitivity
- **Use when:** You need perfect formal/legal tone

### Claude Opus 4
- **Best for:** Critical high-stakes translations
- **Strengths:** Maximum accuracy, nuanced understanding
- **Use when:** Quality is absolutely critical

---

## ⚡ Tips & Tricks

### 1. Use Streaming for Long Documents
Streaming is ON by default - you'll see translations appear word-by-word

### 2. Compare Before Finalizing
For important documents, use `/translate compare` to see both Gemini and Claude

### 3. Choose Right Model
- Technical docs → Gemini
- Legal docs → Claude Sonnet
- Critical docs → Claude Opus

### 4. Language Codes
You can use short codes: `es`, `fr`, `de`, `zh`, `ja`, `ar`, etc.

### 5. Context Matters
The system automatically preserves:
- Legal terminology
- Regulatory references
- Formal tone
- Document structure

---

## 🧪 Test It Out

### Quick Test in Browser Console
```javascript
// Paste this in console:
await window.regulatoryTranslation.translateText(
    "This is a test",
    "Spanish",
    { stream: false }
);
```

### Or Use Test Pages
1. Open `tmp_rovodev_test_translation.html` for automated tests
2. Open `regulatory-translation-demo.html` for interactive demo

---

## 🆓 Pricing

**FREE!** (User-pays model via Puter.js)
- No API keys needed
- No subscriptions
- No limits
- Users cover their own AI costs
- Perfect for scaling

---

## 🐛 Troubleshooting

### "Translation system not loaded"
**Solution:** Refresh the page - scripts may not be loaded yet

### "Backend not initialized"
**Solution:** Type `/translate help` to trigger initialization

### "Language not found"
**Solution:** Use `/translate list` to see available languages

### Translation seems off
**Solution:** Try a different model with `/translate model claude`

---

## 📚 Learn More

- **Full Documentation:** `TRANSLATION_INTEGRATION_COMPLETE.md`
- **Demo Page:** `regulatory-translation-demo.html`
- **Test Suite:** `tmp_rovodev_test_translation.html`
- **In-App Help:** `/translate help`

---

## 🎉 You're Ready!

Just type `/translate Spanish` in your chat and watch the magic happen! 🚀
