const axios = require('axios');
const API_KEY = process.env.HUBSPOT_API_KEY;
const BASE_URL = 'https://api.hubapi.com';

// ... (keep existing functions: makeRequest, getDealById, getContactByEmail, updateContactOwner, syncDealContactOwner)

async function getAllDeals(limit = 100, after = undefined) {
  console.log(`Fetching deals, limit: ${limit}, after: ${after}`);
  const endpoint = `/crm/v3/objects/deals?limit=${limit}${after ? `&after=${after}` : ''}&properties=dealname,hubspot_owner_id,email`;
  return makeRequest(endpoint);
}

let lastCheckedDeals = new Map();

async function checkForDealOwnerChanges() {
  console.log("Checking for deal owner changes...");
  let hasMore = true;
  let after = undefined;
  let changedDeals = [];

  while (hasMore) {
    const dealsResponse = await getAllDeals(100, after);
    const deals = dealsResponse.results;

    for (const deal of deals) {
      const dealId = deal.id;
      const currentOwner = deal.properties.hubspot_owner_id;
      const lastKnownOwner = lastCheckedDeals.get(dealId);

      if (lastKnownOwner && lastKnownOwner !== currentOwner) {
        console.log(`Deal ${dealId} owner changed from ${lastKnownOwner} to ${currentOwner}`);
        changedDeals.push(dealId);
      }

      lastCheckedDeals.set(dealId, currentOwner);
    }

    hasMore = dealsResponse.paging?.next?.after !== undefined;
    after = dealsResponse.paging?.next?.after;
  }

  return changedDeals;
}

async function syncChangedDeals() {
  const changedDeals = await checkForDealOwnerChanges();
  console.log(`Found ${changedDeals.length} deals with changed owners`);

  for (const dealId of changedDeals) {
    try {
      const result = await syncDealContactOwner(dealId);
      console.log(`Synced deal ${dealId}:`, result);
    } catch (error) {
      console.error(`Error syncing deal ${dealId}:`, error);
    }
  }
}

module.exports = { syncDealContactOwner, syncAllDealContactOwners, syncChangedDeals };