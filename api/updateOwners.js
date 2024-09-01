const axios = require('axios');
const API_KEY = process.env.HUBSPOT_API_KEY;
const BASE_URL = 'https://api.hubapi.com';

async function makeRequest(endpoint, method = 'GET', data = null) {
  // ... (keep the existing makeRequest function)
}

async function getDealById(dealId) {
  // ... (keep the existing getDealById function)
}

async function getContactByEmail(email) {
  // ... (keep the existing getContactByEmail function)
}

async function updateContactOwner(contactId, ownerId) {
  // ... (keep the existing updateContactOwner function)
}

async function syncDealContactOwner(dealId) {
  // ... (keep the existing syncDealContactOwner function)
}

async function getAllDeals(limit = 100, after = undefined) {
  console.log(`Fetching deals, limit: ${limit}, after: ${after}`);
  const endpoint = `/crm/v3/objects/deals?limit=${limit}${after ? `&after=${after}` : ''}&properties=dealname,hubspot_owner_id,email`;
  return makeRequest(endpoint);
}

async function syncAllDealContactOwners() {
  let hasMore = true;
  let after = undefined;
  const results = [];

  while (hasMore) {
    const dealsResponse = await getAllDeals(100, after);
    const deals = dealsResponse.results;

    for (const deal of deals) {
      try {
        const result = await syncDealContactOwner(deal.id);
        results.push({ dealId: deal.id, ...result });
      } catch (error) {
        console.error(`Error processing deal ${deal.id}:`, error.message);
        results.push({ dealId: deal.id, error: error.message });
      }
    }

    hasMore = dealsResponse.paging?.next?.after !== undefined;
    after = dealsResponse.paging?.next?.after;
  }

  return results;
}

module.exports = { syncDealContactOwner, syncAllDealContactOwners };