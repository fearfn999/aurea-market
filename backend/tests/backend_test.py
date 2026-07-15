"""
Backend API tests for Aurea Market.
Covers public product/order endpoints, auth login, and admin CRUD + stats.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://aurea-market-1.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@aureamarket.gg"
ADMIN_PASSWORD = "Admin@12345"


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(api_client):
    r = api_client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ----------------------------- Public: root / categories -----------------------------
class TestPublicMeta:
    def test_root(self, api_client):
        r = api_client.get(f"{API}/")
        assert r.status_code == 200
        assert "Aurea Market" in r.json().get("message", "")

    def test_categories(self, api_client):
        r = api_client.get(f"{API}/categories")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) >= 4
        slugs = [c["slug"] for c in data]
        assert "discord-nitro" in slugs
        assert "game-accounts" in slugs


# ----------------------------- Public: products -----------------------------
class TestProducts:
    def test_list_products_returns_id_not_underscore(self, api_client):
        r = api_client.get(f"{API}/products")
        assert r.status_code == 200
        products = r.json()
        assert isinstance(products, list)
        assert len(products) >= 8, f"Expected seeded 8 products, got {len(products)}"
        p = products[0]
        assert "id" in p and p["id"], "Product must have 'id' field"
        assert "_id" not in p, "Response must not include '_id'"
        assert "title" in p and "price" in p and "category" in p

    def test_get_product_by_id(self, api_client):
        products = api_client.get(f"{API}/products").json()
        pid = products[0]["id"]
        r = api_client.get(f"{API}/products/{pid}")
        assert r.status_code == 200
        assert r.json()["id"] == pid

    def test_get_product_invalid_id(self, api_client):
        r = api_client.get(f"{API}/products/invalid-id-xxx")
        assert r.status_code == 404

    def test_filter_by_category(self, api_client):
        r = api_client.get(f"{API}/products", params={"category": "discord-nitro"})
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 1
        assert all(p["category"] == "discord-nitro" for p in items)

    def test_search_products(self, api_client):
        r = api_client.get(f"{API}/products", params={"search": "Nitro"})
        assert r.status_code == 200
        items = r.json()
        assert all("nitro" in p["title"].lower() for p in items)


# ----------------------------- Public: orders -----------------------------
class TestOrders:
    def test_create_order(self, api_client):
        products = api_client.get(f"{API}/products").json()
        pid = products[0]["id"]
        payload = {
            "customer_name": "TEST_Buyer",
            "customer_email": "test_buyer@example.com",
            "contact": "discord:test#0001",
            "items": [{"product_id": pid, "title": products[0]["title"], "price": products[0]["price"], "quantity": 2}],
            "total": products[0]["price"] * 2,
            "note": "TEST order",
        }
        r = api_client.post(f"{API}/orders", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "pending"
        assert "id" in data

    def test_create_order_bad_email(self, api_client):
        r = api_client.post(f"{API}/orders", json={
            "customer_name": "x", "customer_email": "not-an-email",
            "contact": "c", "items": [], "total": 0
        })
        assert r.status_code == 422


# ----------------------------- Auth -----------------------------
class TestAuth:
    def test_login_success(self, api_client):
        r = api_client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data and isinstance(data["access_token"], str)
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"

    def test_login_wrong_password(self, api_client):
        r = api_client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_login_unknown_user(self, api_client):
        r = api_client.post(f"{API}/auth/login", json={"email": "nope@aureamarket.gg", "password": "x"})
        assert r.status_code == 401

    def test_me_with_token(self, api_client, admin_headers):
        r = api_client.get(f"{API}/auth/me", headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_me_without_token(self, api_client):
        r = api_client.get(f"{API}/auth/me")
        assert r.status_code == 401


# ----------------------------- Admin: products CRUD + stats + orders -----------------------------
class TestAdmin:
    def test_admin_endpoints_require_auth(self, api_client):
        assert api_client.get(f"{API}/admin/orders").status_code == 401
        assert api_client.get(f"{API}/admin/stats").status_code == 401
        assert api_client.post(f"{API}/admin/products", json={}).status_code == 401

    def test_admin_endpoints_reject_bad_token(self, api_client):
        r = api_client.get(f"{API}/admin/stats", headers={"Authorization": "Bearer invalid.jwt.token"})
        assert r.status_code == 401

    def test_product_crud(self, api_client, admin_headers):
        payload = {
            "title": "TEST_Product",
            "category": "game-keys",
            "price": 9.99,
            "original_price": 19.99,
            "description": "TEST description",
            "image": "https://example.com/img.png",
            "tier": "standard",
            "stock": 5,
            "featured": False,
            "delivery": "Instant Delivery",
        }
        # CREATE
        r = api_client.post(f"{API}/admin/products", headers=admin_headers, json=payload)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["id"] and created["title"] == "TEST_Product"
        pid = created["id"]

        # GET (verify persistence)
        r = api_client.get(f"{API}/products/{pid}")
        assert r.status_code == 200
        assert r.json()["title"] == "TEST_Product"

        # UPDATE
        payload["title"] = "TEST_Product_Updated"
        payload["price"] = 14.99
        r = api_client.put(f"{API}/admin/products/{pid}", headers=admin_headers, json=payload)
        assert r.status_code == 200
        assert r.json()["title"] == "TEST_Product_Updated"
        assert r.json()["price"] == 14.99

        # GET verify update
        r = api_client.get(f"{API}/products/{pid}")
        assert r.json()["title"] == "TEST_Product_Updated"

        # DELETE
        r = api_client.delete(f"{API}/admin/products/{pid}", headers=admin_headers)
        assert r.status_code == 200

        # GET returns 404
        r = api_client.get(f"{API}/products/{pid}")
        assert r.status_code == 404

    def test_admin_orders(self, api_client, admin_headers):
        r = api_client.get(f"{API}/admin/orders", headers=admin_headers)
        assert r.status_code == 200
        orders = r.json()
        assert isinstance(orders, list)
        if orders:
            assert "id" in orders[0]
            assert "_id" not in orders[0]

    def test_admin_stats(self, api_client, admin_headers):
        r = api_client.get(f"{API}/admin/stats", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        for key in ("products", "orders", "pending", "revenue"):
            assert key in data
        assert data["products"] >= 8


# ----------------------------- Stripe checkout -----------------------------
class TestStripeCheckout:
    """Verifies Stripe integration: server-side pricing, txn record, idempotency guard, status polling."""

    def _get_products_by_title(self, api_client, substr):
        products = api_client.get(f"{API}/products").json()
        for p in products:
            if substr.lower() in p["title"].lower():
                return p
        return None

    def test_checkout_session_creates_stripe_url_and_uses_server_pricing(self, api_client):
        # Get Elden Ring product ($34.99 expected -> 3499 cents)
        elden = self._get_products_by_title(api_client, "Elden Ring")
        assert elden is not None, "Elden Ring seed product not found"
        assert elden["price"] == 34.99

        payload = {
            "items": [{"product_id": elden["id"], "quantity": 1}],
            "customer_name": "TEST_StripeBuyer",
            "customer_email": "test_stripe@example.com",
            "contact": "discord:test#0001",
            "note": "TEST stripe order",
            "origin_url": BASE_URL,
        }
        r = api_client.post(f"{API}/checkout/session", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and "session_id" in data
        assert data["url"].startswith("https://checkout.stripe.com"), f"Not a stripe url: {data['url']}"
        # Save for later tests
        TestStripeCheckout.session_id = data["session_id"]
        TestStripeCheckout.expected_amount_cents = 3499  # 34.99 * 100

    def test_checkout_status_matches_server_computed_amount(self, api_client):
        assert hasattr(TestStripeCheckout, "session_id"), "Prior test must have created a session"
        sid = TestStripeCheckout.session_id
        r = api_client.get(f"{API}/checkout/status/{sid}")
        assert r.status_code == 200, r.text
        data = r.json()
        # Before payment: status open, payment_status unpaid
        assert data["status"] == "open", f"Expected 'open', got {data['status']}"
        assert data["payment_status"] == "unpaid", f"Expected 'unpaid', got {data['payment_status']}"
        # Amount total in cents must match server-computed total
        assert data["amount_total"] == TestStripeCheckout.expected_amount_cents, \
            f"Amount mismatch: expected {TestStripeCheckout.expected_amount_cents} cents, got {data['amount_total']}"
        assert data["currency"].lower() == "usd"

    def test_checkout_ignores_client_supplied_price(self, api_client):
        """Client tries to send extra fields like price=0.01 – server should still charge DB price."""
        elden = self._get_products_by_title(api_client, "Elden Ring")
        # Client sends only product_id + quantity (fields defined by CheckoutItem) – extra 'price' will be ignored.
        payload = {
            "items": [{"product_id": elden["id"], "quantity": 2, "price": 0.01}],
            "customer_name": "TEST_Server_Pricing",
            "customer_email": "test_srv_price@example.com",
            "contact": "discord:test#0002",
            "origin_url": BASE_URL,
        }
        r = api_client.post(f"{API}/checkout/session", json=payload)
        assert r.status_code == 200, r.text
        sid = r.json()["session_id"]
        # Verify server-side: 2 * 34.99 = 69.98 => 6998 cents
        r = api_client.get(f"{API}/checkout/status/{sid}")
        assert r.status_code == 200
        assert r.json()["amount_total"] == 6998, f"Server-side pricing failed: {r.json()}"

    def test_payment_transaction_created_with_initiated_status(self, api_client):
        """Verify via GET /checkout/status that the txn exists and is 'initiated' / 'unpaid' before any interaction.
        The status endpoint also proves the txn was persisted (404 if missing)."""
        elden = self._get_products_by_title(api_client, "Elden Ring")
        payload = {
            "items": [{"product_id": elden["id"], "quantity": 1}],
            "customer_name": "TEST_TxnCheck",
            "customer_email": "test_txn@example.com",
            "contact": "discord:test#0003",
            "origin_url": BASE_URL,
        }
        r = api_client.post(f"{API}/checkout/session", json=payload)
        assert r.status_code == 200
        sid = r.json()["session_id"]
        # GET status – if txn not stored, we'd get 404
        r2 = api_client.get(f"{API}/checkout/status/{sid}")
        assert r2.status_code == 200
        assert r2.json()["payment_status"] == "unpaid"

    def test_checkout_status_not_found(self, api_client):
        r = api_client.get(f"{API}/checkout/status/cs_test_fake_nonexistent_session_id_12345")
        assert r.status_code == 404

    def test_checkout_empty_cart_returns_400(self, api_client):
        payload = {
            "items": [],
            "customer_name": "TEST_Empty",
            "customer_email": "test_empty@example.com",
            "contact": "discord:test#0004",
            "origin_url": BASE_URL,
        }
        r = api_client.post(f"{API}/checkout/session", json=payload)
        assert r.status_code == 400

    def test_checkout_invalid_product_ids_returns_400(self, api_client):
        payload = {
            "items": [
                {"product_id": "notavalidid", "quantity": 1},
                {"product_id": "507f1f77bcf86cd799439011", "quantity": 1},  # valid ObjectId but non-existent
            ],
            "customer_name": "TEST_InvalidIds",
            "customer_email": "test_invalid@example.com",
            "contact": "discord:test#0005",
            "origin_url": BASE_URL,
        }
        r = api_client.post(f"{API}/checkout/session", json=payload)
        assert r.status_code == 400

    def test_checkout_multiple_items_pricing(self, api_client):
        """Multi-item cart: verify total is sum of DB prices * quantities."""
        products = api_client.get(f"{API}/products").json()
        # Pick two products
        p1, p2 = products[0], products[1]
        expected_cents = int(round((p1["price"] * 2 + p2["price"] * 1) * 100))
        payload = {
            "items": [
                {"product_id": p1["id"], "quantity": 2},
                {"product_id": p2["id"], "quantity": 1},
            ],
            "customer_name": "TEST_MultiItem",
            "customer_email": "test_multi@example.com",
            "contact": "discord:test#0006",
            "origin_url": BASE_URL,
        }
        r = api_client.post(f"{API}/checkout/session", json=payload)
        assert r.status_code == 200, r.text
        sid = r.json()["session_id"]
        r = api_client.get(f"{API}/checkout/status/{sid}")
        assert r.status_code == 200
        assert r.json()["amount_total"] == expected_cents, \
            f"Multi-item total mismatch: expected {expected_cents}, got {r.json()['amount_total']}"

    def test_no_order_created_while_unpaid(self, api_client, admin_headers):
        """Idempotency guard: no order should exist for a session whose payment_status is still 'unpaid'."""
        elden = self._get_products_by_title(api_client, "Elden Ring")
        payload = {
            "items": [{"product_id": elden["id"], "quantity": 1}],
            "customer_name": "TEST_NoOrderYet",
            "customer_email": "test_no_order@example.com",
            "contact": "discord:test#0007",
            "origin_url": BASE_URL,
        }
        r = api_client.post(f"{API}/checkout/session", json=payload)
        assert r.status_code == 200
        sid = r.json()["session_id"]
        # Poll status multiple times (simulating _fulfill_order idempotency path)
        for _ in range(3):
            r = api_client.get(f"{API}/checkout/status/{sid}")
            assert r.status_code == 200
            assert r.json()["payment_status"] == "unpaid"
        # Now inspect admin/orders – no order should reference this session_id
        r = api_client.get(f"{API}/admin/orders", headers=admin_headers)
        assert r.status_code == 200
        orders = r.json()
        matching = [o for o in orders if o.get("session_id") == sid]
        assert len(matching) == 0, f"Order was created for unpaid session {sid}!"


# ----------------------------- Multi-vendor: sellers -----------------------------
import uuid as _uuid

APPROVED_SELLER_EMAIL = "seller1@test.com"
APPROVED_SELLER_PASSWORD = "Seller@123"


@pytest.fixture(scope="session")
def approved_seller_token(api_client):
    r = api_client.post(f"{API}/auth/login", json={"email": APPROVED_SELLER_EMAIL, "password": APPROVED_SELLER_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Approved seller login failed: {r.status_code} {r.text}")
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def approved_seller_headers(approved_seller_token):
    return {"Authorization": f"Bearer {approved_seller_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def approved_seller_user(api_client, approved_seller_token):
    r = api_client.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {approved_seller_token}"})
    assert r.status_code == 200
    return r.json()


class TestSellerAuth:
    def test_login_approved_seller_returns_role_status_store(self, api_client):
        r = api_client.post(f"{API}/auth/login", json={"email": APPROVED_SELLER_EMAIL, "password": APPROVED_SELLER_PASSWORD})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data
        u = data["user"]
        assert u["role"] == "seller"
        assert u["status"] == "approved"
        assert u["store_name"] == "Jay Gaming"

    def test_register_new_seller_pending_and_pending_cannot_create(self, api_client):
        unique = _uuid.uuid4().hex[:10]
        email = f"TEST_pending_{unique}@example.com"
        payload = {"name": "TEST Pending", "email": email, "password": "Passw0rd!", "store_name": f"TEST Store {unique}"}
        r = api_client.post(f"{API}/auth/register", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data
        u = data["user"]
        assert u["role"] == "seller"
        assert u["status"] == "pending"
        assert u["store_name"] == payload["store_name"]

        # Pending seller cannot create products
        token = data["access_token"]
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        product_payload = {
            "title": "TEST_Pending_Should_Fail", "category": "game-keys", "price": 5.0,
            "description": "d", "image": "https://example.com/i.png", "stock": 1,
        }
        r2 = api_client.post(f"{API}/seller/products", headers=headers, json=product_payload)
        assert r2.status_code == 403, f"Pending seller was allowed to create: {r2.status_code} {r2.text}"
        # Save for later admin-approve test
        TestSellerAuth.pending_email = email
        TestSellerAuth.pending_token = token

    def test_duplicate_email_returns_400(self, api_client):
        # Try registering with the already-approved seller email
        r = api_client.post(f"{API}/auth/register", json={
            "name": "Duplicate", "email": APPROVED_SELLER_EMAIL, "password": "x", "store_name": "dup"
        })
        assert r.status_code == 400


class TestAdminSellerManagement:
    def test_admin_stats_include_sellers(self, api_client, admin_headers):
        r = api_client.get(f"{API}/admin/stats", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert "sellers" in data
        assert "pending_sellers" in data
        assert isinstance(data["sellers"], int) and data["sellers"] >= 1
        assert isinstance(data["pending_sellers"], int)

    def test_admin_lists_sellers(self, api_client, admin_headers):
        r = api_client.get(f"{API}/admin/sellers", headers=admin_headers)
        assert r.status_code == 200
        sellers = r.json()
        assert isinstance(sellers, list) and len(sellers) >= 1
        emails = [s["email"] for s in sellers]
        assert APPROVED_SELLER_EMAIL in emails
        one = next(s for s in sellers if s["email"] == APPROVED_SELLER_EMAIL)
        for k in ("id", "name", "email", "store_name", "status", "products"):
            assert k in one, f"Missing key {k} in seller entry"
        assert "_id" not in one
        assert one["status"] == "approved"

    def test_admin_sellers_requires_auth(self, api_client):
        r = api_client.get(f"{API}/admin/sellers")
        assert r.status_code == 401

    def test_admin_approves_pending_seller(self, api_client, admin_headers):
        # register a fresh pending seller (emails are lowercased server-side)
        unique = _uuid.uuid4().hex[:10]
        email = f"test_approve_{unique}@example.com"
        password = "Passw0rd!"
        reg = api_client.post(f"{API}/auth/register", json={
            "name": "TEST Approve", "email": email, "password": password, "store_name": f"TEST Approve {unique}"
        })
        assert reg.status_code == 200
        # Fetch id from /admin/sellers
        sellers = api_client.get(f"{API}/admin/sellers", headers=admin_headers).json()
        pending = next((s for s in sellers if s["email"] == email), None)
        assert pending is not None and pending["status"] == "pending"
        seller_id = pending["id"]

        # Approve via query param
        r = api_client.put(f"{API}/admin/sellers/{seller_id}/status", headers=admin_headers, params={"status": "approved"})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "approved"

        # Verify seller can now create a product (via a new login)
        login = api_client.post(f"{API}/auth/login", json={"email": email, "password": password})
        assert login.status_code == 200
        u = login.json()["user"]
        assert u["status"] == "approved"

        headers = {"Authorization": f"Bearer {login.json()['access_token']}", "Content-Type": "application/json"}
        prod = api_client.post(f"{API}/seller/products", headers=headers, json={
            "title": f"TEST_approved_prod_{unique}", "category": "game-keys", "price": 3.5,
            "description": "TEST approved", "image": "https://example.com/i.png", "stock": 3,
        })
        assert prod.status_code == 200, prod.text
        p = prod.json()
        assert p["seller_name"] == f"TEST Approve {unique}"
        assert p.get("seller_id"), "seller_id should be set on created product"
        # cleanup: delete product via seller endpoint
        api_client.delete(f"{API}/seller/products/{p['id']}", headers=headers)

    def test_admin_invalid_status_returns_400(self, api_client, admin_headers):
        sellers = api_client.get(f"{API}/admin/sellers", headers=admin_headers).json()
        sid = sellers[0]["id"]
        r = api_client.put(f"{API}/admin/sellers/{sid}/status", headers=admin_headers, params={"status": "banana"})
        assert r.status_code == 400


class TestSellerProductsCRUD:
    """Approved seller can CRUD only their own products; ownership enforced."""

    def test_seller_can_create_product_with_store_name(self, api_client, approved_seller_headers):
        payload = {
            "title": "TEST_SellerProduct", "category": "game-keys", "price": 9.99,
            "original_price": 19.99, "description": "TEST seller desc",
            "image": "https://example.com/img.png", "tier": "standard", "stock": 5,
            "featured": False, "delivery": "Instant Delivery",
        }
        r = api_client.post(f"{API}/seller/products", headers=approved_seller_headers, json=payload)
        assert r.status_code == 200, r.text
        p = r.json()
        assert p["title"] == "TEST_SellerProduct"
        assert p["seller_name"] == "Jay Gaming"
        assert p.get("seller_id")
        TestSellerProductsCRUD.created_id = p["id"]

    def test_public_products_include_seller_products_and_names(self, api_client):
        r = api_client.get(f"{API}/products")
        assert r.status_code == 200
        products = r.json()
        # Our seller-created product should be in this list
        mine = next((p for p in products if p["id"] == TestSellerProductsCRUD.created_id), None)
        assert mine is not None, "Seller product not visible in public listing"
        assert mine["seller_name"] == "Jay Gaming"
        # Seed products (no seller_id) should default to Aurea Market Official
        official = [p for p in products if p.get("seller_name") == "Aurea Market Official"]
        assert len(official) >= 1, "No products attributed to Aurea Market Official"

    def test_seller_list_returns_only_own(self, api_client, approved_seller_headers):
        r = api_client.get(f"{API}/seller/products", headers=approved_seller_headers)
        assert r.status_code == 200
        products = r.json()
        assert all(p["seller_name"] == "Jay Gaming" for p in products), "Seller sees non-own products"
        ids = [p["id"] for p in products]
        assert TestSellerProductsCRUD.created_id in ids

    def test_seller_stats(self, api_client, approved_seller_headers):
        r = api_client.get(f"{API}/seller/stats", headers=approved_seller_headers)
        assert r.status_code == 200
        d = r.json()
        for k in ("products", "sales", "revenue"):
            assert k in d
        assert isinstance(d["products"], int) and d["products"] >= 1

    def test_seller_can_update_own_product(self, api_client, approved_seller_headers):
        pid = TestSellerProductsCRUD.created_id
        r = api_client.put(f"{API}/seller/products/{pid}", headers=approved_seller_headers, json={
            "title": "TEST_SellerProduct_Updated", "category": "game-keys", "price": 12.50,
            "description": "TEST updated", "image": "https://example.com/img.png",
            "tier": "standard", "stock": 3, "featured": False, "delivery": "Instant Delivery",
        })
        assert r.status_code == 200, r.text
        assert r.json()["title"] == "TEST_SellerProduct_Updated"
        assert r.json()["price"] == 12.50
        # Persistence check via public endpoint
        r2 = api_client.get(f"{API}/products/{pid}")
        assert r2.status_code == 200
        assert r2.json()["title"] == "TEST_SellerProduct_Updated"

    def test_seller_cannot_edit_official_product(self, api_client, approved_seller_headers):
        # Pick any seeded product (has no seller_id)
        all_products = api_client.get(f"{API}/products").json()
        official = next(p for p in all_products if p.get("seller_name") == "Aurea Market Official")
        r = api_client.put(f"{API}/seller/products/{official['id']}", headers=approved_seller_headers, json={
            "title": "TEST_hacked", "category": official["category"], "price": 0.01,
            "description": "x", "image": "https://example.com/x.png",
        })
        assert r.status_code == 403

    def test_seller_cannot_delete_others(self, api_client, approved_seller_headers):
        all_products = api_client.get(f"{API}/products").json()
        official = next(p for p in all_products if p.get("seller_name") == "Aurea Market Official")
        r = api_client.delete(f"{API}/seller/products/{official['id']}", headers=approved_seller_headers)
        assert r.status_code == 403

    def test_seller_can_delete_own(self, api_client, approved_seller_headers):
        pid = TestSellerProductsCRUD.created_id
        r = api_client.delete(f"{API}/seller/products/{pid}", headers=approved_seller_headers)
        assert r.status_code == 200
        # verify gone
        assert api_client.get(f"{API}/products/{pid}").status_code == 404


class TestAdminOfficialProduct:
    def test_admin_creates_product_tagged_official(self, api_client, admin_headers):
        payload = {
            "title": "TEST_Official_Admin", "category": "game-keys", "price": 4.99,
            "description": "TEST official", "image": "https://example.com/i.png",
            "tier": "standard", "stock": 3,
        }
        r = api_client.post(f"{API}/admin/products", headers=admin_headers, json=payload)
        assert r.status_code == 200, r.text
        p = r.json()
        assert p["seller_name"] == "Aurea Market Official"
        assert p.get("seller_id") is None
        # cleanup
        api_client.delete(f"{API}/admin/products/{p['id']}", headers=admin_headers)


class TestSellerEndpointsAuthz:
    def test_seller_endpoints_require_auth(self, api_client):
        assert api_client.get(f"{API}/seller/products").status_code == 401
        assert api_client.get(f"{API}/seller/stats").status_code == 401
        assert api_client.post(f"{API}/seller/products", json={}).status_code == 401
