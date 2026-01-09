# 🐻‍❄️ Polar.sh Integration - Quick Reference Card

## 🚀 Start Development (Copy & Paste)

```bash
# Terminal 1 - Backend
cd backend && python3 main.py

# Terminal 2 - Frontend  
npm run dev

# Terminal 3 - Webhooks (optional)
ngrok http 8000
```

---

## 🔑 Environment Setup

**File:** `backend/.env`

```env
POLAR_ACCESS_TOKEN=polar_pat_xxxxx
POLAR_ORGANIZATION_ID=org_xxxxx
POLAR_WEBHOOK_SECRET=whsec_xxxxx
ENVIRONMENT=sandbox
```

**Get credentials:** https://sandbox.polar.sh/settings/api

---

## 🎯 Test URLs

| URL | Purpose |
|-----|---------|
| http://localhost:8000 | Backend health check |
| http://localhost:5173 | Frontend home |
| http://localhost:5173/pricing.html | Pricing page |
| http://localhost:5173/tmp_rovodev_polar_demo.html | **Test page** ⭐ |

---

## 💳 Test Card

```
Card: 4242 4242 4242 4242
Expiry: 12/25 (any future date)
CVC: 123 (any 3 digits)
```

---

## 📡 API Endpoints

```bash
# Health check
GET http://localhost:8000/

# List products
GET http://localhost:8000/api/products

# Create checkout
POST http://localhost:8000/api/checkout
{
  "product_id": "prod_xxxxx",
  "email": "test@example.com"
}

# Webhooks (from Polar)
POST http://localhost:8000/api/webhooks/polar
```

---

## 🎨 Frontend Usage

```javascript
import { PolarCheckout } from './src/polar-checkout.js';

const polar = new PolarCheckout({ apiBase: '/api' });

// Simple checkout
await polar.checkout('prod_xxxxx');

// Get products
const products = await polar.getProducts();

// Render products
polar.renderProducts(container, products);
```

---

## 🪝 Webhook Events

| Event | When | Action |
|-------|------|--------|
| `order.created` | Payment successful | ✅ Grant access |
| `subscription.created` | Subscription starts | 🎉 Welcome email |
| `subscription.canceled` | Subscription ends | ❌ Revoke access |

---

## 🔧 Common Commands

```bash
# Install backend
cd backend && pip install -r requirements.txt

# Install frontend
npm install

# Check Python
python3 --version

# Check Node
node --version

# Kill port 8000
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Kill port 5173
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

---

## 🐛 Quick Fixes

### "Failed to create checkout"
→ Check `POLAR_ACCESS_TOKEN` in `.env`

### Products not loading
→ Check `POLAR_ORGANIZATION_ID` in `.env`

### CORS error
→ Backend must run on port 8000

### Webhook not working
→ Use ngrok for local testing

---

## 📁 Key Files

```
backend/main.py              # Backend API
src/polar-checkout.js        # Frontend module
pricing.html                 # Pricing page
tmp_rovodev_polar_demo.html  # Test page
backend/.env                 # Your credentials
```

---

## 🎯 5-Minute Setup

1. Get token from https://sandbox.polar.sh/settings/api
2. `cd backend && cp .env.example .env`
3. Edit `.env` and paste token
4. `cd backend && python3 main.py` (Terminal 1)
5. `npm run dev` (Terminal 2)
6. Open http://localhost:5173/tmp_rovodev_polar_demo.html

---

## 🎉 Success Checklist

- [ ] Backend shows "Uvicorn running on http://0.0.0.0:8000"
- [ ] Frontend shows "Local: http://localhost:5173/"
- [ ] Demo page shows "Backend: Online" (green)
- [ ] Demo page shows "Products: X Found" (green)
- [ ] Test checkout redirects to Polar
- [ ] Payment completes successfully
- [ ] Success page loads

---

## 📚 Full Docs

- **Overview**: README_POLAR_INTEGRATION.md
- **Quick Start**: POLAR_QUICKSTART.md
- **Checklist**: POLAR_SETUP_CHECKLIST.md
- **Complete**: POLAR_INTEGRATION_COMPLETE.md

---

**Need help?** Check backend logs and browser console first!
