# Plara Polar Payment Backend - Lightweight Flask Version
# Uses direct API calls instead of polar-sdk to avoid pydantic-core build issues

import os
import hmac
import hashlib
import httpx
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

# Polar API configuration
POLAR_API_BASE = "https://api.polar.sh/v1"
POLAR_ACCESS_TOKEN = os.getenv("POLAR_ACCESS_TOKEN")
POLAR_WEBHOOK_SECRET = os.getenv("POLAR_WEBHOOK_SECRET")
POLAR_ORG_ID = os.getenv("POLAR_ORGANIZATION_ID")

def polar_headers():
    return {
        "Authorization": f"Bearer {POLAR_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }

@app.route('/')
def health():
    return jsonify({"status": "healthy", "service": "Plara Payment API"})

@app.route('/api/checkout', methods=['POST'])
def create_checkout():
    """Create a Polar checkout session"""
    try:
        data = request.json
        product_id = data.get('product_id')
        
        if not product_id:
            return jsonify({"error": "product_id is required"}), 400
        
        # Call Polar API directly
        with httpx.Client() as client:
            response = client.post(
                f"{POLAR_API_BASE}/checkouts/",
                headers=polar_headers(),
                json={
                    "products": [product_id],
                    "success_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/success.html?checkout_id={{CHECKOUT_ID}}"
                }
            )
            
            if response.status_code >= 400:
                print(f"❌ Polar API Error: {response.status_code}")
                print(f"Response: {response.text}")
                return jsonify({"error": f"Polar API Error: {response.text}"}), response.status_code
            
            checkout_data = response.json()
            print(f"✅ Created checkout: {checkout_data.get('url')}")
            
            return jsonify({
                "checkout_url": checkout_data.get("url"),
                "checkout_id": checkout_data.get("id")
            })
    
    except Exception as e:
        print(f"Checkout error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/products', methods=['GET'])
def get_products():
    """Fetch products from Polar"""
    try:
        with httpx.Client() as client:
            response = client.get(
                f"{POLAR_API_BASE}/products/",
                headers=polar_headers(),
                params={"organization_id": POLAR_ORG_ID}
            )
            
            if response.status_code >= 400:
                return jsonify({"error": response.text}), response.status_code
            
            return jsonify(response.json())
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/webhooks/polar', methods=['POST'])
@app.route('/webhook', methods=['POST'])
def handle_webhook():
    """Handle Polar webhook events"""
    payload = request.get_data()
    signature = request.headers.get('Polar-Signature', '')
    
    # Verify signature if secret is configured
    if POLAR_WEBHOOK_SECRET:
        expected_sig = hmac.new(
            POLAR_WEBHOOK_SECRET.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_sig):
            print("Invalid webhook signature")
            return jsonify({"error": "Invalid signature"}), 401
    
    event = request.json
    event_type = event.get("type")
    
    print(f"\n{'='*50}")
    print(f"📨 Webhook: {event_type}")
    print(f"{'='*50}")
    
    if event_type == "checkout.created":
        print("🛒 Checkout started")
    
    elif event_type == "order.created":
        order_data = event.get("data", {})
        print(f"✅ Payment successful!")
        print(f"   Order ID: {order_data.get('id')}")
        print(f"   Customer: {order_data.get('customer_email')}")
        # TODO: Grant access, update database, send email, etc.
    
    elif event_type == "subscription.created":
        print("📦 Subscription created")
    
    elif event_type == "subscription.canceled":
        print("❌ Subscription canceled")
    
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    port = int(os.getenv("BACKEND_PORT", 8000))
    print(f"🚀 Starting Plara Payment API on port {port}")
    app.run(host="0.0.0.0", port=port, debug=True)
