
import React from 'react';
import { StockTechnicals } from '../types';
import Card from './shared/Card';

interface TechnicalsDisplayProps {
  technicals?: StockTechnicals; // Made optional
}

const TechnicalItem: React.FC<{ label: string; value: string | number | undefined; className?: string }> = ({ label, value, className="" }) => {
  let displayValue: string;

  if (value === undefined || value === null) {
    displayValue = 'N/A';
  } else {
    const numericValue = Number(value);
    if (isFinite(numericValue)) {
      displayValue = numericValue.toFixed(2);
    } else {
      // If 'value' was a string that couldn't be converted to a finite number (e.g., "N/A", "SomeText")
      // display it as is.
      displayValue = String(value);
    }
  }

  return (
    <div className={`flex justify-between py-2 border-b border-gray-700 last:border-b-0 ${className}`}>
      <span className="text-gray-400">{label}:</span>
      <span className="font-semibold text-gray-100">{displayValue}</span>
    </div>
  );
};

const RSIIndicator: React.FC<{ value: number | undefined }> = ({ value }) => {
  if (value === undefined) return <span className="font-semibold text-gray-100">N/A</span>;
  
  let colorClass = 'text-yellow-400'; // Neutral
  let text = 'Neutral';
  if (value > 70) {
    colorClass = 'text-red-400'; // Overbought
    text = 'Overbought';
  } else if (value < 30) {
    colorClass = 'text-green-400'; // Oversold
    text = 'Oversold';
  }
  // value is confirmed to be a number here if not undefined, so value.toFixed(2) is safe.
  return <span className={`font-semibold ${colorClass}`}>{value.toFixed(2)} ({text})</span>;
};

const TechnicalsDisplay: React.FC<TechnicalsDisplayProps> = ({ technicals }) => {
  if (!technicals) {
    return <Card title="Technical Indicators"><p className="text-gray-400">Technical data not available.</p></Card>;
  }
  return (
    <Card title="Technical Indicators">
      <div className="space-y-1">
        <TechnicalItem label="50-Day SMA" value={technicals.sma50} />
        <TechnicalItem label="200-Day SMA" value={technicals.sma200} />
        <div className="flex justify-between py-2 border-b border-gray-700">
          <span className="text-gray-400">RSI (14):</span>
          <RSIIndicator value={technicals.rsi} />
        </div>
        <TechnicalItem label="MACD Line" value={technicals.macdLine} />
        <TechnicalItem label="MACD Signal" value={technicals.macdSignal} />
        <TechnicalItem label="Support Level" value={technicals.supportLevel} className="text-green-400" />
        <TechnicalItem label="Resistance Level" value={technicals.resistanceLevel} className="text-red-400" />
      </div>
    </Card>
  );
};

export default TechnicalsDisplay;
