

import React from 'react';
import { DhanFundLimit, TradingMode } from '../types';
import Card from './shared/Card';
import { PAPER_BALANCE_LABEL } from '../constants';

interface FundLimitsPanelProps {
  fundLimits: DhanFundLimit | null;
  paperBalance?: number;
  tradingMode: TradingMode;
  isLoading?: boolean;
}

const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '₹N/A';
  }
  return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const FundLimitItem: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight = false }) => (
  <div className="flex justify-between py-1.5 border-b border-gray-700 last:border-b-0">
    <span className="text-sm text-gray-400">{label}:</span>
    <span className={`text-sm font-semibold ${highlight ? 'text-emerald-400' : 'text-gray-100'}`}>{value}</span>
  </div>
);

const FundLimitsPanel: React.FC<FundLimitsPanelProps> = ({ fundLimits, paperBalance, tradingMode, isLoading }) => {
  const title = tradingMode === 'paper' ? PAPER_BALANCE_LABEL : "Fund Limits (Live Account)";
  
  return (
    <Card title={title}>
      {isLoading && <p className="text-gray-400">Loading data...</p>}
      {!isLoading && tradingMode === 'paper' && (
        <FundLimitItem label="Current Paper Balance" value={formatCurrency(paperBalance)} highlight={true} />
      )}
      {!isLoading && tradingMode === 'live' && !fundLimits && (
        <p className="text-gray-400">Fund limit data not available. Ensure backend is connected and Dhan API key is valid.</p>
      )}
      {!isLoading && tradingMode === 'live' && fundLimits && (
        <div className="space-y-0.5">
          <FundLimitItem label="Available Balance to Trade" value={formatCurrency(fundLimits.availabelBalance)} highlight={true} />
          <FundLimitItem label="Start of Day (SOD) Limit" value={formatCurrency(fundLimits.sodLimit)} />
          <FundLimitItem label="Collateral Amount" value={formatCurrency(fundLimits.collateralAmount)} />
          <FundLimitItem label="Receivable Amount" value={formatCurrency(fundLimits.receiveableAmount)} />
          <FundLimitItem label="Utilized Margin Today" value={formatCurrency(fundLimits.utilizedAmount)} />
          <FundLimitItem label="Blocked for Payout" value={formatCurrency(fundLimits.blockedPayoutAmount)} />
          <FundLimitItem label="Withdrawable Balance" value={formatCurrency(fundLimits.withdrawableBalance)} />
          <p className="text-xs text-gray-500 mt-2">Dhan Client ID: {fundLimits.dhanClientId || 'N/A'}</p>
        </div>
      )}
      <p className="text-xs text-gray-500 mt-3">
        {tradingMode === 'live' 
          ? "Fund limits are fetched from your broker (Dhan) via the backend."
          : "Paper balance is managed locally for simulation."
        }
      </p>
    </Card>
  );
};

export default FundLimitsPanel;
