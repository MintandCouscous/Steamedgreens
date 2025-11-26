import { GoogleGenAI } from "@google/genai";
import { ReportData, FinancialYearData } from "../types";

const SYSTEM_INSTRUCTION = `
You are an **Executive Director at a top-tier Investment Bank (e.g., Goldman Sachs, JP Morgan)** specializing in Distressed Assets and Special Situations in India.
Your task is to generate a **Confidential Information Memorandum (IM) Grade Report** on a specific Indian company.

**Core Directives:**
1. **Tone:** Highly professional, objective, concise, and financial-heavy. Avoid generic fluff.
2. **Sources:** Prioritize **IBBI List of Creditors, NCLT Orders, Credit Rating Rationales (CRISIL/ICRA), and Annual Reports**.
3. **Accuracy:** If data (like specific claims) is unavailable, explicitly state "Data not in public domain" instead of hallucinating.

**Report Structure (Strictly Follow This):**

1. **Executive Summary**
   - **The Opportunity:** One-paragraph deal teaser.
   - **Key Distresses:** Why is the company in trouble? (Macro/Micro factors).
   - **Current Status:** Running concern? Liquidation? Resolution Plan approved?

2. **Corporate Profile & Shareholding**
   - **Entity Details:** CIN, Incorporation Date, Registered Office.
   - **Capital Structure Table:** Authorized Share Capital, Paid-up Capital.
   - **Shareholding Pattern:** Promoters vs. Public vs. Institutional holding (% breakdown).

3. **Business & Asset Overview**
   - **Core Operations:** Manufacturing capacity, location specific specs (e.g., "1.2 MTPA Integrated Steel Plant in Odisha").
   - **Land & Facilities:** Freehold vs. Leasehold status (critical for valuation).
   - **Key Licenses:** Environmental clearances, mining leases, PPAs.

4. **Insolvency & Bankruptcy (IBC) Status & Claims Analysis**
   - **Timeline Table:** Admission Date | RP Name | CoC Constitution | Resolution Status.
   - **CLAIMS ANALYSIS TABLE (Critical):**
     | Creditor Class | Amount Claimed (INR Cr) | Amount Admitted (INR Cr) | % Vote Share in CoC |
     | :--- | :--- | :--- | :--- |
     | Financial Creditors (FC) | ... | ... | ... |
     | Operational Creditors (OC) | ... | ... | ... |
     | Workmen/Employees | ... | ... | ... |
     | **Total** | **...** | **...** | **100%** |
   - *Search specifically for "List of Creditors [Company Name]" on IBBI or the company website.*

5. **Financial Performance (5-Year Historical)**
   - **REQUIRED TABLE:** Columns -> Year (Recent -> Old), Revenue, EBITDA, EBITDA Margin (%), PAT, Net Worth, Total Debt.
   - **Ratio Analysis:** Comment on DSCR, Net Leverage, and Interest Coverage if data permits.
   - **Auditor Comments:** Mention any "Going Concern" qualifications from recent audit reports.

6. **Debt Profile & Lender Consortium**
   - **Charge Data Table:** Lender Name | Amount Secured | Charge ID | Asset Charged.
   - **Consortium Leader:** Identify the lead bank if possible.

7. **Legal & Regulatory Contingencies**
   - **Key Litigations:** Non-IBC cases (e.g., ED/CBI investigations, NGT bans, arbitration awards).
   - **Regulatory Risk:** Policy changes affecting the sector.

8. **SWOT Analysis**
   - **Strengths:** (e.g., Strategic location, backward integration).
   - **Weaknesses:** (e.g., High cost of debt, legacy technology).
   - **Opportunities:** (e.g., Sector turnaround, PLI schemes).
   - **Threats:** (e.g., Liquidation value erosion).

**CRITICAL OUTPUT FORMAT:**
1. Return the report in **Markdown**.
2. Use **Markdown Tables** for all data sets.
3. **AT THE VERY END**, strictly append a JSON block wrapped in \`\`\`json\`\`\` containing the financial data for charting.
   - Format: \`[{ "year": "FY24", "revenue": 100, "ebitda": 20, "ebitdaMargin": 20, "pat": 5, "debt": 50, "equity": 30 }, ...]\` (Values in INR Cr).
`;

export const generateReport = async (companyName: string, focusArea?: string): Promise<ReportData> => {
  // 1. Get Key
  const apiKey = process.env.API_KEY ? process.env.API_KEY.trim() : "";
  // Check for the placeholder or empty string
  if (!apiKey || apiKey === "PASTE_YOUR_NEW_KEY_HERE") {
    throw new Error("API Key is missing or invalid. Please update vite.config.ts with a valid Google Gemini API Key.");
  }
  
  const ai = new GoogleGenAI({ apiKey: apiKey });

  // 2. Build Prompt
  let prompt = `Generate an Investment Banking Grade Confidential Information Memorandum (IM) draft for "${companyName}". Strictly follow the "Executive Director" persona and structure defined in the system instructions. Focus heavily on the "Claims Analysis" and "Financial Performance" sections.`;
  
  if (focusArea && focusArea.trim()) {
    prompt += `\n\n**CLIENT SPECIFIC REQUEST:** The client is particularly interested in: "${focusArea}". Provide granular detail and forensic analysis on this specific aspect.`;
  }

  // 3. Define Helper for Response Processing
  const processResponse = (fullText: string, groundings: any[]) => {
    const sources: string[] = [];
    if (groundings) {
      groundings.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          sources.push(chunk.web.uri);
        }
      });
    }

    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
    let financialData: FinancialYearData[] = [];
    let cleanMarkdown = fullText;

    if (jsonMatch && jsonMatch[1]) {
      try {
        financialData = JSON.parse(jsonMatch[1]);
        cleanMarkdown = fullText.replace(jsonMatch[0], "").trim();
      } catch (e) {
        console.warn("Failed to parse financial JSON from LLM response", e);
      }
    }

    return {
      companyName,
      rawMarkdown: cleanMarkdown,
      financialData,
      sources: Array.from(new Set(sources)),
    };
  };

  try {
    // ATTEMPT 1: With Google Search Tools
    console.log("Attempting generation with Google Search...");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        temperature: 0.2, // Lower temperature for more factual/professional output
      },
    });

    return processResponse(
        response.text || "", 
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    );

  } catch (error: any) {
    console.warn("Attempt 1 failed. Error details:", error);

    // CRITICAL ERROR HANDLING
    const errorMsg = error.toString().toLowerCase();
    if (errorMsg.includes("leaked") || errorMsg.includes("key")) {
      throw new Error("CRITICAL: Your API Key was blocked by Google because it was posted publicly. Please generate a NEW key at aistudio.google.com and update vite.config.ts.");
    }

    // ATTEMPT 2: Fallback without Search Tools
    console.log("Retrying without Search Tool...");
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt + "\n\n(Note: Real-time search is currently unavailable. Use your internal training data to estimate financials and clearly state 'Estimates' where actuals are missing.)",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          // Removed tools to bypass potential search-specific permission issues
          temperature: 0.2,
        },
      });
      
      const result = processResponse(response.text || "", []);
      result.rawMarkdown += "\n\n---\n**Disclaimer:** *This report was generated using internal knowledge bases as live search was unavailable. Specific claim amounts and recent court dates may need manual verification.*";
      return result;

    } catch (retryError: any) {
      console.error("Gemini API Fatal Error:", retryError);
      let msg = retryError instanceof Error ? retryError.message : String(retryError);
      
      if (msg.includes("403") || msg.includes("key")) {
        msg = "Your API Key is invalid or has been blocked. Please check vite.config.ts.";
      }
      
      throw new Error(msg);
    }
  }
};
