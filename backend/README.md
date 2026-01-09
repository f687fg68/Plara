# Plara Backend - Polar.sh Payment Integration

## Overview

This is the Python FastAPI backend for handling Polar.sh payment processing, checkout sessions, and webhooks.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or with virtual environment:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Polar.sh credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
POLAR_ACCESS_TOKEN=polar_pat_your_actual_token_here
POLAR_WEBHOOK_SECRET=your_webhook_secret_here
POLAR_ORGANIZATION_ID=your_org_id_here
ENVIRONMENT=sandbox
```

**Where to find these values:**

1. **Access Token**: Go to [Polar Dashboard](https://polar.sh/dashboard) → Settings → API Keys
2. **Organization ID**: Found in your Polar dashboard URL or organization settings
3. **Webhook Secret**: Dashboard → Settings → Webhooks → Add Endpoint

### 3. Create Products in Polar

1. Go to [Polar Dashboard](https://polar.sh/dashboard)
2. Create two products:
   - **Monthly Plan**: $19.99/month
   - **Yearly Plan**: $49.99/year
3. Copy the Product Price IDs
4. Update `.env` with:
   ```env
   PRODUCT_ID_MONTHLY=price_xxxxx
   PRODUCT_ID_YEARLY=price_xxxxx
   ```

### 4. Run the Backend

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at: `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

## 📡 API Endpoints

### Health Check
```http
GET /
```

Returns server status and environment info.

### Get Products
```http
GET /api/products
```

Returns all available products from Polar.

**Response:**
```json
[
  {
    "id": "prod_xxx",
    "name": "Monthly Plan",
    "description": "Perfect for flexible access",
    "price_amount": 1999,
    "price_currency": "USD",
    "is_recurring": true,
    "interval": "month"
  }
]
```

### Create Checkout Session
```http
POST /api/checkout
```

**Request Body:**
```json
{
  "product_id": "price_xxxxx",
  "email": "customer@example.com",
  "customer_name": "John Doe",
  "metadata": {
    "plan": "monthly",
    "source": "website"
  }
}
```

**Response:**
```json
{
  "checkout_url": "https://polar.sh/checkout/xxxxx",
  "checkout_id": "checkout_xxxxx",
  "expires_at": "2024-01-15T12:00:00Z"
}
```

### Get Checkout Status
```http
GET /api/checkout/{checkout_id}
```

Returns the status of a checkout session.

### Webhook Endpoint
```http
POST /api/webhooks/polar
```

Receives webhooks from Polar. **Must be publicly accessible**.

### Get Customer Orders
```http
GET /api/orders/{customer_email}
```

Returns all orders for a specific customer.

## 🔒 Webhook Setup

### Using ngrok for Local Testing

1. **Install ngrok**: https://ngrok.com/download

2. **Start your backend**:
   ```bash
   python main.py
   ```

3. **In a new terminal, start ngrok**:
   ```bash
   ngrok http 8000
   ```

4. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)

5. **Configure Polar Webhook**:
   - Go to [Polar Dashboard](https://polar.sh/dashboard) → Settings → Webhooks
   - Click "Add Endpoint"
   - URL: `https://abc123.ngrok.io/api/webhooks/polar`
   - Events: Select all or specific events (checkout.created, order.created, subscription.created, etc.)
   - Save and copy the webhook secret
   - Update your `.env` with the webhook secret

### Webhook Events Handled

- `checkout.created` - Checkout session created
- `checkout.updated` - Checkout session updated
- `order.created` - **Payment successful**
- `subscription.created` - New subscription
- `subscription.updated` - Subscription updated
- `subscription.canceled` - Subscription cancelled

## 🧪 Testing

### Test Checkout Flow

1. Start backend: `python main.py`
2. Start frontend: `npm run dev` (in root directory)
3. Go to `http://localhost:5173/pricing.html`
4. Click "Get Monthly Plan" or "Get Yearly Plan"
5. Complete payment in Polar sandbox

### Test Webhooks

Use ngrok and trigger events:

```bash
# Test webhook manually with curl
curl -X POST http://localhost:8000/api/webhooks/polar \
  -H "Content-Type: application/json" \
  -H "Polar-Signature: test_signature" \
  -d '{
    "type": "order.created",
    "data": {
      "id": "order_123",
      "customer_email": "test@example.com",
      "amount": 1999,
      "currency": "USD"
    }
  }'
```

### Test with Polar Sandbox

Use test card numbers in Polar sandbox:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires 3DS: `4000 0025 0000 3155`

## 📊 Monitoring

### View Logs

The backend logs all events to console:

```
========================================
📨 Webhook received: order.created
========================================

✅ Order created (Payment successful!)
   Order ID: order_xxxxx
   Customer: customer@example.com
   Product: Monthly Plan
   Amount: 1999 USD
```

### Check Polar Dashboard

- View all orders: Dashboard → Orders
- View customers: Dashboard → Customers
- View webhook logs: Dashboard → Settings → Webhooks

## 🚢 Production Deployment

### Environment Setup

1. Set `ENVIRONMENT=production` in `.env`
2. Use production Polar access token
3. Update `FRONTEND_URL` to your production domain
4. Deploy to a hosting service (Heroku, Railway, DigitalOcean, etc.)

### Hosting Options

#### Heroku
```bash
heroku create plara-backend
heroku config:set POLAR_ACCESS_TOKEN=polar_pat_xxx
heroku config:set POLAR_WEBHOOK_SECRET=xxx
heroku config:set ENVIRONMENT=production
git push heroku main
```

#### Railway
```bash
railway init
railway add
# Add environment variables in Railway dashboard
railway up
```

#### Docker
```bash
# Create Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Build and run
docker build -t plara-backend .
docker run -p 8000:8000 --env-file .env plara-backend
```

### Update Webhook URL

After deployment, update your Polar webhook URL to your production domain:
- Example: `https://api.plara.com/api/webhooks/polar`

## 🔐 Security

- ✅ Webhook signature verification implemented
- ✅ CORS configured for frontend
- ✅ Environment variables for secrets
- ✅ HTTPS required in production
- ⚠️ Add rate limiting for production
- ⚠️ Add authentication for customer-specific endpoints

## 📝 Troubleshooting

### "POLAR_ACCESS_TOKEN not configured"
- Ensure `.env` file exists in `backend/` directory
- Check that `python-dotenv` is installed
- Verify token starts with `polar_pat_`

### Webhook signature verification fails
- Ensure webhook secret matches Polar dashboard
- Check that raw request body is being used (no parsing before verification)
- Test with ngrok to see actual webhook payloads

### Products not loading
- Verify `POLAR_ORGANIZATION_ID` is correct
- Ensure products are created in Polar dashboard
- Check products are not archived

### CORS errors
- Add your frontend URL to CORS origins in `main.py`
- Check frontend is running on expected port (5173)

## 📚 Resources

- [Polar.sh Documentation](https://docs.polar.sh)
- [Polar Python SDK](https://github.com/polarsource/polar-python)
- [FastAPI Documentation](https://fastapi.tiangolo.com)

## 💬 Support

For issues or questions:
1. Check Polar dashboard webhook logs
2. Check backend console logs
3. Contact Polar support: support@polar.sh
