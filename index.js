const express = require('express');
const { syncDealContactOwner, syncAllDealContactOwners, syncChangedDeals } = require('./api/updateOwners');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// ... (keep existing endpoints)

// Add a new endpoint to manually trigger the check for changed deals
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

// Set up periodic polling
const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
setInterval(async () => {
    console.log('Running scheduled check for deal changes');
    try {
        await syncChangedDeals();
    } catch (error) {
        console.error('Error in scheduled deal change check:', error);
    }
}, POLLING_INTERVAL);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});