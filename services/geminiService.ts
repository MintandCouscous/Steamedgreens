import { GoogleGenAI } from "@google/genai";
import { ReportData, FinancialYearData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  try {
    let prompt = `Give me a detailed brief on "${companyName}". Structure it strictly according to the sections defined in your system instructions. Use MCA filings, credit rating reports, IBBI/NCLT orders, and IPA disclosures.`;
    
    if (focusArea && focusArea.trim()) {
      prompt += `\n\n**ENHANCEMENT INSTRUCTION:** Please provide extra detail and focus specifically on: "${focusArea}". Enhance this section with deep analysis.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        temperature: 0.3, // Low temperature for high factual accuracy
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
