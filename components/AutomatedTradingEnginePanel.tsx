
import React from 'react';
import { AutomatedTradingLogEntry, TradeSignal, DhanOrderResponse } from '../types';
import Card from './shared/Card';
import { 
    AUTO_ENGINE_TITLE,
    AUTO_ENGINE_START_BUTTON,
    AUTO_ENGINE_STOP_BUTTON,
    AUTO_ENGINE_LOG_TITLE,
    AUTO_ENGINE_SHORTLIST_TITLE,
    AUTO_ENGINE_STATUS_IDLE,
    AUTO_ENGINE_STATUS_RUNNING,
    AUTO_ENGINE_STATUS_STOPPED
} from '../constants';

interface AutomatedTradingEnginePanelProps {
  onStartEngine: () => void;
  onStopEngine: () => void;
  logs: AutomatedTradingLogEntry[];
  isActive: boolean;
  isLoadingInitially: boolean; // To disable start button if initial app data is loading
  shortlistedTrades: TradeSignal[]; // To display trades acted upon by the engine
}

const AutomatedTradingEnginePanel: React.FC<AutomatedTradingEnginePanelProps> = ({ 
    onStartEngine, 
    onStopEngine, 
    logs, 
    isActive, 
    isLoadingInitially,
    shortlistedTrades 
}) => {

  const getLogEntryColor = (type: AutomatedTradingLogEntry['type']) => {
    switch (type) {
      case 'success':
      case 'trade_placed':
      case 'ai_decision': // Assuming positive decisions
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'info':
      default:
        return 'text-gray-300';
    }
  };

  return (
    <Card title={AUTO_ENGINE_TITLE} className="border-2 border-blue-500">
      <div className="mb-4">
        <button
          onClick={isActive ? onStopEngine : onStartEngine}
          disabled={isLoadingInitially || (isActive && logs.length > 0 && logs[logs.length -1].message.includes('Processing stock'))} // Disable stop if actively processing a stock, disable start if initial data loading
          className={`w-full px-4 py-2 font-semibold rounded-md transition duration-150
            ${isActive 
              ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400' 
              : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400'}
            text-white`}
        >
          {isActive ? AUTO_ENGINE_STOP_BUTTON : AUTO_ENGINE_START_BUTTON}
        </button>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Status: {isActive ? AUTO_ENGINE_STATUS_RUNNING : (logs.length === 0 ? AUTO_ENGINE_STATUS_IDLE : AUTO_ENGINE_STATUS_STOPPED)}
        </p>
      </div>

      {shortlistedTrades.length > 0 && (
         <div className="mb-4">
            <h4 className="text-sm font-semibold text-blue-300 mb-1">{AUTO_ENGINE_SHORTLIST_TITLE} ({shortlistedTrades.length})</h4>
            <div className="text-xs bg-gray-700 p-2 rounded max-h-32 overflow-y-auto">
                {shortlistedTrades.map(trade => (
                    <p key={trade.id} className="mb-0.5">
                        <span className="font-medium text-yellow-400">{trade.symbol}</span>: {trade.action} Qty: {trade.quantity} ({trade.reasoning.substring(0,50)}...)
                    </p>
                ))}
            </div>
        </div>
      )}


      <div>
        <h4 className="text-sm font-semibold text-gray-300 mb-2">{AUTO_ENGINE_LOG_TITLE}</h4>
        <div className="bg-gray-800 p-3 rounded-md max-h-60 overflow-y-auto text-xs space-y-1 border border-gray-700">
          {logs.length === 0 && <p className="text-gray-500">Engine log is empty.</p>}
          {logs.map((log) => (
            <div key={log.id} className={`p-1 rounded ${getLogEntryColor(log.type)}`}>
              <span className="font-mono text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.message}
              {log.type === 'error' && log.details && typeof log.details === 'string' && (
                <span className="block pl-4 text-red-500 text-[10px]">Details: {log.details}</span>
              )}
              {log.type === 'ai_decision' && log.details && typeof log.details !== 'string' && 'action' in log.details && (
                 <span className="block pl-4 text-sky-400 text-[10px]">
                    AI Signal: {log.details.symbol} - {log.details.action}, Qty: {log.details.quantity}, Conf: {log.details.confidence} | Reason: {log.details.reasoning.substring(0,60)}...
                 </span>
              )}
               {log.type === 'trade_placed' && log.details && typeof log.details !== 'string' && 'orderId' in log.details && (
                 <span className="block pl-4 text-lime-400 text-[10px]">
                    Order ID: {log.details.orderId}, Status: {log.details.orderStatus}
                 </span>
              )}
            </div>
          ))}
        </div>
      </div>
       <p className="text-xs text-gray-500 mt-3">
        The automated engine will process a predefined list of stocks, get AI insights, and place MARKET BUY orders for shortlisted stocks. This is a simplified first phase.
      </p>
    </Card>
  );
};

export default AutomatedTradingEnginePanel;
