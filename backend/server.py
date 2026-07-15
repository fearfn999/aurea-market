from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import json
import logging
from typing import List, Optional, Annotated
from datetime import datetime, timezone, timedelta

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator, EmailStr
import httpx
import stripe
from openai import AsyncOpenAI

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
EMERGENT_LLM_KEY = os.environ.get('OPENAI_API_KEY')
PAYPAL_CLIENT_ID = os.environ.get('PAYPAL_CLIENT_ID')
PAYPAL_SECRET = os.environ.get('PAYPAL_SECRET')
PAYPAL_MODE = os.environ.get('PAYPAL_MODE', 'sandbox')
PAYPAL_BASE = 'https://api-m.sandbox.paypal.com' if PAYPAL_MODE == 'sandbox' else 'https://api-m.paypal.com'

app = FastAPI(title="Aurea Market API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Mongo helpers
# ---------------------------------------------------------------------------
def _validate_object_id(v):
    if isinstance(v, ObjectId):
        return str(v)
    return str(v)


PyObjectId = Annotated[str, BeforeValidator(_validate_object_id)]


# ---------------------------------------------------------------------------
# Auth utils
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if creds is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = creds.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def require_seller(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") not in ("seller", "admin"):
        raise HTTPException(status_code=403, detail="Seller access required")
    if user.get("role") == "seller" and user.get("status") != "approved":
        raise HTTPException(status_code=403, detail="Your seller account is pending admin approval")
    return user


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class LoginInput(BaseModel):
    email: EmailStr
    password: str


class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str
    store_name: Optional[str] = None
    role: str = "buyer"  # buyer | seller


class ProductInput(BaseModel):
    title: str
    category: str
    price: float
    original_price: Optional[float] = None
    description: str
    image: str
    tier: str = "standard"  # standard | premium
    stock: int = 10
    featured: bool = False
    delivery: str = "Instant Delivery"


class Product(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: PyObjectId = Field(alias="_id")
    title: str
    category: str
    price: float
    original_price: Optional[float] = None
    description: str
    image: str
    tier: str = "standard"
    stock: int = 10
    featured: bool = False
    delivery: str = "Instant Delivery"
    seller_id: Optional[str] = None
    seller_name: str = "Aurea Market Official"
    created_at: Optional[str] = None


class OrderItem(BaseModel):
    product_id: str
    title: str
    price: float
    quantity: int


class OrderInput(BaseModel):
    customer_name: str
    customer_email: EmailStr
    contact: str  # discord / telegram handle
    items: List[OrderItem]
    total: float
    note: Optional[str] = ""


# ---------------------------------------------------------------------------
# Routes - public
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "Aurea Market API online"}


CATEGORIES = [
    {"slug": "discord-nitro", "name": "Discord Nitro", "icon": "DiscordLogo"},
    {"slug": "game-accounts", "name": "Game Accounts", "icon": "GameController"},
    {"slug": "game-keys", "name": "Game Keys", "icon": "Key"},
    {"slug": "gift-cards", "name": "Gift Cards", "icon": "GiftCard"},
]


@api_router.get("/categories")
async def get_categories():
    return CATEGORIES


# ---------------------------------------------------------------------------
# Routes - AI Support Assistant
# ---------------------------------------------------------------------------
SUPPORT_SYSTEM_PROMPT = (
    "You are 'Aurea Assistant', the friendly AI support agent for Aurea Market — a premium "
    "digital gaming marketplace. We sell Discord Nitro, ranked/OG game accounts (Valorant, "
    "Fortnite), Steam & game keys (Cyberpunk 2077, Elden Ring), and gift cards (Steam, "
    "PlayStation Plus). Key facts: instant digital delivery in seconds (some accounts are manual "
    "under 1 hour); secure checkout via Stripe (card & crypto); 24/7 Discord support; all goods are "
    "verified and warrantied. Help customers pick products, explain delivery, payment, refunds, and "
    "account safety. Be concise, warm and helpful (2-4 short sentences). If asked something you "
    "cannot resolve (order-specific issues, disputes), tell them to open a ticket in our Discord. "
    "Never invent prices — tell them to check the Shop page for current pricing."
)


class SupportChatInput(BaseModel):
    session_id: str
    message: str


@api_router.post("/support/chat")
async def support_chat(data: SupportChatInput):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="Support assistant is not configured")
    msg = data.message.strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    client = AsyncOpenAI(api_key=EMERGENT_LLM_KEY)
    try:
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SUPPORT_SYSTEM_PROMPT},
                {"role": "user", "content": msg},
            ],
        )
        reply = resp.choices[0].message.content or ""
    except Exception as e:
        logger.error("Support chat error: %s", e)
        raise HTTPException(status_code=502, detail="Assistant is temporarily unavailable")

    now = datetime.now(timezone.utc).isoformat()
    await db.support_messages.insert_many([
        {"session_id": data.session_id, "role": "user", "text": msg, "created_at": now},
        {"session_id": data.session_id, "role": "assistant", "text": reply, "created_at": now},
    ])

    return {"reply": reply}


@api_router.get("/products", response_model=List[Product], response_model_by_alias=False)
async def get_products(category: Optional[str] = None, search: Optional[str] = None, featured: Optional[bool] = None):
    query = {}
    if category:
        query["category"] = category
    if featured is not None:
        query["featured"] = featured
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
    docs = await db.products.find(query).sort("created_at", -1).to_list(500)
    return [Product(**d) for d in docs]


@api_router.get("/products/{product_id}", response_model=Product, response_model_by_alias=False)
async def get_product(product_id: str):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=404, detail="Product not found")
    doc = await db.products.find_one({"_id": ObjectId(product_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**doc)


@api_router.post("/orders")
async def create_order(order: OrderInput):
    doc = order.model_dump()
    doc["status"] = "pending"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.orders.insert_one(doc)
    return {"id": str(res.inserted_id), "status": "pending", "message": "Order received! We'll deliver to your contact shortly."}


# ---------------------------------------------------------------------------
# Routes - Stripe checkout
# ---------------------------------------------------------------------------
class CheckoutItem(BaseModel):
    product_id: str
    quantity: int = 1


class CheckoutRequest(BaseModel):
    items: List[CheckoutItem]
    customer_name: str
    customer_email: EmailStr
    contact: str
    note: Optional[str] = ""
    origin_url: str


async def _compute_cart(items: List[CheckoutItem]):
    """Recompute cart line items and total from DB prices (never trust client)."""
    line_items = []
    total = 0.0
    for it in items:
        if not ObjectId.is_valid(it.product_id):
            continue
        prod = await db.products.find_one({"_id": ObjectId(it.product_id)})
        if not prod:
            continue
        qty = max(1, int(it.quantity))
        price = float(prod["price"])
        total += price * qty
        line_items.append({"product_id": it.product_id, "title": prod["title"], "price": price, "quantity": qty})
    return line_items, round(total, 2)


async def _fulfill_order(txn: dict):
    """Create the order once for a paid transaction (idempotent, race-safe)."""
    # Atomically claim this session; only the first caller flips the flag.
    claim = await db.payment_transactions.update_one(
        {"session_id": txn["session_id"], "order_created": {"$ne": True}},
        {"$set": {"order_created": True}},
    )
    if claim.modified_count == 0:
        return
    order_doc = {
        "customer_name": txn["customer_name"],
        "customer_email": txn["customer_email"],
        "contact": txn["contact"],
        "note": txn.get("note", ""),
        "items": txn["items"],
        "total": txn["amount"],
        "status": "paid",
        "session_id": txn["session_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(order_doc)


@api_router.post("/checkout/session")
async def create_checkout_session(data: CheckoutRequest, request: Request):
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Payments are not configured")

    line_items, total = await _compute_cart(data.items)
    if not line_items or total <= 0:
        raise HTTPException(status_code=400, detail="Cart is empty or invalid")

    origin = data.origin_url.rstrip("/")
    success_url = f"{origin}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/cart"

    session = stripe.checkout.Session.create(
        mode="payment",
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {"name": "Aurea Market Order"},
                "unit_amount": int(round(total * 100)),
            },
            "quantity": 1,
        }],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"source": "aurea_market", "customer_email": data.customer_email},
    )

    await db.payment_transactions.insert_one({
        "session_id": session.id,
        "amount": total,
        "currency": "usd",
        "items": line_items,
        "customer_name": data.customer_name,
        "customer_email": data.customer_email,
        "contact": data.contact,
        "note": data.note or "",
        "metadata": {"source": "aurea_market"},
        "status": "initiated",
        "payment_status": "initiated",
        "order_created": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"url": session.url, "session_id": session.id}


@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, request: Request):
    txn = await db.payment_transactions.find_one({"session_id": session_id})
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    stripe.api_key = STRIPE_API_KEY
    try:
        sess = stripe.checkout.Session.retrieve(session_id)
        pmt_status = sess.payment_status
        st = sess.status
        amount_total = sess.amount_total
        currency = sess.currency
    except Exception as e:
        logger.error("Stripe status error: %s", e)
        raise HTTPException(status_code=502, detail="Could not check payment status")

    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"status": st, "payment_status": pmt_status}},
    )

    if pmt_status == "paid":
        fresh = await db.payment_transactions.find_one({"session_id": session_id})
        await _fulfill_order(fresh)

    return {
        "status": st,
        "payment_status": pmt_status,
        "amount_total": amount_total,
        "currency": currency,
    }


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    if not STRIPE_API_KEY:
        return {"received": False}
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    stripe.api_key = STRIPE_API_KEY
    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(payload=body, sig_header=signature, secret=webhook_secret)
        else:
            event = json.loads(body)
    except Exception as e:
        logger.error("Stripe webhook error: %s", e)
        raise HTTPException(status_code=400, detail="Invalid webhook")

    session_id = event.get("data", {}).get("object", {}).get("id") if isinstance(event, dict) else event.get("data", {}).get("object", {}).get("id", None)
    if hasattr(event, 'data') and hasattr(event.data, 'object'):
        session_id = event.data.object.get('id', None) if hasattr(event.data.object, 'get') else getattr(event.data.object, 'id', None)

    if not session_id:
        return {"received": True}

    pmt_status = "unpaid"
    if isinstance(event, dict):
        obj = event.get("data", {}).get("object", {})
        if obj.get("payment_status") == "paid" or obj.get("status") == "complete":
            pmt_status = "paid"
    elif hasattr(event, 'type'):
        if event.type in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
            pmt_status = "paid"

    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"payment_status": pmt_status}},
    )
    if pmt_status == "paid":
        txn = await db.payment_transactions.find_one({"session_id": session_id})
        if txn:
            await _fulfill_order(txn)
    return {"received": True}


# ---------------------------------------------------------------------------
# Routes - auth
# ---------------------------------------------------------------------------
@api_router.post("/auth/register")
async def register(data: RegisterInput):
    email = data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    role = data.role or "buyer"
    status = "pending" if role == "seller" else "active"
    doc = {
        "email": email,
        "password_hash": hash_password(data.password),
        "name": data.name,
        "store_name": data.store_name if role == "seller" else None,
        "role": role,
        "status": status,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = await db.users.insert_one(doc)
    token = create_access_token(str(res.inserted_id), email, role)
    return {"access_token": token, "user": {"email": email, "name": data.name, "role": role, "status": status, "store_name": doc["store_name"]}}


@api_router.post("/auth/login")
async def login(data: LoginInput):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user["_id"]), email, user.get("role", "admin"))
    return {"access_token": token, "user": {
        "email": email, "name": user.get("name"), "role": user.get("role"),
        "status": user.get("status", "approved"), "store_name": user.get("store_name"),
    }}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {
        "email": user["email"], "name": user.get("name"), "role": user.get("role"),
        "status": user.get("status", "approved"), "store_name": user.get("store_name"),
    }


# ---------------------------------------------------------------------------
# Routes - seller
# ---------------------------------------------------------------------------
@api_router.post("/seller/products", response_model=Product, response_model_by_alias=False)
async def seller_create_product(data: ProductInput, seller: dict = Depends(require_seller)):
    doc = data.model_dump()
    doc["seller_id"] = seller["_id"]
    doc["seller_name"] = seller.get("store_name") or seller.get("name") or "Seller"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.products.insert_one(doc)
    created = await db.products.find_one({"_id": res.inserted_id})
    return Product(**created)


@api_router.get("/seller/products", response_model=List[Product], response_model_by_alias=False)
async def seller_list_products(seller: dict = Depends(require_seller)):
    docs = await db.products.find({"seller_id": seller["_id"]}).sort("created_at", -1).to_list(500)
    return [Product(**d) for d in docs]


@api_router.put("/seller/products/{product_id}", response_model=Product, response_model_by_alias=False)
async def seller_update_product(product_id: str, data: ProductInput, seller: dict = Depends(require_seller)):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=404, detail="Product not found")
    prod = await db.products.find_one({"_id": ObjectId(product_id)})
    if not prod or prod.get("seller_id") != seller["_id"]:
        raise HTTPException(status_code=403, detail="You can only edit your own products")
    await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": data.model_dump()})
    updated = await db.products.find_one({"_id": ObjectId(product_id)})
    return Product(**updated)


@api_router.delete("/seller/products/{product_id}")
async def seller_delete_product(product_id: str, seller: dict = Depends(require_seller)):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=404, detail="Product not found")
    prod = await db.products.find_one({"_id": ObjectId(product_id)})
    if not prod or prod.get("seller_id") != seller["_id"]:
        raise HTTPException(status_code=403, detail="You can only delete your own products")
    await db.products.delete_one({"_id": ObjectId(product_id)})
    return {"message": "Product deleted"}


@api_router.get("/seller/stats")
async def seller_stats(seller: dict = Depends(require_seller)):
    sid = seller["_id"]
    my_products = await db.products.find({"seller_id": sid}).to_list(500)
    product_ids = {str(p["_id"]) for p in my_products}
    orders = await db.orders.find({"status": "paid"}).to_list(1000)
    sales = 0
    revenue = 0.0
    for o in orders:
        for it in o.get("items", []):
            if it.get("product_id") in product_ids:
                sales += it.get("quantity", 0)
                revenue += it.get("price", 0) * it.get("quantity", 0)
    return {"products": len(my_products), "sales": sales, "revenue": round(revenue, 2)}


# ---------------------------------------------------------------------------
# Routes - admin
# ---------------------------------------------------------------------------
@api_router.post("/admin/products", response_model=Product, response_model_by_alias=False)
async def create_product(data: ProductInput, admin: dict = Depends(require_admin)):
    doc = data.model_dump()
    doc["seller_id"] = None
    doc["seller_name"] = "Aurea Market Official"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.products.insert_one(doc)
    created = await db.products.find_one({"_id": res.inserted_id})
    return Product(**created)


@api_router.put("/admin/products/{product_id}", response_model=Product, response_model_by_alias=False)
async def update_product(product_id: str, data: ProductInput, admin: dict = Depends(require_admin)):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=404, detail="Product not found")
    await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": data.model_dump()})
    updated = await db.products.find_one({"_id": ObjectId(product_id)})
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**updated)


@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(require_admin)):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=404, detail="Product not found")
    await db.products.delete_one({"_id": ObjectId(product_id)})
    return {"message": "Product deleted"}


@api_router.get("/admin/orders")
async def list_orders(admin: dict = Depends(require_admin)):
    docs = await db.orders.find().sort("created_at", -1).to_list(500)
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs


@api_router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(require_admin)):
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    pending = await db.orders.count_documents({"status": "pending"})
    revenue_docs = await db.orders.find({}, {"total": 1}).to_list(1000)
    revenue = sum(d.get("total", 0) for d in revenue_docs)
    sellers = await db.users.count_documents({"role": "seller"})
    pending_sellers = await db.users.count_documents({"role": "seller", "status": "pending"})
    return {"products": total_products, "orders": total_orders, "pending": pending, "revenue": revenue,
            "sellers": sellers, "pending_sellers": pending_sellers}


@api_router.get("/admin/sellers")
async def list_sellers(admin: dict = Depends(require_admin)):
    docs = await db.users.find({"role": "seller"}).sort("created_at", -1).to_list(500)
    out = []
    for d in docs:
        count = await db.products.count_documents({"seller_id": str(d["_id"])})
        out.append({
            "id": str(d["_id"]), "name": d.get("name"), "email": d.get("email"),
            "store_name": d.get("store_name"), "status": d.get("status", "pending"),
            "products": count, "created_at": d.get("created_at"),
        })
    return out


@api_router.put("/admin/sellers/{seller_id}/status")
async def set_seller_status(seller_id: str, admin: dict = Depends(require_admin), status: str = "approved"):
    if status not in ("approved", "pending", "rejected"):
        raise HTTPException(status_code=400, detail="Invalid status")
    if not ObjectId.is_valid(seller_id):
        raise HTTPException(status_code=404, detail="Seller not found")
    res = await db.users.update_one({"_id": ObjectId(seller_id), "role": "seller"}, {"$set": {"status": status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Seller not found")
    return {"id": seller_id, "status": status}


# ---------------------------------------------------------------------------
# Routes - PayPal checkout
# ---------------------------------------------------------------------------
class PaypalOrderInput(BaseModel):
    items: List[CheckoutItem]
    customer_name: str
    customer_email: EmailStr
    contact: str
    note: Optional[str] = ""


async def _paypal_access_token():
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(
            f"{PAYPAL_BASE}/v1/oauth2/token",
            data={"grant_type": "client_credentials"},
            auth=(PAYPAL_CLIENT_ID, PAYPAL_SECRET),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        r.raise_for_status()
        return r.json()["access_token"]


@api_router.post("/paypal/order")
async def paypal_create_order(data: PaypalOrderInput):
    if not PAYPAL_CLIENT_ID or not PAYPAL_SECRET:
        raise HTTPException(status_code=500, detail="PayPal is not configured")
    line_items, total = await _compute_cart(data.items)
    if not line_items or total <= 0:
        raise HTTPException(status_code=400, detail="Cart is empty or invalid")

    try:
        token = await _paypal_access_token()
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.post(
                f"{PAYPAL_BASE}/v2/checkout/orders",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={
                    "intent": "CAPTURE",
                    "purchase_units": [{
                        "amount": {"currency_code": "USD", "value": f"{total:.2f}"},
                        "description": "Aurea Market digital goods",
                    }],
                },
            )
            r.raise_for_status()
            order = r.json()
    except httpx.HTTPStatusError as e:
        logger.error("PayPal create order failed: %s %s", e.response.status_code, e.response.text)
        raise HTTPException(status_code=502, detail="Could not start PayPal checkout")

    await db.payment_transactions.insert_one({
        "provider": "paypal",
        "paypal_order_id": order["id"],
        "session_id": order["id"],
        "amount": total,
        "currency": "usd",
        "items": line_items,
        "customer_name": data.customer_name,
        "customer_email": data.customer_email,
        "contact": data.contact,
        "note": data.note or "",
        "status": "initiated",
        "payment_status": "initiated",
        "order_created": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"order_id": order["id"]}


@api_router.post("/paypal/capture/{order_id}")
async def paypal_capture_order(order_id: str):
    if not PAYPAL_CLIENT_ID or not PAYPAL_SECRET:
        raise HTTPException(status_code=500, detail="PayPal is not configured")
    txn = await db.payment_transactions.find_one({"paypal_order_id": order_id})
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    try:
        token = await _paypal_access_token()
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.post(
                f"{PAYPAL_BASE}/v2/checkout/orders/{order_id}/capture",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            )
            r.raise_for_status()
            result = r.json()
    except httpx.HTTPStatusError as e:
        logger.error("PayPal capture failed: %s %s", e.response.status_code, e.response.text)
        raise HTTPException(status_code=502, detail="Could not capture PayPal payment")

    status = result.get("status", "")
    paid = status == "COMPLETED"
    await db.payment_transactions.update_one(
        {"paypal_order_id": order_id},
        {"$set": {"status": status, "payment_status": "paid" if paid else status.lower()}},
    )
    if paid:
        fresh = await db.payment_transactions.find_one({"paypal_order_id": order_id})
        await _fulfill_order(fresh)

    return {"status": status, "paid": paid}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Seeding
# ---------------------------------------------------------------------------
SEED_PRODUCTS = [
    {"title": "Discord Nitro - 1 Year", "category": "discord-nitro", "price": 39.99, "original_price": 99.99,
     "description": "Full Discord Nitro subscription for 12 months. Includes 2 server boosts, HD streaming, larger uploads, custom emojis everywhere and animated avatars.", "image": "https://images.unsplash.com/photo-1643139863038-7355941e9e89?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", "tier": "premium", "stock": 50, "featured": True, "delivery": "Instant Delivery"},
    {"title": "Discord Nitro - 3 Months", "category": "discord-nitro", "price": 12.99, "original_price": 29.99,
     "description": "3 months of Discord Nitro. Boost your servers and unlock premium perks instantly.", "image": "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", "tier": "standard", "stock": 100, "featured": False, "delivery": "Instant Delivery"},
    {"title": "Valorant Account - Immortal Ranked", "category": "game-accounts", "price": 149.99, "original_price": 249.99,
     "description": "Immortal ranked Valorant account. 40+ skins, full agent unlock, verified email included. Region: NA.", "image": "https://images.unsplash.com/photo-1542751371-adc38448a05e?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", "tier": "premium", "stock": 3, "featured": True, "delivery": "Manual Delivery < 1h"},
    {"title": "Fortnite OG Account - 50+ Skins", "category": "game-accounts", "price": 89.99, "original_price": 159.99,
     "description": "Rare OG Fortnite account with Renegade Raider, Black Knight and 50+ exclusive skins. Full access.", "image": "https://images.unsplash.com/photo-1600861194942-f883de0dfe96?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", "tier": "premium", "stock": 2, "featured": False, "delivery": "Manual Delivery < 1h"},
    {"title": "Steam Wallet Gift Card - $50", "category": "gift-cards", "price": 46.99,
     "description": "Digital Steam wallet code worth $50. Redeemable globally on your Steam account.", "image": "https://images.unsplash.com/photo-1614294148960-9aa740632a87?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", "tier": "standard", "stock": 200, "featured": True, "delivery": "Instant Delivery"},
    {"title": "PlayStation Plus - 12 Months", "category": "gift-cards", "price": 54.99, "original_price": 79.99,
     "description": "PS Plus Essential membership for 12 months. Online multiplayer, monthly games and cloud saves.", "image": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", "tier": "standard", "stock": 80, "featured": False, "delivery": "Instant Delivery"},
    {"title": "Cyberpunk 2077 - Steam Key", "category": "game-keys", "price": 24.99, "original_price": 59.99,
     "description": "Global Steam key for Cyberpunk 2077. Activate and download instantly.", "image": "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", "tier": "standard", "stock": 60, "featured": True, "delivery": "Instant Delivery"},
    {"title": "Elden Ring - Steam Key", "category": "game-keys", "price": 34.99, "original_price": 59.99,
     "description": "Global Steam key for Elden Ring. Includes base game, ready to activate.", "image": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", "tier": "standard", "stock": 45, "featured": False, "delivery": "Instant Delivery"},
]


async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Seeded admin user")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Updated admin password")


async def seed_products():
    count = await db.products.count_documents({})
    if count == 0:
        for p in SEED_PRODUCTS:
            p["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.products.insert_many(SEED_PRODUCTS)
        logger.info("Seeded %d products", len(SEED_PRODUCTS))


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await seed_admin()
    await seed_products()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
