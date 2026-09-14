import { ShoppingIntent, ShoppingIntentSchema } from '../types/agent';

export class IntentParser {
  /**
   * Parse natural language user shopping request into structured ShoppingIntent object
   */
  static parse(input: string, options: Partial<ShoppingIntent> = {}): ShoppingIntent {
    const rawInput = input.trim();

    // Price extraction regex (e.g. under ₹25,000, under 25000, below 30000, max 25k, under $19.99)
    let maxPrice = options.maxPrice ?? 25000;
    const priceMatch = rawInput.match(/(?:under|below|max|within|less than|<=|₹|\$)\s*([\d.,]+[kK]?)/i);
    if (priceMatch && priceMatch[1]) {
      let priceStr = priceMatch[1].replace(/,/g, '');
      if (priceStr.toLowerCase().endsWith('k')) {
        priceStr = (parseFloat(priceStr.slice(0, -1)) * 1000).toString();
      }
      const parsedPrice = parseFloat(priceStr);
      if (!isNaN(parsedPrice) && parsedPrice > 0) {
        maxPrice = parsedPrice;
      }
    }

    // Clean product query extraction
    let productQuery = rawInput
      .replace(/(?:find|get|buy|acquire|search for|look for)\s+/i, '')
      .replace(/(?:under|below|max|within|less than|<=|₹|\$)\s*[\d.,]+[kK]?/gi, '')
      .replace(/(?:and add (?:it )?to (?:my )?cart|add to cart)/gi, '')
      .trim();

    if (!productQuery) {
      productQuery = 'Sony WH-1000XM5';
    }

    const rawIntent: ShoppingIntent = {
      productQuery,
      maxPrice,
      currency: options.currency ?? (input.includes('$') ? 'USD' : 'INR'),
      quantity: options.quantity ?? 1,
      condition: options.condition ?? 'new',
      autoAddToCart: options.autoAddToCart ?? true,
      actionPolicy: 'add_to_cart_if_under_limit',
      preferredBrand: options.preferredBrand,
      preferredColor: options.preferredColor,
    };

    return ShoppingIntentSchema.parse(rawIntent);
  }
}
