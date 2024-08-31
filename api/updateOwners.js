const axios = require('axios');

const API_KEY = process.env.HUBSPOT_API_KEY;
const BASE_URL = 'https://api.hubapi.com';

async function makeRequest(endpoint, method = 'GET', data = null) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };
  try {
    const response = await axios({ method, url, headers, data });
    console.log(`Request to ${endpoint} successful`);
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

async function getDealById(dealId) {
  console.log(`Fetching deal with ID: ${dealId}`);
  const endpoint = `/crm/v3/objects/deals/${dealId}?properties=dealname,hubspot_owner_id,email`;
  return makeRequest(endpoint);
}

async function getContactByEmail(email) {
  console.log(`Searching for contact with email: ${email}`);
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

async function updateContactOwner(contactId, ownerId) {
  console.log(`Updating contact ${contactId} with new owner ${ownerId}`);
  const endpoint = `/crm/v3/objects/contacts/${contactId}`;
  const data = {
    properties: {
      hubspot_owner_id: ownerId
    }
  };
  await makeRequest(endpoint, 'PATCH', data);
}

async function syncDealContactOwner(dealId) {
  try {
    console.log(`Processing deal ${dealId}`);
    const deal = await getDealById(dealId);
    console.log(`Deal data:`, JSON.stringify(deal, null, 2));

    const dealEmail = deal.properties.email;
    const dealOwner = deal.properties.hubspot_owner_id;

    if (!dealEmail || !dealOwner) {
      console.log(`Skipping deal ${dealId}: Missing email (${dealEmail}) or owner (${dealOwner})`);
      return { updated: false, reason: 'Missing email or owner' };
    }

    const contact = await getContactByEmail(dealEmail);

    if (!contact) {
      console.log(`No contact found for email ${dealEmail}`);
      return { updated: false, reason: 'No contact found' };
    }

    console.log(`Contact data:`, JSON.stringify(contact, null, 2));

    const contactId = contact.id;
    const currentContactOwner = contact.properties.hubspot_owner_id;

    if (dealOwner !== currentContactOwner) {
      console.log(`Updating contact ${contactId} owner from ${currentContactOwner || 'none'} to ${dealOwner}`);
      await updateContactOwner(contactId, dealOwner);
      return { updated: true, contactId, oldOwner: currentContactOwner, newOwner: dealOwner };
    } else {
      console.log(`No owner update needed for contact ${contactId}`);
      return { updated: false, reason: 'Owner already matches' };
    }
  } catch (error) {
    console.error('Error in syncDealContactOwner:', error.message);
    throw error;
  }
}

module.exports = { syncDealContactOwner };