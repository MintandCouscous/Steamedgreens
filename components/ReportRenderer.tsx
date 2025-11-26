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
      
      // H3 - Subsections
      if (line.startsWith('### ')) {
        return <h3 key={key} className="text-lg font-bold text-gray-800 mt-6 mb-3 font-serif border-b border-gray-200 pb-1">{line.replace('### ', '')}</h3>;
      }
      // H2 - Major Sections
      if (line.startsWith('## ')) {
        return (
            <div key={key} className="mt-10 mb-5">
                <h2 className="text-2xl font-bold text-primary font-serif">{line.replace('## ', '')}</h2>
                <div className="h-1 w-16 bg-accent mt-2"></div>
            </div>
        );
      }
      // H1 - Title (usually handled by the report header, but just in case)
      if (line.startsWith('# ')) {
        return <h1 key={key} className="text-3xl font-bold text-gray-900 mt-4 mb-6 font-serif text-center">{line.replace('# ', '')}</h1>;
      }
      
      // List items
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={key} className="flex items-start mb-2 ml-4">
            <span className="mr-2 text-accent mt-1.5 text-xs">●</span>
            <span className="text-gray-700 leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: parseBold(line.replace(/^[-*]\s+/, '')) }} />
          </div>
        );
      }
      
      // Tables
      if (line.startsWith('|')) {
        // Render tables inside a styled container
        return (
            <div key={key} className="overflow-x-auto my-5 border border-gray-300 rounded shadow-sm">
                <div className="min-w-full inline-block align-middle">
                    <pre className="font-mono text-xs text-gray-800 bg-white p-4 leading-relaxed whitespace-pre" 
                         style={{ 
                             fontFamily: '"Menlo", "Consolas", "Monaco", monospace', 
                             borderLeft: '4px solid #2563eb' 
                         }}>
                        {line}
                    </pre>
                </div>
                <div className="bg-gray-50 px-4 py-1 border-t border-gray-200">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Table Data</span>
                </div>
            </div>
        )
      }
      
      // Empty lines
      if (line.trim() === '') return <div key={key} className="h-3"></div>;

      // Regular Paragraphs
      return <p key={key} className="text-gray-700 mb-3 leading-relaxed text-sm text-justify" dangerouslySetInnerHTML={{ __html: parseBold(line) }} />;
    });
  };

  const parseBold = (text: string) => {
    // Replace **text** with <strong>text</strong>
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
  };

  return (
    <div className="bg-white p-10 rounded-xl shadow-lg border border-gray-200 print:shadow-none print:border-none">
        {/* Report Header */}
        <div className="mb-8 border-b-2 border-primary pb-6 flex justify-between items-end">
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Confidential Information Memorandum</p>
                <h1 className="text-3xl font-bold text-gray-900 font-serif">{report.companyName}</h1>
                <p className="text-sm text-gray-500 mt-2">Generated via Investment Banking AI • {new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-right hidden sm:block">
                 <div className="bg-gray-100 px-3 py-1 rounded text-xs font-mono text-gray-600">
                    STRICTLY PRIVATE & CONFIDENTIAL
                 </div>
            </div>
        </div>

        {/* Content */}
      <div className="prose prose-sm max-w-none prose-headings:font-serif prose-p:text-gray-700 prose-li:text-gray-700">
        {renderContent(report.rawMarkdown)}
      </div>

      {/* Sources Footer */}
      {report.sources.length > 0 && (
        <div className="mt-16 pt-8 border-t border-gray-200 bg-gray-50 -mx-10 px-10 pb-6">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Analyst References & Sources</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {report.sources.map((source, idx) => (
              <a key={idx} href={source} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate flex items-center gap-2">
                 <span className="w-1 h-1 bg-blue-400 rounded-full shrink-0"></span>
                 {source}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
