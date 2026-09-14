# DealCloser 🚀

> *"An autonomous AI agent that doesn't just find the deal. It closes it."*

DealCloser is an autonomous web acquisition agent built for the **Anakin Forge Hackathon 2026**.

Traditional price comparison tools stop at **READ → SHOW**. DealCloser completes the full autonomous lifecycle:

```
INTENT → DISCOVER → READ → REASON → RISK GATE → ACT → VERIFY → RECOVER → COMPLETE
```

---

## ⚡ Powered by Anakin

Anakin is not merely a data source in DealCloser—it is the core infrastructure powering the **execution layer**:

- **Anakin Wire**: Powers live product discovery, catalog resolution, and action definitions via `https://api.anakin.io/v1/wire`.
- **Anakin Wire Jobs**: Handles asynchronous task dispatch and polling (`createTask`, `pollJob`) for live catalog querying.
- **Anakin Browser API**: Managed remote headless browser infrastructure accessed via WebSockets (`wss://api.anakin.io/v1/browser-connect`).
- **Playwright CDP Integration**: Connects directly to Anakin Browser API over Chrome DevTools Protocol (CDP) to drive authentic DOM interactions, perform live Add-to-Cart mutations, and execute independent cart DOM verification passes.

---

## 🌟 Why DealCloser is Different

- **Real Web Action**: Executes authentic `ADD_TO_CART` DOM interactions on live retail websites via Anakin Browser API CDP sessions.
- **Independent Verification**: Never relies on action return status alone. Opens an independent browser session to inspect the live cart DOM and verify product title, price, and item quantity.
- **Strict Risk Gate & Financial Boundary**:
  - `ADD_TO_CART` is the absolute maximum autonomous action permitted.
  - Payment execution is strictly **prohibited**.
  - Order submission is strictly **prohibited**.
  - Cart verification is independent of the action result.
- **Live Catalog Discovery**: Dynamically discovers and executes actions from Anakin's live catalog.

---

## 🎬 Live E2E Proof

DealCloser has been verified end-to-end on live retail web infrastructure:

```
Intent: "Find Classic Grahams and add to cart"
  │
  ▼
[1. Discovery] ──► Identified item via Anakin Wire catalog
  │
  ▼
[2. Decision] ───► Selected "Classic Grahams" at $14.99 on Partake Foods (Shopify)
  │
  ▼
[3. Risk Gate] ──► Approved ADD_TO_CART (Price $14.99 ≤ Max $20; No payment allowed)
  │
  ▼
[4. Anakin Browser] ► Connected via Playwright CDP to wss://api.anakin.io/v1/browser-connect
  │
  ▼
[5. Real ACT] ───► Clicked live button[name="add"] on Partake Foods DOM
  │
  ▼
[6. Independent Verify] ► Opened fresh CDP session to /cart and extracted live DOM elements:
                     Verified product: "Classic Grahams" in live cart DOM
  │
  ▼
[7. Verified Link] ─► Generated verified cart link for user completion
```

- **Verified Target**: Classic Grahams ($14.99)
- **Verified Retailer**: Partake Foods (Shopify platform)
- **Live E2E Status**: Real browser interaction and independent cart DOM verification; no mocked ACT/VERIFY path.

---

## 🛠️ Architecture

```
User Natural Language Intent
          │
          ▼
   [Intent Parser] (Zod schema validation)
          │
          ▼
 [Anakin Wire Discovery] (Catalog & resolve queries)
          │
          ▼
  [Decision Engine] (Hard constraints & deal scoring)
          │
          ▼
     [Risk Gate] (Safety audit & action authorization)
          │
          ▼
[Anakin Browser API (Actor)] (Playwright CDP session)
          │
          ▼
 [Verifier (Cart DOM Read)] (Independent verification pass)
          │
          ▼
 [Verified Cart Link] (Direct link to verified cart)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ / 20+
- Anakin API Key (`ANAKIN_API_KEY`)

### Installation & Local Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 Documentation

- [DEMO-READY.md](docs/DEMO-READY.md)
- [LIVE-E2E-SMOKE-TEST.md](docs/LIVE-E2E-SMOKE-TEST.md)
- [END-TO-END-PROOF.md](docs/END-TO-END-PROOF.md)
- [FINAL-LIVE-E2E-PROOF.md](docs/FINAL-LIVE-E2E-PROOF.md)
- [REAL-CART-PROOF.md](docs/REAL-CART-PROOF.md)
- [anakin-capabilities.md](docs/anakin-capabilities.md)

---

## 🛡️ License

Built for the **Anakin Forge Hackathon 2026**. All rights reserved.
