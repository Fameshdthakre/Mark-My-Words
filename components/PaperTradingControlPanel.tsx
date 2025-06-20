
import React, { useState, useEffect } from 'react';
import { PaperTradingSettings } from '../types';
import Card from './shared/Card';
import { DEFAULT_PAPER_BUDGET, PAPER_TRADING_SETUP_TITLE } from '../constants';

interface PaperTradingControlPanelProps {
  settings: PaperTradingSettings;
  onSessionStart: (budget: number, mode: 'reset' | 'redefine') => void;
  isLoading?: boolean; 
}

const PaperTradingControlPanel: React.FC<PaperTradingControlPanelProps> = ({ settings, onSessionStart, isLoading }) => {
  const [inputBudget, setInputBudget] = useState<string>(settings.initialBudget.toString());

  useEffect(() => {
    // Update input field if settings change externally, e.g., after loading or session start
    setInputBudget(settings.initialBudget.toString());
  }, [settings.initialBudget, settings.sessionActive]);

  const handleAction = (mode: 'reset' | 'redefine') => {
    const budget = parseFloat(inputBudget);
    if (isNaN(budget) || budget <= 0) {
      alert('Please enter a valid positive budget amount.');
      return;
    }
    onSessionStart(budget, mode);
  };
  
  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const inputClass = "w-full bg-gray-700 border border-gray-600 text-gray-100 py-2 px-3 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1";
  const buttonBaseClass = "w-full text-white font-semibold py-2 px-4 rounded-md transition duration-150 disabled:bg-gray-500";


  return (
    <Card title={PAPER_TRADING_SETUP_TITLE} className="border-2 border-purple-500">
      <div className="space-y-4">
        <div>
          <label htmlFor="paperBudget" className={labelClass}>
            {settings.sessionActive ? 'New Budget (INR)' : 'Set Initial Budget (INR)'}
          </label>
          <input
            type="number"
            id="paperBudget"
            value={inputBudget}
            onChange={(e) => setInputBudget(e.target.value)}
            className={inputClass}
            placeholder={`e.g., ${DEFAULT_PAPER_BUDGET}`}
            min="1"
            disabled={isLoading}
          />
        </div>

        {!settings.sessionActive ? (
          <button
            onClick={() => handleAction('reset')}
            className={`${buttonBaseClass} bg-purple-600 hover:bg-purple-700`}
            disabled={isLoading}
          >
            {isLoading ? 'Starting...' : 'Start Paper Trading Session'}
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => handleAction('redefine')}
              className={`${buttonBaseClass} bg-sky-600 hover:bg-sky-700`}
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Budget & Continue Session'}
            </button>
            <button
              onClick={() => handleAction('reset')}
              className={`${buttonBaseClass} bg-red-600 hover:bg-red-700`}
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Session & Set New Budget'}
            </button>
          </div>
        )}

        {settings.sessionActive && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-sm text-gray-300">
              Current Paper Balance: 
              <span className="font-semibold text-lg text-emerald-400 ml-2">
                {formatCurrency(settings.currentBalance)}
              </span>
            </p>
            <p className="text-xs text-gray-500">Initial Budget was: {formatCurrency(settings.initialBudget)}</p>
          </div>
        )}
      </div>

      {settings.error && (
        <p className="text-xs text-red-400 mt-2 px-1 py-0.5 bg-red-900 border border-red-700 rounded">
            Session Error: {settings.error}
        </p>
      )}
      {settings.sheetError && !settings.error && ( // sheetError is a legacy field, map to persistenceStatus if needed
         <p className="text-xs text-orange-400 mt-2 px-1 py-0.5 bg-orange-900 border border-orange-700 rounded">
            Warning: Could not save last operation to persistence. Data might be inconsistent.
         </p>
      )}

      <p className="text-xs text-gray-500 mt-3">
        {settings.sessionActive 
            ? "'Update Budget' preserves history. 'Reset Session' clears all paper data and starts fresh."
            : "Starting a new session will set up your paper trading environment."
        }
      </p>
      <p className="text-xs text-gray-500 mt-1">
          {settings.persistenceEnabled 
            ? "Paper data persistence to PostgreSQL is active." 
            : "Paper data persistence to PostgreSQL is NOT active (backend issue or config)."
          }
          {settings.persistenceStatus === 'db_query_failed' && settings.persistenceEnabled && 
            <span className="text-orange-400 block"> Last database query failed.</span>
          }
          {settings.persistenceStatus === 'db_transaction_failed' && settings.persistenceEnabled && 
            <span className="text-orange-400 block"> Last database transaction failed. Data may not be saved.</span>
          }
           {settings.persistenceStatus === 'db_read_failed' && settings.persistenceEnabled && 
            <span className="text-orange-400 block"> Failed to read latest data from database. Using in-memory values.</span>
          }
          {settings.persistenceStatus === 'stubbed_session_no_db' && !settings.persistenceEnabled &&
            <span className="text-yellow-500 block"> Paper data is currently in-memory only (not saved to PostgreSQL).</span>
          }
           {settings.persistenceStatus === 'db_connection_failed' && !settings.persistenceEnabled &&
            <span className="text-red-500 block"> Failed to connect to PostgreSQL database. Persistence is off.</span>
          }
      </p>
    </Card>
  );
};

export default PaperTradingControlPanel;
