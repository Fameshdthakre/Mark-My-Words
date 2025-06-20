
import React, { useState, useEffect } from 'react';
import Card from './shared/Card';

interface AteConfig {
  stockListFilter: string;
  paperCapitalAllocationPercent: number;
}

interface AutomatedTradingEngineConfigPanelProps {
  currentConfig: AteConfig;
  onSaveConfig: (newConfig: AteConfig) => void;
}

const AutomatedTradingEngineConfigPanel: React.FC<AutomatedTradingEngineConfigPanelProps> = ({ currentConfig, onSaveConfig }) => {
  const [stockFilter, setStockFilter] = useState<string>(currentConfig.stockListFilter);
  const [capitalAlloc, setCapitalAlloc] = useState<string>(currentConfig.paperCapitalAllocationPercent.toString());

  useEffect(() => {
    setStockFilter(currentConfig.stockListFilter);
    setCapitalAlloc(currentConfig.paperCapitalAllocationPercent.toString());
  }, [currentConfig]);

  const handleSave = () => {
    const allocPercent = parseFloat(capitalAlloc);
    if (isNaN(allocPercent) || allocPercent < 0 || allocPercent > 100) {
      alert("Please enter a valid capital allocation percentage (0-100).");
      return;
    }
    onSaveConfig({
      stockListFilter: stockFilter.trim(),
      paperCapitalAllocationPercent: allocPercent,
    });
    alert("ATE Configuration Saved!");
  };
  
  const inputClass = "w-full bg-gray-700 border border-gray-600 text-gray-100 py-2 px-3 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1";

  return (
    <Card title="ATE Configuration" className="border-2 border-cyan-500">
      <div className="space-y-4">
        <div>
          <label htmlFor="ateStockFilter" className={labelClass}>
            Stock List Filter (e.g., "NIFTY50", "ALL", "INFY,TCS")
          </label>
          <input
            type="text"
            id="ateStockFilter"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className={inputClass}
            placeholder="NIFTY50, ALL, or comma-separated symbols"
          />
        </div>
        <div>
          <label htmlFor="ateCapitalAlloc" className={labelClass}>
            Capital Allocation per Trade (Paper Mode %)
          </label>
          <input
            type="number"
            id="ateCapitalAlloc"
            value={capitalAlloc}
            onChange={(e) => setCapitalAlloc(e.target.value)}
            className={inputClass}
            min="0"
            max="100"
            step="0.1"
            placeholder="e.g., 2 for 2%"
          />
        </div>
        <button
          onClick={handleSave}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150"
        >
          Save ATE Configuration
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        Configure how the Automated Trading Engine selects stocks and manages capital in paper mode.
      </p>
    </Card>
  );
};

export default AutomatedTradingEngineConfigPanel;
