# 🚀 ChurnGuard Quick Start Guide

## 30-Second Test

### 1. Open Your App
Open `index.html` in your browser

### 2. Launch ChurnGuard
Type in chat: `/churnguard`

### 3. You Should See:
```
🛡️ ChurnGuard
AI-Powered Customer Success Churn Prevention Engine
💰 Avg. $127K saved/year • 📊 94% save rate • ⚡ Real-time analysis

[STEP 1] Select Response Type
- 6 response type options with icons
- Default: Retention Response (selected)

[STEP 2] Choose AI Model
- Claude Sonnet 4.5 (selected, most empathetic)
- Gemini 3.0 Pro (comprehensive analysis)
- GPT-4o (fastest)

[STEP 3] Customer & Ticket Details
- Form fields for customer info
- Ticket/issue textarea
- Optional behavior metrics
```

### 4. Fill Test Data
```
Customer Name: Acme Corporation
Company Name: My Business Inc
Tier: Enterprise
Contract Value: 240000
Days Until Renewal: 45

Support Ticket:
"We've been experiencing critical bugs for 2 weeks with no resolution. 
Our engineering team is considering switching to [competitor]. 
Need immediate action or we're canceling at renewal."

Optional Metrics:
Usage Change: -42
Days Since Login: 2
NPS Score: -15
Support Tickets: 8
```

### 5. Generate
Click "🚀 Analyze & Generate Retention Response"

### 6. Watch Real-Time Progress
- ✓ Analyzing sentiment & frustration (5-10 sec)
- ✓ Calculating churn risk score (instant)
- ✓ Generating personalized response (15-20 sec)

### 7. Verify Output
You should see:
✅ **Sentiment Analysis**
   - Sentiment: -68% (Very Negative)
   - Frustration: 9/10
   - Tone: Angry
   - Urgency: Critical

✅ **Churn Risk Assessment**
   - Score: 87% (Critical Risk)
   - Top 3 risk factors with recommendations
   - Color-coded indicators

✅ **Escalation Recommendation**
   - Escalate: YES
   - Route to: VP CS + Account Executive
   - Priority: P0 - Critical

✅ **AI-Generated Response**
   - Empathetic, personalized email
   - Addresses specific concerns
   - Offers concrete solutions
   - Clear next steps

✅ **Product Solutions**
   - Specific feature recommendations
   - Implementation timelines

### 8. Test Actions
Click each button:
- 📋 Copy → Clipboard should have response
- 💾 Download → File downloads
- 📄 Insert to Doc → Content appears in editor
- 🔄 Regenerate → New version generates

## Expected Console Output
```
✅ ChurnGuard AI Engine loaded - Gemini 3.0 Pro & Claude Sonnet 4.5 ready
✅ ChurnGuard Response Writer module loaded
✅ ChurnGuard Display module loaded
🛡️ ChurnGuard command: /churnguard
🧠 Analyzing sentiment with Claude Sonnet 4.5...
✅ Sentiment analysis complete
🤖 Generating retention response with Claude Sonnet 4.5...
✅ Retention response generated
```

## Quick Commands Test
```bash
/churnguard                          # Launch wizard
/churnguard help                     # Show help
/churnguard type support             # Set to support resolution
/churnguard model gemini-3-pro       # Switch to Gemini
```

## Success Checklist
- [ ] `/churnguard` command recognized
- [ ] Wizard displays correctly
- [ ] All 6 response types visible
- [ ] All 3 AI models selectable
- [ ] Form accepts input
- [ ] Generate button works
- [ ] Real-time progress shows
- [ ] Sentiment analysis completes
- [ ] Churn risk calculated
- [ ] Response generates
- [ ] All action buttons work
- [ ] Model switching works

## Performance Benchmarks
- Wizard Display: < 1 second
- Sentiment Analysis: 5-10 seconds
- Churn Calculation: Instant
- Response Generation: 15-30 seconds
- Total Time: 20-40 seconds

## Common Issues

### Issue: Command not recognized
**Fix**: Refresh page, check browser console for script errors

### Issue: No response generated
**Fix**: Check internet, verify Puter.js loaded, try different model

### Issue: Form doesn't accept input
**Fix**: Click inside textarea, ensure no JavaScript errors

### Issue: Buttons don't work
**Fix**: Check console, reload page, verify event listeners attached

## Test Different Scenarios

### Test 1: Critical Risk (Fast)
- Customer: Acme Corp
- Ticket: "Canceling due to bugs"
- Expected: High churn score, escalation required

### Test 2: Moderate Risk
- Customer: TechFlow
- Ticket: "Not using much lately"
- Expected: Medium churn score, CSM follow-up

### Test 3: Low Risk Check-in
- Customer: StartupXYZ
- Type: Proactive Check-in
- Expected: Low score, friendly outreach

---

**If all tests pass, ChurnGuard is working perfectly! 🎉**

## Next Steps
1. Try with real customer tickets
2. Compare different AI models
3. Test all 6 response types
4. Review generated responses
5. Customize for your use case

Type `/churnguard help` for full feature documentation!
