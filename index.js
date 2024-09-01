const express = require('express');
const { syncDealContactOwner, syncAllDealContactOwners } = require('./api/updateOwners');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

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

app.post('/sync-deal/:dealId', async (req, res) => {
    const { dealId } = req.params;
    console.log(`Manually syncing deal ${dealId}`);
    try {
        const result = await syncDealContactOwner(dealId);
        console.log('Sync result:', JSON.stringify(result, null, 2));
        res.status(200).json(result);
    } catch (error) {
        console.error('Error syncing deal:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});