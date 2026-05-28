const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

/**
 * Core function to call Gemini 1.5 Flash
 */
export const callGemini = async (prompt, retries = 3) => {
    // Force latest version to break browser cache
    console.log("Gemini Engine: V2.1 Check (flash-latest)");
    
    const localKey = typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : null;
    const apiKey = (localKey && localKey !== 'null') ? localKey : process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey || apiKey === 'undefined') {
        throw new Error("Gemini API Key missing. Please set NEXT_PUBLIC_GEMINI_API_KEY or provide it via settings.");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
            },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        clearTimeout(timeoutId);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        console.log("gemini connect");
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        clearTimeout(timeoutId);
        if (retries > 0 && (error.name === 'AbortError' || error.message.includes('fetch'))) {
            console.warn(`Network hiccup. Retrying... (${retries} left)`);
            return callGemini(prompt, retries - 1);
        }
        console.error("Gemini API Error:", error);
        throw error;
    }
};

/**
 * Generate a professional Clinical Summary
 */
export const generateClinicalSummary = async (symptoms, findings, diagnosis) => {
    const prompt = `
        You are a senior medical specialist. Summarize the following consultation data into a professional, concise clinical summary paragraph for a medical report. 
        Tone: Professional, Clinical, Objective.
        
        Chief Complaints: ${symptoms}
        Objective Findings: ${findings}
        Diagnosis: ${diagnosis}
        
        Output only the summary paragraph.
    `;
    return await callGemini(prompt);
};

/**
 * Deep Clinical Reasoning for Medications and Labs
 */
export const getClinicalInsights = async (symptoms, findings, diagnosis, existingHistory = "") => {
    const prompt = `
        You are a clinical decision support AI. Based on the following patient data, suggest the top 3 most relevant medications and top 2 diagnostic tests.
        
        Symptoms: ${symptoms}
        Findings: ${findings}
        Diagnosis: ${diagnosis}
        Patient History: ${existingHistory}

        Return the response strictly as a JSON object with this format:
        {
          "medicines": [{"name": "Medicine Name", "dosage": "e.g. 1-0-1", "duration": "e.g. 5 days", "reason": "why suggested"}],
          "labs": [{"name": "Test Name", "reason": "why suggested"}]
        }
    `;
    const response = await callGemini(prompt);
    // Extract JSON from potential markdown response
    const jsonStr = response.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
};
