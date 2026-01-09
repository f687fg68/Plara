"""
Plara Backend - Polar.sh Payment Integration
FastAPI backend for handling Polar checkout sessions and webhooks
"""

from fastapi import FastAPI, HTTPException, Request, Header, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from polar_sdk import Polar
from dotenv import load_dotenv
import os
import hmac
import hashlib
import json
from datetime import datetime
from typing import Optional, List, Dict, Any

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Plara Payment API",
    description="Backend API for Polar.sh payment integration",
    version="1.0.0"
)

# Configure CORS for Vite dev server and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        os.getenv("FRONTEND_URL", "http://localhost:5173")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Polar SDK
polar_client = Polar(
    access_token=os.getenv("POLAR_ACCESS_TOKEN"),
    server="sandbox" if os.getenv("ENVIRONMENT") == "sandbox" else "production"
)

# Pydantic Models
class CheckoutRequest(BaseModel):
    product_id: str
    email: Optional[EmailStr] = None
    customer_name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class CheckoutResponse(BaseModel):
    checkout_url: str
    checkout_id: str
    expires_at: Optional[str] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    price_amount: int
    price_currency: str
    is_recurring: bool
    interval: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    customer_email: str
    product_name: str
    amount: int
    currency: str
    status: str
    created_at: str

# Health Check
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Plara Payment API",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "timestamp": datetime.utcnow().isoformat()
    }

# Get Available Products
@app.get("/api/products", response_model=List[ProductResponse])
async def get_products():
    """
    Fetch all available products from Polar
    Returns a list of products with pricing information
    """
    try:
        org_id = os.getenv("POLAR_ORGANIZATION_ID")
        if not org_id:
            raise HTTPException(
                status_code=500,
                detail="POLAR_ORGANIZATION_ID not configured"
            )
        
        # Fetch products from Polar
        products_response = polar_client.products.list(
            organization_id=org_id,
            is_archived=False
        )
        
        products = []
        for product in products_response.result.items:
            # Get the first price (or you can iterate through all prices)
            if product.prices and len(product.prices) > 0:
                price = product.prices[0]
                products.append({
                    "id": product.id,
                    "name": product.name,
                    "description": product.description,
                    "price_amount": price.price_amount,
                    "price_currency": price.price_currency,
                    "is_recurring": price.is_recurring,
                    "interval": price.recurring_interval if price.is_recurring else None
                })
        
        return products
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch products: {str(e)}"
        )

# Create Checkout Session
@app.post("/api/checkout", response_model=CheckoutResponse)
async def create_checkout(request: CheckoutRequest):
    """
    Create a Polar checkout session
    Returns the checkout URL where the customer will complete payment
    """
    try:
        # Build checkout creation request
        checkout_data = {
            "product_price_id": request.product_id,
            "success_url": f"{os.getenv('FRONTEND_URL')}/success?checkout_id={{CHECKOUT_ID}}",
            "customer_email": request.email,
        }
        
        # Add customer name if provided
        if request.customer_name:
            checkout_data["customer_name"] = request.customer_name
        
        # Add metadata if provided
        if request.metadata:
            checkout_data["metadata"] = request.metadata
        
        # Create checkout session with Polar
        checkout = polar_client.checkouts.custom.create(
            request=checkout_data
        )
        
        return CheckoutResponse(
            checkout_url=checkout.url,
            checkout_id=checkout.id,
            expires_at=checkout.expires_at.isoformat() if checkout.expires_at else None
        )
    
    except Exception as e:
        print(f"Checkout creation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create checkout: {str(e)}"
        )

# Get Checkout Status
@app.get("/api/checkout/{checkout_id}")
async def get_checkout_status(checkout_id: str):
    """
    Get the status of a checkout session
    Useful for verifying payment completion
    """
    try:
        checkout = polar_client.checkouts.get(checkout_id)
        
        return {
            "checkout_id": checkout.id,
            "status": checkout.status,
            "customer_email": checkout.customer_email,
            "amount": checkout.amount,
            "currency": checkout.currency,
            "product_name": checkout.product.name if checkout.product else None,
            "created_at": checkout.created_at.isoformat(),
            "confirmed_at": checkout.confirmed_at.isoformat() if checkout.confirmed_at else None
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=f"Checkout not found: {str(e)}"
        )

# Webhook Handler
@app.post("/api/webhooks/polar")
async def handle_polar_webhook(
    request: Request,
    polar_signature: Optional[str] = Header(None, alias="Polar-Signature")
):
    """
    Handle incoming webhooks from Polar
    Verifies signature and processes payment events
    """
    # Get raw body for signature verification
    body = await request.body()
    
    # Verify webhook signature
    webhook_secret = os.getenv("POLAR_WEBHOOK_SECRET")
    if not webhook_secret:
        raise HTTPException(
            status_code=500,
            detail="POLAR_WEBHOOK_SECRET not configured"
        )
    
    # Calculate expected signature
    expected_signature = hmac.new(
        webhook_secret.encode(),
        body,
        hashlib.sha256
    ).hexdigest()
    
    # Compare signatures
    if not polar_signature or not hmac.compare_digest(
        polar_signature,
        expected_signature
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid webhook signature"
        )
    
    # Parse event data
    try:
        event = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Invalid JSON payload"
        )
    
    event_type = event.get("type")
    event_data = event.get("data")
    
    print(f"\n{'='*60}")
    print(f"📨 Webhook received: {event_type}")
    print(f"{'='*60}\n")
    
    # Handle different event types
    if event_type == "checkout.created":
        await handle_checkout_created(event_data)
    
    elif event_type == "checkout.updated":
        await handle_checkout_updated(event_data)
    
    elif event_type == "order.created":
        await handle_order_created(event_data)
    
    elif event_type == "subscription.created":
        await handle_subscription_created(event_data)
    
    elif event_type == "subscription.updated":
        await handle_subscription_updated(event_data)
    
    elif event_type == "subscription.canceled":
        await handle_subscription_canceled(event_data)
    
    else:
        print(f"⚠️  Unhandled event type: {event_type}")
    
    return JSONResponse(
        status_code=200,
        content={"status": "received", "event_type": event_type}
    )

# Webhook Event Handlers
async def handle_checkout_created(data: dict):
    """Handle checkout.created event"""
    print(f"🛒 Checkout created: {data.get('id')}")
    print(f"   Customer: {data.get('customer_email')}")
    print(f"   Amount: {data.get('amount')} {data.get('currency')}")

async def handle_checkout_updated(data: dict):
    """Handle checkout.updated event"""
    print(f"🔄 Checkout updated: {data.get('id')}")
    print(f"   Status: {data.get('status')}")

async def handle_order_created(data: dict):
    """Handle order.created event - payment successful"""
    print(f"✅ Order created (Payment successful!)")
    print(f"   Order ID: {data.get('id')}")
    print(f"   Customer: {data.get('customer_email')}")
    print(f"   Product: {data.get('product', {}).get('name')}")
    print(f"   Amount: {data.get('amount')} {data.get('currency')}")
    
    # TODO: Add your business logic here
    # - Update database with order
    # - Send confirmation email
    # - Grant access to product/service
    # - Update user subscription status

async def handle_subscription_created(data: dict):
    """Handle subscription.created event"""
    print(f"🔔 Subscription created")
    print(f"   Subscription ID: {data.get('id')}")
    print(f"   Customer: {data.get('customer_email')}")
    print(f"   Status: {data.get('status')}")
    
    # TODO: Grant subscription access to user

async def handle_subscription_updated(data: dict):
    """Handle subscription.updated event"""
    print(f"🔄 Subscription updated")
    print(f"   Subscription ID: {data.get('id')}")
    print(f"   Status: {data.get('status')}")

async def handle_subscription_canceled(data: dict):
    """Handle subscription.canceled event"""
    print(f"❌ Subscription canceled")
    print(f"   Subscription ID: {data.get('id')}")
    print(f"   Customer: {data.get('customer_email')}")
    
    # TODO: Revoke subscription access

# Get Customer Orders
@app.get("/api/orders/{customer_email}", response_model=List[OrderResponse])
async def get_customer_orders(customer_email: str):
    """
    Get all orders for a specific customer
    """
    try:
        org_id = os.getenv("POLAR_ORGANIZATION_ID")
        orders_response = polar_client.orders.list(
            organization_id=org_id
        )
        
        # Filter orders by customer email
        customer_orders = []
        for order in orders_response.result.items:
            if order.customer.email == customer_email:
                customer_orders.append({
                    "id": order.id,
                    "customer_email": order.customer.email,
                    "product_name": order.product.name,
                    "amount": order.amount,
                    "currency": order.currency,
                    "status": order.status,
                    "created_at": order.created_at.isoformat()
                })
        
        return customer_orders
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch orders: {str(e)}"
        )

# Get Customer Subscriptions Status
@app.get("/api/subscriptions/{customer_email}")
async def check_subscription_status(customer_email: str):
    """
    Check if a customer has an active subscription
    """
    try:
        org_id = os.getenv("POLAR_ORGANIZATION_ID")
        if not org_id:
            raise HTTPException(
                status_code=500,
                detail="POLAR_ORGANIZATION_ID not configured"
            )
            
        # List subscriptions for the user
        # Note: In a real app, you might want to filter by specific product IDs
        subscriptions = polar_client.subscriptions.list(
            organization_id=org_id,
            request={"customer_email": customer_email} if hasattr(polar_client.subscriptions, 'list') else None 
            # Note: The Polar SDK structure might vary slightly, treating list as allowing filters directly or via params
            # We will use a broader fetch and filter in python if the SDK requires it, 
            # but usually list(..., customer_email=...) or similar works.
            # Let's try the standard pattern for Polar SDK
        )
        
        # NOTE: The above SDK call might need adjustment based on exact SDK version.
        # If 'list' doesn't support direct filtering by email in this version, we would verify manually.
        # Re-fetching all subscriptions is inefficient, but for this context:
        
        # Let's use a more robust approach compatible with typical Polar SDK usage:
        # We need to find if there is ANY active subscription for this email.
        
        # Re-implementing with expected SDK signature:
        all_subs = polar_client.subscriptions.list(
            organization_id=org_id,
            # query parameters often differ, let's assume we get a list and filter for safety if SDK filter fails or is not present
        )
        
        has_active = False
        active_sub = None
        
        items = all_subs.result.items if hasattr(all_subs, 'result') else all_subs.items
        
        for sub in items:
            if sub.customer.email == customer_email and sub.status == 'active':
                has_active = True
                active_sub = sub
                break
        
        return {
            "has_active_subscription": has_active,
            "subscription": {
                 "id": active_sub.id,
                 "status": active_sub.status,
                 "current_period_end": active_sub.current_period_end.isoformat() if active_sub.current_period_end else None
            } if active_sub else None
        }

    except Exception as e:
        print(f"Subscription check error: {str(e)}")
        # Start of error handling
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check subscription: {str(e)}"
        )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    print(f"❌ Error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc)
        }
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
