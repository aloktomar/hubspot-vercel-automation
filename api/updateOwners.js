// HubSpot API configuration
// const API_KEY = 'pat-na1-311f30aa-fe1e-4a3f-99a0-f7dd1603d535';
const axios = require('axios');

// HubSpot API configuration
const API_KEY = process.env.HUBSPOT_API_KEY;
const BASE_URL = 'https://api.hubapi.com';

// Helper function to make API requests
async function makeRequest(endpoint, method = 'GET', data = null) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };
  try {
    const response = await axios({ method, url, headers, data });
    return response.data;
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
}

// Get recent deals
async function getRecentDeals(since) {
  let deals = [];
  let after = undefined;
  while (true) {
    const endpoint = `/crm/v3/objects/deals?limit=100${after ? `&after=${after}` : ''}&properties=dealname,hubspot_owner_id,email,createdate,lastmodifieddate`;
    const response = await makeRequest(endpoint);
    const recentDeals = response.results.filter(deal => new Date(deal.properties.lastmodifieddate) > since);
    deals = deals.concat(recentDeals);
    if (!response.paging || !response.paging.next || recentDeals.length < response.results.length) {
      break;
    }
    after = response.paging.next.after;
  }
  return deals;
}

// Get contact by email
async function getContactByEmail(email) {
  const endpoint = `/crm/v3/objects/contacts/search`;
  const data = {
    filterGroups: [{
      filters: [{
        propertyName: 'email',
        operator: 'EQ',
        value: email
      }]
    }],
    properties: ['email', 'hubspot_owner_id']
  };
  const response = await makeRequest(endpoint, 'POST', data);
  return response.results[0];
}

// Update contact owner
async function updateContactOwner(contactId, ownerId) {
  const endpoint = `/crm/v3/objects/contacts/${contactId}`;
  const data = {
    properties: {
      hubspot_owner_id: ownerId
    }
  };
  await makeRequest(endpoint, 'PATCH', data);
}

// Main function to sync deal owners with contact owners
async function syncDealContactOwners(since) {
  try {
    console.log(`Fetching deals modified since ${since.toISOString()}`);
    const deals = await getRecentDeals(since);
    console.log(`Found ${deals.length} recently modified deals`);

    let updatedCount = 0;

    for (const deal of deals) {
      const dealId = deal.id;
      const dealEmail = deal.properties.email;
      const dealOwner = deal.properties.hubspot_owner_id;

      if (!dealEmail || !dealOwner) {
        console.log(`Skipping deal ${dealId}: Missing email or owner`);
        continue;
      }

      console.log(`Processing deal ${dealId} with email ${dealEmail}`);

      const contact = await getContactByEmail(dealEmail);

      if (!contact) {
        console.log(`No contact found for email ${dealEmail}`);
        continue;
      }

      const contactId = contact.id;
      const currentContactOwner = contact.properties.hubspot_owner_id;

      if (dealOwner !== currentContactOwner) {
        console.log(`Updating contact ${contactId} owner from ${currentContactOwner || 'none'} to ${dealOwner}`);
        await updateContactOwner(contactId, dealOwner);
        updatedCount++;
      } else {
        console.log(`No owner update needed for contact ${contactId}`);
      }
    }

    console.log(`Process completed. Updated ${updatedCount} contacts.`);
    return { updatedCount, dealsProcessed: deals.length };
  } catch (error) {
    console.error('Error in syncDealContactOwners:', error.message);
    throw error;
  }
}

// Vercel serverless function
module.exports = async (req, res) => {
  try {
    // Check if it's a scheduled run or manual trigger
    const isScheduled = req.headers['x-vercel-cron'] === '0 * * * *'; // Assuming hourly cron job
    const since = isScheduled
      ? new Date(Date.now() - 3600000) // 1 hour ago for scheduled runs
      : new Date(0); // Beginning of time for manual runs

    const result = await syncDealContactOwners(since);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};