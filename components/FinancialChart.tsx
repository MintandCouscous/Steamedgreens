import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart
} from 'recharts';
import { FinancialYearData } from '../types';

interface FinancialChartProps {
  data: FinancialYearData[];
}

export const FinancialChart: React.FC<FinancialChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  // Reverse data if it came in descending order (Recent -> Old), we usually chart Old -> Recent (Left -> Right)
  // Assuming the LLM might give it in either order, let's sort by year if possible.
  // For now, simple reverse if needed or just trust the API.
  // Let's ensure standard display order.
  const chartData = [...data].reverse();

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Trajectory (INR Cr)</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            }}
          >
            <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" vertical={false} />
            <XAxis 
                dataKey="year" 
                tick={{fill: '#64748b', fontSize: 12}} 
                axisLine={false} 
                tickLine={false} 
            />
            <YAxis 
                yAxisId="left" 
                tick={{fill: '#64748b', fontSize: 12}} 
                axisLine={false} 
                tickLine={false}
                label={{ value: 'Revenue / Debt', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#94a3b8' } }}
            />
            <YAxis 
                yAxisId="right" 
                orientation="right" 
                tick={{fill: '#64748b', fontSize: 12}} 
                axisLine={false} 
                tickLine={false}
                label={{ value: 'EBITDA Margin %', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#94a3b8' } }}
            />
            <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
            <Bar yAxisId="left" dataKey="debt" name="Total Debt" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
            <Line yAxisId="right" type="monotone" dataKey="ebitdaMargin" name="EBITDA %" stroke="#10b981" strokeWidth={2} dot={{r: 4}} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-500 text-center mt-2">
        *Data extracted automatically. Verify with original filings.
      </p>
    </div>
  );
};