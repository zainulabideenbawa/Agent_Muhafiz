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

const TARGET_ACTOR_ID = 'apify/twitter-scraper'; // Example Actor
const MUHAFIZ_ENDPOINT = 'http://localhost:3001/api/trigger-crisis';

async function pollSocialIntelligence() {
    console.log("-----------------------------------------");
    console.log("Muhafiz-X: OSINT Uplink Active");
    console.log(`Targeting: ${TARGET_ACTOR_ID}`);
    console.log("-----------------------------------------");

    if (!process.env.APIFY_TOKEN) {
        console.error("❌ ERROR: APIFY_TOKEN missing in .env");
        return;
    }

    // This is a loop that would run every 5 minutes in a real deployment
    // For this simulation/POC, we trigger a fetch of the last results
    try {
        // 1. Fetch latest results from the Twitter Scraper Task
        // Note: In real life, you would 'run' the actor first
        const dataset = await client.dataset('YOUR_DATASET_ID').listItems();
        
        console.log(`[OSINT] Found ${dataset.items.length} new signals from the grid.`);

        for (const item of dataset.items) {
            const rawText = item.full_text || item.text;
            
            // 2. Push to Muhafiz-X for Analysis
            console.log(`[Pushing Signal] "${rawText.slice(0, 50)}..."`);
            
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
        console.log("💡 TIP: Ensure you have a valid APIFY_TOKEN and Dataset ID.");
    }
}

// Start polling
pollSocialIntelligence();
