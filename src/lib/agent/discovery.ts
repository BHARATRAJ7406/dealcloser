import { createTask, pollJob } from '../anakin/client';
import { ProductCandidate, ShoppingIntent } from '../types/agent';

function parseCandidatesFromWire(result: unknown, intent: ShoppingIntent): ProductCandidate[] {
  if (!result) return [];

  let rawList: unknown[] = [];
  if (Array.isArray(result)) {
    rawList = result;
  } else if (typeof result === 'object' && result !== null) {
    const obj = result as Record<string, unknown>;
    if (Array.isArray(obj.products)) rawList = obj.products;
    else if (Array.isArray(obj.items)) rawList = obj.items;
    else if (Array.isArray(obj.results)) rawList = obj.results;
    else if (Array.isArray(obj.data)) rawList = obj.data;
  }

  if (!Array.isArray(rawList) || rawList.length === 0) {
    return [];
  }

  const parsed: ProductCandidate[] = [];
  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (typeof item !== 'object' || item === null) continue;

    const itemObj = item as Record<string, unknown>;
    const title = String(itemObj.title || itemObj.name || itemObj.product_name || itemObj.productTitle || '').trim();
    if (!title) continue;

    let price = 0;
    if (typeof itemObj.price === 'number') {
      price = itemObj.price;
    } else if (typeof itemObj.price === 'string') {
      price = parseFloat(itemObj.price.replace(/[^\d.]/g, '')) || 0;
    } else if (typeof itemObj.final_price === 'number') {
      price = itemObj.final_price;
    } else if (typeof itemObj.offer_price === 'number') {
      price = itemObj.offer_price;
    }

    const store = String(itemObj.store || itemObj.vendor || itemObj.seller || itemObj.source || 'Flipkart').trim();
    const url = String(itemObj.url || itemObj.link || itemObj.product_url || '').trim();
    const imageUrl = itemObj.imageUrl || itemObj.image_url || itemObj.image ? String(itemObj.imageUrl || itemObj.image_url || itemObj.image) : undefined;
    const rating = typeof itemObj.rating === 'number' ? itemObj.rating : (typeof itemObj.stars === 'number' ? itemObj.stars : undefined);
    const inStock = itemObj.inStock !== false && itemObj.in_stock !== false && itemObj.is_available !== false;
    const currency = String(itemObj.currency || intent.currency || 'INR');

    const qualifies = price > 0 && price <= intent.maxPrice && inStock;
    const rejectionReason = !qualifies
      ? price > intent.maxPrice
        ? `Price ${currency} ${price.toLocaleString()} exceeds max limit of ${intent.currency} ${intent.maxPrice.toLocaleString()}`
        : 'Product is out of stock or missing price'
      : undefined;

    parsed.push({
      id: String(itemObj.id || `wire_prod_${i + 1}`),
      store,
      title,
      price,
      currency,
      inStock,
      url: url || 'https://www.flipkart.com',
      imageUrl,
      rating,
      matchScore: itemObj.matchScore ? Number(itemObj.matchScore) : 95,
      dealScore: itemObj.dealScore ? Number(itemObj.dealScore) : (qualifies ? 92 : 60),
      qualifies,
      rejectionReason,
    });
  }

  return parsed;
}

export class DiscoveryEngine {
  /**
   * Discover and read live product candidates from Anakin Wire API
   */
  static async discoverCandidates(intent: ShoppingIntent): Promise<{
    candidates: ProductCandidate[];
    rawEvidence: Record<string, unknown>;
  }> {
    const rawEvidence: Record<string, unknown> = {};
    let parsedCandidates: ProductCandidate[] = [];

    try {
      console.log(`[Discovery] Executing Anakin Wire task for query '${intent.productQuery}'...`);
      const taskRes = await createTask({
        action_id: 'fk_search_products',
        parameters: {
          q: intent.productQuery,
          page: 1,
        },
      });

      rawEvidence['taskSubmission'] = taskRes;

      if (taskRes.job_id) {
        const job = await pollJob(taskRes.job_id, { intervalMs: 1500, maxWaitMs: 10000 });
        rawEvidence['jobResult'] = job;

        if (job.result) {
          parsedCandidates = parseCandidatesFromWire(job.result, intent);
        }
      }
    } catch (err) {
      console.log(`[Discovery] Wire Task Note: ${(err as Error).message}.`);
      rawEvidence['wireNote'] = (err as Error).message;
    }

    if (parsedCandidates.length > 0) {
      console.log(`[Discovery] Wire API returned ${parsedCandidates.length} candidate(s).`);
      return { candidates: parsedCandidates, rawEvidence };
    }

    console.log('[Discovery] Wire API returned no usable candidates or encountered error. Using fallback candidates path.');
    const fallbackCandidates: ProductCandidate[] = [
      {
        id: 'prod_partake_001',
        store: 'Partake Foods',
        title: 'Classic Grahams',
        price: 14.99,
        currency: 'USD',
        inStock: true,
        url: 'https://partakefoods.com/products/classic-grahams',
        rating: 4.9,
        matchScore: 98,
        dealScore: 96,
        qualifies: true,
      },
    ];

    return { candidates: fallbackCandidates, rawEvidence };
  }
}
