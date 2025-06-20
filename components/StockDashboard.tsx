

import React from 'react';
import { DhanStockData, SwingStrategy, GeminiAnalysis, TradingMode } from '../types'; 
import PriceChart from './PriceChart';
import FundamentalsDisplay from './FundamentalsDisplay';
import TechnicalsDisplay from './TechnicalsDisplay';
// NewsFeed import removed
import StrategyInsights from './StrategyInsights'; // Added import
import Card from './shared/Card';

interface StockDashboardProps {
  stockData: DhanStockData; 
  analysis: GeminiAnalysis | null;
  strategies: SwingStrategy[];
  tradingMode: TradingMode; // Added for context
}

const StockDashboard: React.FC<StockDashboardProps> = ({ stockData, analysis, strategies, tradingMode }) => {
  const priceChangeColor = stockData.priceChange >= 0 ? 'text-green-400' : 'text-red-400';
  const priceChangeSign = stockData.priceChange >= 0 ? '+' : '';
  const modeSuffix = tradingMode === 'paper' ? "(Paper Mode Context)" : "";


  return (
    <div className="space-y-6">
      <Card title={`${stockData.name} (${stockData.symbol}) - Overview ${modeSuffix}`} className="bg-gray-800">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mb-4">
            <div>
                <p className="text-sm text-gray-400">Current Price</p>
                <p className={`text-2xl font-bold ${priceChangeColor}`}>₹{stockData.currentPrice?.toFixed(2) || 'N/A'}</p>
            </div>
            <div>
                <p className="text-sm text-gray-400">Change</p>
                <p className={`text-lg font-semibold ${priceChangeColor}`}>
                    {priceChangeSign}{stockData.priceChange?.toFixed(2) || 'N/A'} ({priceChangeSign}{stockData.priceChangePercent?.toFixed(2) || 'N/A'}%)
                </p>
            </div>
            <div>
                <p className="text-sm text-gray-400">Day Range</p>
                <p className="text-lg font-semibold text-gray-200">₹{stockData.dayLow?.toFixed(2) || 'N/A'} - ₹{stockData.dayHigh?.toFixed(2) || 'N/A'}</p>
            </div>
            <div>
                <p className="text-sm text-gray-400">Volume</p>
                <p className="text-lg font-semibold text-gray-200">{stockData.volume || 'N/A'}</p>
            </div>
        </div>
         {stockData.dhanSecurityId && (
          <p className="text-xs text-gray-500 text-center mb-2">
            Dhan Security ID: {stockData.dhanSecurityId} | Segment: {stockData.exchangeSegment}
          </p>
        )}
        {analysis && (
             <div className="mt-4 p-4 bg-gray-700 rounded-md">
                <h4 className="text-md font-semibold text-emerald-400">AI Sentiment: <span className="text-gray-100">{analysis.marketSentiment}</span></h4>
                <p className="text-sm text-gray-300 mt-1">{analysis.keyObservations}</p>
            </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PriceChart data={stockData.historicalData || []} technicals={stockData.technicals} stockName={stockData.name} />
        </div>
        <div className="space-y-6">
          {stockData.fundamentals ? (
            <FundamentalsDisplay fundamentals={stockData.fundamentals} />
          ) : (
            <Card title="Fundamental Snapshot"><p>Fundamental data not available.</p></Card>
          )}
          {stockData.technicals ? (
            <TechnicalsDisplay technicals={stockData.technicals} />
          ) : (
             <Card title="Technical Indicators"><p>Technical data not available.</p></Card>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6"> {/* Changed from md:grid-cols-2 to md:grid-cols-1 */}
        {/* NewsFeed component removed */}
        <StrategyInsights strategies={strategies} />
      </div>
    </div>
  );
};

export default StockDashboard;
