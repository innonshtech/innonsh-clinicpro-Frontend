const GEMINI_MODELS = [
    "gemini-1.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash"
];

/**
 * Core function to call Gemini with multi-model fallback, retry backoff, and non-blocking failure handling.
 */
export const callGemini = async (prompt, retries = 2, modelIndex = 0) => {
    const rawLocalKey = typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : null;
    const cleanLocalKey = rawLocalKey && typeof rawLocalKey === 'string' ? rawLocalKey.trim() : null;
    const envKey = (process.env.NEXT_PUBLIC_GEMINI_API_KEY || '').trim();

    const apiKey = (cleanLocalKey && cleanLocalKey !== 'null' && cleanLocalKey !== 'undefined') 
        ? cleanLocalKey 
        : envKey;

    if (!apiKey) {
        throw new Error("Gemini API Key missing. Please provide a valid key in AI Settings or configure NEXT_PUBLIC_GEMINI_API_KEY. Manual documentation remains available.");
    }

    const currentModel = GEMINI_MODELS[modelIndex] || GEMINI_MODELS[0];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    try {
        const response = await fetch(url, {
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
            const code = data.error.code;
            const msg = data.error.message || '';
            const isOverloaded = code === 503 || msg.includes('overloaded') || msg.includes('Unavailable');
            const isQuota = code === 429 || msg.includes('quota') || msg.includes('exhausted') || msg.includes('Too Many Requests');
            const isAuthError = code === 400 && (msg.includes('API key') || msg.includes('not valid') || msg.includes('INVALID_ARGUMENT'));

            // If model is overloaded or quota-limited on this model and we have fallback models or retries left, retry with backoff
            if ((isOverloaded || isQuota) && retries > 0) {
                const nextModelIdx = (modelIndex + 1) % GEMINI_MODELS.length;
                console.warn(`Gemini (${currentModel}) returned ${code}. Retrying with model ${GEMINI_MODELS[nextModelIdx]}...`);
                await new Promise(r => setTimeout(r, 1200));
                return callGemini(prompt, retries - 1, nextModelIdx);
            }

            if (isQuota) {
                throw new Error("Google Gemini API quota limit reached (429 Rate Limit). You can update your Gemini key in AI Settings or continue consultation manually.");
            }
            if (isOverloaded) {
                throw new Error("Google Gemini service is temporarily overloaded by upstream traffic (503 Service Unavailable). Manual clinical notes, Draft Save, and Complete Visit remain fully functional.");
            }
            if (isAuthError) {
                throw new Error("Google Gemini API key is invalid or unauthorized. Please verify your API key in AI Settings or continue consultation manually.");
            }
            throw new Error(msg || "Gemini service returned an error. You may continue documenting manually.");
        }

        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
        clearTimeout(timeoutId);
        if (retries > 0 && (error.name === 'AbortError' || error.message.includes('fetch'))) {
            const nextModelIdx = (modelIndex + 1) % GEMINI_MODELS.length;
            console.warn(`Gemini request failed (${error.message}). Retrying... (${retries} left)`);
            await new Promise(r => setTimeout(r, 1000));
            return callGemini(prompt, retries - 1, nextModelIdx);
        }
        if (error.name === 'AbortError') {
            throw new Error("Gemini request timed out after 12 seconds. You may continue documenting manually.");
        }
        console.error("Gemini API Error:", error);
        throw error;
    }
};

/**
 * Generate a professional Clinical Summary
 */
export const generateClinicalSummary = async (symptoms, findings, diagnosis) => {
    if (!symptoms?.trim() && !findings?.trim() && !diagnosis?.trim()) {
        throw new Error("Please enter Chief Complaints, Observations, or Diagnosis before generating an AI summary.");
    }
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
