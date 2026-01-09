# 🐻‍❄️ Polar.sh Payment Gateway - Complete Integration

> **Your Plara project is ready to accept payments!** This integration is production-ready with full webhook support, security features, and a clean checkout flow.

---

## 📦 What's Included

Your project now has a **complete, production-ready** Polar.sh integration:

| Feature | Status | Location |
|---------|--------|----------|
| Python FastAPI Backend | ✅ Complete | `backend/main.py` |
| JavaScript Checkout Module | ✅ Complete | `src/polar-checkout.js` |
| Pricing Page | ✅ Complete | `pricing.html` |
| Success/Cancel Pages | ✅ Complete | `success.html`, `cancel.html` |
| Webhook Handler | ✅ Complete | `backend/main.py` |
| Product Listing API | ✅ Complete | `GET /api/products` |
| Checkout API | ✅ Complete | `POST /api/checkout` |
| Order Management | ✅ Complete | `GET /api/orders/{email}` |
| Security (HMAC Verification) | ✅ Complete | Webhook signature validation |
| Demo/Test Page | ✅ Complete | `tmp_rovodev_polar_demo.html` |

---

## 🚀 Quick Start (Choose Your Path)

### 🏃 Fast Track (5 minutes)
**Perfect if you just want to see it working:**

1. **Get Polar token**: https://sandbox.polar.sh/settings/api → Create token
2. **Configure**: 
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and paste your token
   ```
3. **Start servers**:
   ```bash
   # Terminal 1
   cd backend && python3 main.py
   
   # Terminal 2
   npm run dev
   ```
4. **Test**: Open http://localhost:5173/tmp_rovodev_polar_demo.html

---

### 📚 Complete Setup (15 minutes)
**Follow the detailed checklist:**

See **[POLAR_SETUP_CHECKLIST.md](./POLAR_SETUP_CHECKLIST.md)** for step-by-step instructions with checkboxes.

---

### 🎯 Production Deployment (30 minutes)
**Ready to go live:**

See **[POLAR_INTEGRATION_COMPLETE.md](./POLAR_INTEGRATION_COMPLETE.md)** for production deployment guide.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        USER FLOW                             │
└─────────────────────────────────────────────────────────────┘

User visits pricing.html
         ↓
Clicks "Buy Now" button
         ↓
Frontend: PolarCheckout.checkout(productId)
         ↓
POST /api/checkout
         ↓
Backend: Creates Polar checkout session
         ↓
Returns checkout URL
         ↓
User redirected to Polar (secure payment page)
         ↓
User completes payment
         ↓
Polar sends webhook → POST /api/webhooks/polar
         ↓
Backend verifies signature & processes order
         ↓
User redirected to success.html
         ↓
✅ Payment complete!
```

---

## 📁 Project Structure

```
project/
├── backend/
│   ├── main.py                 # ⭐ FastAPI server with all endpoints
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example           # Configuration template
│   └── .env                   # Your credentials (create this)
│
├── src/
│   ├── polar-checkout.js      # ⭐ Frontend checkout handler
│   ├── main.js                # Main app entry
│   └── style.css              # Styles
│
├── pricing.html               # ⭐ Pricing page with buy buttons
├── success.html               # Success page after payment
├── cancel.html                # Cancel page if payment fails
├── tmp_rovodev_polar_demo.html # ⭐ Test/demo page
│
├── vite.config.js             # Vite config with API proxy
├── package.json               # Frontend dependencies
│
└── Documentation/
    ├── README_POLAR_INTEGRATION.md      # 👈 You are here
    ├── POLAR_QUICKSTART.md              # 5-minute quick start
    ├── POLAR_SETUP_CHECKLIST.md         # Detailed checklist
    └── POLAR_INTEGRATION_COMPLETE.md    # Complete API docs
```

---

## 🔑 Getting Your Credentials

### 1. Create Polar Account
- Go to **https://sandbox.polar.sh** (for testing)
- Sign up with GitHub or email
- Verify your email

### 2. Get API Token
- Navigate to **Settings → API**
- Click **"Create Personal Access Token"**
- Name it (e.g., "Plara Development")
- Copy the token (starts with `polar_pat_`)

### 3. Get Organization ID
- Look at your dashboard URL
- Format: `https://sandbox.polar.sh/dashboard/[YOUR_ORG_ID]`
- Copy the ID

### 4. Create Products
- Go to **Products** section
- Click **"Create Product"**
- Create at least one product (e.g., "Monthly Plan - $19.99/month")
- Copy the Product ID

### 5. Configure `.env`
```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
POLAR_ACCESS_TOKEN=polar_pat_your_actual_token_here
POLAR_ORGANIZATION_ID=your_org_id_here
POLAR_WEBHOOK_SECRET=your_webhook_secret_here
ENVIRONMENT=sandbox
```

---

## 🖥️ Installation & Running

### Prerequisites
- **Python 3.8+** (check: `python3 --version`)
- **Node.js 16+** (check: `node --version`)
- **npm or pnpm** (check: `npm --version`)

### Install Dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
npm install
# or
pnpm install
```

### Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
python3 main.py
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Expected output:
```
  VITE v7.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

---

## 🧪 Testing the Integration

### Option 1: Demo Page (Recommended)
```
http://localhost:5173/tmp_rovodev_polar_demo.html
```

Features:
- ✅ Integration status check
- ✅ Product loading test
- ✅ API endpoint tests
- ✅ Live product display

### Option 2: Pricing Page
```
http://localhost:5173/pricing.html
```

1. Click **"Get Monthly Plan"** or **"Get Yearly Plan"**
2. You'll be redirected to Polar checkout
3. Use test card: **4242 4242 4242 4242**
4. Expiry: Any future date (e.g., 12/25)
5. CVC: Any 3 digits (e.g., 123)
6. Complete payment
7. Get redirected to success page

### Option 3: API Testing
```bash
# Health check
curl http://localhost:8000/

# List products
curl http://localhost:8000/api/products

# Create checkout (replace product_id)
curl -X POST http://localhost:8000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"product_id": "prod_xxxxx", "email": "test@example.com"}'
```

---

## 🎨 Frontend Integration Examples

### Basic Checkout
```javascript
import { PolarCheckout } from './src/polar-checkout.js';

const polar = new PolarCheckout({
    apiBase: '/api'
});

// Checkout button
document.getElementById('buy-btn').addEventListener('click', async () => {
    await polar.checkout('prod_xxxxx');
});
```

### With Callbacks
```javascript
const polar = new PolarCheckout({
    apiBase: '/api',
    onSuccess: (data) => {
        console.log('Payment successful!', data);
        // Update UI, show thank you message
    },
    onError: (error) => {
        console.error('Payment failed:', error);
        // Show error message
    }
});
```

### Load Products Dynamically
```javascript
const products = await polar.getProducts();
const container = document.getElementById('products');
polar.renderProducts(container, products);
```

### Popup Checkout (Alternative)
```javascript
await polar.checkoutPopup('prod_xxxxx', {
    email: 'customer@example.com',
    customerName: 'John Doe'
});
```

---

## 🔌 API Endpoints

### Backend API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/api/products` | GET | List all products |
| `/api/checkout` | POST | Create checkout session |
| `/api/checkout/{id}` | GET | Get checkout status |
| `/api/webhooks/polar` | POST | Receive Polar webhooks |
| `/api/orders/{email}` | GET | Get customer orders |

### Example Requests

**Create Checkout:**
```bash
POST /api/checkout
Content-Type: application/json

{
  "product_id": "prod_xxxxx",
  "email": "customer@example.com",
  "customer_name": "John Doe"
}
```

**Response:**
```json
{
  "checkout_url": "https://checkout.polar.sh/...",
  "checkout_id": "co_xxxxx",
  "client_secret": "cs_xxxxx"
}
```

---

## 🪝 Webhook Setup (Local Development)

For local testing, use **ngrok** to expose your backend:

### Install ngrok
```bash
npm install -g ngrok
# or download from https://ngrok.com
```

### Start ngrok
```bash
ngrok http 8000
```

You'll get a URL like: `https://abc123.ngrok.io`

### Configure in Polar
1. Go to **https://sandbox.polar.sh/settings/webhooks**
2. Click **"Create Endpoint"**
3. URL: `https://abc123.ngrok.io/api/webhooks/polar`
4. Select events:
   - ✅ checkout.created
   - ✅ checkout.updated
   - ✅ order.created (most important!)
   - ✅ subscription.created
   - ✅ subscription.updated
   - ✅ subscription.canceled
5. Copy the webhook secret
6. Add to `.env`: `POLAR_WEBHOOK_SECRET=whsec_xxxxx`
7. Restart backend

### Test Webhooks
Complete a test payment and check backend logs:

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

---

## 🔐 Security Features

✅ **Webhook Signature Verification** - HMAC-SHA256 validation  
✅ **CORS Configuration** - Restricted to your frontend domain  
✅ **Environment Variables** - Sensitive data not in code  
✅ **XSS Protection** - HTML escaping in frontend  
✅ **Input Validation** - Pydantic models validate all inputs  
✅ **HTTPS Ready** - Works with SSL/TLS in production

---

## 🚀 Production Deployment

### Checklist
- [ ] Change `ENVIRONMENT` to `production` in `.env`
- [ ] Use production Polar API token (not sandbox)
- [ ] Set `FRONTEND_URL` to your actual domain
- [ ] Deploy backend (Railway, Render, Fly.io, etc.)
- [ ] Deploy frontend (Vercel, Netlify, Cloudflare Pages)
- [ ] Update webhook URL in Polar to production domain
- [ ] Test with real payment in production mode
- [ ] Enable HTTPS on backend
- [ ] Set secure CORS origins

### Backend Deployment Options
- **Railway**: One-click deploy with automatic HTTPS
- **Render**: Free tier available, easy Python setup
- **Fly.io**: Global edge deployment
- **DigitalOcean App Platform**: Simple PaaS
- **Your VPS**: Full control with nginx/gunicorn

### Frontend Deployment Options
- **Vercel**: Best for Vite projects (recommended)
- **Netlify**: Easy continuous deployment
- **Cloudflare Pages**: Fast global CDN
- **GitHub Pages**: Free hosting

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Python version (need 3.8+)
python3 --version

# Install dependencies
cd backend && pip install -r requirements.txt

# Check if port is in use
lsof -i :8000
```

### Frontend won't start
```bash
# Check Node version (need 16+)
node --version

# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Products not loading
- ✅ Verify `POLAR_ORGANIZATION_ID` in `.env`
- ✅ Check products exist in Polar dashboard
- ✅ Ensure products are not archived
- ✅ Check backend logs for errors

### Checkout fails
- ✅ Verify `POLAR_ACCESS_TOKEN` is valid
- ✅ Check product IDs are correct in `pricing.html`
- ✅ Open browser DevTools console for errors
- ✅ Check backend logs for detailed error messages

### Webhooks not working
- ✅ Ensure ngrok is running (for local testing)
- ✅ Verify webhook URL in Polar dashboard
- ✅ Check `POLAR_WEBHOOK_SECRET` matches
- ✅ Look for signature verification errors in backend logs

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **README_POLAR_INTEGRATION.md** | 👈 Overview and quick links |
| **POLAR_QUICKSTART.md** | 5-minute setup guide |
| **POLAR_SETUP_CHECKLIST.md** | Detailed step-by-step checklist |
| **POLAR_INTEGRATION_COMPLETE.md** | Complete API reference and advanced features |

---

## 🎯 What's Next?

### Immediate Next Steps
1. ✅ Get your Polar credentials
2. ✅ Configure `.env` file
3. ✅ Start both servers
4. ✅ Test checkout flow
5. ✅ Set up webhooks with ngrok

### Enhancement Ideas
- 📧 Add email notifications in webhook handlers
- 📊 Implement user dashboard to view orders
- 🎨 Customize success/cancel pages
- 📈 Add analytics tracking (Google Analytics, Plausible)
- 👤 Add customer portal for subscription management
- 🔔 Add real-time notifications
- 💾 Store orders in database (PostgreSQL, MongoDB)

---

## 🆘 Getting Help

1. **Check the logs**: Backend terminal and browser DevTools console
2. **Test with demo page**: `tmp_rovodev_polar_demo.html`
3. **Review documentation**: See other MD files in this directory
4. **Polar Discord**: https://discord.gg/polar
5. **Polar Docs**: https://docs.polar.sh

---

## 🎉 Success!

Your Polar.sh payment integration is **complete and production-ready**!

**What you have:**
- ✅ Secure payment processing
- ✅ Webhook handling
- ✅ Product management
- ✅ Order tracking
- ✅ Test environment
- ✅ Production-ready code

**Time to first payment:** ~15 minutes  
**Difficulty:** Beginner-friendly  
**Maintenance:** Minimal (Polar handles everything)

---

**Happy selling! 💰**

*Built with ❤️ using Polar.sh, FastAPI, and Vite*
