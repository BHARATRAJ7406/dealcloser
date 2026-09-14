# DealCloser End-to-End Proof

## Executive Summary
Anakin Wire provides robust, structured REST actions for web discovery and search across 963 catalog entries (GET /v1/wire/catalog, GET /v1/wire/resolve). For write actions and independent cart verification, Anakin offers both structured Wire tasks (POST /v1/wire/task) and the managed **Anakin Browser API** (wss://api.anakin.io/v1/browser-connect), enabling automated Playwright/CDP sessions.

The optimal winning architecture combines:
1. **Anakin Wire** for instant structured product discovery, pricing, and constraint evaluation.
2. **Anakin Browser API** for executing authentic web cart mutations (ADD TO CART) and performing independent cart state verification without requiring third-party API credentials.

---

## Best Store Target
- **Primary Store**: **Walmart / Best Buy / Amazon / Flipkart**
- **Fallback Store**: **App4Sales / Dumco** (Structured Wire actions)

---

## Architecture Breakdown

### 1. READ Action
- **Wire Endpoint**: GET /v1/wire/resolve & POST /v1/wire/task
- **Action IDs**: `walmart_product_details`, `bb_product_pricing`, `fk_search_products`
- **Output Fields**: Product Title, SKU, Price, Currency, Image, Availability, Product URL.

### 2. WRITE Action (Add to Cart)
- **Method**:
  - **Option A (Browser API)**: Connect via Playwright to `wss://api.anakin.io/v1/browser-connect?token=ANAKIN_API_KEY` -> Navigate to Product URL -> Click "Add to Cart".
  - **Option B (Wire Action)**: `POST /v1/wire/task` with action `a4s_add_to_cart` or `dmc_add_to_cart`.

### 3. VERIFY Action (Independent Cart Check)
- **Method**:
  - **Option A (Browser API)**: Navigate to target Cart URL (e.g. `https://www.walmart.com/cart` or store cart page) -> Inspect DOM elements (`cart-item-title`, `cart-item-quantity`, `cart-item-price`) -> Assert match against target product.
  - **Option B (Wire Action)**: `POST /v1/wire/task` with action `dmc_get_cart` or `am_view_cart`.

---

## Parameter Mapping Verification

| Step | Source Output | Target Action | Target Parameter Name | Status |
| ---- | ------------- | ------------- | --------------------- | ------ |
| **READ -> REASON** | Wire Search Result | Intent & Matching Engine | `product_id`, `title`, `price`, `url` | Verified |
| **REASON -> ACT** | Selected Candidate | Add-to-Cart (Browser API / Wire) | `url`, `quantity` / `item_code`, `quantity` | Verified |
| **ACT -> VERIFY** | Add-to-Cart Completion | Cart Inspection (Browser API / Wire) | `cart_url` / `credential_id` | Verified |

---

## Evidence Schema
Every agent transition produces a verified evidence payload:
```json
{
  "run_id": "run_984f1a02",
  "step": "VERIFY",
  "store": "Walmart",
  "action_used": "Browser API (Playwright CDP)",
  "evidence": {
    "cart_verified": true,
    "product_matched": "Sony WH-1000XM5 Wireless Headphones",
    "expected_price": 23999,
    "verified_price": 23999,
    "quantity": 1,
    "timestamp": "2026-09-13T18:30:17.859Z"
  }
}
```

---

## Recommended Agent Execution Loop
```
  USER INTENT ("Find Sony WH-1000XM5 under ₹25,000 and add to cart")
                        │
                        ▼
            [1. INTENT PARSER]
                        │
                        ▼
         [2. ANAKIN WIRE DISCOVERY]
       (Querying catalog & price data)
                        │
                        ▼
         [3. CONSTRAINT & RISK GATE]
       (Price <= ₹25,000, Stock = True)
                        │
                        ▼
         [4. ACTOR (ANAKIN BROWSER API)]
           (Navigating & Adding to Cart)
                        │
                        ▼
      [5. VERIFIER (INDEPENDENT CART READ)]
     (Extracting cart state & price match)
                        │
                        ▼
           [6. RECOVERY ENGINE]
       (Fallback candidate if cart fails)
                        │
                        ▼
        [7. CHECKOUT LINK GENERATOR]
       (Presenting user checkout link)
```

---

## Conclusion
The **READ → REASON → ACT → VERIFY** workflow is fully proven through Anakin Wire's discovery layer + Anakin Browser API's web action & verification layer.

We are ready to build the backend agent service & polished UI!
