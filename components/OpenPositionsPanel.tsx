
import React from 'react';
import { DhanPosition, DhanProductType, TradingMode } from '../types';
import Card from './shared/Card';

interface OpenPositionsPanelProps {
  positions: DhanPosition[];
  onConvertPosition: (position: DhanPosition, toProductType: DhanProductType) => void;
  isLoading?: boolean;
  tradingMode: TradingMode;
}

const OpenPositionsPanel: React.FC<OpenPositionsPanelProps> = ({ positions, onConvertPosition, isLoading, tradingMode }) => {
  const title = tradingMode === 'paper' ? "My Paper Positions (Simplified)" : "Open Positions (Live)";
  
  const getPnlColor = (pnl: number | undefined) => (pnl !== undefined && pnl >= 0 ? 'text-green-400' : 'text-red-400');

  const handleConvert = (position: DhanPosition) => {
    const targetProductType: DhanProductType = position.productType === 'INTRADAY' ? 'CNC' : 'INTRADAY';
    onConvertPosition(position, targetProductType);
  };

  return (
    <Card title={title}>
      {isLoading && tradingMode === 'live' && <p className="text-gray-400">Processing conversion...</p>}
      {!isLoading && positions.length === 0 ? (
        <p className="text-gray-400">No open positions to display.</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {positions.map((pos) => (
            <div key={`${pos.securityId}${pos.productType}-${tradingMode}`} className="p-3 bg-gray-700 rounded-md shadow">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-md font-semibold text-emerald-300">{pos.tradingSymbol}</h4>
                <span className={`text-xs font-semibold ${pos.positionType === 'LONG' ? 'text-blue-400' : 'text-orange-400'}`}>
                  {pos.positionType} | {pos.exchangeSegment}
                </span>
              </div>
              <div className="text-xs text-gray-400 grid grid-cols-2 gap-x-2 gap-y-0.5">
                <span>Prod Type: <span className="text-gray-200">{pos.productType}</span></span>
                <span>Net Qty: <span className="text-gray-200">{pos.netQty}</span></span>
                
                <span>Buy Avg: <span className="text-gray-200">₹{pos.buyAvg?.toFixed(2) ?? 'N/A'}</span></span>
                <span>Cost Price: <span className="text-gray-200">₹{pos.costPrice?.toFixed(2) ?? 'N/A'}</span></span>
                <span>Buy Qty: <span className="text-gray-200">{pos.buyQty}</span></span>

                <span>Sell Avg: <span className="text-gray-200">₹{pos.sellAvg?.toFixed(2) ?? 'N/A'}</span></span>
                <span>Sell Qty: <span className="text-gray-200">{pos.sellQty}</span></span>
                
                <span className={getPnlColor(pos.unrealizedProfit)}>Unrealized P&L: ₹{pos.unrealizedProfit?.toFixed(2) ?? '0.00'}</span>
                <span>Realized P&L: ₹{pos.realizedProfit?.toFixed(2) ?? '0.00'}</span>

                <span>Day Buy Qty: <span className="text-gray-200">{pos.dayBuyQty}</span></span>
                <span>Day Buy Val: <span className="text-gray-200">₹{pos.dayBuyValue?.toFixed(2) ?? 'N/A'}</span></span>
                <span>Day Sell Qty: <span className="text-gray-200">{pos.daySellQty}</span></span>
                <span>Day Sell Val: <span className="text-gray-200">₹{pos.daySellValue?.toFixed(2) ?? 'N/A'}</span></span>
                <span>Sec ID: <span className="text-gray-200">{pos.securityId}</span></span>
              </div>
              {tradingMode === 'live' && (pos.productType === 'INTRADAY' || pos.productType === 'CNC' || pos.productType === 'MARGIN') && Math.abs(pos.netQty) > 0 && (
                <button
                  onClick={() => handleConvert(pos)}
                  disabled={isLoading}
                  className="mt-2 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-semibold py-1 px-3 rounded-md transition duration-150"
                  aria-label={`Convert ${pos.tradingSymbol} to ${pos.productType === 'INTRADAY' ? 'CNC' : 'INTRADAY'}`}
                >
                  Convert to {pos.productType === 'INTRADAY' ? 'CNC' : 'INTRADAY'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-3">
        {tradingMode === 'live' 
          ? "Open positions data reflects your current standing with the broker (Dhan)."
          : "Paper positions are simplified and derived from paper holdings."
        }
      </p>
    </Card>
  );
};

export default OpenPositionsPanel;
