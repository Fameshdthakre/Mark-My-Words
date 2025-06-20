

import React from 'react';
import { PaperLedgerEntry } from '../types';
import Card from './shared/Card';
import { PAPER_LEDGER_TITLE } from '../constants'; // GOOGLE_SHEETS_DISCLAIMER removed

interface PaperLedgerPanelProps {
  entries: PaperLedgerEntry[];
}

const PaperLedgerPanel: React.FC<PaperLedgerPanelProps> = ({ entries }) => {

  const formatCurrency = (value: number | undefined) => 
    value !== undefined ? `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';

  return (
    <Card title={PAPER_LEDGER_TITLE} className="border-2 border-indigo-500">
      {entries.length === 0 ? (
        <p className="text-gray-400">Paper ledger is empty. Start trading to see entries.</p>
      ) : (
        <div className="space-y-1 max-h-96 overflow-y-auto pr-2 text-xs">
          <div className="grid grid-cols-5 gap-x-1 font-semibold text-gray-300 border-b border-gray-600 pb-1 mb-1 sticky top-0 bg-gray-800 z-10">
            <div className="col-span-2">Description</div>
            <div>Type</div>
            <div>Amount</div>
            <div>Balance</div>
          </div>
          {entries.map((entry) => (
            <div key={entry.id} className={`grid grid-cols-5 gap-x-1 py-1 ${entry.type === 'INFO' ? 'text-gray-400' : ''}`}>
              <div className="col-span-2 truncate" title={entry.description}>
                <span className="text-gray-500 text-[10px] mr-1">[{new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]</span>
                {entry.description}
              </div>
              <div className={entry.type === 'DEBIT' ? 'text-red-400' : entry.type === 'CREDIT' ? 'text-green-400' : 'text-blue-400'}>
                {entry.type}
              </div>
              <div className={entry.type === 'DEBIT' ? 'text-red-400' : entry.type === 'CREDIT' ? 'text-green-400' : ''}>
                {entry.type !== 'INFO' ? formatCurrency(entry.amount) : '-'}
              </div>
              <div className="font-medium text-gray-200">{formatCurrency(entry.balance)}</div>
            </div>
          ))}
        </div>
      )}
       <p className="text-xs text-gray-500 mt-3">
        Paper trading data is now persisted using Google Sheets via the backend.
      </p>
    </Card>
  );
};

export default PaperLedgerPanel;
