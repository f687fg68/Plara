# 🐻‍❄️ Polar.sh Payment Integration - Complete Setup Guide

## 📋 Overview

Your Plara project now has a **complete Polar.sh payment integration** with:
- ✅ Python FastAPI backend with full webhook support
- ✅ Vanilla JavaScript frontend with checkout flow
- ✅ Product listing and dynamic pricing
- ✅ Success/Cancel page handling
- ✅ Secure webhook verification
- ✅ Order management system

---

## 🚀 Quick Start

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Configure Environment Variables
Create a `.env` file in the `backend/` directory:

```env
# Polar.sh Configuration
POLAR_ACCESS_TOKEN=polar_pat_your_token_here
POLAR_WEBHOOK_SECRET=your_webhook_secret_here
POLAR_ORGANIZATION_ID=your_org_id_here

# Environment (sandbox for testing, production for live)
ENVIRONMENT=sandbox

# Server Configuration
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173

# Product IDs (get these from your Polar dashboard)
PRODUCT_ID_MONTHLY=prod_xxxxx
PRODUCT_ID_YEARLY=prod_xxxxx
```

#### Get Your Polar Credentials

1. **Access Token**: Go to [Polar Dashboard](https://sandbox.polar.sh/settings/api) → Settings → API → Create Personal Access Token
2. **Organization ID**: Found in your Polar dashboard URL: `https://sandbox.polar.sh/dashboard/[YOUR_ORG_ID]`
3. **Webhook Secret**: Settings → Developers → Webhooks → Create Endpoint
4. **Product IDs**: Products → Click on a product → Copy the ID from the URL

#### Start Backend Server
```bash
cd backend
python main.py
```

The backend will start on `http://localhost:8000`

---

### 2. Frontend Setup

#### Install Dependencies
```bash
npm install
# or
pnpm install
```

#### Start Development Server
```bash
npm run dev
# or
pnpm dev
```

The frontend will start on `http://localhost:5173`

---

## 🔧 Configuration

### Update Product IDs in pricing.html

Edit `pricing.html` and update the `data-product-id` attributes:

```html
<!-- Monthly Plan Button -->
<button class="btn-signin" 
        data-plan="monthly" 
        data-product-id="YOUR_ACTUAL_MONTHLY_PRODUCT_ID">
    Get Monthly Plan
</button>

<!-- Yearly Plan Button -->
<button class="btn-signin" 
        data-plan="yearly" 
        data-product-id="YOUR_ACTUAL_YEARLY_PRODUCT_ID">
    Get Yearly Plan
</button>
```

---

## 🎯 API Endpoints

### Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /` | GET | Health check |
| `GET /api/products` | GET | Fetch all available products |
| `POST /api/checkout` | POST | Create checkout session |
| `GET /api/checkout/{checkout_id}` | GET | Get checkout status |
| `POST /api/webhooks/polar` | POST | Handle Polar webhooks |
| `GET /api/orders/{customer_email}` | GET | Get customer orders |

### Example API Usage

#### Fetch Products
```bash
curl http://localhost:8000/api/products
```

#### Create Checkout
```bash
curl -X POST http://localhost:8000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "prod_xxxxx",
    "email": "customer@example.com",
    "customer_name": "John Doe"
  }'
```

---

## 🪝 Webhook Setup

### Local Development with ngrok

For local testing, use ngrok to expose your backend:

```bash
# Install ngrok: https://ngrok.com
ngrok http 8000
```

You'll get a URL like: `https://abc123.ngrok.io`

### Configure Webhook in Polar Dashboard

1. Go to [Polar Dashboard](https://sandbox.polar.sh/settings/webhooks) → Settings → Developers → Webhooks
2. Click "Create Endpoint"
3. Set URL: `https://abc123.ngrok.io/api/webhooks/polar`
4. Select events:
   - ✅ `checkout.created`
   - ✅ `checkout.updated`
   - ✅ `order.created`
   - ✅ `subscription.created`
   - ✅ `subscription.updated`
   - ✅ `subscription.canceled`
5. Copy the webhook secret and add it to your `.env` file

### Webhook Events Handled

The backend automatically handles these events:

- **checkout.created**: When a checkout session is created
- **checkout.updated**: When checkout status changes
- **order.created**: ✅ **Payment successful!** (Most important)
- **subscription.created**: When a subscription starts
- **subscription.updated**: When subscription status changes
- **subscription.canceled**: When a subscription is canceled

---

## 📁 File Structure

```
project/
├── backend/
│   ├── main.py                    # FastAPI backend with Polar integration
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example              # Environment variables template
│   └── .env                      # Your actual credentials (gitignored)
│
├── src/
│   ├── polar-checkout.js         # Frontend checkout module
│   └── main.js                   # Main JavaScript entry
│
├── pricing.html                  # Pricing page with checkout buttons
├── success.html                  # Success page after payment
├── cancel.html                   # Cancel page if payment fails
├── vite.config.js                # Vite configuration with API proxy
└── package.json                  # Frontend dependencies
```

---

## 🔐 Security Features

✅ **Webhook Signature Verification**: All webhooks are verified using HMAC-SHA256  
✅ **CORS Configuration**: Restricted to your frontend domain  
✅ **Environment Variables**: Sensitive data stored securely  
✅ **XSS Protection**: HTML escaping in frontend  
✅ **Input Validation**: Pydantic models validate all inputs

---

## 🧪 Testing the Integration

### Test Flow

1. **Start Both Servers**:
   ```bash
   # Terminal 1: Backend
   cd backend && python main.py
   
   # Terminal 2: Frontend
   npm run dev
   ```

2. **Visit Pricing Page**:
   ```
   http://localhost:5173/pricing.html
   ```

3. **Click "Get Monthly Plan" or "Get Yearly Plan"**

4. **Complete Checkout**:
   - You'll be redirected to Polar's secure checkout
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date and CVC

5. **Success Redirect**:
   - After payment, you'll be redirected to `/success.html?checkout_id=xxx`
   - Backend will receive webhook notification

6. **Check Backend Logs**:
   ```
   ============================================================
   📨 Webhook received: order.created
   ============================================================
   
   ✅ Order created (Payment successful!)
      Order ID: order_xxxxx
      Customer: customer@example.com
      Product: Monthly Plan
      Amount: 1999 USD
   ```

---

## 📊 Frontend Integration Examples

### Option 1: Direct Redirect (Current Implementation)

```javascript
import { PolarCheckout } from './src/polar-checkout.js';

const polar = new PolarCheckout({
  apiBase: '/api',
  onSuccess: (data) => {
    window.location.href = '/success.html';
  }
});

// Checkout button
button.addEventListener('click', async () => {
  await polar.checkout(productId);
});
```

### Option 2: Popup Window

```javascript
await polar.checkoutPopup(productId, {
  email: 'customer@example.com'
});
```

### Option 3: Dynamic Product Loading

```javascript
const products = await polar.getProducts();
polar.renderProducts(container, products);
```

---

## 🎨 Customization

### Change Theme
```javascript
const polar = new PolarCheckout({
  theme: 'dark', // or 'light'
});
```

### Custom Success Handler
```javascript
const polar = new PolarCheckout({
  onSuccess: (data) => {
    console.log('Order ID:', data.checkout_id);
    // Show custom success message
    // Update user's account
    // Send analytics event
  },
  onError: (error) => {
    // Show custom error message
  }
});
```

### Price Formatting
```javascript
polar.formatPrice(1999, 'USD', 'month');
// Returns: "$19.99/mo"
```

---

## 🚨 Troubleshooting

### "Failed to create checkout"
- ✅ Check that `POLAR_ACCESS_TOKEN` is set correctly
- ✅ Verify product ID exists in your Polar dashboard
- ✅ Make sure you're using the right environment (sandbox vs production)

### Webhooks not received
- ✅ Use ngrok for local testing
- ✅ Verify webhook URL in Polar dashboard
- ✅ Check webhook secret matches your `.env`
- ✅ Look at backend logs for signature verification errors

### CORS errors
- ✅ Backend CORS allows `http://localhost:5173`
- ✅ Vite proxy configured correctly in `vite.config.js`
- ✅ Check browser console for specific CORS messages

### Products not loading
- ✅ Verify `POLAR_ORGANIZATION_ID` is correct
- ✅ Check that products are not archived in Polar
- ✅ Ensure products have prices configured

---

## 🔄 Production Deployment

### Backend Deployment

1. **Environment Variables**:
   ```env
   ENVIRONMENT=production
   POLAR_ACCESS_TOKEN=polar_pat_live_xxxxx
   FRONTEND_URL=https://yourdomain.com
   ```

2. **Deploy to**:
   - Railway
   - Render
   - Fly.io
   - DigitalOcean App Platform
   - Your own VPS

3. **Update Webhook URL**:
   - Change from ngrok URL to your production domain
   - Update in Polar dashboard: `https://api.yourdomain.com/api/webhooks/polar`

### Frontend Deployment

1. **Build**:
   ```bash
   npm run build
   ```

2. **Deploy**:
   - Vercel
   - Netlify
   - Cloudflare Pages
   - Your own hosting

3. **Update API Base**:
   ```javascript
   const polar = new PolarCheckout({
     apiBase: 'https://api.yourdomain.com/api'
   });
   ```

---

## 📚 Additional Resources

- **Polar.sh Documentation**: https://docs.polar.sh
- **API Reference**: https://docs.polar.sh/api
- **SDK Documentation**: https://github.com/polarsource/polar-python
- **Dashboard**: https://polar.sh (production) or https://sandbox.polar.sh (testing)

---

## 🎉 What's Included

✅ Complete payment flow (redirect to Polar checkout)  
✅ Webhook handling with signature verification  
✅ Product listing from Polar API  
✅ Checkout session creation  
✅ Order verification  
✅ Customer order history  
✅ Success/cancel page handling  
✅ Loading states and error handling  
✅ XSS protection and input validation  
✅ TypeScript-style JSDoc comments  
✅ Production-ready error handling

---

## 📝 Next Steps

1. **Get your Polar credentials** and update `.env`
2. **Create products** in Polar dashboard
3. **Update product IDs** in `pricing.html`
4. **Test the flow** with sandbox mode
5. **Set up ngrok** for webhook testing
6. **Deploy to production** when ready

---

## 💡 Pro Tips

- Start with **sandbox mode** for testing (no real money)
- Use **ngrok** for local webhook testing
- Check **backend logs** to see webhook events in real-time
- Test with **Polar's test cards**: `4242 4242 4242 4242`
- Store customer info after successful orders for future reference
- Implement **email notifications** in webhook handlers
- Add **analytics tracking** for checkout flow

---

## 🤝 Support

Need help? 
- Check the [Polar.sh Discord](https://discord.gg/polar)
- Read the [documentation](https://docs.polar.sh)
- Review backend logs for detailed error messages

---

**Happy Coding! 🚀**
