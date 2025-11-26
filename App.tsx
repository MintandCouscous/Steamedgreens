import React, { useState, useEffect } from 'react';
import { generateReport } from './services/geminiService';
import { downloadWordDocument } from './utils/docGenerator';
import { ReportRenderer } from './components/ReportRenderer';
import { FinancialChart } from './components/FinancialChart';
import { ReportData, ReportStatus } from './types';
import { Search, FileDown, Loader2, Sparkles, AlertCircle, Settings2, CheckCircle2, Briefcase, Landmark } from 'lucide-react';

const App = () => {
  const [companyName, setCompanyName] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [status, setStatus] = useState<ReportStatus>(ReportStatus.IDLE);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [systemReady, setSystemReady] = useState(false);

  useEffect(() => {
    // Simple check to ensure component mounted
    setSystemReady(true);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    setStatus(ReportStatus.GENERATING);
    setError(null);
    setReport(null);

    try {
      // Pass the optional focus area to the service
      const data = await generateReport(companyName, focusArea);
      setReport(data);
      setStatus(ReportStatus.COMPLETE);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setStatus(ReportStatus.ERROR);
    }
  };

  const handleDownload = async () => {
    if (report) {
      await downloadWordDocument(report);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-20 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-primary text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <Landmark size={24} className="text-blue-300" />
            </div>
            <div>
                <h1 className="text-lg font-bold tracking-tight text-white leading-tight">DueDiligence<span className="text-blue-300">AI</span></h1>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Investment Banking Suite</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-xs font-medium text-gray-400 border border-white/20 px-3 py-1 rounded-full hidden sm:block">
                v2.0 Enterprise
             </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-12 flex-grow w-full">
        {/* Search Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-6">
             <Briefcase size={12} />
             <span>Information Memorandum Generator</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-primary mb-6 tracking-tight font-serif">
            Institutional Grade <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Credit Research</span>
          </h2>
          <p className="text-lg text-gray-600 mb-10 leading-relaxed">
            Generate specific deep-dive reports with Claims Analysis (IBC), Lender Consortium details, and Financial Modeling inputs.
          </p>
          
          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto space-y-3">
            <div className="relative shadow-sm">
              <input
                type="text"
                placeholder="Target Entity (e.g., Dhrovv India Limited)"
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm text-lg outline-none font-medium placeholder:text-gray-400"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={status === ReportStatus.GENERATING}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
            </div>

            {/* Optional Enhancement Input */}
            <div className="relative group">
              <input
                type="text"
                placeholder="Focus Instruction (e.g., 'Analyze contingent liabilities & related party transactions')"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm text-sm outline-none placeholder:text-gray-400"
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                disabled={status === ReportStatus.GENERATING}
              />
              <Settings2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
            </div>

            <button
              type="submit"
              disabled={!companyName.trim() || status === ReportStatus.GENERATING}
              className="w-full bg-primary hover:bg-slate-800 text-white py-4 rounded-xl font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:translate-y-[-1px]"
            >
              {status === ReportStatus.GENERATING ? <Loader2 className="animate-spin" size={20} /> : 'Generate IM Report'}
            </button>
          </form>
        </div>

        {/* Error State */}
        {status === ReportStatus.ERROR && (
          <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold">Generation Error</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State Overlay / Skeleton */}
        {status === ReportStatus.GENERATING && (
          <div className="max-w-4xl mx-auto space-y-8 animate-pulse opacity-70">
             <div className="flex gap-4 items-center justify-center py-10">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce delay-100"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce delay-200"></div>
             </div>
             <div className="text-center text-sm font-medium text-gray-500">
                Retrieving IBBI Claims Data... <br/>
                Parsing Credit Rating Rationales... <br/>
                Structuring Financial Models...
             </div>
          </div>
        )}

        {/* Results View */}
        {status === ReportStatus.COMPLETE && report && (
          <div className="animate-fade-in-up pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-200 pb-8">
              <div>
                  <h2 className="text-3xl font-bold text-gray-900 font-serif">{report.companyName}</h2>
                  <p className="text-gray-500 text-sm mt-1">Deep-Dive Credit Analysis Report</p>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg shadow-blue-600/20"
              >
                <FileDown size={18} />
                Download Confidential IM (.docx)
              </button>
            </div>

            {/* Financial Chart Section */}
            {report.financialData.length > 0 && (
              <FinancialChart data={report.financialData} />
            )}

            {/* Markdown Report Render */}
            <ReportRenderer report={report} />
          </div>
        )}
      </main>

      {/* Footer System Status */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 gap-4">
            <div>
              &copy; {new Date().getFullYear()} DueDiligence AI (Enterprise Edition). strictly Private & Confidential.
            </div>
            <div className="flex items-center gap-3">
              <span className={systemReady ? "text-green-600 flex items-center font-medium" : "text-amber-500 flex items-center"}>
                <CheckCircle2 size={12} className="inline mr-1.5" />
                {systemReady ? "Systems Operational" : "Initializing..."}
              </span>
              <span className="text-gray-200">|</span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Live Search Active
              </span>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
