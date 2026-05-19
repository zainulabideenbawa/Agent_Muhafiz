import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from 'dotenv';

dotenv.config();

// Sentinel, Dispatcher, Communicator, Auditor — fast, lightweight tasks
export const flashModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GOOGLE_API_KEY,
    maxRetries: 0,
});

// Bug 6 Fix: Analyst, TruthEngine, Oracle, Strategist need deeper reasoning
// Using gemini-2.5-pro for these heavy multi-step agents
export const proModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-pro",
    apiKey: process.env.GOOGLE_API_KEY,
    maxRetries: 0,
});
