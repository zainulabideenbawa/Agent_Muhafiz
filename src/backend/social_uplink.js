import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

/**
 * MUHAFIZ-X: SOVEREIGN OSINT UPLINK
 * This script polls Apify scrapers for real-time social media activity
 * and pushes actionable signals to the Sovereign Dispatcher.
 */

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});

// Standard Polling Interval (10 Minutes)
const POLLING_INTERVAL = 10 * 60 * 1000; 

const TARGET_ACTOR_ID = process.env.APIFY_ACTOR_ID || 'apify/twitter-scraper';
const MUHAFIZ_ENDPOINT = process.env.MUHAFIZ_ENDPOINT || 'http://localhost:3001/api/incidents/trigger-crisis';

async function pollSocialIntelligence() {
    console.log(`\n[${new Date().toLocaleTimeString()}] Muhafiz-X: SCANNING DIGITAL GRID...`);

    if (!process.env.APIFY_TOKEN) {
        console.error("❌ ERROR: APIFY_TOKEN missing in .env");
        return;
    }

    try {
        // 1. Run the custom Twitter Actor
        const run = await client.actor(TARGET_ACTOR_ID).call();

        // 2. Fetch results
        const dataset = await client.dataset(run.defaultDatasetId).listItems();
        console.log(`[OSINT] Intelligence gathered: ${dataset.items.length} signals found.`);

        for (const item of dataset.items) {
            const rawText = item.full_text || item.text;
            if (!rawText) continue;

            console.log(`[Uplink] Alerting Sovereign Brain: "${rawText.slice(0, 40)}..."`);
            
            await fetch(MUHAFIZ_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    input: rawText,
                    source: 'TWITTER_OSINT' 
                })
            });
        }
    } catch (error) {
        console.error("❌ OSINT Uplink Error:", error.message);
    }
    
    console.log(`[OSINT] Sleeping for 10 minutes... Next scan at: ${new Date(Date.now() + POLLING_INTERVAL).toLocaleTimeString()}`);
}

// Start the Autonomous Loop
pollSocialIntelligence();
setInterval(pollSocialIntelligence, POLLING_INTERVAL);
