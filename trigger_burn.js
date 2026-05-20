import fetch from 'node-fetch';

async function test() {
    console.log("Triggering live crisis for: burn road per aag he...");
    try {
        const response = await fetch('http://127.0.0.1:3001/api/incidents/trigger-crisis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ signal: "burn road per aag he" })
        });
        const data = await response.json();
        console.log("Response from server:", data);
    } catch (e) {
        console.error("Failed to trigger incident:", e);
    }
}
test();
