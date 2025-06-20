

import React from 'react';
import { DhanOrderResponse, DhanOrderStatus, TradingMode } from '../types'; 
import Card from './shared/Card';

interface OrderHistoryPanelProps {
  orders: DhanOrderResponse[];
  tradingMode: TradingMode;
}

const getStatusColor = (status: DhanOrderStatus | string, tradingMode: TradingMode) => {
  if (tradingMode === 'paper') {
    switch (status) {
      case 'PAPER_TRADED': return 'text-green-400';
      case 'PAPER_REJECTED': return 'text-red-400';
      case 'PENDING': return 'text-yellow-400'; // For limit/sl orders not yet filled
      default: return 'text-gray-300';
    }
  }
  // Live mode colors
  switch (status) {
    case 'TRADED':
    case 'PART_TRADED':
      return 'text-green-400';
    case 'PENDING':
    case 'TRANSIT':
    case 'PENDING_APPROVAL': 
    case 'SENT_TO_BROKER':   
      return 'text-yellow-400';
    case 'REJECTED':
    case 'CANCELLED':
    case 'EXPIRED':
    case 'FAILED_ON_CLIENT': 
      return 'text-red-400';
    default:
      return 'text-gray-300'; 
  }
};

const OrderHistoryPanel: React.FC<OrderHistoryPanelProps> = ({ orders, tradingMode }) => {
  const title = tradingMode === 'paper' ? "Paper Trade History" : "Order History (Dhan API Aligned)";
  return (
    <Card title={title}>
      {orders.length === 0 ? (
        <p className="text-gray-400">No orders to display.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {orders.map((order) => (
            <div key={`${order.orderId}-${tradingMode}`} className="p-2.5 bg-gray-700 rounded-md shadow text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-emerald-300">
                  {order.tradingSymbol || order.securityId} - {order.transactionType}
                </span>
                <span className={`font-medium ${getStatusColor(order.orderStatus, tradingMode)}`}>
                  {order.orderStatus.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 text-gray-400">
                <span>Qty: <span className="text-gray-200">{order.quantity}@{order.orderType === 'LIMIT' ? `₹${order.price?.toFixed(2)}` : order.orderType}</span></span>
                <span>Filled: <span className="text-gray-200">{order.filledQty || 0}@{order.averageTradedPrice?.toFixed(2) || 'N/A'}</span></span>
                <span>Product: <span className="text-gray-200">{order.productType}</span></span>
                 <span>Segment: <span className="text-gray-200">{order.exchangeSegment}</span></span>
              </div>
              <p className="text-gray-500 mt-0.5 text-[10px]">
                {tradingMode === 'paper' ? 'Paper ID' : 'Dhan ID'}: {order.orderId} | {new Date(order.createdTime || Date.now()).toLocaleTimeString()}
              </p>
              {order.omsErrorDescription && (
                <p className="text-red-400 text-[10px] mt-0.5">Error: {order.omsErrorDescription} ({order.omsErrorCode})</p>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-3">
        {tradingMode === 'live' 
          ? "Order statuses would be updated from your broker (Dhan) via your backend."
          : "Paper orders are simulated locally."
        }
      </p>
    </Card>
  );
};

export default OrderHistoryPanel;
