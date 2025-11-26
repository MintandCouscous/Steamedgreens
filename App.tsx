import React, { useState, useEffect } from 'react';
import { generateReport } from './services/geminiService';
import { downloadWordDocument } from './utils/docGenerator';
import { ReportRenderer } from './components/ReportRenderer';
import { FinancialChart } from './components/FinancialChart';
import { ReportData, ReportStatus } from './types';
import { Search, FileDown, Loader2, Sparkles, AlertCircle, Settings2, CheckCircle2 } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-white p-1.5 rounded-lg">
              <Sparkles size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-primary">DueDiligence<span className="text-accent">AI</span></h1>
          </div>
          <div className="text-xs font-medium text-gray-500 border border-gray-200 px-3 py-1 rounded-full bg-gray-50 hidden sm:block">
            Powered by Gemini 2.5 Flash
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-12 flex-grow w-full">
        {/* Search Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-4xl font-extrabold text-primary mb-4 tracking-tight">
            Deep-Dive Corporate<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Intelligence Reports</span>
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Enter a company name to generate a detailed brief covering MCA data, assets, financial matrices, IBC status, and litigations.
          </p>
          
          <form onSubmit={handleSearch} className="relative max-w-lg mx-auto space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Company Name (e.g., Dhrovv India Limited)"
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-accent focus:ring-4 focus:ring-blue-50 transition-all shadow-sm text-lg outline-none font-medium"
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
                placeholder="Optional: Enhance specific section (e.g., 'Focus on NCLT orders')"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-accent focus:ring-2 focus:ring-blue-50 transition-all shadow-sm text-sm outline-none"
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                disabled={status === ReportStatus.GENERATING}
              />
              <Settings2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent transition-colors" size={16} />
            </div>

            <button
              type="submit"
              disabled={!companyName.trim() || status === ReportStatus.GENERATING}
              className="w-full bg-primary hover:bg-slate-800 text-white py-3.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10"
            >
              {status === ReportStatus.GENERATING ? <Loader2 className="animate-spin" size={20} /> : 'Generate Deep-Dive Report'}
            </button>
          </form>
        </div>

        {/* Error State */}
        {status === ReportStatus.ERROR && (
          <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold">Analysis Failed</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State Overlay / Skeleton */}
        {status === ReportStatus.GENERATING && (
          <div className="max-w-4xl mx-auto space-y-6 animate-pulse opacity-70">
             <div className="h-8 bg-gray-200 rounded w-1/3"></div>
             <div className="h-64 bg-gray-200 rounded-xl w-full"></div>
             <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
             </div>
             <div className="text-center text-sm text-gray-500 mt-4">
                Scanning MCA filings, credit ratings, IBBI orders, and generating financial matrices... <br/>
                <span className="text-xs opacity-75">(This typically takes 30-45 seconds due to deep research)</span>
             </div>
          </div>
        )}

        {/* Results View */}
        {status === ReportStatus.COMPLETE && report && (
          <div className="animate-fade-in-up pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-gray-800">Deep Dive: {report.companyName}</h2>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-blue-600/20"
              >
                <FileDown size={18} />
                Download .DOCX
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
      <footer className="border-t border-gray-200 bg-white py-4 mt-auto">
        <div className="max-w-5xl mx-auto px-4 flex justify-between items-center text-xs text-gray-500">
            <div>
              &copy; {new Date().getFullYear()} DueDiligence AI
            </div>
            <div className="flex items-center gap-2">
              <span className={systemReady ? "text-green-600" : "text-amber-500"}>
                <CheckCircle2 size={14} className="inline mr-1" />
                {systemReady ? "System Ready" : "Initializing..."}
              </span>
              <span className="text-gray-300">|</span>
              <span>API Key: Configured</span>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;