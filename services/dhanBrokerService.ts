// This service now makes calls to YOUR OWN BACKEND SERVER.
// Your backend will then interact with the Dhan API.

import {
  DhanInstrument,
  DhanOrderRequest,
  DhanOrderResponse,
  DhanHolding,
  RawDhanHolding, // Import RawDhanHolding for mapping
  DhanPosition,
  DhanPositionConvertRequest,
  DhanPositionConvertResponse,
  DhanFundLimit,
  DhanTrade,
  DhanExchangeSegment,
  DhanOrderModificationRequest,
  DhanOrderSlicingResponseItem,
  DhanSuperOrderPlaceRequest,
  DhanSuperOrderPlaceResponse,
  DhanSuperOrderModifyRequest,
  DhanSuperOrderModifyResponse,
  DhanLegName,
  DhanSuperOrderCancelRequest, // conceptual, params are in path
  DhanSuperOrderCancelLegResponse,
  DhanSuperOrderListItem,
  // Data API Types
  DhanHistoricalDataRequest,
  DhanHistoricalDataResponse,
  DhanMarketQuoteLtpRequest,
  DhanLtpResponse,
  DhanMarketQuoteOhlcRequest,
  DhanOhlcResponse,
  DhanMarketQuoteFullRequest,
  DhanMarketFullQuoteResponse,
  DhanOptionChainRequest,
  DhanOptionChainResponse,
  DhanOptionChainExpiryListRequest,
  DhanOptionChainExpiryListResponse,
  // NEW Endpoint Types
  DhanEdisBulkFormRequest,
  DhanEdisFormRequest,
  DhanEdisFormResponse,
  DhanEdisInquireResponse,
  DhanLedgerRequestParams,
  DhanLedgerResponse,
  DhanTradeHistoryRequestParams,
  DhanTradeHistoryResponse,
  DhanMarginCalculatorRequest,
  DhanMarginCalculatorResponse,
} from '../types';
import {
  BACKEND_API_URL,
  DHAN_MOCK_CLIENT_ID, // This would eventually be managed by the backend per authenticated user
} from '../constants';

// Helper function for API calls
async function fetchFromBackend<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_API_URL}${endpoint}`, options);
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      // Ignore if response is not JSON
    }
    const errorMessage = errorData?.message || errorData?.detail || response.statusText || `HTTP error! status: ${response.status}`;
    throw new Error(`Backend API Error (${endpoint}): ${errorMessage}`);
  }
  // Handle cases where backend might return 204 No Content or similar for success
  if (response.status === 204 || response.status === 202) {
    return null as T; // Or an appropriate empty success value based on T
  }
  return response.json() as Promise<T>;
}


// ---- Instrument Search & Details ----
export const searchDhanInstruments = async (
  searchTerm: string,
  segment?: DhanExchangeSegment,
  // nseStockList is no longer needed here as backend handles search
): Promise<DhanInstrument[]> => {
  const queryParams = new URLSearchParams();
  queryParams.append('term', searchTerm);
  if (segment) {
    queryParams.append('segment', segment);
  }
  return fetchFromBackend<DhanInstrument[]>(`/instruments/search?${queryParams.toString()}`);
};

export const getDhanInstrumentDetails = async (securityId: string): Promise<DhanInstrument | null> => {
  return fetchFromBackend<DhanInstrument | null>(`/instruments/${securityId}`);
};

// ---- Order Management ----
export const placeDhanOrder = async (orderRequest: DhanOrderRequest): Promise<DhanOrderResponse> => {
  return fetchFromBackend<DhanOrderResponse>('/orders/place', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderRequest),
  });
};

export const modifyDhanOrder = async (orderId: string, modificationRequest: DhanOrderModificationRequest): Promise<DhanOrderResponse> => {
  return fetchFromBackend<DhanOrderResponse>(`/orders/modify/${orderId}`, {
    method: 'PUT', // Or POST, depending on backend design
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(modificationRequest),
  });
};

export const cancelDhanOrder = async (orderId: string, dhanClientId: string = DHAN_MOCK_CLIENT_ID): Promise<DhanOrderResponse> => {
  return fetchFromBackend<DhanOrderResponse>(`/orders/cancel/${orderId}`, {
    method: 'POST', // Or DELETE
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dhanClientId }), // Backend might get client_id from session
  });
};

export const placeDhanSlicingOrder = async (orderRequest: DhanOrderRequest): Promise<DhanOrderSlicingResponseItem[]> => {
   return fetchFromBackend<DhanOrderSlicingResponseItem[]>('/orders/slicing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderRequest),
  });
};

export const getDhanOrderDetails = async (orderId: string): Promise<DhanOrderResponse | null> => {
  return fetchFromBackend<DhanOrderResponse | null>(`/orders/${orderId}`);
};

export const getDhanOrderByCorrelationId = async (correlationId: string): Promise<DhanOrderResponse | null> => {
  return fetchFromBackend<DhanOrderResponse | null>(`/orders/external/${correlationId}`);
};

export const getDhanOrderBook = async (): Promise<DhanOrderResponse[]> => {
  return fetchFromBackend<DhanOrderResponse[]>('/orders');
};

export const getDhanTradeBook = async (): Promise<DhanTrade[]> => {
  return fetchFromBackend<DhanTrade[]>('/trades');
};

export const getDhanTradesByOrderId = async (orderId: string): Promise<DhanTrade[]> => {
  return fetchFromBackend<DhanTrade[]>(`/trades/${orderId}`);
};


// ---- Portfolio Management ----
export const getDhanHoldings = async (): Promise<DhanHolding[]> => {
  const rawHoldings = await fetchFromBackend<RawDhanHolding[]>('/portfolio/holdings');
  // Map raw API response to the internal DhanHolding type
  return rawHoldings.map(rawHolding => ({
    dhanClientId: DHAN_MOCK_CLIENT_ID, // Assuming this is added client-side or needs a default
    tradingSymbol: rawHolding.tradingSymbol,
    exchange: rawHolding.exchange,
    isin: rawHolding.isin,
    securityId: rawHolding.securityId,
    totalQty: rawHolding.totalQty,
    dpQty: rawHolding.dpQty,
    t1Qty: rawHolding.t1Qty,
    availableQty: rawHolding.availableQty,
    collateralQty: rawHolding.collateralQty,
    averageCostPrice: rawHolding.avgCostPrice, // Map from API name
    ltp: rawHolding.lastTradedPrice, // Map from API name
    closePrice: rawHolding.closePrice, // Pass through if available
    mtf_t1_qty: rawHolding.mtf_t1_qty, // New field
    mtf_qty: rawHolding.mtf_qty,       // New field
    // Calculated fields (investedValue, currentValue, pnl, dayPnl) are handled in App.tsx
  }));
};

export const getDhanPositions = async (): Promise<DhanPosition[]> => {
  return fetchFromBackend<DhanPosition[]>('/portfolio/positions');
};

export const convertDhanPosition = async (convertRequest: DhanPositionConvertRequest): Promise<DhanPositionConvertResponse> => {
  return fetchFromBackend<DhanPositionConvertResponse>('/portfolio/positions/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(convertRequest),
  });
};


// ---- Financial & Account APIs ----
export const getDhanFundLimits = async (): Promise<DhanFundLimit | null> => {
  return fetchFromBackend<DhanFundLimit | null>('/account/fundlimit');
};

// ---- Super Order APIs ----
export const placeDhanSuperOrder = async (request: DhanSuperOrderPlaceRequest): Promise<DhanSuperOrderPlaceResponse> => {
  return fetchFromBackend<DhanSuperOrderPlaceResponse>('/super/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
};

export const getDhanSuperOrdersList = async (): Promise<DhanSuperOrderListItem[]> => {
  return fetchFromBackend<DhanSuperOrderListItem[]>('/super/orders');
};

export const modifyDhanSuperOrder = async (orderId: string, request: DhanSuperOrderModifyRequest): Promise<DhanSuperOrderModifyResponse> => {
  return fetchFromBackend<DhanSuperOrderModifyResponse>(`/super/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
};

export const cancelDhanSuperOrderLeg = async (orderId: string, legName: DhanLegName): Promise<DhanSuperOrderCancelLegResponse> => {
  // Backend will construct the full path `/v2/super/orders/{order-id}/{order-leg}`
  return fetchFromBackend<DhanSuperOrderCancelLegResponse>(`/super/orders/${orderId}/${legName}`, {
    method: 'DELETE', // As per Dhan API documentation for cancelling a leg
  });
};


// --- DATA API FUNCTIONS ---
// These functions now assume your backend will proxy these requests to Dhan.
// The request/response types remain the same as they reflect Dhan's API structure.

export const getDhanHistoricalDailyData = async (request: DhanHistoricalDataRequest): Promise<DhanHistoricalDataResponse> => {
  return fetchFromBackend<DhanHistoricalDataResponse>('/charts/historical', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
};

export const getDhanHistoricalIntradayData = async (request: DhanHistoricalDataRequest): Promise<DhanHistoricalDataResponse> => {
  return fetchFromBackend<DhanHistoricalDataResponse>('/charts/intraday', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
};

export const getDhanMarketFeedLtp = async (request: DhanMarketQuoteLtpRequest): Promise<DhanLtpResponse> => {
  return fetchFromBackend<DhanLtpResponse>('/marketfeed/ltp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
};

export const getDhanMarketFeedOhlc = async (request: DhanMarketQuoteOhlcRequest): Promise<DhanOhlcResponse> => {
  return fetchFromBackend<DhanOhlcResponse>('/marketfeed/ohlc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
};

export const getDhanMarketFeedQuote = async (request: DhanMarketQuoteFullRequest): Promise<DhanMarketFullQuoteResponse> => {
  return fetchFromBackend<DhanMarketFullQuoteResponse>('/marketfeed/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
};

export const getDhanOptionChain = async (request: DhanOptionChainRequest): Promise<DhanOptionChainResponse> => {
  return fetchFromBackend<DhanOptionChainResponse>('/optionchain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
};

export const getDhanOptionChainExpiryList = async (request: DhanOptionChainExpiryListRequest): Promise<DhanOptionChainExpiryListResponse> => {
  return fetchFromBackend<DhanOptionChainExpiryListResponse>('/optionchain/expirylist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
};

// --- NEW Endpoint Functions ---

// EDIS Management
export const generateDhanEdisBulkForm = async (request: DhanEdisBulkFormRequest): Promise<DhanEdisFormResponse> => {
  return fetchFromBackend<DhanEdisFormResponse>('/edis/bulkform', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
};

export const generateDhanEdisForm = async (request: DhanEdisFormRequest): Promise<DhanEdisFormResponse> => {
  return fetchFromBackend<DhanEdisFormResponse>('/edis/form', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
};

export const generateDhanEdisTpin = async (): Promise<{ status: 'success' | 'error', message?: string }> => {
  // This Dhan API returns 202 Accepted on success with no body.
  // Backend should mirror this behavior or provide a JSON success message.
  const response = await fetch(`${BACKEND_API_URL}/edis/tpin`, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Backend API Error (/edis/tpin): ${response.statusText}`);
  }
  if (response.status === 202 || response.status === 204) {
    return { status: 'success', message: 'T-PIN generation initiated successfully.' };
  }
  return response.json();
};

export const getDhanEdisAuthorizedQuantity = async (isin: string): Promise<DhanEdisInquireResponse> => {
  return fetchFromBackend<DhanEdisInquireResponse>(`/edis/inquire/${isin}`);
};

// Account Reporting - Ledger
export const getDhanLedgerReport = async (params: DhanLedgerRequestParams): Promise<DhanLedgerResponse> => {
  const queryParams = new URLSearchParams(params as any).toString();
  return fetchFromBackend<DhanLedgerResponse>(`/ledger?${queryParams}`);
};

// Trade History (Paginated)
export const getDhanTradeHistory = async (params: DhanTradeHistoryRequestParams): Promise<DhanTradeHistoryResponse> => {
   const queryParams = new URLSearchParams(params as any).toString();
  return fetchFromBackend<DhanTradeHistoryResponse>(`/trades/history?${queryParams}`);
};

// Calculators - Margin Calculator
export const calculateDhanMargin = async (request: DhanMarginCalculatorRequest): Promise<DhanMarginCalculatorResponse> => {
  return fetchFromBackend<DhanMarginCalculatorResponse>('/margincalculator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
};
// End of dhanBrokerService.ts changes
