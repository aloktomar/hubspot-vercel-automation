const axios = require('axios');

const API_KEY = process.env.HUBSPOT_API_KEY;
const BASE_URL = 'https://api.hubapi.com';

// Same helper functions as before...

// Fetch deals updated in the last 10 minutes
async function getRecentlyUpdatedDeals() {
  console.log(`Fetching recently updated deals`);
  const endpoint = `/crm/v3/objects/deals/search`;
  const data = {
    filterGroups: [{
      filters: [{
        propertyName: 'hs_lastmodifieddate',
        operator: 'GT',
        value: (new Date(Date.now() - 10 * 60 * 1000)).toISOString() // deals updated in the last 10 minutes
      }]
    }],
    properties: ['dealname', 'hubspot_owner_id', 'email']
  };
  const response = await makeRequest(endpoint, 'POST', data);
  return response.results;
}

// Sync owners for recently updated deals
async function syncRecentlyUpdatedDeals() {
  try {
    const deals = await getRecentlyUpdatedDeals();
    for (const deal of deals) {
      const dealId = deal.id;
      console.log(`Processing deal ${dealId}`);
      await syncDealContactOwner(dealId);
    }
  } catch (error) {
    console.error('Error in syncRecentlyUpdatedDeals:', error.message);
    throw error;
  }
}

// Schedule the script to run periodically
syncRecentlyUpdatedDeals();
