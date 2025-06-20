

import { DhanExchangeSegment, DhanInstrumentType, DhanOrderType, DhanProductType, DhanValidity, DhanEdisExchange, DhanEdisSegment, DhanAmoTime, DhanHistoricalInstrumentType } from './types';

export const GEMINI_TEXT_MODEL = "gemini-2.5-pro"; // Updated Model

export const APP_TITLE = "Dhan AI Trading Agent";

// MAX_NEWS_ITEMS removed
export const MAX_STRATEGIES = 2;

// --- Application Configuration ---
export const APP_SUBTITLE = "AI-powered stock analysis and trade signals. Integrated with Dhan API via backend. User Monitored.";
export const FOOTER_COPYRIGHT_TEXT_PREFIX = "&copy; ";
export const FOOTER_COPYRIGHT_TEXT_SUFFIX = " Dhan AI Trading Agent. AI Solution Designed by Famesh Thakre. Powered by Gemini API. Dhan API Ready.";
export const FOOTER_RISK_DISCLAIMER = "Trading involves substantial risk of loss. AI suggestions are for informational purposes only. Your capital is at risk.";

// --- Backend Related ---
// This URL will be where your custom backend server is running.
// For local development, it might be 'http://localhost:3001/api'.
export const BACKEND_API_URL = 'https://dhan-api-backend-984804457635.europe-west1.run.app/api'; // Your deployed Cloud Run URL with /api path
// export const BACKEND_API_URL = 'http://localhost:3001/api'; // For local backend testing

export const DHAN_MOCK_CLIENT_ID = "MOCK_CLIENT_ID"; // This would be managed by the backend per user

export const DEFAULT_EXCHANGE_SEGMENT: DhanExchangeSegment = 'NSE_EQ';
export const DEFAULT_INSTRUMENT_TYPE: DhanInstrumentType = 'EQUITY';
export const DEFAULT_PRODUCT_TYPE: DhanProductType = 'INTRADAY';
export const DEFAULT_ORDER_TYPE: DhanOrderType = 'MARKET';
export const DEFAULT_VALIDITY: DhanValidity = 'DAY';
export const DEFAULT_AMO_TIME: DhanAmoTime = 'OPEN';

// --- ID Prefixes (Frontend generated, if needed before backend assigns one) ---
export const AI_TRADE_CORRELATION_PREFIX = "AI_TRADE_";
export const SUPER_ORDER_CORRELATION_PREFIX = "AI_SUPER_"; // New prefix for super orders
export const FAILED_ORDER_ID_PREFIX = "FAILED_"; // For client-side failures
export const REJECTED_ORDER_ID_PREFIX = "REJECTED_"; // For user rejections
export const INITIAL_LOAD_SIGNAL_ID_PREFIX = "initial_load_"; // For signals derived from initial data
export const TRADE_SIGNAL_ID_PREFIX = "signal-";
export const AUTO_TRADE_LOG_ID_PREFIX = "autotrade-log-";
export const AUTO_TRADE_SIGNAL_ID_PREFIX = "auto-signal-";
export const PAPER_TRADE_ID_PREFIX = "PAPER_TRADE_";
export const PAPER_LEDGER_ID_PREFIX = "paper_ledger_";


// --- Error Messages & Titles (Gemini Service & UI) ---
export const ERROR_MSG_API_KEY_MISSING_TITLE = "API Key Error";
// Updated to reflect that API_KEY must come from process.env
export const ERROR_MSG_API_KEY_MISSING_DETAIL = "Gemini API key (process.env.API_KEY) not configured or accessible.";

export const ERROR_MSG_ANALYSIS_TITLE = "Error in analysis";
export const ERROR_MSG_ANALYSIS_DETAIL = "Could not retrieve detailed analysis from AI.";
export const ERROR_MSG_ANALYSIS_API_ERROR_DETAIL = "Failed to connect to AI for analysis.";

// News error messages removed

export const ERROR_MSG_STRATEGY_PARSE_TITLE = "Error parsing strategies";
export const ERROR_MSG_STRATEGY_PARSE_DETAIL = "Could not correctly parse strategies from AI.";
export const ERROR_MSG_STRATEGY_API_TITLE = "API Error generating strategies";
export const ERROR_MSG_STRATEGY_API_DETAIL = "Failed to connect to AI.";

export const ERROR_MSG_TRADE_DECISION_API_ERROR = "Error generating trade decision"; // Used if API call itself fails.

// --- News Item Constants (Gemini Service) removed ---

// --- UI Text Constants ---
// StockSearch.tsx
export const PLACEHOLDER_STOCK_SEARCH = "Enter stock symbol (e.g., RELIANCE)";
export const BUTTON_TEXT_ANALYZING = "Analyzing...";
export const BUTTON_TEXT_ANALYZE_STOCK = "Analyze Stock";

// TradeDecisionPanel.tsx
export const BUTTON_TEXT_ACKNOWLEDGE_HOLD = "Acknowledged HOLD";
export const BUTTON_TEXT_APPROVE_PREFIX = "Approve ";
export const BUTTON_TEXT_REJECT_SIGNAL = "Reject Signal";
export const MSG_TRADE_PANEL_REVIEW_CAREFULLY = "Review carefully. Approved BUY/SELL signals will be prepared for order placement."; // Updated

// StrategyInsights.tsx
export const DISCLAIMER_AI_SUGGESTIONS = "Disclaimer: These are AI-generated suggestions based on simulated data and not financial advice. Always do your own research.";

// LoadingSpinner.tsx
export const LOADING_SPINNER_DEFAULT_MESSAGE = "Loading...";

// ErrorDisplay.tsx
export const ERROR_DISPLAY_PREFIX = "Error: ";

// App.tsx specific UI messages
export const APP_FALLBACK_ERROR_MESSAGE = "An unknown error occurred.";
export const MISSING_DHAN_INSTRUMENT_DATA_ERROR = "Missing necessary Dhan instrument data (securityId or segment) to place trade.";
export const ORDER_PLACEMENT_FAILED_ERROR_PREFIX = "Failed to place order: "; // Updated
export const IDLE_MESSAGE_APP_START = "Enter a stock symbol to begin analysis and get a trade decision.";
export const NSE_DATA_LOAD_ERROR = "Failed to load essential stock list data. Some features like search suggestions might be affected.";

// --- NEW Constants for Endpoint Enums (as strings from API, mapped to types) ---

export const DHAN_EDIS_EXCHANGE_NSE: DhanEdisExchange = 'NSE';
export const DHAN_EDIS_EXCHANGE_BSE: DhanEdisExchange = 'BSE';
export const DHAN_EDIS_EXCHANGE_ALL: DhanEdisExchange = 'ALL';

export const DHAN_EDIS_SEGMENT_EQ: DhanEdisSegment = 'EQ';
export const DHAN_EDIS_SEGMENT_FNO: DhanEdisSegment = 'FNO';
export const DHAN_EDIS_SEGMENT_COMM: DhanEdisSegment = 'COMM';

// --- Automated Trading Engine ---
export const AUTO_ENGINE_TITLE = "Automated Trading Engine";
export const AUTO_ENGINE_START_BUTTON = "Start Automated Engine";
export const AUTO_ENGINE_STOP_BUTTON = "Stop Automated Engine";
export const AUTO_ENGINE_LOG_TITLE = "Engine Activity Log";
export const AUTO_ENGINE_SHORTLIST_TITLE = "AI Shortlisted Trades";
export const AUTO_ENGINE_STATUS_IDLE = "Engine is idle. Press Start to begin.";
export const AUTO_ENGINE_STATUS_RUNNING = "Engine is running...";
export const AUTO_ENGINE_STATUS_STOPPED = "Engine stopped.";
export const AUTO_ENGINE_VIEW_TITLE = "Automated Trading Engine - Live View";
// export const AUTO_ENGINE_MAX_STOCKS_TO_PROCESS = 10; // Removed as all stocks are processed now

// Benchmark Index Configuration (NIFTY 50 example)
export const BENCHMARK_INDEX_CONFIG = {
  symbol: "NIFTY 50",
  dhanSecurityId: "26000",
  exchangeSegment: 'IDX_I' as DhanExchangeSegment,
  instrumentType: 'INDEX' as DhanInstrumentType,
  historicalInstrumentType: 'INDEX' as DhanHistoricalInstrumentType,
};

// --- Paper Trading Constants ---
export const DEFAULT_PAPER_BUDGET = 100000; // Default ₹1,00,000
export const PAPER_TRADING_MODE_LABEL = "Paper Trading";
export const LIVE_TRADING_MODE_LABEL = "Live Trading (Real Money)"; // Updated
export const PAPER_TRADING_SETUP_TITLE = "Paper Trading Setup";
export const PAPER_LEDGER_TITLE = "Paper Trading Ledger";
export const PAPER_BALANCE_LABEL = "Paper Account Balance";
export const INSUFFICIENT_PAPER_FUNDS_MSG = "Insufficient paper funds for this trade.";
// GOOGLE_SHEETS_DISCLAIMER removed as it's now integrated

// --- Live Trading Constants ---
export const LIVE_TRADE_CONFIRMATION_MSG_PREFIX = "You are about to place a REAL trade with your Dhan account using REAL MONEY.";
export const LIVE_TRADE_CONFIRMATION_MSG_SUFFIX = "Are you sure you want to proceed?";
export const LIVE_TRADE_ORDER_FAILED_TITLE = "Live Order Failed";
export const LIVE_TRADE_ORDER_REJECTED_BY_USER_MSG = "Live order rejected by user confirmation.";

// --- Paper Trading Backend API Endpoints ---
export const PAPER_TRADING_BASE_ENDPOINT = "/paper-trading";
export const PAPER_TRADING_DATA_ENDPOINT = `${PAPER_TRADING_BASE_ENDPOINT}/data`;
export const PAPER_TRADING_SESSION_ENDPOINT = `${PAPER_TRADING_BASE_ENDPOINT}/session`;
export const PAPER_TRADING_TRADE_ENDPOINT = `${PAPER_TRADING_BASE_ENDPOINT}/trade`;

