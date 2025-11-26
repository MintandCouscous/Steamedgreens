import { GoogleGenAI } from "@google/genai";
import { ReportData, FinancialYearData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are a world-class Senior Financial Analyst and Forensic Auditor.
Your task is to generate a detailed due-diligence brief on a specific company.
You have access to Google Search to find real-time data from MCA filings, credit rating reports (CRISIL, ICRA, CARE), IBBI/NCLT orders, and news.

**Rules:**
1. **Be Fact-Based:** If data is not available, explicitly state "Data not publicly available". Do not hallucinate figures.
2. **Structure:** Follow the requested structure strictly.
3. **Financials:** Try to find the last 5 years of financial data.
4. **Output Format:**
   - Return the main report in clean, professional **Markdown**.
   - **CRITICAL:** At the very end of your response, strictly append a JSON block wrapped in \`\`\`json\`\`\` containing the financial data extracted (if found) for charting. The JSON structure should be an array of objects: [{ "year": "FY23", "revenue": 100.5, "ebitda": 20.1, "ebitdaMargin": 20, "pat": 5.5, "debt": 50.0, "equity": 30.0 }]. Values should be in INR Crores (indicate unit in text).
   - If exact numbers aren't found, leave the JSON array empty [].

**Prompt Structure to Follow:**
1. **About the Company**: Incorporation, CIN, Shareholding, Background.
2. **Overview of Asset(s)**: Locations, Capacities, Status.
3. **Operational & Financial Performance**: Commentary on why performance changed.
4. **Capital Structure & Lenders**: Charge data, lenders.
5. **CIRP / IBC Timeline**: If applicable, list events.
6. **Other Litigations**: Non-IBC cases.
7. **IPA / RP Disclosures**: If applicable.
8. **One-page Takeaway**: Summary bullets.
`;

export const generateReport = async (companyName: string): Promise<ReportData> => {
  try {
    const prompt = `Give me a detailed brief on "${companyName}". Use MCA filings, credit rating reports, IBBI/NCLT orders, and IPA disclosures. Cite sources where possible.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        temperature: 0.4, // Lower temperature for more factual output
      },
    });

    const fullText = response.text || "";
    
    // Extract Sources from grounding metadata
    const sources: string[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          sources.push(chunk.web.uri);
        }
      });
    }

    // Extract JSON block for financials
    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
    let financialData: FinancialYearData[] = [];
    let cleanMarkdown = fullText;

    if (jsonMatch && jsonMatch[1]) {
      try {
        financialData = JSON.parse(jsonMatch[1]);
        // Remove the JSON block from the display markdown to keep it clean
        cleanMarkdown = fullText.replace(jsonMatch[0], "").trim();
      } catch (e) {
        console.warn("Failed to parse financial JSON from LLM response", e);
      }
    }

    return {
      companyName,
      rawMarkdown: cleanMarkdown,
      financialData,
      sources: Array.from(new Set(sources)), // Deduplicate sources
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate report. Please check the API key and try again.");
  }
};