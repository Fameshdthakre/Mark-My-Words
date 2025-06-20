
import React, { useState, useEffect } from 'react';
import { 
    DhanStockData, 
    DhanOrderRequest, 
    DhanTransactionType, 
    DhanProductType, 
    DhanOrderType, 
    DhanValidity, 
    DhanAmoTime,
    TradingMode
} from '../types';
import Card from './shared/Card';
import { 
    DHAN_MOCK_CLIENT_ID, 
    DEFAULT_PRODUCT_TYPE, 
    DEFAULT_ORDER_TYPE, 
    DEFAULT_VALIDITY,
    DEFAULT_AMO_TIME,
    AI_TRADE_CORRELATION_PREFIX,
    PAPER_TRADE_ID_PREFIX,
    DEFAULT_EXCHANGE_SEGMENT // Added import
} from '../constants';

interface OrderPlacementPanelProps {
  stockData: DhanStockData;
  onPlaceOrder: (orderRequest: DhanOrderRequest) => void;
  isLoading: boolean;
  tradingMode: TradingMode;
}

const OrderPlacementPanel: React.FC<OrderPlacementPanelProps> = ({ stockData, onPlaceOrder, isLoading, tradingMode }) => {
  const [transactionType, setTransactionType] = useState<DhanTransactionType>('BUY');
  const [productType, setProductType] = useState<DhanProductType>(DEFAULT_PRODUCT_TYPE);
  const [orderType, setOrderType] = useState<DhanOrderType>(DEFAULT_ORDER_TYPE);
  const [quantity, setQuantity] = useState<string>('1');
  const [price, setPrice] = useState<string>('');
  const [triggerPrice, setTriggerPrice] = useState<string>('');
  const [validity, setValidity] = useState<DhanValidity>(DEFAULT_VALIDITY);
  const [disclosedQuantity, setDisclosedQuantity] = useState<string>('');
  const [isAmo, setIsAmo] = useState<boolean>(false);
  const [amoTime, setAmoTime] = useState<DhanAmoTime>(DEFAULT_AMO_TIME);
  const [boProfitValue, setBoProfitValue] = useState<string>('');
  const [boStopLossValue, setBoStopLossValue] = useState<string>('');

  useEffect(() => {
    // Reset fields when stockData changes (new stock selected)
    setTransactionType('BUY');
    setProductType(DEFAULT_PRODUCT_TYPE);
    setOrderType(DEFAULT_ORDER_TYPE);
    setQuantity('1');
    setPrice(stockData.currentPrice > 0 ? stockData.currentPrice.toFixed(2) : ''); // Pre-fill price if available
    setTriggerPrice('');
    setValidity(DEFAULT_VALIDITY);
    setDisclosedQuantity('');
    setIsAmo(false);
    setAmoTime(DEFAULT_AMO_TIME);
    setBoProfitValue('');
    setBoStopLossValue('');
  }, [stockData.symbol, stockData.currentPrice]);

  const isMarketOrder = orderType === 'MARKET';
  const isLimitOrder = orderType === 'LIMIT';
  const isStopLossOrder = orderType === 'STOP_LOSS';
  const isStopLossMarketOrder = orderType === 'STOP_LOSS_MARKET';

  const isBracketOrder = productType === 'BO';
  const isCoverOrder = productType === 'CO';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!stockData.dhanSecurityId || !stockData.exchangeSegment) && tradingMode === 'live') {
      alert('Stock security ID or exchange segment is missing for live trading.');
      return;
    }
     if (tradingMode === 'paper' && !stockData.symbol) { // Basic check for paper mode
      alert('Stock symbol is missing for paper trading.');
      return;
    }


    const orderRequest: DhanOrderRequest = {
      dhanClientId: tradingMode === 'paper' ? 'PAPER_CLIENT' : DHAN_MOCK_CLIENT_ID,
      correlationId: `${AI_TRADE_CORRELATION_PREFIX}${tradingMode === 'paper' ? 'PAPER_USER_' : 'USER_'}${Date.now()}`,
      securityId: stockData.dhanSecurityId || stockData.symbol, // Use symbol as fallback for paper if ID missing
      exchangeSegment: stockData.exchangeSegment || DEFAULT_EXCHANGE_SEGMENT, // Fallback for paper
      transactionType,
      productType,
      orderType,
      quantity: parseInt(quantity, 10) || 0,
      validity,
      price: !isMarketOrder && price ? parseFloat(price) : undefined,
      triggerPrice: (isStopLossOrder || isStopLossMarketOrder || isCoverOrder) && triggerPrice ? parseFloat(triggerPrice) : undefined,
      disclosedQuantity: disclosedQuantity ? parseInt(disclosedQuantity, 10) : undefined,
      afterMarketOrder: isAmo,
      amoTime: isAmo ? amoTime : undefined,
      boProfitValue: isBracketOrder && boProfitValue ? parseFloat(boProfitValue) : undefined,
      boStopLossValue: isBracketOrder && boStopLossValue ? parseFloat(boStopLossValue) : undefined,
    };
    onPlaceOrder(orderRequest);
  };

  // Basic validation check
  const canSubmit = () => {
    if (isLoading) return false;
    if (tradingMode === 'live' && (!stockData.dhanSecurityId || !stockData.exchangeSegment)) return false;
    if (!stockData.symbol && tradingMode === 'paper') return false; // Need at least a symbol for paper
    if (!quantity || parseInt(quantity) <= 0) return false;
    if (isLimitOrder && (!price || parseFloat(price) <= 0)) return false;
    if (isStopLossOrder && ((!price || parseFloat(price) <= 0) || (!triggerPrice || parseFloat(triggerPrice) <= 0))) return false;
    if ((isStopLossMarketOrder || isCoverOrder) && (!triggerPrice || parseFloat(triggerPrice) <= 0)) return false;
    if (isBracketOrder && ((!boProfitValue || parseFloat(boProfitValue) <= 0) || (!boStopLossValue || parseFloat(boStopLossValue) <= 0))) return false;
    // For BO, if order type is LIMIT, price is also required.
    if (isBracketOrder && isLimitOrder && (!price || parseFloat(price) <= 0)) return false;
    return true;
  };

  const inputClass = "w-full bg-gray-700 border border-gray-600 text-gray-100 py-2 px-3 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1";
  const selectClass = `${inputClass} appearance-none`;
  const panelTitle = tradingMode === 'paper' 
    ? `Place Paper Order: ${stockData.symbol}` 
    : `Place Order: ${stockData.symbol} (${stockData.dhanSecurityId || 'N/A'} / ${stockData.exchangeSegment || 'N/A'})`;


  return (
    <Card title={panelTitle} className="mt-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Transaction Type */}
          <div>
            <label className={labelClass}>Transaction Type</label>
            <div className="flex space-x-3">
              {(['BUY', 'SELL'] as DhanTransactionType[]).map(tt => (
                <label key={tt} className="flex items-center space-x-2 text-sm">
                  <input type="radio" name="transactionType" value={tt} checked={transactionType === tt} onChange={() => setTransactionType(tt)} className="form-radio text-emerald-500 bg-gray-700 border-gray-600 focus:ring-emerald-500" />
                  <span className={tt === 'BUY' ? 'text-green-400' : 'text-red-400'}>{tt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Product Type */}
          <div>
            <label htmlFor="productType" className={labelClass}>Product Type</label>
            <select id="productType" value={productType} onChange={(e) => setProductType(e.target.value as DhanProductType)} className={selectClass}>
              {(['CNC', 'INTRADAY', 'MARGIN', 'MTF', 'CO', 'BO'] as DhanProductType[]).map(pt => (
                <option key={pt} value={pt}>{pt}</option>
              ))}
            </select>
          </div>

          {/* Order Type */}
          <div>
            <label htmlFor="orderType" className={labelClass}>Order Type</label>
            <select id="orderType" value={orderType} onChange={(e) => setOrderType(e.target.value as DhanOrderType)} className={selectClass}>
              {(['MARKET', 'LIMIT', 'STOP_LOSS', 'STOP_LOSS_MARKET'] as DhanOrderType[]).map(ot => (
                <option key={ot} value={ot}>{ot.replace('_', '-')}</option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className={labelClass}>Quantity</label>
            <input type="number" id="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} min="1" required />
          </div>

          {/* Price (Conditional) */}
          {(isLimitOrder || (isStopLossOrder && !isCoverOrder && !isBracketOrder) || (isBracketOrder && isLimitOrder)) && (
            <div>
              <label htmlFor="price" className={labelClass}>Price (Current: ₹{stockData.currentPrice > 0 ? stockData.currentPrice.toFixed(2) : 'N/A'})</label>
              <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} step="0.05" min="0" required={isLimitOrder || isStopLossOrder} />
            </div>
          )}

          {/* Trigger Price (Conditional) */}
          {(isStopLossOrder || isStopLossMarketOrder || isCoverOrder ) && (
            <div>
              <label htmlFor="triggerPrice" className={labelClass}>Trigger Price</label>
              <input type="number" id="triggerPrice" value={triggerPrice} onChange={(e) => setTriggerPrice(e.target.value)} className={inputClass} step="0.05" min="0" required />
            </div>
          )}
        </div>

        {/* Bracket Order Specific Fields */}
        {isBracketOrder && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-gray-700 rounded-md mt-2">
            <div>
              <label htmlFor="boProfitValue" className={labelClass}>BO Profit Target (Price)</label>
              <input type="number" id="boProfitValue" value={boProfitValue} onChange={(e) => setBoProfitValue(e.target.value)} className={inputClass} step="0.05" min="0" required />
            </div>
            <div>
              <label htmlFor="boStopLossValue" className={labelClass}>BO Stop Loss (Price)</label>
              <input type="number" id="boStopLossValue" value={boStopLossValue} onChange={(e) => setBoStopLossValue(e.target.value)} className={inputClass} step="0.05" min="0" required />
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Validity */}
            <div>
                <label htmlFor="validity" className={labelClass}>Validity</label>
                <select id="validity" value={validity} onChange={(e) => setValidity(e.target.value as DhanValidity)} className={selectClass}>
                {(['DAY', 'IOC'] as DhanValidity[]).map(v => (
                    <option key={v} value={v}>{v}</option>
                ))}
                </select>
            </div>

            {/* Disclosed Quantity (Optional) */}
            <div>
                <label htmlFor="disclosedQuantity" className={labelClass}>Disclosed Qty (Optional)</label>
                <input type="number" id="disclosedQuantity" value={disclosedQuantity} onChange={(e) => setDisclosedQuantity(e.target.value)} className={inputClass} min="0" />
            </div>
        </div>


        {/* AMO Fields (Conditional) */}
        <div className="flex items-center space-x-3 pt-2">
          <input type="checkbox" id="isAmo" checked={isAmo} onChange={(e) => setIsAmo(e.target.checked)} className="form-checkbox h-4 w-4 text-emerald-500 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500" />
          <label htmlFor="isAmo" className="text-sm text-gray-300">After Market Order (AMO)</label>
        </div>

        {isAmo && (
          <div>
            <label htmlFor="amoTime" className={labelClass}>AMO Time</label>
            <select id="amoTime" value={amoTime} onChange={(e) => setAmoTime(e.target.value as DhanAmoTime)} className={selectClass}>
              {(['PRE_OPEN', 'OPEN', 'OPEN_30', 'OPEN_60'] as DhanAmoTime[]).map(at => (
                <option key={at} value={at}>{at.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit() || isLoading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-500 text-white font-semibold py-2.5 px-4 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50"
        >
          {isLoading ? 'Placing Order...' : `Place ${transactionType} ${tradingMode === 'paper' ? 'Paper ' : ''}Order`}
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-3">
        Ensure all parameters are correct. For {tradingMode} mode.
        {tradingMode === 'live' && " CO uses Trigger Price for SL. BO requires Profit and Stop Loss Values (treated as absolute prices here)."}
      </p>
    </Card>
  );
};

export default OrderPlacementPanel;
