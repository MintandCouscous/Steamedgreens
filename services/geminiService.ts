import { GoogleGenAI } from "@google/genai";
import { ReportData, FinancialYearData } from "../types";

const SYSTEM_INSTRUCTION = `
You are a world-class Senior Financial Analyst, Forensic Auditor, and Insolvency Professional.
Your task is to generate a **comprehensive "Deep-Dive Due Diligence Report"** on a specific Indian company.

**Core Directives:**
1. **Sources:** You MUST use the \`googleSearch\` tool to find real-time data from **MCA filings, credit rating reports (CRISIL, ICRA, CARE, India Ratings), IBBI/NCLT orders, IPA disclosures, and reliable news outlets**.
2. **Accuracy:** Cite sources explicitly. If specific data (like a specific debt figure) is unavailable, state "Data not publicly available" rather than estimating.
3. **Format:** Use clean **Markdown**. Use Markdown Tables for all financial data, lists of lenders, and litigation timelines.

**Report Structure (Strictly Follow This):**

1. **About the Company**
   - Incorporation details (CIN, RoC, Incorporation Date).
   - Shareholding / equity partners (% stakes).
   - Brief background & promoter history.

2. **Overview of the Asset(s)**
   - Location, size/capacity, sector-specific specs (MW for power, beds for hospitals, TPA for steel, sq. ft. for real estate, etc.).
   - EPC/commissioning, PPAs/offtake agreements, licenses/approvals.
   - Current operational status (running/idle/mothballed).

3. **Operational & Financial Performance (Last 5 Years)**
   - **REQUIRED TABLE:** Columns -> Year (Recent to Old), Revenue, EBITDA, EBITDA %, PAT, Debt, Equity.
   - Commentary: Explain *why* performance collapsed or grew (sector economics, regulatory issues, debt overhang).

4. **Capital Structure & Lenders**
   - **REQUIRED TABLE (MCA Charge Data):** Lender | Amount | Date | Security/Charge Type.
   - Estimate Total Debt Outstanding.

5. **CIRP / IBC Timeline (If Applicable)**
   - **REQUIRED TABLE:** Date | Forum/Ref | Event (Admission, RP appointment, Form-G, CoC constitution, extensions, liquidation order).
   - Clarify if liquidation application has been filed (Check NCLT/IBBI).

6. **Other Litigations (Non-IBC)**
   - Investor-state, High Court, Supreme Court, sector regulators (e.g., TRAI, CERC), NGT, etc.
   - **REQUIRED TABLE:** Respondent | Year filed | Last order/status | Description.

7. **IPA / RP Disclosures**
   - Identify RP (Name, IBBI Reg No., IPA).
   - Check IIIPI / ICSI-IIP / ICMAI-IPA portals for relationship disclosures.
   - **REQUIRED TABLE:** Corporate Debtor | Disclosure type | Date/time.
   - *Draft Text:* If disclosures are missing/delayed, provide draft text to query the RP/IPA.

8. **One-page Takeaway**
   - Crisp bullets: what the company is, what went wrong, financial/operational health, CIRP progress, litigations, and risks.

**Optional Enhancements (Auto-include if relevant):**
- "Why stranded" explainer (fuel economics, regulation, market shift).

**CRITICAL OUTPUT FORMAT:**
1. Return the report in **Markdown**.
2. **AT THE VERY END**, strictly append a JSON block wrapped in \`\`\`json\`\`\` containing the financial data for charting.
   - Format: \`[{ "year": "FY24", "revenue": 100, "ebitda": 20, "ebitdaMargin": 20, "pat": 5, "debt": 50, "equity": 30 }, ...]\` (Values in INR Cr).
   - If exact numbers aren't found, leave the array empty \`[]\`.
`;

export const generateReport = async (companyName: string, focusArea?: string): Promise<ReportData> => {
  // 1. Get Key
  const apiKey = process.env.API_KEY ? process.env.API_KEY.trim() : "";
  if (!apiKey) {
    throw new Error("API Key is missing. Please check vite.config.ts.");
  }
  
  const ai = new GoogleGenAI({ apiKey: apiKey });

  // 2. Build Prompt
  let prompt = `Give me a detailed brief on "${companyName}". Structure it strictly according to the sections defined in your system instructions. Use MCA filings, credit rating reports, IBBI/NCLT orders, and IPA disclosures.`;
  if (focusArea && focusArea.trim()) {
    prompt += `\n\n**ENHANCEMENT INSTRUCTION:** Please provide extra detail and focus specifically on: "${focusArea}". Enhance this section with deep analysis.`;
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
        temperature: 0.3,
      },
    });

    return processResponse(
        response.text || "", 
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    );

  } catch (error: any) {
    console.warn("Attempt 1 failed with Search Tool. Retrying without search...", error);
    
    // ATTEMPT 2: Fallback without Search Tools (Standard Model)
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt + "\n\n(Note: Real-time search is currently unavailable. Please rely on your internal knowledge base.)",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          // Removed tools specifically to bypass permission errors
          temperature: 0.3,
        },
      });
      
      const result = processResponse(response.text || "", []);
      // Append a small note to the markdown so user knows
      result.rawMarkdown += "\n\n> *Note: This report was generated using the model's internal knowledge base as live search was unavailable.*";
      return result;

    } catch (retryError: any) {
      console.error("Gemini API Fatal Error:", retryError);
      const msg = retryError instanceof Error ? retryError.message : String(retryError);
      throw new Error(`Generation Failed: ${msg}`);
    }
  }
};