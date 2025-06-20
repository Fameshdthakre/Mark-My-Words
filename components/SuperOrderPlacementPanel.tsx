
import React, { useState, useEffect } from 'react';
import {
  DhanStockData,
  DhanSuperOrderPlaceRequest,
  DhanTransactionType,
  DhanProductType,
  DhanOrderType,
} from '../types';
import Card from './shared/Card';
import { DHAN_MOCK_CLIENT_ID, DEFAULT_PRODUCT_TYPE, DEFAULT_ORDER_TYPE, SUPER_ORDER_CORRELATION_PREFIX, DEFAULT_EXCHANGE_SEGMENT } from '../constants';

interface SuperOrderPlacementPanelProps {
  stockData: DhanStockData;
  onPlaceSuperOrder: (request: DhanSuperOrderPlaceRequest) => void;
  isLoading: boolean;
}

const SuperOrderPlacementPanel: React.FC<SuperOrderPlacementPanelProps> = ({ stockData, onPlaceSuperOrder, isLoading }) => {
  const [transactionType, setTransactionType] = useState<DhanTransactionType>('BUY');
  const [productType, setProductType] = useState<DhanProductType>(DEFAULT_PRODUCT_TYPE);
  const [orderType, setOrderType] = useState<DhanOrderType>(DEFAULT_ORDER_TYPE); // For entry leg
  const [quantity, setQuantity] = useState<string>('1');
  const [entryPrice, setEntryPrice] = useState<string>(''); // Only for LIMIT entry
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [stopLossPrice, setStopLossPrice] = useState<string>('');
  const [trailingJump, setTrailingJump] = useState<string>(''); // Optional

  useEffect(() => {
    setTransactionType('BUY');
    setProductType(DEFAULT_PRODUCT_TYPE);
    setOrderType(DEFAULT_ORDER_TYPE);
    setQuantity('1');
    setEntryPrice(stockData.currentPrice > 0 ? stockData.currentPrice.toFixed(2) : '');
    setTargetPrice(stockData.currentPrice > 0 ? (stockData.currentPrice * 1.05).toFixed(2) : ''); // Default 5% target
    setStopLossPrice(stockData.currentPrice > 0 ? (stockData.currentPrice * 0.98).toFixed(2) : ''); // Default 2% SL
    setTrailingJump('');
  }, [stockData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockData.dhanSecurityId || !stockData.exchangeSegment) {
      alert('Stock Security ID or Exchange Segment is missing.');
      return;
    }

    const qty = parseInt(quantity, 10);
    const price = orderType === 'LIMIT' ? parseFloat(entryPrice) : 0; // Price 0 for MARKET entry
    const tgtPrice = parseFloat(targetPrice);
    const slPrice = parseFloat(stopLossPrice);
    const trailJump = trailingJump ? parseFloat(trailingJump) : undefined;

    if (qty <= 0 || tgtPrice <= 0 || slPrice <= 0 || (orderType === 'LIMIT' && price <= 0)) {
      alert('Please enter valid positive values for Quantity, Target, Stop-Loss, and Price (if LIMIT).');
      return;
    }
    // Basic validation for target/stoploss relative to entry for BUY/SELL
    const effectiveEntry = orderType === 'LIMIT' ? price : stockData.currentPrice;
    if (transactionType === 'BUY' && (tgtPrice <= effectiveEntry || slPrice >= effectiveEntry)) {
        alert('For BUY Super Order: Target must be > Entry, Stop-Loss must be < Entry.');
        return;
    }
    if (transactionType === 'SELL' && (tgtPrice >= effectiveEntry || slPrice <= effectiveEntry)) {
        alert('For SELL Super Order: Target must be < Entry, Stop-Loss must be > Entry.');
        return;
    }


    const request: DhanSuperOrderPlaceRequest = {
      dhanClientId: DHAN_MOCK_CLIENT_ID, // Backend will use actual
      correlationId: `${SUPER_ORDER_CORRELATION_PREFIX}USER_${Date.now()}`,
      transactionType,
      exchangeSegment: stockData.exchangeSegment,
      productType,
      orderType, // Entry leg order type
      securityId: stockData.dhanSecurityId,
      quantity: qty,
      price, // Entry price for LIMIT, 0 for MARKET
      targetPrice: tgtPrice,
      stopLossPrice: slPrice,
      trailingJump: trailJump,
    };
    onPlaceSuperOrder(request);
  };
  
  const inputClass = "w-full bg-gray-700 border border-gray-600 text-gray-100 py-2 px-3 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1";
  const selectClass = `${inputClass} appearance-none`;

  return (
    <Card title={`Place Super Order: ${stockData.symbol} (Live)`} className="border-2 border-orange-500">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Transaction Type</label>
            <div className="flex space-x-3">
              {(['BUY', 'SELL'] as DhanTransactionType[]).map(tt => (
                <label key={tt} className="flex items-center space-x-2 text-sm">
                  <input type="radio" name="soTransactionType" value={tt} checked={transactionType === tt} onChange={() => setTransactionType(tt)} className="form-radio text-emerald-500" />
                  <span className={tt === 'BUY' ? 'text-green-400' : 'text-red-400'}>{tt}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="soProductType" className={labelClass}>Product Type</label>
            <select id="soProductType" value={productType} onChange={(e) => setProductType(e.target.value as DhanProductType)} className={selectClass}>
              {(['INTRADAY', 'CNC', 'MARGIN', 'MTF'] as DhanProductType[]).map(pt => ( <option key={pt} value={pt}>{pt}</option> ))}
            </select>
          </div>
          <div>
            <label htmlFor="soOrderType" className={labelClass}>Entry Order Type</label>
            <select id="soOrderType" value={orderType} onChange={(e) => setOrderType(e.target.value as DhanOrderType)} className={selectClass}>
              {(['MARKET', 'LIMIT'] as DhanOrderType[]).map(ot => ( <option key={ot} value={ot}>{ot}</option> ))}
            </select>
          </div>
          <div>
            <label htmlFor="soQuantity" className={labelClass}>Quantity</label>
            <input type="number" id="soQuantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} min="1" required />
          </div>
          {orderType === 'LIMIT' && (
            <div>
              <label htmlFor="soEntryPrice" className={labelClass}>Entry Price (Current: ₹{stockData.currentPrice > 0 ? stockData.currentPrice.toFixed(2): 'N/A'})</label>
              <input type="number" id="soEntryPrice" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} className={inputClass} step="0.05" min="0.01" required />
            </div>
          )}
           <div> {/* Empty div for grid alignment if entry price is not shown */}</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-700">
            <div>
                <label htmlFor="soTargetPrice" className={labelClass}>Target Price</label>
                <input type="number" id="soTargetPrice" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} className={inputClass} step="0.05" min="0.01" required />
            </div>
            <div>
                <label htmlFor="soStopLossPrice" className={labelClass}>Stop-Loss Price</label>
                <input type="number" id="soStopLossPrice" value={stopLossPrice} onChange={(e) => setStopLossPrice(e.target.value)} className={inputClass} step="0.05" min="0.01" required />
            </div>
            <div>
                <label htmlFor="soTrailingJump" className={labelClass}>Trailing Jump (Optional)</label>
                <input type="number" id="soTrailingJump" value={trailingJump} onChange={(e) => setTrailingJump(e.target.value)} className={inputClass} step="0.05" min="0" />
            </div>
        </div>
        <button
          type="submit"
          disabled={isLoading || !stockData.dhanSecurityId}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-500 text-white font-semibold py-2.5 px-4 rounded-md transition"
        >
          {isLoading ? 'Placing Super Order...' : `Place ${transactionType} Super Order`}
        </button>
      </form>
    </Card>
  );
};

export default SuperOrderPlacementPanel;
