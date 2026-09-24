import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatVertexAI } from "@langchain/google-vertexai";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import { updateApiHealth } from '../health_monitor.js';

dotenv.config();

const saPath = path.resolve("./xenon-lyceum-495513-e6-708a9ff3fc14.json");
const hasServiceAccount = fs.existsSync(saPath);

if (hasServiceAccount) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = saPath;
}

const FLASH_MODELS = [
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-2.5-flash"
];

const PRO_MODELS = [
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-pro",
    "gemini-pro-latest"
];

// Dual-Engine model invoker: tries Vertex AI (Service Account) first, falls back to AI Studio (API Key)
async function invokeDualEngine(models, messages, options = {}) {
    const start = Date.now();
    let lastError = null;

    // 1. Try Vertex AI (Service Account) if key file exists
    if (hasServiceAccount) {
        for (const model of models) {
            try {
                console.log(`[Models/Vertex] Attempting Service Account invoke for model: "${model}"`);
                const client = new ChatVertexAI({
                    model: model,
                    project: "xenon-lyceum-495513-e6",
                    location: "us-central1",
                    maxRetries: 0
                });
                const result = await client.invoke(messages, options);
                console.log(`[Models/Vertex] Success using Service Account model: "${model}"`);
                updateApiHealth('llm_gateway', true, Date.now() - start);
                return result;
            } catch (e) {
                console.warn(`[Models/Vertex] Service Account failed for "${model}": ${e.message}`);
                lastError = e;
            }
        }
    }

    // 2. Fall back to AI Studio (API Key)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("[Models/AIStudio] Fallback failed: GEMINI_API_KEY is not defined.");
        updateApiHealth('llm_gateway', false, Date.now() - start);
        throw lastError || new Error("No credentials available");
    }

    for (const model of models) {
        try {
            console.log(`[Models/AIStudio] Attempting API Key fallback for model: "${model}"`);
            const client = new ChatGoogleGenerativeAI({
                modelName: model,
                model: model,
                maxRetries: 0,
                apiKey: apiKey
            });
            const result = await client.invoke(messages, options);
            console.log(`[Models/AIStudio] Success using API Key model: "${model}"`);
            updateApiHealth('llm_gateway', true, Date.now() - start);
            return result;
        } catch (e) {
            console.warn(`[Models/AIStudio] API Key failed for "${model}": ${e.message}`);
            lastError = e;
        }
    }

    updateApiHealth('llm_gateway', false, Date.now() - start);
    throw lastError || new Error("All models in both Vertex and AI Studio failed");
}

export const flashModel = {
    invoke: async (messages, options = {}) => {
        return invokeDualEngine(FLASH_MODELS, messages, options);
    }
};

export const proModel = {
    invoke: async (messages, options = {}) => {
        return invokeDualEngine(PRO_MODELS, messages, options);
    }
};
