export const safeParseJson = (str, fallback = {}) => {
    try {
        if (!str) return fallback;
        
        // Find the first '{' and the last '}'
        const start = str.indexOf('{');
        const end = str.lastIndexOf('}');
        
        if (start !== -1 && end !== -1 && end >= start) {
            const jsonText = str.substring(start, end + 1);
            return JSON.parse(jsonText);
        }
        
        // Standard clean as fallback
        const cleaned = str.replace(/```json|```/g, "").trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.warn("[Safe JSON Parser] Failed to parse output. Returning safe fallback. Error:", e.message);
        return fallback;
    }
};
