# End-to-End Action Matrix

| Store | Search / Read | Detail | Price | Stock | Add to Cart | Get Cart | Same Session | Key Action IDs |
| ----- | ------------- | ------ | ----- | ----- | ----------- | -------- | ------------ | -------------- |
| **Dumco (dmc)** | NO | NO | NO | NO | YES | YES | YES (with auth/credential_id) | `dmc_add_to_cart, dmc_add_items_to_cart, dmc_get_cart` |
| **App4Sales (a4s)** | YES | YES | YES | YES | YES | NO | NO (Cart Read missing) | `a4s_search_products, a4s_add_to_cart` |
| **Flipkart (fk)** | YES | YES | YES | YES | NO | NO | NO (Wire Cart actions missing) | `fk_search_products, flipkart_get_product, act_fk_product_detail` |
| **Best Buy (bb)** | YES | YES | YES | YES | NO | NO | NO (Wire Cart actions missing) | `bb_product_pricing, bb_fulfillment, bb_product_detail` |
| **Walmart (walmart)** | YES | YES | YES | YES | NO | NO | NO (Wire Cart actions missing) | `walmart_category_listing, walmart_deals, walmart_product_details` |
| **Blue Ridge Knives (brk)** | NO | NO | NO | NO | YES | NO | NO | `brk_add_to_cart, brk_clear_cart` |
| **We Knife (wk)** | NO | NO | NO | NO | YES | NO | NO | `wk_add_items_to_cart` |
| **Vijay Sales (vs)** | NO | NO | NO | NO | YES | NO | NO | `vs_add_to_cart` |
| **Amazon (am)** | YES (via camelcamelcamel / amazon-br) | YES | YES | NO | NO | YES | NO (Add Cart missing on Wire) | `am_view_cart, act_camelcamelcamel_product_price_history_detail` |
