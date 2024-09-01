const express = require('express');
const { syncDealContactOwner, syncAllDealContactOwners } = require('./api/updateOwners');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/webhook', async (req, res) => {
    // ... (keep the existing webhook endpoint)
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

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});