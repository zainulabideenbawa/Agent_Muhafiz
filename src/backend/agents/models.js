import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleAuth } from "google-auth-library";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let saToken = null;
let saTokenExpiry = 0;
const saPath = path.resolve("./xenon-lyceum-495513-e6-708a9ff3fc14.json");
const hasServiceAccount = fs.existsSync(saPath);

// Retrieve service account token dynamically if present and valid
async function getOAuthToken() {
    if (!hasServiceAccount) return null;
    
    const now = Date.now();
    // Refresh token 5 minutes before expiry
    if (saToken && now < saTokenExpiry - 300000) {
        return saToken;
    }
    
    try {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = saPath;
        const auth = new GoogleAuth({
            scopes: ["https://www.googleapis.com/auth/generative-language"]
        });
        const client = await auth.getClient();
        const tokenResponse = await client.getAccessToken();
        saToken = tokenResponse.token;
        // Access token expiry is usually 3600 seconds (1 hour)
        saTokenExpiry = now + 3600000;
        console.log("[Models] Dynamic Service Account OAuth2 Token Refreshed.");
        return saToken;
    } catch (e) {
        console.error("[Models] Failed to get Service Account token:", e.message);
        return null;
    }
}

// Custom client instantiation that handles dynamic api key or oauth2 token
export const flashModel = {
    invoke: async (messages, options = {}) => {
        const token = await getOAuthToken();
        const config = {
            model: "gemini-2.5-flash",
            maxRetries: 0,
        };
        
        if (token) {
            // LangChain accepts token in place of apiKey if it's set in process.env or passed
            config.apiKey = token;
        } else {
            config.apiKey = process.env.GOOGLE_API_KEY;
        }
        
        const client = new ChatGoogleGenerativeAI(config);
        return client.invoke(messages, options);
    }
};

export const proModel = {
    invoke: async (messages, options = {}) => {
        const token = await getOAuthToken();
        const config = {
            model: "gemini-2.5-pro",
            maxRetries: 0,
        };
        
        if (token) {
            config.apiKey = token;
        } else {
            config.apiKey = process.env.GOOGLE_API_KEY;
        }
        
        const client = new ChatGoogleGenerativeAI(config);
        return client.invoke(messages, options);
    }
};
