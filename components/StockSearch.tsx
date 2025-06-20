
import React, { useState } from 'react';
import { NseTotalMarketStockInfo } from '../types';
import { PLACEHOLDER_STOCK_SEARCH, BUTTON_TEXT_ANALYZING, BUTTON_TEXT_ANALYZE_STOCK } from '../constants';

interface StockSearchProps {
  onSearch: (symbol: string) => void;
  isLoading: boolean;
  nseStockList: NseTotalMarketStockInfo[]; // Updated prop
}

const StockSearch: React.FC<StockSearchProps> = ({ onSearch, isLoading, nseStockList }) => {
  const [symbol, setSymbol] = useState<string>(nseStockList.length > 0 ? nseStockList[0].SYMBOL : 'RELIANCE');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol.trim()) {
      onSearch(symbol.trim());
    }
  };
  
  // Update default symbol if nseStockList loads after initial render
  React.useEffect(() => {
    if (nseStockList.length > 0 && (symbol === 'RELIANCE' || !nseStockList.find(s => s.SYMBOL === symbol))) {
        // Set symbol only if current symbol is default and list is available, or if current symbol is not in list
        // This avoids overriding user input if they type before list loads but still ensures a valid default.
        // A better UX might involve a loading state for the datalist itself.
        // For now, if the initial symbol state was a fallback and the list loads, update to first from list.
        if(symbol === 'RELIANCE' && !nseStockList.find(s => s.SYMBOL === 'RELIANCE') && nseStockList[0]){
             setSymbol(nseStockList[0].SYMBOL);
        } else if (symbol === 'RELIANCE' && nseStockList.find(s => s.SYMBOL === 'RELIANCE')){
             // keep RELIANCE if it's a valid symbol in the list and was the default
        } else if (nseStockList[0]) { // if current symbol is not in list, but list has items
            // setSymbol(nseStockList[0].SYMBOL); // Decided against this aggressive update, could clear user input.
        }
    }
  }, [nseStockList, symbol]);


  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-800 rounded-lg shadow-lg flex flex-col sm:flex-row items-center gap-4">
      <div className="flex-grow w-full sm:w-auto">
        <label htmlFor="stockSymbol" className="sr-only">Stock Symbol</label>
        <div className="relative">
          <input
            type="text"
            id="stockSymbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder={PLACEHOLDER_STOCK_SEARCH}
            className="w-full bg-gray-700 border border-gray-600 text-gray-100 text-lg py-3 px-4 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150"
            list="stock-suggestions"
            autoCapitalize="characters"
          />
          <datalist id="stock-suggestions">
            {nseStockList.map(stock => (
              <option key={stock.SYMBOL} value={stock.SYMBOL}>
                {stock.SYMBOL} - {stock["NAME OF COMPANY"]}
              </option>
            ))}
          </datalist>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 text-xs">
             (e.g. RELIANCE, INFY)
          </div>
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading || !symbol.trim()}
        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-500 text-white font-semibold py-3 px-6 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50"
      >
        {isLoading ? BUTTON_TEXT_ANALYZING : BUTTON_TEXT_ANALYZE_STOCK}
      </button>
    </form>
  );
};

export default StockSearch;
