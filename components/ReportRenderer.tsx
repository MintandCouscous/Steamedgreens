import React from 'react';
import { ReportData } from '../types';

interface ReportRendererProps {
  report: ReportData;
}

export const ReportRenderer: React.FC<ReportRendererProps> = ({ report }) => {
  // A simple markdown to JSX renderer
  const renderContent = (markdown: string) => {
    return markdown.split('\n').map((line, index) => {
      const key = `line-${index}`;
      
      if (line.startsWith('### ')) {
        return <h3 key={key} className="text-xl font-semibold text-gray-800 mt-6 mb-3">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={key} className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-b pb-2 border-gray-200">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={key} className="text-3xl font-bold text-primary mt-4 mb-6">{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={key} className="flex items-start mb-2 ml-4">
            <span className="mr-2 text-accent mt-1.5">•</span>
            <span className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: parseBold(line.replace(/^[-*]\s+/, '')) }} />
          </div>
        );
      }
      if (line.startsWith('|')) {
        // Basic rendering for tables to preserve structure in a scrollable div
        return (
            <div key={key} className="overflow-x-auto my-4">
                <pre className="text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded whitespace-pre">{line}</pre>
            </div>
        )
      }
      
      if (line.trim() === '') return <div key={key} className="h-2"></div>;

      return <p key={key} className="text-gray-700 mb-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: parseBold(line) }} />;
    });
  };

  const parseBold = (text: string) => {
    // Replace **text** with <strong>text</strong>
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <div className="prose max-w-none">
        {renderContent(report.rawMarkdown)}
      </div>

      {report.sources.length > 0 && (
        <div className="mt-12 pt-6 border-t border-gray-100">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Sources Detected</h4>
          <ul className="space-y-1">
            {report.sources.map((source, idx) => (
              <li key={idx} className="text-xs truncate">
                <a href={source} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  {source}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};