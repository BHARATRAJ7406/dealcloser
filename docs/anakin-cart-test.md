# Anakin Wire CART / Add-to-Cart Test Results

## Cart Capability Analysis
- **Discovered Cart Actions**:
  - `brk_add_to_cart` (Catalog: `blueridgeknives`)
  - `dmc_add_to_cart` (Catalog: `dumco`)
  - `wk_add_items_to_cart` (Catalog: `weknife`)
  - `a4s_add_to_cart` (Catalog: `app4sales`)

## Safety & Action Policy Evaluation
- **Safety Policy**: Maximum autonomous action allowed is **ADD TO CART**. Payment, checkout submission, or financial transaction is strictly prohibited.
- **Authentication Requirement**: Wholesale/retail cart actions (`dmc_add_to_cart`, `brk_add_to_cart`) require explicit authenticated identity credentials (`credential_id`).
- **Browser API Fallback (Capability E)**: When structured Wire cart actions are restricted or require session cookies, DealCloser uses the managed Browser API (`wss://api.anakin.io/v1/browser-connect`) via Playwright/CDP to execute dynamic cart mutations on target retail sites and verify cart contents independently.

## Test Summary
- **Status**: Documented requirement for authentication identity & Browser API fallback.
