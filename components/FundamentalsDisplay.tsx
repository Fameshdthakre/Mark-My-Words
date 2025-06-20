

import React from 'react';
import { StockFundamentals } from '../types';
import Card from './shared/Card';

interface FundamentalsDisplayProps {
  fundamentals?: StockFundamentals; // Made optional
}

const FundamentalItem: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-700 last:border-b-0">
    <span className="text-gray-400">{label}:</span>
    <span className="font-semibold text-gray-100">{value !== undefined ? String(value) : 'N/A'}</span>
  </div>
);

const FundamentalsDisplay: React.FC<FundamentalsDisplayProps> = ({ fundamentals }) => {
  if (!fundamentals) {
    return <Card title="Fundamental Snapshot"><p className="text-gray-400">Fundamental data not available.</p></Card>;
  }
  return (
    <Card title="Fundamental Snapshot">
      <div className="space-y-1">
        <FundamentalItem label="Market Cap" value={fundamentals.marketCap} />
        <FundamentalItem label="P/E Ratio" value={fundamentals.peRatio} />
        <FundamentalItem label="EPS (TTM)" value={fundamentals.eps !== undefined && fundamentals.eps !== "N/A" ? `₹${fundamentals.eps}` : 'N/A'} />
        <FundamentalItem label="Dividend Yield" value={fundamentals.dividendYield !== undefined && fundamentals.dividendYield !== "N/A" ? `${fundamentals.dividendYield}%` : 'N/A'} />
        <FundamentalItem label="Book Value/Share" value={fundamentals.bookValue !== undefined && fundamentals.bookValue !== "N/A" ? `₹${fundamentals.bookValue}` : 'N/A'} />
      </div>
    </Card>
  );
};

export default FundamentalsDisplay;