

export interface StockPricePoint {
  date: string;
  price: number;
}

export interface StockFundamentals {
  marketCap: string;
  peRatio: number | string;
  eps: number | string;
  dividendYield: number | string;
  bookValue: number | string;
}

export interface StockTechnicals {
  sma50: number;
  sma200: number;
  rsi: number;
  macdLine: number;
  macdSignal: number;
  supportLevel: number;
  resistanceLevel: number;
}

// Represents enriched stock data, potentially including Dhan-specific identifiers
export interface DhanStockData {
  symbol: string; // User-friendly symbol like "RELIANCE"
  name: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  historicalData: StockPricePoint[];
  fundamentals?: StockFundamentals; // Made optional
  technicals?: StockTechnicals;   // Made optional
  volume: string;
  dayHigh: number;
  dayLow: number;
  // Dhan-specific fields, to be populated after instrument lookup
  dhanSecurityId?: string; // Dhan's unique numeric ID for the instrument
  exchangeSegment?: DhanExchangeSegment; 
  instrumentType?: DhanInstrumentType; // High-level e.g., EQUITY, FUTSTK (derived from SEM_INSTRUMENT_NAME)
  // Fields from Market Quote API
  ltp?: number;
  ohlc?: DhanOhlcData;
  marketDepth?: DhanMarketDepthData;
  openInterest?: number;
  lastTradeTime?: string; // From full quote
  lastTradeQuantity?: number; // From full quote
  lowerCircuitLimit?: number;
  upperCircuitLimit?: number;
  averageTradePrice?: number; // From full quote
}


// NewsItem removed

export interface GeminiAnalysis {
  marketSentiment: string;
  keyObservations: string;
}

export interface SwingStrategy {
  strategyTitle: string;
  entryCondition: string;
  targetPrice: string;
  stopLoss: string;
  riskAssessment:string;
}

export type AppState = 'idle' | 'loading' | 'success' | 'error' | 'awaiting_trade_decision';

// --- Types aligned with Dhan API Documentation ---

export type DhanTransactionType = 'BUY' | 'SELL';
export type DhanOrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'STOP_LOSS_MARKET';
export type DhanProductType = 'CNC' | 'INTRADAY' | 'MARGIN' | 'MTF' | 'CO' | 'BO';
export type DhanValidity = 'DAY' | 'IOC';

export type DhanExchangeSegment =
  | 'IDX_I'          // Index (Index Value)
  | 'NSE_EQ'         // NSE Equity Cash
  | 'NSE_FNO'        // NSE Futures & Options
  | 'NSE_CURRENCY'   // NSE Currency
  | 'BSE_EQ'         // BSE Equity Cash
  | 'MCX_COMM'       // MCX Commodity
  | 'BSE_CURRENCY'   // BSE Currency
  | 'BSE_FNO';       // BSE Futures & Options

export type DhanInstrumentType = 
  | 'EQUITY' 
  | 'FUTIDX' 
  | 'FUTSTK' 
  | 'FUTCOM' 
  | 'OPTIDX' 
  | 'OPTSTK' 
  | 'OPTCOM'
  | 'INDEX' 
  | 'CURRENCY' 
  | 'COMMODITY';

export type DhanOrderStatus =
  | 'TRANSIT'
  | 'PENDING'
  | 'REJECTED'
  | 'CANCELLED'
  | 'TRADED'
  | 'EXPIRED'
  | 'PART_TRADED'
  | 'CONFIRM' 
  | 'CLOSED' 
  | 'TRIGGERED' 
  | 'MODIFIED' // Added from OCR for super order status
  | 'INACTIVE' // Added from OCR for super order status
  | 'PENDING_APPROVAL' 
  | 'APPROVED_BY_USER' 
  | 'SENT_TO_BROKER'   
  | 'FAILED_ON_CLIENT' 
  | 'CANCELLED_BY_USER'
  | 'PAPER_TRADED' 
  | 'PAPER_REJECTED' 
  | 'UNKNOWN'; 

export type DhanAmoTime = 'PRE_OPEN' | 'OPEN' | 'OPEN_30' | 'OPEN_60';

export interface TradeSignal {
  id: string;
  symbol: string; 
  action: 'BUY' | 'SELL' | 'HOLD';
  quantity?: number;
  targetPrice?: number;
  stopLossPrice?: number;
  confidence?: 'High' | 'Medium' | 'Low';
  reasoning: string;
  timestamp: string;
  relatedStockData?: DhanStockData; 
}

export interface DhanOrderRequest {
  dhanClientId?: string; 
  correlationId?: string; 
  transactionType: DhanTransactionType;
  exchangeSegment: DhanExchangeSegment;
  productType: DhanProductType;
  orderType: DhanOrderType;
  validity: DhanValidity;
  securityId: string; 
  quantity: number;
  disclosedQuantity?: number; 
  price?: number; 
  triggerPrice?: number; 
  afterMarketOrder?: boolean; 
  amoTime?: DhanAmoTime; 
  boProfitValue?: number; 
  boStopLossValue?: number; 
}

export interface DhanOrderModificationRequest {
  dhanClientId: string;
  orderId: string; 
  orderType: DhanOrderType; 
  legName?: DhanLegName; 
  quantity?: number; 
  price?: number; 
  disclosedQuantity?: number;
  triggerPrice?: number; 
  validity: DhanValidity; 
}

export interface DhanOrderResponse {
  dhanClientId: string;
  orderId: string; // OCR for cancel super order response uses 'orderld' - will map to orderId in backend if Dhan sends that
  exchangeOrderId?: string; 
  correlationId?: string;
  orderStatus: DhanOrderStatus | string; 
  transactionType: DhanTransactionType;
  exchangeSegment: DhanExchangeSegment;
  productType: DhanProductType;
  orderType: DhanOrderType;
  validity: DhanValidity;
  securityId: string;
  tradingSymbol?: string; 
  quantity: number;
  disclosedQuantity?: number;
  price: number; 
  triggerPrice?: number;
  afterMarketOrder?: boolean; 
  boProfitValue?: number; 
  boStopLossValue?: number; 
  legName?: string; 
  filledQty: number; 
  averageTradedPrice: number; 
  remainingQuantity?: number; 
  createdTime?: string; 
  updateTime?: string; 
  exchangeTime?: string; 
  omsErrorCode?: string; 
  omsErrorDescription?: string;
  algoId?: string; 
  drvExpiryDate?: string | null; 
  drvOptionType?: DhanOptionType | null; 
  drvStrikePrice?: number | null; 
  signalId?: string; 
  clientOrderStatus?: DhanOrderStatus; 
}

export interface DhanOrderSlicingResponseItem {
  orderId: string;
  orderStatus: string; 
}

export interface RawDhanHolding {
  exchange: string;
  tradingSymbol: string;
  securityId: string;
  isin: string;
  totalQty: number;
  dpQty: number;
  t1Qty: number;
  mtf_t1_qty?: number; 
  mtf_qty?: number;    
  availableQty: number;
  collateralQty?: number;
  avgCostPrice: number;    
  lastTradedPrice?: number; 
  closePrice?: number; 
}


export interface DhanHolding {
  dhanClientId: string; 
  tradingSymbol: string;
  exchange: string; 
  isin: string;
  securityId: string; 
  totalQty: number; 
  dpQty: number; 
  t1Qty: number; 
  availableQty: number; 
  collateralQty?: number; 
  averageCostPrice: number; 
  ltp?: number; 
  closePrice?: number; 
  investedValue?: number; 
  currentValue?: number;  
  pnl?: number;           
  dayPnl?: number;        
  mtf_t1_qty?: number;    
  mtf_qty?: number;       
}

export type DhanOptionType = 'CE' | 'PE' | null;
export type DhanExpiryFlag = 'M' | 'W'; 
export type DhanOrderAvailability = 'Y' | 'N'; 
export type DhanAsmGsmFlag = 'N' | 'R' | 'Y'; 
export type DhanBuySellIndicator = 'A'; 

export interface DhanInstrument {
  SEM_SECURITY_ID: string; 
  SEM_EXM_EXCH_ID: string; 
  SEM_SEGMENT: string; 
  isin?: string; 
  SM_SYMBOL_NAME: string; 
  SEM_TRADING_SYMBOL?: string; 
  SEM_CUSTOM_SYMBOL: string; 
  SEM_INSTRUMENT_NAME: string; 
  SEM_EXCH_INSTRUMENT_TYPE?: string; 
  SEM_SERIES?: string; 
  SEM_LOT_UNITS?: number; 
  SEM_TICK_SIZE?: number; 
  SEM_EXPIRY_CODE?: string; 
  semExpiryDate?: string; 
  semStrikePrice?: number; 
  semOptionType?: DhanOptionType; 
  semExpiryFlag?: DhanExpiryFlag; 
  smUnderlyingSecurityId?: string; 
  smUnderlyingSymbol?: string; 
  bracketFlag?: DhanOrderAvailability; 
  coverFlag?: DhanOrderAvailability; 
  asmGsmFlag?: DhanAsmGsmFlag; 
  asmGsmCategory?: string; 
  buySellIndicator?: DhanBuySellIndicator; 
  mtfLeverage?: number; 
}

export interface DhanFundLimit {
    dhanClientId: string; 
    availabelBalance: number; 
    sodLimit: number; 
    collateralAmount: number;
    receiveableAmount: number;
    utilizedAmount: number;
    blockedPayoutAmount: number;
    withdrawableBalance: number;
}

export interface DhanTrade {
    dhanClientId: string;
    orderId: string;
    exchangeOrderId: string;
    exchangeTradeId: string;
    transactionType: DhanTransactionType;
    exchangeSegment: DhanExchangeSegment;
    productType: DhanProductType;
    orderType: DhanOrderType; 
    tradingSymbol: string;
    securityId: string;
    tradedQuantity: number;
    tradedPrice: number;
    createTime: string; 
    updateTime?: string;
    exchangeTime?: string;
    drvExpiryDate?: string | null;
    drvOptionType?: DhanOptionType | null;
    drvStrikePrice?: number | null;
    customSymbol?: string;
}

export type DhanPositionType = 'LONG' | 'SHORT' | 'CLOSED';

export interface DhanPosition {
  dhanClientId: string;
  tradingSymbol: string;
  securityId: string;
  positionType: DhanPositionType;
  exchangeSegment: DhanExchangeSegment;
  productType: DhanProductType;
  buyAvg: number;
  buyQty: number;
  costPrice: number; 
  sellAvg: number;
  sellQty: number;
  netQty: number;
  realizedProfit: number;
  unrealizedProfit: number;
  rbiReferenceRate: number;
  multiplier: number;
  carryForwardBuyQty: number;
  carryForwardSellQty: number;
  carryForwardBuyValue: number;
  carryForwardSellValue: number;
  dayBuyQty: number;
  daySellQty: number;
  dayBuyValue: number;
  daySellValue: number;
  drvExpiryDate: string; 
  drvOptionType: DhanOptionType | null; 
  drvStrikePrice: number;
  crossCurrency: boolean;
}

export interface DhanPositionConvertRequest {
  dhanClientId: string;
  fromProductType: DhanProductType;
  exchangeSegment: DhanExchangeSegment;
  positionType: DhanPositionType;
  securityId: string;
  convertQty: number;
  toProductType: DhanProductType;
}

export interface DhanPositionConvertResponse {
  status: string; 
  message?: string;
  httpStatusCode: number; 
}

export type DhanOrderFlag = 'OCO' | 'SINGLE'; 
export type DhanLegName = 'ENTRY_LEG' | 'TARGET_LEG' | 'STOP_LOSS_LEG'; 


// Super Order Types (based on OCR and logical structure)
export interface DhanSuperOrderPlaceRequest {
  dhanClientId: string; // Added by backend
  correlationId?: string; // Optional user/partner generated id
  transactionType: DhanTransactionType; // BUY or SELL
  exchangeSegment: DhanExchangeSegment; // e.g., NSE_EQ
  productType: DhanProductType; // e.g., CNC, INTRADAY
  orderType: DhanOrderType; // For Entry Leg: LIMIT or MARKET
  securityId: string; // Exchange standard identification for scrip
  quantity: number; // Number of shares for the order
  price: number; // Price at which order is placed (Mandatory for LIMIT entry order)
  targetPrice: number; // Target price for the Super Order
  stopLossPrice: number; // Stop Loss price for the Super Order
  trailingJump?: number; // Optional: Price jump by which Stop Loss should be trailed
}

export interface DhanSuperOrderPlaceResponse {
  orderId: string; // Order specific identification generated by Dhan (OCR had orderld)
  orderStatus: DhanOrderStatus | string; // e.g., TRANSIT, PENDING
}

export interface DhanSuperOrderModifyRequest {
  dhanClientId: string; // User specific identification
  orderId: string; // This is the main Super Order ID from placement.
  orderType: DhanOrderType; // LIMIT or MARKET (for modifying entry leg type)
  legName: DhanLegName; // ENTRY_LEG, STOP_LOSS_LEG, TARGET_LEG
  quantity?: number; // Quantity to be modified - only for ENTRY_LEG
  price?: number; // Price to be modified - only for ENTRY_LEG (if it's LIMIT)
  targetPrice?: number; // Target Price to be modified - ENTRY_LEG or TARGET_LEG
  stopLossPrice?: number; // Stop Loss Price to be modified - ENTRY_LEG or STOP_LOSS_LEG
  trailingJump?: number; // Stop Loss Price jump - ENTRY_LEG or STOP_LOSS_LEG
}

export interface DhanSuperOrderModifyResponse {
  orderId: string; // Order specific identification (OCR had orderld)
  orderStatus: DhanOrderStatus | string;
}

// For canceling a specific leg
export interface DhanSuperOrderCancelRequest { // This is a conceptual name, API uses DELETE with path params
    orderId: string;
    legName: DhanLegName; // order-leg from API doc
}

export interface DhanSuperOrderCancelLegResponse {
  orderId: string; // Order specific identification (OCR had orderld)
  orderStatus: DhanOrderStatus | string; // e.g., CANCELLED
}

export interface DhanSuperOrderLegDetail {
  orderId: string; // Order specific identification for this leg generated by Dhan
  legName: DhanLegName; // STOP_LOSS_LEG, TARGET_LEG
  transactionType: DhanTransactionType; // BUY or SELL (for the leg)
  remainingQuantity: number; // Number of shares yet to be traded for the leg
  price: number; // Price at which the order is requested to execute for the leg (trigger price for SL/Target)
  orderStatus: DhanOrderStatus | string; // PENDING, TRIGGERED, CANCELLED, EXPIRED etc.
  trailingJump?: number; // Price Jump by which Stop Loss should be trailed (only for SL leg)
  averageTradedPrice?: number; // Added from OCR for leg details
  filledQty?: number; // Added from OCR for leg details
}

export interface DhanSuperOrderListItem {
  dhanClientId: string;
  orderId: string;
  exchangeOrderId?: string;
  correlationId?: string;
  orderStatus: DhanOrderStatus | string; // Overall status of the super order (e.g., TRANSIT, PENDING, TRADED, CLOSED)
  transactionType: DhanTransactionType; // BUY or SELL
  exchangeSegment: DhanExchangeSegment;
  productType: DhanProductType;
  orderType: DhanOrderType; // LIMIT, MARKET (for the entry leg)
  validity: DhanValidity; // DAY, IOC (for the entry leg)
  tradingSymbol: string;
  securityId: string;
  quantity: number; // Total quantity for the entry leg
  remainingQuantity: number; // Remaining quantity for the entry leg
  ltp?: number; // Price at which the stock is currently trading
  price: number; // Price at which the entry order was requested/executed
  afterMarketOrder: boolean;
  legName: DhanLegName; // Name of the main leg (typically ENTRY_LEG)
  createTime: string;
  updateTime: string;
  exchangeTime: string;
  omsErrorDescription?: string;
  algoId?: string; // Algo ID
  averageTradedPrice: number; // Average price at which order is traded (for entry leg)
  filledQty: number; // Quantity of order traded on Exchange (for entry leg)
  legDetails: DhanSuperOrderLegDetail[]; // Array of Leg Details (for Target and Stop Loss legs)
}


// --- DATA API TYPES (as defined previously) ---

// Historical Data API
export type DhanHistoricalInstrumentType = 'EQUITY' | 'FUTSTK' | 'FUTIDX' | 'FUTCOM' | 'OPTIDX' | 'OPTSTK' | 'OPTCOM' | 'INDEX';

export interface DhanHistoricalDataRequest {
  securityId: string;
  exchangeSegment: DhanExchangeSegment;
  instrument: DhanHistoricalInstrumentType; 
  expiryCode?: number; 
  fromDate: string; 
  toDate: string; 
  oi?: boolean; 
  interval?: '1' | '5' | '15' | '25' | '60'; 
}

export interface DhanHistoricalDataResponse {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  timestamp: number[]; 
  open_interest?: number[]; 
  status?: string; 
  remarks?: { title: string, message: string }; 
}

// New type for display-friendly historical data
export interface HistoricalDataPoint {
  date: string; 
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  openInterest?: number;
}


// Market Quote API Types
export interface DhanMarketQuoteInstrument {
  exchangeSegment: DhanExchangeSegment;
  securityId: string;
}

export interface DhanMarketQuoteLtpRequest {
  instruments: DhanMarketQuoteInstrument[];
  requestType: 'ltp'; 
}
export interface DhanMarketQuoteOhlcRequest {
  instruments: DhanMarketQuoteInstrument[];
  requestType: 'ohlc';
}
export interface DhanMarketQuoteFullRequest {
  instruments: DhanMarketQuoteInstrument[];
  requestType: 'full';
}

export interface DhanLtpData {
  lastPrice: number;
  securityId: string; 
  exchangeSegment: DhanExchangeSegment; 
}

export interface DhanLtpResponse {
  status: 'success' | 'error';
  remarks?: { title: string, message: string };
  data?: Record<DhanExchangeSegment, Record<string, { last_price: number }>>; 
  parsedData?: DhanLtpData[]; 
}


export interface DhanOhlcData {
  open: number;
  high: number;
  low: number;
  close: number;
}
export interface DhanOhlcEntry {
  last_price: number;
  ohlc: DhanOhlcData;
  securityId: string; 
  exchangeSegment: DhanExchangeSegment; 
}

export interface DhanOhlcResponse {
  status: 'success' | 'error';
  remarks?: { title: string, message: string };
  data?: Record<DhanExchangeSegment, Record<string, Omit<DhanOhlcEntry, 'securityId' | 'exchangeSegment'>>>; 
  parsedData?: DhanOhlcEntry[]; 
}


export interface DhanMarketDepthLevel {
  quantity: number;
  orders: number;
  price: number;
}

export interface DhanMarketDepthData {
  buy: DhanMarketDepthLevel[];
  sell: DhanMarketDepthLevel[];
}

export interface DhanMarketFullQuoteDataEntry {
  average_price: number;
  buy_quantity: number;
  depth?: DhanMarketDepthData; 
  last_price: number;
  last_quantity: number;
  last_trade_time: string; 
  lower_circuit_limit: number;
  net_change: number;
  ohlc: DhanOhlcData;
  oi: number;
  oi_day_high: number;
  oi_day_low: number;
  sell_quantity: number;
  upper_circuit_limit: number;
  volume: number;
  securityId: string; 
  exchangeSegment: DhanExchangeSegment; 
}

export interface DhanMarketFullQuoteResponse {
  status: 'success' | 'error';
  remarks?: { title: string, message: string };
  data?: Record<DhanExchangeSegment, Record<string, Omit<DhanMarketFullQuoteDataEntry, 'securityId' | 'exchangeSegment'>>>; 
  parsedData?: DhanMarketFullQuoteDataEntry[]; 
}


// Option Chain API Types
export interface DhanOptionChainRequest {
  underlyingScrip: string; 
  underlyingSeg: 'IDX_I' | 'NSE_EQ' | 'NSE_FNO' | 'MCX_COMM'; 
  expiry: string; 
}

export interface DhanOptionChainExpiryListRequest {
  underlyingScrip: string; 
  underlyingSeg: 'IDX_I' | 'NSE_EQ' | 'NSE_FNO' | 'MCX_COMM';
}

export interface DhanOptionGreekData {
  delta: number;
  theta: number;
  gamma: number;
  vega: number;
  iv?: number; 
}

export interface DhanOptionChainStrikeDataItem {
  greeks: DhanOptionGreekData;
  implied_volatility: number;
  last_price: number;
  oi: number;
  previous_close_price: number;
  previous_oi: number;
  previous_volume: number;
  top_ask_price: number;
  top_ask_quantity: number;
  top_bid_price: number;
  top_bid_quantity: number;
  volume: number;
  securityId?: string; 
}

export interface DhanOptionChainStrikeData {
  strikePrice: number; 
  ce?: DhanOptionChainStrikeDataItem;
  pe?: DhanOptionChainStrikeDataItem;
}

export interface DhanOptionChainData {
  last_price: number; 
  oc: Record<string, { ce?: DhanOptionChainStrikeDataItem, pe?: DhanOptionChainStrikeDataItem }>; 
  parsedStrikes?: DhanOptionChainStrikeData[]; 
}

export interface DhanOptionChainResponse {
  data: DhanOptionChainData;
  status: 'success' | 'error';
  remarks?: { title: string, message: string };
}

export interface DhanOptionChainExpiryListResponse {
  data: string[]; 
  status: 'success' | 'error';
  remarks?: { title: string, message: string };
}


// Types for WebSocket Feeds (logical structure after parsing binary)

// For 20 Market Depth (depth-api-feed.dhan.co)
export interface DhanMarketDepth20SubscriptionInstrument {
  exchangeSegment: DhanExchangeSegment;
  securityId: string;
}
export interface DhanMarketDepth20SubscriptionRequest {
  RequestCode: 23; 
  InstrumentCount: number;
  InstrumentList: DhanMarketDepth20SubscriptionInstrument[];
}
export interface DhanMarketDepth20ResponseHeader { 
  messageLength: number; 
  feedResponseCode: number; 
  exchangeSegment: number; 
  securityId: number; 
  messageSequence: number; 
}
export interface DhanMarketDepth20LevelData { 
  price: number; 
  quantity: number; 
  numOrders: number; 
}
export interface DhanMarketDepth20Packet {
  header: DhanMarketDepth20ResponseHeader;
  isBidPacket: boolean; 
  depthLevels: DhanMarketDepth20LevelData[]; 
}

// For Live Market Feed (api-feed.dhan.co)
export type DhanLiveFeedMode = 'ltp' | 'quote' | 'full'; 
export const DhanLiveFeedRequestCode = { 
    SUBSCRIPTION: 15, 
    UNSUBSCRIPTION: 17, 
    TICKER_FEED: 2, 
    QUOTE_FEED: 4,  
    FULL_FEED: 8,   
};

export interface DhanLiveFeedInstrument {
  exchangeSegment: DhanExchangeSegment;
  securityId: string;
}
export interface DhanLiveFeedSubscriptionJSON {
  RequestCode: number; 
  InstrumentCount: number;
  InstrumentList: DhanLiveFeedInstrument[];
  mode?: DhanLiveFeedMode; 
}

export interface DhanLiveFeedGenericResponseHeader { 
  feedResponseCode: number; 
  messageLength: number; 
  exchangeSegmentCode: number; 
  securityId: number; 
}

export interface DhanTickerData {
  lastTradedPrice: number; 
  lastTradedTime: number; 
}
export interface DhanPrevCloseData {
  prevClosePrice: number; 
}
export interface DhanQuoteData {
  latestTradedPrice: number; 
  lastTradedQuantity: number; 
  lastTradedTime: number; 
  avgTradePrice: number; 
  volume: number; 
  totalSellQuantity: number; 
  totalBuyQuantity: number; 
  dayOpenValue: number; 
  dayCloseValue?: number; 
  dayHighValue: number; 
  dayLowValue: number; 
}
export interface DhanOpenInterestData {
  openInterest: number; 
}
export interface DhanMarketDepth5LevelItem { 
  bidQuantity: number; 
  askQuantity: number; 
  numBidOrders: number; 
  numAskOrders: number; 
  bidPrice: number; 
  askPrice: number; 
}
export interface DhanFullFeedData extends DhanQuoteData {
  openInterest?: number; 
  highestOpenInterestDay?: number; 
  lowestOpenInterestDay?: number; 
  marketDepth5Levels?: DhanMarketDepth5LevelItem[]; 
}

export interface DhanFeedDisconnectMessageData { 
  disconnectionReasonCode: number; 
}

// --- NEW Endpoint Types ---

// EDIS Management
export type DhanEdisExchange = 'NSE' | 'BSE' | 'MCX' | 'ALL';
export type DhanEdisSegment = 'EQ' | 'COMM' | 'FNO';

export interface DhanEdisBulkFormRequest {
  isin: string[];
  exchange: DhanEdisExchange;
  segment: DhanEdisSegment;
}

export interface DhanEdisFormRequest {
  isin: string;
  qty: number; 
  exchange: DhanEdisExchange;
  segment: DhanEdisSegment;
  bulk: boolean;
}

export interface DhanEdisFormResponse {
  dhanClientId: string;
  edisFormHtml: string; 
}


export interface DhanEdisInquireResponse { 
  clientId: string; 
  isin: string;
  totalQty: string; 
  aprvdQty: string; 
  status: string;
  remarks: string;
}

// Account Reporting - Ledger
export interface DhanLedgerRequestParams {
  fromDate: string; 
  toDate: string;   
}

export interface DhanLedgerEntry { 
  dhanClientId: string;
  narration: string;
  voucherdate: string; 
  exchange: string;
  voucherdesc: string;
  vouchernumber: string;
  debit: string; 
  credit: string; 
  runbal: string; 
}

export type DhanLedgerResponse = DhanLedgerEntry[]; 

// Trade History (Paginated)
export interface DhanTradeHistoryRequestParams {
  fromDate: string;    
  toDate: string;      
  pageNumber: string;  
}

export interface DhanTradeHistoryEntry extends DhanTrade { 
  isin: string;
  instrument: string; 
  sebiTax: number;
  stt: number;
  brokerageCharges: number;
  serviceTax: number;
  exchangeTransactionCharges: number;
  stampDuty: number;
}
export type DhanTradeHistoryResponse = DhanTradeHistoryEntry[];

// Calculators - Margin Calculator
export interface DhanMarginCalculatorRequest { 
  dhanClientId: string;
  exchangeSegment: DhanExchangeSegment;
  transactionType: DhanTransactionType;
  quantity: number;
  productType: DhanProductType;
  securityId: string;
  price: number;
  triggerPrice?: number;
}

export interface DhanMarginCalculatorResponse { 
  totalMargin: number;
  spanMargin: number;
  exposureMargin: number;
  availableBalance: number; 
  variableMargin: number;
  insufficientBalance: number; 
  brokerage: number;
  leverage: string; 
}

// --- End of NEW Endpoint Types ---


export type { DhanOrderResponse as TradeOrder }; 
export type { DhanHolding as UserHolding };     
export type { DhanOrderStatus as OrderStatus };

// Ensure DhanStockData is the primary export for general stock information
export type StockData = DhanStockData;


// --- NEW Type for NseTotalMarketStockDetails.json ---
export interface NseTotalMarketStockInfo {
  SYMBOL: string;
  "NAME OF COMPANY": string;
  "ISIN NUMBER": string;
  "SECURITY ID": number;
  SERIES: string;
  "DATE OF LISTING": string;
  "PAID UP VALUE": number;
  "MARKET LOT": number;
  "FACE VALUE": number;
  // Potential additions for direct use in historical data fetcher if available
  DHAN_SECURITY_ID?: string; 
  DHAN_EXCHANGE_SEGMENT?: DhanExchangeSegment;
  DHAN_INSTRUMENT_TYPE?: DhanHistoricalInstrumentType;
}

// --- NEW Type for Automated Trading Engine ---
export interface AutomatedTradingLogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'trade_placed' | 'ai_decision';
  details?: string | TradeSignal | DhanOrderResponse | Error;
}

// --- NEW Types for Paper Trading ---
export type TradingMode = 'live' | 'paper';

export interface PaperTradingSettings {
  initialBudget: number;
  currentBalance: number;
  sessionActive: boolean;
  persistenceEnabled?: boolean; // Added to indicate if sheets are active
  persistenceStatus?: 'success' | 'failed' | 'stubbed' | 'initializing' | 'db_connected' | 'db_connection_failed' | 'db_query_failed' | 'db_transaction_failed' | 'db_read_failed' | 'stubbed_session_no_db' | 'pending_db_operation' | 'db_success' | 'db_success_partial_log' | 'db_write_failed'; // Added for specific operation status
  sheetError?: boolean; // General flag for sheet issues
  error?: string; // Optional error message
}

export interface PaperLedgerEntry {
  id: string;
  timestamp: string;
  description: string; 
  type: 'DEBIT' | 'CREDIT' | 'INFO'; 
  amount: number; 
  balance: number; 
}
