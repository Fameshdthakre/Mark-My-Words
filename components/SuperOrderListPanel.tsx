
import React, { useState } from 'react';
import { DhanSuperOrderListItem, DhanSuperOrderLegDetail, DhanLegName, DhanOrderType, DhanSuperOrderModifyRequest } from '../types';
import Card from './shared/Card';

interface SuperOrderListPanelProps {
  superOrders: DhanSuperOrderListItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onModify: (orderId: string, request: DhanSuperOrderModifyRequest) => void;
  onCancelLeg: (orderId: string, legName: DhanLegName) => void;
}

const getStatusColor = (status: string | undefined) => {
  if (!status) return 'text-gray-400';
  const s = status.toUpperCase();
  if (s.includes('PENDING') || s.includes('TRANSIT') || s.includes('TRIGGERED')) return 'text-yellow-400';
  if (s.includes('TRADED') || s.includes('CLOSED') || s.includes('MODIFIED') || s.includes('APPROVED_BY_USER')) return 'text-green-400';
  if (s.includes('REJECTED') || s.includes('CANCELLED') || s.includes('EXPIRED')) return 'text-red-400';
  return 'text-gray-300';
};

const SuperOrderListPanel: React.FC<SuperOrderListPanelProps> = ({ superOrders, isLoading, onRefresh, onModify, onCancelLeg }) => {
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<{ quantity?: string; price?: string; targetPrice?: string; stopLossPrice?: string; trailingJump?: string }>({});

  const handleStartEdit = (order: DhanSuperOrderListItem) => {
    setEditingOrderId(order.orderId);
    setEditFields({
      quantity: String(order.quantity),
      price: String(order.price), // Entry price
      targetPrice: String(order.legDetails.find(leg => leg.legName === 'TARGET_LEG')?.price || ''),
      stopLossPrice: String(order.legDetails.find(leg => leg.legName === 'STOP_LOSS_LEG')?.price || ''),
      trailingJump: String(order.legDetails.find(leg => leg.legName === 'STOP_LOSS_LEG')?.trailingJump || ''),
    });
  };

  const handleSaveEdit = (orderId: string, originalOrderType: DhanOrderType) => {
    // Simplified: Modifies only ENTRY_LEG attributes or overall target/SL if directly mapped
    // A full per-leg modification would be more complex
    const modifyRequest: DhanSuperOrderModifyRequest = {
      dhanClientId: '', // Backend adds this
      orderId: orderId,
      orderType: originalOrderType, // Keep original entry order type for this simplified modify
      legName: 'ENTRY_LEG', // Assume modifying properties related to the entry/overall SO
      quantity: editFields.quantity ? parseInt(editFields.quantity, 10) : undefined,
      price: (originalOrderType === 'LIMIT' && editFields.price) ? parseFloat(editFields.price) : undefined,
      targetPrice: editFields.targetPrice ? parseFloat(editFields.targetPrice) : undefined,
      stopLossPrice: editFields.stopLossPrice ? parseFloat(editFields.stopLossPrice) : undefined,
      trailingJump: editFields.trailingJump ? parseFloat(editFields.trailingJump) : undefined,
    };
    onModify(orderId, modifyRequest);
    setEditingOrderId(null);
  };

  const inputClass = "w-full bg-gray-600 border-gray-500 text-gray-100 py-1 px-2 rounded text-xs";


  return (
    <Card title="Super Orders (Live)" className="border-2 border-teal-500">
      <button onClick={onRefresh} disabled={isLoading} className="mb-3 w-full text-sm bg-teal-600 hover:bg-teal-700 disabled:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md">
        {isLoading ? 'Refreshing...' : 'Refresh Super Orders'}
      </button>
      {isLoading && superOrders.length === 0 && <p>Loading super orders...</p>}
      {!isLoading && superOrders.length === 0 && <p className="text-gray-400">No active super orders.</p>}
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {superOrders.map(order => (
          <div key={order.orderId} className="p-3 bg-gray-700 rounded-md shadow-md text-xs">
            <div className="flex justify-between items-center mb-1">
              <h5 className="font-semibold text-emerald-300">{order.tradingSymbol} <span className="text-gray-400">({order.transactionType})</span></h5>
              <span className={getStatusColor(order.orderStatus)}>{order.orderStatus}</span>
            </div>
            <p>ID: {order.orderId} | Qty: {order.quantity} @ {order.orderType === 'LIMIT' ? `₹${order.price.toFixed(2)}` : 'MARKET'}</p>
            
            {order.legDetails.map(leg => (
              <div key={leg.orderId} className="ml-2 mt-1 p-1.5 bg-gray-600 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-cyan-300">{leg.legName.replace('_LEG','')}</span>
                  <span className={getStatusColor(leg.orderStatus)}>{leg.orderStatus}</span>
                </div>
                <p>Leg ID: {leg.orderId} | Price: ₹{leg.price.toFixed(2)}
                   {leg.legName === 'STOP_LOSS_LEG' && leg.trailingJump ? ` (Trail: ${leg.trailingJump})` : ''}
                </p>
                {leg.orderStatus === 'PENDING' && (
                  <button onClick={() => onCancelLeg(order.orderId, leg.legName)} disabled={isLoading} className="mt-1 text-xs bg-red-700 hover:bg-red-800 px-2 py-0.5 rounded">
                    Cancel {leg.legName.replace('_LEG','')}
                  </button>
                )}
              </div>
            ))}

            {(order.orderStatus === 'PENDING' || order.orderStatus === 'PART_TRADED') && editingOrderId !== order.orderId && (
              <button onClick={() => handleStartEdit(order)} disabled={isLoading} className="mt-2 text-xs bg-sky-600 hover:bg-sky-700 px-2 py-0.5 rounded">
                Modify Order
              </button>
            )}

            {editingOrderId === order.orderId && (
              <div className="mt-2 p-2 bg-gray-600 rounded space-y-1">
                <p className="text-sm text-yellow-300">Editing {order.orderId} (Entry Leg & Main Params):</p>
                <div><label className="text-gray-400 text-[10px]">Qty:</label><input type="text" value={editFields.quantity} onChange={e => setEditFields({...editFields, quantity: e.target.value})} className={inputClass} /></div>
                {order.orderType === 'LIMIT' && <div><label className="text-gray-400 text-[10px]">Entry Price:</label><input type="text" value={editFields.price} onChange={e => setEditFields({...editFields, price: e.target.value})} className={inputClass} /></div>}
                <div><label className="text-gray-400 text-[10px]">Target Price:</label><input type="text" value={editFields.targetPrice} onChange={e => setEditFields({...editFields, targetPrice: e.target.value})} className={inputClass} /></div>
                <div><label className="text-gray-400 text-[10px]">SL Price:</label><input type="text" value={editFields.stopLossPrice} onChange={e => setEditFields({...editFields, stopLossPrice: e.target.value})} className={inputClass} /></div>
                <div><label className="text-gray-400 text-[10px]">Trail Jump (SL):</label><input type="text" value={editFields.trailingJump} onChange={e => setEditFields({...editFields, trailingJump: e.target.value})} className={inputClass} /></div>
                <div className="flex space-x-2 mt-1">
                    <button onClick={() => handleSaveEdit(order.orderId, order.orderType)} className="text-xs bg-green-600 hover:bg-green-700 px-2 py-0.5 rounded">Save</button>
                    <button onClick={() => setEditingOrderId(null)} className="text-xs bg-gray-500 hover:bg-gray-400 px-2 py-0.5 rounded">Cancel Edit</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default SuperOrderListPanel;
