
import React, { useState, useEffect } from 'react';
import {
  DhanStockData,
  DhanMarginCalculatorRequest,
  DhanMarginCalculatorResponse,
  DhanExchangeSegment,
  DhanTransactionType,
  DhanProductType,
  TradingMode,
} from '../types';
import Card from './shared/Card';
import LoadingSpinner from './shared/LoadingSpinner';
import ErrorDisplay from './shared/ErrorDisplay';
import { DHAN_MOCK_CLIENT_ID, DEFAULT_EXCHANGE_SEGMENT, DEFAULT_PRODUCT_TYPE } from '../constants';

interface MarginCalculatorPanelProps {
  stockData: DhanStockData;
  dhanClientId: string; // To be passed from App.tsx or constants
  onCalculateMargin: (request: DhanMarginCalculatorRequest) => Promise<DhanMarginCalculatorResponse>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  result: DhanMarginCalculatorResponse | null;
  setResult: React.Dispatch<React.SetStateAction<DhanMarginCalculatorResponse | null>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  tradingMode: TradingMode;
}

const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const MarginCalculatorPanel: React.FC<MarginCalculatorPanelProps> = ({
  stockData,
  dhanClientId,
  onCalculateMargin,
  isLoading,
  setIsLoading,
  result,
  setResult,
  error,
  setError,
  tradingMode,
}) => {
  const [exchangeSegment, setExchangeSegment] = useState<DhanExchangeSegment>(stockData.exchangeSegment || DEFAULT_EXCHANGE_SEGMENT);
  const [transactionType, setTransactionType] = useState<DhanTransactionType>('BUY');
  const [quantity, setQuantity] = useState<string>('1');
  const [productType, setProductType] = useState<DhanProductType>(DEFAULT_PRODUCT_TYPE);
  const [price, setPrice] = useState<string>('');
  const [triggerPrice, setTriggerPrice] = useState<string>('');

  useEffect(() => {
    setExchangeSegment(stockData.exchangeSegment || DEFAULT_EXCHANGE_SEGMENT);
    setPrice(stockData.currentPrice > 0 ? stockData.currentPrice.toFixed(2) : '');
    setResult(null); // Clear previous results when stock changes
    setError(null);
  }, [stockData, setResult, setError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tradingMode === 'paper') {
        setError("Margin calculation is only applicable for Live Trading mode.");
        setResult(null);
        return;
    }
    if (!stockData.dhanSecurityId) {
      setError('Dhan Security ID is missing for the selected stock.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);

    const request: DhanMarginCalculatorRequest = {
      dhanClientId: dhanClientId, // This should be the actual client ID for live mode
      exchangeSegment,
      transactionType,
      quantity: parseInt(quantity, 10) || 1,
      productType,
      securityId: stockData.dhanSecurityId,
      price: parseFloat(price) || 0, // Ensure price is a number
      triggerPrice: triggerPrice ? parseFloat(triggerPrice) : undefined,
    };

    try {
      const response = await onCalculateMargin(request);
      setResult(response);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to calculate margin.';
      console.error('Margin Calculation Error:', err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full bg-gray-700 border border-gray-600 text-gray-100 py-2 px-3 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1";
  const selectClass = `${inputClass} appearance-none`;

  if (tradingMode === 'paper') {
    return (
        <Card title={`Margin Calculator: ${stockData.symbol}`} className="mt-6">
             <p className="text-gray-400">Margin calculation is available in "Live Trading (Real Money)" mode only.</p>
        </Card>
    );
  }

  return (
    <Card title={`Margin Calculator: ${stockData.symbol} (${stockData.dhanSecurityId || 'N/A'})`} className="mt-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="mcExchangeSegment" className={labelClass}>Exchange Segment</label>
            <select id="mcExchangeSegment" value={exchangeSegment} onChange={(e) => setExchangeSegment(e.target.value as DhanExchangeSegment)} className={selectClass} disabled>
              {([stockData.exchangeSegment || DEFAULT_EXCHANGE_SEGMENT] as DhanExchangeSegment[]).map(es => ( // Only show current stock's segment
                <option key={es} value={es}>{es}</option>
              ))}
            </select>
             <p className="text-[10px] text-gray-500 mt-0.5">Auto-set from stock data.</p>
          </div>

          <div>
            <label className={labelClass}>Transaction Type</label>
            <div className="flex space-x-3">
              {(['BUY', 'SELL'] as DhanTransactionType[]).map(tt => (
                <label key={tt} className="flex items-center space-x-2 text-sm">
                  <input type="radio" name="mcTransactionType" value={tt} checked={transactionType === tt} onChange={() => setTransactionType(tt)} className="form-radio text-emerald-500 bg-gray-700 border-gray-600 focus:ring-emerald-500" />
                  <span className={tt === 'BUY' ? 'text-green-400' : 'text-red-400'}>{tt}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="mcProductType" className={labelClass}>Product Type</label>
            <select id="mcProductType" value={productType} onChange={(e) => setProductType(e.target.value as DhanProductType)} className={selectClass}>
              {(['CNC', 'INTRADAY', 'MARGIN', 'MTF', 'CO', 'BO'] as DhanProductType[]).map(pt => (
                <option key={pt} value={pt}>{pt}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="mcQuantity" className={labelClass}>Quantity</label>
            <input type="number" id="mcQuantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} min="1" required />
          </div>

          <div>
            <label htmlFor="mcPrice" className={labelClass}>Price (Current: ₹{stockData.currentPrice > 0 ? stockData.currentPrice.toFixed(2) : 'N/A'})</label>
            <input type="number" id="mcPrice" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} step="0.05" min="0" required/>
          </div>

          <div>
            <label htmlFor="mcTriggerPrice" className={labelClass}>Trigger Price (Optional for SL/CO/BO)</label>
            <input type="number" id="mcTriggerPrice" value={triggerPrice} onChange={(e) => setTriggerPrice(e.target.value)} className={inputClass} step="0.05" min="0" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !stockData.dhanSecurityId}
          className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-gray-500 text-white font-semibold py-2.5 px-4 rounded-md transition duration-150"
        >
          {isLoading ? 'Calculating...' : 'Calculate Margin'}
        </button>
      </form>

      {isLoading && <LoadingSpinner message="Calculating margin..." />}
      {error && <ErrorDisplay message="Margin Calculation Error" details={error} />}

      {result && !isLoading && !error && (
        <div className="mt-6 space-y-1 text-sm">
          <h4 className="text-md font-semibold text-emerald-400 mb-2">Margin Calculation Results:</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-3 bg-gray-700 rounded-md">
            <ResultItem label="Total Margin Required" value={formatCurrency(result.totalMargin)} highlight={true} />
            <ResultItem label="Leverage Provided" value={result.leverage} />
            <ResultItem label="Span Margin" value={formatCurrency(result.spanMargin)} />
            <ResultItem label="Exposure Margin" value={formatCurrency(result.exposureMargin)} />
            <ResultItem label="Variable Margin" value={formatCurrency(result.variableMargin)} />
            <ResultItem label="Brokerage (Estimated)" value={formatCurrency(result.brokerage)} />
            <ResultItem label="Account Available Balance" value={formatCurrency(result.availableBalance)} />
             {result.insufficientBalance > 0 && (
                <ResultItem label="Insufficient Balance By" value={formatCurrency(result.insufficientBalance)} isError={true} />
             )}
          </div>
           <p className="text-xs text-gray-500 mt-2">Note: `availableBalance` shown here is your current account balance. `insufficientBalance` indicates any shortfall for this specific trade margin.</p>
        </div>
      )}
    </Card>
  );
};

const ResultItem: React.FC<{ label: string; value: string; highlight?: boolean; isError?: boolean }> = ({ label, value, highlight, isError }) => (
  <>
    <span className="text-gray-400">{label}:</span>
    <span className={`font-semibold ${isError ? 'text-red-400' : highlight ? 'text-emerald-300' : 'text-gray-100'}`}>{value}</span>
  </>
);

export default MarginCalculatorPanel;
