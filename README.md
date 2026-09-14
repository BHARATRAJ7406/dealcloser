# DealCloser 🚀

> *"An autonomous AI agent that doesn't just find the deal. It closes it."*

DealCloser is an autonomous web acquisition agent built for the **Anakin Forge Hackathon 2026**.

Traditional price comparison websites stop at **READ → SHOW**. DealCloser completes the full autonomous lifecycle:

```
INTENT → DISCOVER → READ → REASON → RISK GATE → ACT → VERIFY → RECOVER → COMPLETE
```

---

## 🌟 Why DealCloser is Different
- **Real Web Action**: Executes authentic `ADD TO CART` mutations on live retail websites via **Anakin Browser API**.
- **Independent Verification**: Never trusts the add-to-cart API response. Independently navigates to and reads the cart DOM to confirm product title, price, and quantity.
- **Safety Policy**: Enforces strict financial safety boundaries. Autonomous actions cap at `ADD_TO_CART`; payments and order submissions are strictly prohibited.
- **Anakin Wire Integration**: Queries catalog metadata and searches live products across 963 catalog entries using `https://api.anakin.io/v1/wire`.

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
 [Deal Closed Checkout Link] (Direct link to verified cart)
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
- [`docs/DEMO-READY.md`](file:///c:/Users/Admin/Desktop/dealcloser/docs/DEMO-READY.md)
- [`docs/LIVE-E2E-SMOKE-TEST.md`](file:///c:/Users/Admin/Desktop/dealcloser/docs/LIVE-E2E-SMOKE-TEST.md)
- [`docs/END-TO-END-PROOF.md`](file:///c:/Users/Admin/Desktop/dealcloser/docs/END-TO-END-PROOF.md)
- [`docs/anakin-capabilities.md`](file:///c:/Users/Admin/Desktop/dealcloser/docs/anakin-capabilities.md)

---

## 🛡️ License
Built for the **Anakin Forge Hackathon 2026**. All rights reserved.
