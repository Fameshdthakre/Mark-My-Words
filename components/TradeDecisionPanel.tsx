
import React from 'react';
import { TradeSignal, DhanStockData } from '../types'; // Updated to DhanStockData
import Card from './shared/Card';
import { BUTTON_TEXT_ACKNOWLEDGE_HOLD, BUTTON_TEXT_APPROVE_PREFIX, BUTTON_TEXT_REJECT_SIGNAL, MSG_TRADE_PANEL_REVIEW_CAREFULLY, LIVE_TRADING_MODE_LABEL, PAPER_TRADING_MODE_LABEL } from '../constants';

interface TradeDecisionPanelProps {
  signal: TradeSignal;
  stockData: DhanStockData; // To display current price context & Dhan specific IDs
  onApprove: (signal: TradeSignal) => void;
  onReject: (signal: TradeSignal) => void;
  // tradingMode prop could be added here if specific text based on mode is needed directly in this panel
}

const TradeDecisionPanel: React.FC<TradeDecisionPanelProps> = ({ signal, stockData, onApprove, onReject }) => {
  const getActionColor = (action: TradeSignal['action']) => {
    if (action === 'BUY') return 'text-green-400';
    if (action === 'SELL') return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <Card title={`AI Trade Signal: ${signal.symbol} @ ₹${stockData.currentPrice.toFixed(2)}`} className="border-2 border-emerald-500">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-2xl font-bold">
            Action: <span className={getActionColor(signal.action)}>{signal.action}</span>
          </p>
          <p className="text-sm text-gray-400">Confidence: <span className="font-semibold text-gray-200">{signal.confidence || 'N/A'}</span></p>
        </div>
        
        <p className="text-gray-300"><strong className="text-gray-400">Reasoning:</strong> {signal.reasoning}</p>

        {signal.action !== 'HOLD' && (
          <div className="grid grid-cols-2 gap-3 text-sm mt-2">
            {typeof signal.targetPrice === 'number' && (
              <p><strong className="text-gray-400">Target:</strong> ₹{signal.targetPrice.toFixed(2)}</p>
            )}
            {typeof signal.stopLossPrice === 'number' && (
              <p><strong className="text-gray-400">Stop-Loss:</strong> ₹{signal.stopLossPrice.toFixed(2)}</p>
            )}
             <p><strong className="text-gray-400">Quantity:</strong> {signal.quantity || 1}</p>
          </div>
        )}
        
        <p className="text-xs text-gray-500">
          Signal ID: {signal.id} | Timestamp: {new Date(signal.timestamp).toLocaleString()}
          {stockData.dhanSecurityId && ` | Dhan SecID: ${stockData.dhanSecurityId}`}
        </p>
      </div>

      <div className="mt-6 flex space-x-4">
        <button
          onClick={() => onApprove(signal)}
          // Cannot "approve" a HOLD action as an order, but acknowledge is fine.
          // The actual order placement for BUY/SELL happens in onApprove
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition duration-150"
          aria-label={`Approve ${signal.action} signal for ${signal.symbol}`}
        >
          {signal.action === 'HOLD' ? BUTTON_TEXT_ACKNOWLEDGE_HOLD : `${BUTTON_TEXT_APPROVE_PREFIX}${signal.action}`}
        </button>
        <button
          onClick={() => onReject(signal)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150"
          aria-label={`Reject ${signal.action} signal for ${signal.symbol}`}
        >
          {BUTTON_TEXT_REJECT_SIGNAL}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        {MSG_TRADE_PANEL_REVIEW_CAREFULLY}
        {signal.action !== 'HOLD' && ` Approving will attempt to place the order in the currently selected trading mode.`}
      </p>
    </Card>
  );
};

export default TradeDecisionPanel;
