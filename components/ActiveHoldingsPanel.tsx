
import React from 'react';
import { DhanHolding, TradingMode } from '../types'; 
import Card from './shared/Card';

interface ActiveHoldingsPanelProps {
  holdings: DhanHolding[];
  tradingMode: TradingMode;
}

const ActiveHoldingsPanel: React.FC<ActiveHoldingsPanelProps> = ({ holdings, tradingMode }) => {
  const title = tradingMode === 'paper' ? "My Paper Holdings" : "My Holdings (Dhan API Aligned)";
  
  const processedHoldings = holdings.map(h => {
    const ltp = typeof h.ltp === 'number' ? h.ltp : h.averageCostPrice; 
    const currentValue = h.totalQty * ltp;
    const investedValue = h.totalQty * h.averageCostPrice;
    const pnl = currentValue - investedValue;
    return {
      ...h,
      ltp, 
      currentValue,
      investedValue,
      pnl
    };
  });


  return (
    <Card title={title}>
      {processedHoldings.length === 0 ? (
        <p className="text-gray-400">No active holdings to display.</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {processedHoldings.map((holding) => (
            <div key={`${holding.securityId || holding.isin}-${tradingMode}`} className="p-3 bg-gray-700 rounded-md shadow">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-md font-semibold text-emerald-300">{holding.tradingSymbol}</h4>
                <span className={`text-sm font-medium ${holding.pnl && holding.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  P&L: ₹{holding.pnl?.toFixed(2) ?? '0.00'}
                </span>
              </div>
              <div className="text-xs text-gray-400 grid grid-cols-2 gap-x-2">
                <span>Qty: <span className="text-gray-200">{holding.totalQty} (Avl: {holding.availableQty})</span></span>
                <span>Avg Price: <span className="text-gray-200">₹{typeof holding.averageCostPrice === 'number' ? holding.averageCostPrice.toFixed(2) : 'N/A'}</span></span>
                <span>LTP: <span className="text-gray-200">₹{holding.ltp?.toFixed(2) || 'N/A'}</span></span>
                <span>Value: <span className="text-gray-200">₹{holding.currentValue?.toFixed(2) || 'N/A'}</span></span>
                <span>Exchange: <span className="text-gray-200">{holding.exchange}</span></span>
                <span>Sec ID: <span className="text-gray-200">{holding.securityId}</span></span>
                {typeof holding.mtf_qty === 'number' && holding.mtf_qty > 0 && (
                  <span>MTF Qty: <span className="text-gray-200">{holding.mtf_qty}</span></span>
                )}
                {typeof holding.mtf_t1_qty === 'number' && holding.mtf_t1_qty > 0 && (
                  <span>MTF T1 Qty: <span className="text-gray-200">{holding.mtf_t1_qty}</span></span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-3">
        {tradingMode === 'live' 
          ? "Holdings data would be fetched from your broker (Dhan) via your backend."
          : "Paper holdings are simulated locally."
        }
      </p>
    </Card>
  );
};

export default ActiveHoldingsPanel;
