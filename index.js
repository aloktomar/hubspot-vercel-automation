const express = require('express');
const { syncDealContactOwner } = require('./api/updateOwners');

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

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});