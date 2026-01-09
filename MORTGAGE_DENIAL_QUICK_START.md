# Mortgage Denial Letter SaaS - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Open the Application

Simply open `mortgage-denial-ui.html` in a web browser. That's it! No server setup, no npm install, no build process.

```bash
# Option 1: Direct open
open mortgage-denial-ui.html

# Option 2: Simple HTTP server
python3 -m http.server 8000
# Then visit: http://localhost:8000/mortgage-denial-ui.html
```

### Step 2: Generate Your First Letter

#### Method A: Using the UI Wizard

1. **Click "Generate Letter"** in the sidebar
2. **Fill in Application Info:**
   - Application ID: `APP-2025-12345`
   - Applicant Name: `John Smith`
   - Loan Amount: `450000`
   - Address: `123 Main St, Denver, CO 80202`
   - Property Address: `456 Oak Ave, Denver, CO 80202`
3. **Select Denial Reasons:**
   - Check `IE04 - Debt-to-Income Ratio Too High`
   - Check `CA01 - Insufficient Cash for Down Payment`
4. **Choose AI Model:** GPT-4o (recommended)
5. **Click "Generate Letter with AI"**
6. **Review compliance score** and download/save

#### Method B: Using Chat Integration

Type in the chat input (integrates with your existing app.js):

```
generate denial letter
```

Then answer the conversational prompts:
- Applicant name: `John Smith`
- Application ID: `APP-2025-12345`
- Loan amount: `450000`
- Loan type: `conventional`
- Address: `123 Main St, Denver, CO 80202`
- Property: `456 Oak Ave, Denver, CO 80202`
- Denial reasons: `IE04 CA01`
- Model: `1` (GPT-4o)

The AI will generate a fully compliant letter automatically!

#### Method C: Programmatic (for developers)

```javascript
// Access the global app instance
const app = window.mortgageApp;

// Generate letter
const result = await app.aiEngine.generateDenialLetter(
    {
        application_id: 'APP-2025-12345',
        application_date: '2025-01-15',
        applicant_name: 'John Smith',
        applicant_address: '123 Main St',
        applicant_city: 'Denver',
        applicant_state: 'CO',
        applicant_zip: '80202',
        loan_type: 'conventional',
        loan_amount: 450000,
        property_address: '456 Oak Ave, Denver, CO 80202',
        loan_purpose: 'purchase'
    },
    [
        {
            code: 'IE04',
            dti_ratio: 0.52,
            max_dti: 0.43,
            monthly_debt: 4200,
            monthly_income: 8000
        },
        {
            code: 'CA01',
            available_cash: 30000,
            required_down_payment: 90000
        }
    ],
    { model: 'gpt-4o' }
);

console.log('Compliance Score:', result.validation.compliance_score);
console.log('Letter:', result.content);
```

## 📋 Key Features to Try

### 1. Dashboard
- View statistics (total letters, compliance rate)
- See recent letters
- Quick actions

### 2. Compliance Validation
Every letter is automatically checked for:
- ✅ FCRA Section 615(a) requirements
- ✅ ECOA/Regulation B compliance
- ✅ No vague language
- ✅ Specific numbers and percentages

### 3. Cloud Storage (Puter.js)
All letters are automatically saved to your Puter.js cloud:
- `/mortgage_denial/letters/` - Generated letters
- `/mortgage_denial/audit/` - Audit logs
- Accessible from any device

### 4. Multi-AI Models
Switch between:
- **GPT-4o** - Best compliance accuracy
- **Claude 3.5 Sonnet** - Best legal language
- **Gemini 3.0 Pro** - Fastest processing

## 🎯 Common Use Cases

### Use Case 1: High DTI Denial
```javascript
Reason: IE04
Details: DTI 52% (max 43%)
AI Output: "Your monthly debt obligations of $4,200 represent 52.0% 
of your gross monthly income of $8,000. Our lending guidelines 
require a maximum debt-to-income ratio of 43.0%."
```

### Use Case 2: Credit Score Denial
```javascript
Reason: CR01
Details: Score 610 (min 640)
AI Output: "Your credit score of 610 is below our minimum lending 
requirement of 640 for this loan program. This score was obtained 
from Equifax."
+ Full FCRA disclosures with bureau contact info
```

### Use Case 3: Insufficient Cash
```javascript
Reason: CA01
Details: Have $30K, need $90K
AI Output: "You have indicated available liquid funds of $30,000 
for down payment and closing costs. Our analysis shows that a 
minimum of $90,000 is required. You are short by $60,000."
```

## 🔍 Testing Compliance

The validator automatically flags issues:

**Critical Errors (Non-compliant):**
- ❌ Missing credit score disclosure
- ❌ Vague language: "failed to meet our standards"
- ❌ Missing ECOA non-discrimination notice

**Warnings (Review recommended):**
- ⚠️ Credit bureau phone may be missing
- ⚠️ Should explain why score is not higher
- ⚠️ Consider including specific percentages

## 📊 Compliance Score Breakdown

```
100 points = Perfect compliance

Deductions:
- Critical errors: -25 points each
- Warnings: -5 points each

Example:
✅ Credit score disclosed
✅ Bureau contact complete
✅ No vague language
⚠️ Missing explanation (why score not higher)
= 95/100 (Excellent)
```

## 🎨 UI Navigation

**Sidebar Menu:**
- 📊 Dashboard - Overview and stats
- ✨ Generate Letter - Main wizard
- 📬 All Letters - Letter history
- 🔄 Appeals - Appeal management (coming soon)
- 🛡️ Compliance - Regulatory status
- 🏦 Lenders - Lender configs

## 🔧 Configuration

### Lender Configuration
```javascript
await app.storage.saveLenderConfig('lender_123', {
    name: 'First National Mortgage',
    nmls: '123456',
    address: '123 Financial Plaza, SF, CA 94111',
    phone: '1-800-555-0123',
    branding: {
        logo_url: 'https://example.com/logo.png',
        primary_color: '#2563eb'
    }
});
```

### AI Model Selection
```javascript
// In UI: Select from dropdown
// In code:
const models = app.aiEngine.getAvailableModels();
// Returns: [
//   { value: 'gpt-4o', label: 'GPT-4o', provider: 'openai' },
//   { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'anthropic' },
//   { value: 'gemini-3-pro', label: 'Gemini 3.0 Pro', provider: 'google' }
// ]
```

## 📁 File Structure

```
Your workspace/
├── mortgage-denial-ui.html              # Open this file!
├── mortgage-denial-styles.css           # Dark theme styles
├── mortgage-denial-app.js               # Main controller
├── mortgage-denial-ai-engine.js         # AI generation
├── mortgage-compliance-validator.js     # Compliance checks
├── mortgage-denial-storage.js           # Cloud storage
├── mortgage-denial-chat-integration.js  # Chat backend
├── mortgage-denial-los-integration.js   # LOS adapters
└── MORTGAGE_DENIAL_README.md           # Full documentation
```

## 🆘 Troubleshooting

**Issue: "Puter.js not available"**
- Solution: Check internet connection (Puter.js SDK loads from CDN)

**Issue: "AI model error"**
- Solution: Ensure you have Puter.js credits for AI usage

**Issue: Letter not saving**
- Solution: Check browser console for errors, verify Puter.js authentication

**Issue: Low compliance score**
- Solution: Review validation details, add specific numbers/percentages

## 🎓 Learning Path

1. **Day 1:** Generate 5 sample letters using the wizard
2. **Day 2:** Try chat integration for conversational generation
3. **Day 3:** Review compliance scores and understand validation
4. **Day 4:** Configure lender settings and branding
5. **Day 5:** Integrate with your LOS (if applicable)

## 📞 Getting Help

**Console Logging:**
```javascript
// Enable verbose logging
window.mortgageApp.debug = true;

// Check stats
console.log(mortgageApp.aiEngine.getStats());

// View storage
console.log(await mortgageApp.storage.getStats());
```

**Test Compliance:**
```javascript
const validator = new MortgageComplianceValidator();
const result = validator.quickCheck(letterText);
console.log(result.passed ? '✅ Passed' : '❌ Failed', result.issues);
```

## 🚢 Production Deployment

**Step 1: Host static files**
```bash
# Upload to any hosting:
- Netlify (drag & drop)
- Vercel (git push)
- GitHub Pages
- AWS S3 + CloudFront
- Your own server
```

**Step 2: Configure domain**
```
https://denialai.yourcompany.com
```

**Step 3: Done!**
- No backend setup needed
- No database to manage
- Scales automatically via Puter.js

## 💰 Pricing Considerations

**Puter.js costs (passed to users):**
- GPT-4o: ~$0.10-0.30 per letter
- Claude 3.5: ~$0.15-0.40 per letter
- Gemini 3.0: ~$0.05-0.15 per letter

**Your pricing model:**
- Free tier: 10 letters/month
- Pro: $99/month (500 letters)
- Enterprise: Custom pricing

**Net margin:** ~80-95% after Puter.js costs

---

## ✅ Quick Checklist

- [ ] Opened mortgage-denial-ui.html
- [ ] Generated first letter
- [ ] Reviewed compliance score
- [ ] Saved letter to cloud
- [ ] Tried chat integration
- [ ] Tested different AI models
- [ ] Explored dashboard stats
- [ ] Read full documentation

**Ready to launch? You're all set!** 🎉

---

**Questions?** Open browser console and type: `mortgageApp` to explore the API.
