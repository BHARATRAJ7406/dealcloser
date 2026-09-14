# DealCloser - Hackathon Demo Ready

## Executive Overview
**DealCloser** is an autonomous web acquisition agent designed for the **Anakin Forge Hackathon 2026**.
Unlike standard price comparison websites, DealCloser parses natural language shopping goals, discovers products via **Anakin Wire**, evaluates hard constraints and deal scores, audits safety policies, executes real cart mutations via **Anakin Browser API**, and performs independent cart verification before delivering a verified checkout URL to the user.

---

## Agent Loop Execution Pipeline
\`\`\`
INTENT ("Find Sony WH-1000XM5 under ₹25,000")
  │
  ▼
DISCOVER (Anakin Wire API fk_search_products)
  │
  ▼
READ (Extract title, price, stock, URL)
  │
  ▼
REASON (Hard Constraints: Price <= ₹25,000, Stock = True)
  │
  ▼
RISK GATE (Audit Safety: ADD_TO_CART max, No payments)
  │
  ▼
ACT (Anakin Browser API wss://api.anakin.io/v1/browser-connect)
  │
  ▼
VERIFY (Independent Cart DOM Pass)
  │
  ▼
RECOVER (Fallback store selection if verification fails)
  │
  ▼
DEAL CLOSED (Present verified cart & checkout URL)
\`\`\`

---

## Real Anakin Integrations
1. **Anakin Wire API** (`https://api.anakin.io/v1/wire`):
   - Used for instant catalog discovery (`GET /v1/wire/catalog`), action resolution (`GET /v1/wire/resolve`), and asynchronous product searching (`POST /v1/wire/task`).
2. **Anakin Managed Browser API** (`wss://api.anakin.io/v1/browser-connect`):
   - Connected via Playwright CDP over WebSocket with `X-API-Key` authentication header to perform web cart mutations and inspect DOM state independently.

---

## Safety & Action Policy
- **Maximum Autonomous Action**: `ADD_TO_CART`.
- **Payment & Checkout Submission**: Strictly prohibited. The human remains in full control of final payment and order placement.
- **Budget Protection**: Any product exceeding `maxPrice` is automatically rejected at both the Decision Engine and Risk Gate levels.

---

## Running the Application Locally
\`\`\`bash
# 1. Environment Setup (.env)
ANAKIN_API_KEY=ask_5347fe446a17cb708786bfd1b22ce6405afe3bbb354da8f6a4478f387bda1cab
ANAKIN_BASE_URL=https://api.anakin.io
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# 2. Run Development Server
npm run dev

# 3. Access in Browser
http://localhost:3000
\`\`\`
