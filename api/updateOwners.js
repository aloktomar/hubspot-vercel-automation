const express = require('express');
const { syncDealContactOwner, syncAllDealContactOwners, syncChangedDeals } = require('./api/updateOwners');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('HubSpot Deal-Contact Sync Service is running');
});

app.post('/webhook', async (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body, null, 2));
  try {
    const { object_id } = req.body;

    if (!object_id) {
      return res.status(400).json({ error: 'Missing deal ID' });
    }
    const result = await syncDealContactOwner(object_id);
    console.log('Sync result:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/sync-all-deals', async (req, res) => {
  console.log('Starting sync for all deals');
  try {
    const results = await syncAllDealContactOwners();
    console.log('Sync completed');
    res.status(200).json(results);
  } catch (error) {
    console.error('Error syncing all deals:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/check-deal-changes', async (req, res) => {
  console.log('Manually checking for deal changes');
  try {
    await syncChangedDeals();
    res.status(200).json({ message: 'Check completed' });
  } catch (error) {
    console.error('Error checking for deal changes:', error);
    res.status(500).json({ error: error.message });
  }
});

const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
setInterval(async () => {
  console.log('Running scheduled check for deal changes');
  try {
    await syncChangedDeals();
  } catch (error) {
    console.error('Error in scheduled deal change check:', error);
  }
}, POLLING_INTERVAL);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});