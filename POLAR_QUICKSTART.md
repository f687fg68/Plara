# 🚀 Polar.sh Integration - 5 Minute Quickstart

## ✅ What You Have

Your project already includes a **complete Polar.sh payment integration**:

- ✅ Python FastAPI backend (`backend/main.py`)
- ✅ JavaScript checkout module (`src/polar-checkout.js`)
- ✅ Pricing page with checkout buttons (`pricing.html`)
- ✅ Success/Cancel pages
- ✅ Webhook handling
- ✅ Product listing
- ✅ Order management

## 🏃 Quick Setup (5 minutes)

### Step 1: Get Polar Credentials (2 min)

1. Go to **[Polar Sandbox Dashboard](https://sandbox.polar.sh)**
2. Create an account or sign in
3. Navigate to **Settings → API**
4. Click **"Create Personal Access Token"**
5. Copy the token (starts with `polar_pat_`)

### Step 2: Configure Backend (1 min)

```bash
cd backend
cp .env.template .env
```

Edit `.env` and add your token:
```env
POLAR_ACCESS_TOKEN=polar_pat_your_actual_token_here
POLAR_ORGANIZATION_ID=your_org_id_from_dashboard_url
ENVIRONMENT=sandbox
```

### Step 3: Start Servers (1 min)

**Terminal 1 - Backend:**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev
```

### Step 4: Create Products in Polar (1 min)

1. Go to **[Products](https://sandbox.polar.sh/dashboard)** in Polar
2. Click **"Create Product"**
3. Add two products:
   - **Monthly Plan**: $19.99/month
   - **Yearly Plan**: $49.99/year
4. Copy the Product IDs

### Step 5: Update Pricing Page

Edit `pricing.html` lines 91 and 126:
```html
<!-- Line 91: Monthly Button -->
<button class="btn-signin" data-plan="monthly" data-product-id="YOUR_MONTHLY_PRODUCT_ID">

<!-- Line 126: Yearly Button -->
<button class="btn-signin" data-plan="yearly" data-product-id="YOUR_YEARLY_PRODUCT_ID">
```

## 🧪 Test It!

1. Open **http://localhost:5173/pricing.html**
2. Click **"Get Monthly Plan"**
3. You'll be redirected to Polar checkout
4. Use test card: **4242 4242 4242 4242**
5. Complete payment
6. Get redirected to success page!

## 🎯 Test Demo Page

Visit **http://localhost:5173/tmp_rovodev_polar_demo.html** to see:
- Integration status check
- Product loading test
- API endpoint tests
- Live checkout demo

## 📋 Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] `.env` file configured with Polar token
- [ ] Products created in Polar dashboard
- [ ] Product IDs updated in `pricing.html`
- [ ] Test checkout completed successfully

## 🪝 Webhook Setup (Optional for now)

For production, you'll need webhooks. For local testing:

```bash
# Install ngrok
npm install -g ngrok
# or download from https://ngrok.com

# Expose your backend
ngrok http 8000
```

Then add the ngrok URL to Polar:
- **Polar Dashboard** → Settings → Developers → Webhooks
- **URL**: `https://your-ngrok-url.ngrok.io/api/webhooks/polar`
- **Events**: Select all order and subscription events

## 🎨 How It Works

### Frontend Flow
```
User clicks "Buy Now"
    ↓
PolarCheckout.checkout(productId)
    ↓
Calls /api/checkout (Backend)
    ↓
Backend creates session with Polar
    ↓
Returns checkout URL
    ↓
User redirected to Polar payment page
    ↓
After payment → Success page
```

### Backend Flow
```
Polar sends webhook → /api/webhooks/polar
    ↓
Verify signature (security)
    ↓
Handle event (order.created, subscription.created, etc.)
    ↓
Update your database
    ↓
Send confirmation email
    ↓
Grant access to user
```

## 📚 Key Files

| File | Purpose |
|------|---------|
| `backend/main.py` | API server with all endpoints |
| `src/polar-checkout.js` | Frontend checkout handler |
| `pricing.html` | Pricing page with buy buttons |
| `success.html` | Success page after payment |
| `vite.config.js` | Proxy configuration |
| `.env` | Your Polar credentials |

## 🔧 Common Issues

### "Failed to create checkout"
→ Check your `POLAR_ACCESS_TOKEN` in `.env`

### Products not loading
→ Make sure `POLAR_ORGANIZATION_ID` is correct

### CORS errors
→ Backend must be running on port 8000

### Webhooks not working locally
→ Use ngrok to expose your local server

## 📖 Full Documentation

See **POLAR_INTEGRATION_COMPLETE.md** for:
- Complete API reference
- Webhook event handling
- Production deployment guide
- Advanced customization
- Security best practices

## 🆘 Need Help?

1. Check backend logs in terminal
2. Open browser DevTools console
3. Visit the demo page: `tmp_rovodev_polar_demo.html`
4. Review **POLAR_INTEGRATION_COMPLETE.md**

## 🎉 You're Ready!

Your Polar.sh integration is complete and ready to accept payments. Just add your credentials and you're good to go!

**Next steps:**
- Test in sandbox mode
- Set up webhooks with ngrok
- Deploy to production
- Switch to production mode in Polar

Happy selling! 💰
