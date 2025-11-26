export interface FinancialYearData {
  year: string;
  revenue: number;
  ebitda: number;
  ebitdaMargin: number;
  pat: number;
  debt: number;
  equity: number;
}

export interface ReportData {
  companyName: string;
  rawMarkdown: string;
  financialData: FinancialYearData[];
  sources: string[];
}

export enum ReportStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export interface ChartDataPoint {
  name: string;
  Revenue: number;
  Debt: number;
  EBITDA: number;
}