# ✅ Polar.sh Integration Setup Checklist

## Pre-flight Check

### System Requirements
- [ ] Python 3.8+ installed
- [ ] Node.js 16+ installed
- [ ] npm or pnpm installed
- [ ] Code editor (VS Code, etc.)
- [ ] Terminal access

## 🔑 Polar Account Setup

### Create Polar Account
- [ ] Go to https://sandbox.polar.sh
- [ ] Sign up or log in
- [ ] Verify your email

### Get API Credentials
- [ ] Navigate to Settings → API
- [ ] Click "Create Personal Access Token"
- [ ] Name it: "Plara Development"
- [ ] Copy the token (starts with `polar_pat_`)
- [ ] Save it securely (you'll need it for `.env`)

### Get Organization ID
- [ ] Look at your dashboard URL
- [ ] Format: `https://sandbox.polar.sh/dashboard/[YOUR_ORG_ID]`
- [ ] Copy the organization ID

### Create Products
- [ ] Go to Products section
- [ ] Click "Create Product"

**Product 1: Monthly Plan**
- [ ] Name: "Monthly Subscription"
- [ ] Price: $19.99
- [ ] Interval: Monthly
- [ ] Copy Product ID (starts with `prod_` or `price_`)

**Product 2: Yearly Plan**
- [ ] Name: "Yearly Subscription"
- [ ] Price: $49.99
- [ ] Interval: Yearly
- [ ] Copy Product ID

## 🖥️ Backend Setup

### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

- [ ] All packages installed successfully
- [ ] No error messages

### Configure Environment
```bash
cp .env.example .env
# or
cp .env.template .env
```

Edit `.env` file:
- [ ] Set `POLAR_ACCESS_TOKEN=polar_pat_...`
- [ ] Set `POLAR_ORGANIZATION_ID=...`
- [ ] Set `ENVIRONMENT=sandbox`
- [ ] Keep `BACKEND_PORT=8000`
- [ ] Keep `FRONTEND_URL=http://localhost:5173`

### Start Backend Server
```bash
python main.py
```

Expected output:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

- [ ] Backend started without errors
- [ ] Running on port 8000
- [ ] No permission errors

### Test Backend
```bash
curl http://localhost:8000/
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Plara Payment API",
  "environment": "sandbox"
}
```

- [ ] Health check returns JSON
- [ ] Status is "healthy"

## 🎨 Frontend Setup

### Install Dependencies
```bash
# In project root directory
npm install
# or
pnpm install
```

- [ ] All packages installed
- [ ] No errors in console

### Start Development Server
```bash
npm run dev
# or
pnpm dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

- [ ] Frontend started successfully
- [ ] Running on port 5173
- [ ] No compilation errors

### Test Frontend
- [ ] Open browser to http://localhost:5173
- [ ] Page loads without errors
- [ ] No console errors in DevTools

## 🛒 Configure Pricing Page

### Update Product IDs

Edit `pricing.html`:

**Line 91 (Monthly Button):**
```html
<button class="btn-signin" 
        data-plan="monthly" 
        data-product-id="YOUR_ACTUAL_MONTHLY_PRODUCT_ID">
    Get Monthly Plan
</button>
```

**Line 126 (Yearly Button):**
```html
<button class="btn-signin" 
        data-plan="yearly" 
        data-product-id="YOUR_ACTUAL_YEARLY_PRODUCT_ID">
    Get Yearly Plan
</button>
```

- [ ] Monthly product ID updated
- [ ] Yearly product ID updated
- [ ] File saved

## 🧪 Test the Integration

### Test 1: Demo Page
- [ ] Visit http://localhost:5173/tmp_rovodev_polar_demo.html
- [ ] Backend status shows "Online" (green)
- [ ] Products status shows number of products (green)
- [ ] Click "Test Health Check" - returns JSON
- [ ] Click "Test Products API" - returns product list

### Test 2: Pricing Page
- [ ] Visit http://localhost:5173/pricing.html
- [ ] Page loads correctly
- [ ] Two pricing cards visible
- [ ] "Get Monthly Plan" button visible
- [ ] "Get Yearly Plan" button visible

### Test 3: Checkout Flow
- [ ] Click "Get Monthly Plan" button
- [ ] Button shows loading state
- [ ] Redirected to Polar checkout page
- [ ] Checkout page loads (Polar hosted)

### Test 4: Test Payment
Use Polar's test card details:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)

- [ ] Enter test card details
- [ ] Click "Pay" button
- [ ] Payment processes successfully
- [ ] Redirected to success page
- [ ] Success page shows confirmation

### Test 5: Backend Logs
Check your backend terminal:

Expected log:
```
============================================================
📨 Webhook received: order.created
============================================================

✅ Order created (Payment successful!)
   Order ID: order_xxxxx
   Customer: test@example.com
   Product: Monthly Plan
   Amount: 1999 USD
```

- [ ] Webhook received (if ngrok is set up)
- [ ] Order details logged correctly

## 🪝 Webhook Setup (Optional for Local Testing)

### Install ngrok
```bash
# Option 1: npm
npm install -g ngrok

# Option 2: Homebrew (Mac)
brew install ngrok

# Option 3: Download from https://ngrok.com
```

- [ ] ngrok installed

### Start ngrok
```bash
ngrok http 8000
```

Expected output:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:8000
```

- [ ] ngrok running
- [ ] HTTPS URL generated
- [ ] Copy the URL

### Configure Webhook in Polar
- [ ] Go to https://sandbox.polar.sh/settings/webhooks
- [ ] Click "Create Endpoint"
- [ ] URL: `https://your-ngrok-url.ngrok.io/api/webhooks/polar`
- [ ] Select events:
  - [ ] checkout.created
  - [ ] checkout.updated
  - [ ] order.created
  - [ ] subscription.created
  - [ ] subscription.updated
  - [ ] subscription.canceled
- [ ] Save webhook
- [ ] Copy webhook secret
- [ ] Add secret to `.env` as `POLAR_WEBHOOK_SECRET`
- [ ] Restart backend

### Test Webhook
- [ ] Complete a test payment
- [ ] Check backend logs for webhook events
- [ ] Webhook signature verified successfully

## 🎯 Final Verification

### API Endpoints Working
- [ ] GET `/api/` - Health check ✅
- [ ] GET `/api/products` - List products ✅
- [ ] POST `/api/checkout` - Create checkout ✅
- [ ] GET `/api/checkout/{id}` - Get checkout status ✅
- [ ] POST `/api/webhooks/polar` - Receive webhooks ✅

### Frontend Working
- [ ] Home page loads ✅
- [ ] Pricing page loads ✅
- [ ] Success page loads ✅
- [ ] Cancel page loads ✅
- [ ] Demo page loads ✅

### Payment Flow Working
- [ ] Click buy button ✅
- [ ] Redirect to Polar ✅
- [ ] Enter payment details ✅
- [ ] Payment succeeds ✅
- [ ] Return to success page ✅
- [ ] Backend receives webhook ✅

## 🚀 Production Readiness

Before going live:

### Security
- [ ] Change `ENVIRONMENT` to `production`
- [ ] Use production Polar API token
- [ ] Set `FRONTEND_URL` to your domain
- [ ] Enable HTTPS on backend
- [ ] Set secure CORS origins

### Deployment
- [ ] Backend deployed (Railway, Render, Fly.io)
- [ ] Frontend deployed (Vercel, Netlify, Cloudflare)
- [ ] Environment variables set in production
- [ ] Webhook URL updated to production domain
- [ ] DNS configured

### Testing
- [ ] Test with real card in production mode
- [ ] Verify webhook delivery in production
- [ ] Test refund flow
- [ ] Test subscription cancellation

## 📊 Troubleshooting Guide

### Backend won't start
- Check Python version: `python --version` (need 3.8+)
- Install dependencies: `pip install -r requirements.txt`
- Check port 8000 not in use: `lsof -i :8000`

### Frontend won't start
- Check Node version: `node --version` (need 16+)
- Clear cache: `rm -rf node_modules && npm install`
- Check port 5173 not in use: `lsof -i :5173`

### Products not loading
- Verify `POLAR_ORGANIZATION_ID` is correct
- Check products exist in Polar dashboard
- Verify products are not archived
- Check backend logs for errors

### Checkout fails
- Verify `POLAR_ACCESS_TOKEN` is valid
- Check product IDs are correct
- Look at browser console for errors
- Check backend logs for detailed error

### Webhooks not received
- Ensure ngrok is running
- Verify webhook URL in Polar dashboard
- Check `POLAR_WEBHOOK_SECRET` matches
- Look for signature verification errors in logs

## 🎉 Success!

If all checkboxes are ✅, your Polar.sh integration is complete and ready!

**What you can do now:**
- Accept one-time payments
- Manage subscriptions
- Handle webhooks
- Track orders
- Process refunds (via Polar dashboard)

**Next steps:**
- Customize success/cancel pages
- Add email notifications in webhook handlers
- Implement user dashboard
- Add analytics tracking
- Deploy to production

## 📚 Resources

- **Full Documentation**: See `POLAR_INTEGRATION_COMPLETE.md`
- **Quick Start**: See `POLAR_QUICKSTART.md`
- **Polar Docs**: https://docs.polar.sh
- **Polar Dashboard**: https://sandbox.polar.sh
- **Support**: https://discord.gg/polar

---

**Time to complete:** ~15-20 minutes  
**Difficulty:** Beginner-friendly  
**Support:** Check backend logs and browser console for errors
