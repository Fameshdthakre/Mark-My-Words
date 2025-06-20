
import {
  BACKEND_API_URL,
  PAPER_TRADING_DATA_ENDPOINT,
  PAPER_TRADING_SESSION_ENDPOINT,
  PAPER_TRADING_TRADE_ENDPOINT
} from '../constants';
import {
  PaperTradingSettings,
  DhanHolding,
  PaperLedgerEntry,
  DhanOrderResponse,
  DhanOrderRequest
} from '../types';

interface PaperTradingDataResponse {
  settings: PaperTradingSettings;
  holdings: DhanHolding[];
  ledger: PaperLedgerEntry[];
  history: DhanOrderResponse[];
}

interface PaperTradeExecutionResponse {
  executedOrder: DhanOrderResponse;
  updatedSettings: PaperTradingSettings;
  updatedHoldings: DhanHolding[];
  newLedgerEntry?: PaperLedgerEntry; // Backend might send the new ledger entry too
}

// Helper function for API calls to paper trading backend
async function fetchFromPaperTradingBackend<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${BACKEND_API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // Ignore if response is not JSON
      }
      const errorMessage = errorData?.message || response.statusText || `HTTP error! status: ${response.status}`;
      // Add response status to the error message for more context
      throw new Error(`Paper Trading Backend API Error (${endpoint}): ${errorMessage} (Status: ${response.status})`);
    }

    if (response.status === 204) { // No content
      return null as T;
    }
    return response.json() as Promise<T>;

  } catch (networkError) {
    // Check if it's a TypeError and includes "Failed to fetch", which is common for network issues
    if (networkError instanceof TypeError && networkError.message.toLowerCase().includes('failed to fetch')) {
      throw new Error(`Network Error: Failed to fetch from backend at ${BACKEND_API_URL}${endpoint}. Server might be down, unreachable, or a CORS issue occurred. (Original: ${networkError.message})`);
    }
    // Re-throw other errors (like the one constructed above if !response.ok)
    throw networkError;
  }
}

export const fetchPaperTradingData = async (): Promise<PaperTradingDataResponse> => {
  return fetchFromPaperTradingBackend<PaperTradingDataResponse>(PAPER_TRADING_DATA_ENDPOINT, {
    method: 'GET',
  });
};

export const startNewPaperSession = async (initialBudget: number, mode: 'reset' | 'redefine'): Promise<PaperTradingSettings> => {
  return fetchFromPaperTradingBackend<PaperTradingSettings>(PAPER_TRADING_SESSION_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ initialBudget, mode }),
  });
};

export const executePaperTradeOrder = async (
  orderRequest: DhanOrderRequest,
  currentStockPriceForFill: number
): Promise<PaperTradeExecutionResponse> => {
  return fetchFromPaperTradingBackend<PaperTradeExecutionResponse>(PAPER_TRADING_TRADE_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ orderRequest, currentStockPriceForFill }),
  });
};
