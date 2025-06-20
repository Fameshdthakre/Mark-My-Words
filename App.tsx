
import React, { useState, useCallback, useEffect } from 'react';
import StockSearch from './components/StockSearch';
import StockDashboard from './components/StockDashboard';
import LoadingSpinner from './components/shared/LoadingSpinner';
import ErrorDisplay from './components/shared/ErrorDisplay';
import TradeDecisionPanel from './components/TradeDecisionPanel';
import OrderPlacementPanel from './components/OrderPlacementPanel'; 
import MarginCalculatorPanel from './components/MarginCalculatorPanel'; 
import ActiveHoldingsPanel from './components/ActiveHoldingsPanel';
import OpenPositionsPanel from './components/OpenPositionsPanel'; 
import FundLimitsPanel from './components/FundLimitsPanel';
import OrderHistoryPanel from './components/OrderHistoryPanel';
import AutomatedTradingEnginePanel from './components/AutomatedTradingEnginePanel'; 
import AutomatedTradingEngineConfigPanel from './components/AutomatedTradingEngineConfigPanel'; // New
import HistoricalDataFetcher from './components/HistoricalDataFetcher'; 
import PaperTradingControlPanel from './components/PaperTradingControlPanel'; 
import PaperLedgerPanel from './components/PaperLedgerPanel'; 
import SuperOrderPlacementPanel from './components/SuperOrderPlacementPanel'; // New
import SuperOrderListPanel from './components/SuperOrderListPanel'; // New


import { 
  generateStockAnalysis, 
  generateSwingStrategies, 
  generateTradeDecision,
  generateHistoricalAnalysisAndShortlist 
} from './services/geminiService';
import { 
  placeDhanOrder, 
  getDhanHoldings, 
  getDhanPositions, 
  convertDhanPosition, 
  getDhanOrderBook, 
  searchDhanInstruments,
  getDhanFundLimits, 
  getDhanHistoricalDailyData, 
  getDhanHistoricalIntradayData, 
  calculateDhanMargin,
  placeDhanSuperOrder,
  getDhanSuperOrdersList,
  modifyDhanSuperOrder,
  cancelDhanSuperOrderLeg,
} from './services/dhanBrokerService'; 
import {
  fetchPaperTradingData,
  startNewPaperSession,
  executePaperTradeOrder
} from './services/paperTradingService'; 
import { calculateSMA, calculateRSI } from './utils/technicalIndicators'; 

import { 
  StockData as CurrentStockData, 
  DhanStockData, 
  SwingStrategy, 
  AppState, 
  GeminiAnalysis, 
  TradeSignal, 
  DhanHolding, 
  DhanPosition, 
  DhanPositionConvertRequest, 
  DhanOrderResponse,
  DhanOrderRequest, 
  DhanExchangeSegment,
  DhanOrderStatus,
  DhanTransactionType,
  DhanProductType,
  DhanOrderType,
  DhanValidity,
  DhanInstrumentType,
  NseTotalMarketStockInfo,
  DhanFundLimit, 
  AutomatedTradingLogEntry, 
  DhanHistoricalDataRequest, 
  DhanHistoricalDataResponse, 
  HistoricalDataPoint, 
  DhanHistoricalInstrumentType,
  StockFundamentals, 
  StockTechnicals,  
  StockPricePoint,
  DhanInstrument,
  TradingMode, 
  PaperTradingSettings, 
  PaperLedgerEntry, 
  DhanMarginCalculatorResponse,
  DhanSuperOrderPlaceRequest,
  DhanSuperOrderPlaceResponse,
  DhanSuperOrderListItem,
  DhanSuperOrderModifyRequest,
  DhanSuperOrderModifyResponse,
  DhanLegName,
  DhanSuperOrderCancelLegResponse,
} from './types';
import { 
  APP_TITLE, 
  APP_SUBTITLE,
  FOOTER_COPYRIGHT_TEXT_PREFIX,
  FOOTER_COPYRIGHT_TEXT_SUFFIX,
  FOOTER_RISK_DISCLAIMER,
  DHAN_MOCK_CLIENT_ID,
  DEFAULT_PRODUCT_TYPE,
  DEFAULT_ORDER_TYPE,
  DEFAULT_VALIDITY,
  AI_TRADE_CORRELATION_PREFIX,
  FAILED_ORDER_ID_PREFIX,
  REJECTED_ORDER_ID_PREFIX,
  INITIAL_LOAD_SIGNAL_ID_PREFIX,
  DEFAULT_EXCHANGE_SEGMENT,
  DEFAULT_INSTRUMENT_TYPE,
  APP_FALLBACK_ERROR_MESSAGE,
  MISSING_DHAN_INSTRUMENT_DATA_ERROR,
  ORDER_PLACEMENT_FAILED_ERROR_PREFIX,
  IDLE_MESSAGE_APP_START,
  NSE_DATA_LOAD_ERROR,
  AUTO_TRADE_LOG_ID_PREFIX,
  BENCHMARK_INDEX_CONFIG, 
  AUTO_ENGINE_VIEW_TITLE,
  DEFAULT_PAPER_BUDGET, 
  PAPER_TRADE_ID_PREFIX, 
  INSUFFICIENT_PAPER_FUNDS_MSG, 
  LIVE_TRADING_MODE_LABEL, 
  PAPER_TRADING_MODE_LABEL, 
  LIVE_TRADE_CONFIRMATION_MSG_PREFIX, 
  LIVE_TRADE_CONFIRMATION_MSG_SUFFIX, 
  LIVE_TRADE_ORDER_FAILED_TITLE, 
  LIVE_TRADE_ORDER_REJECTED_BY_USER_MSG, 
  MSG_TRADE_PANEL_REVIEW_CAREFULLY,
  SUPER_ORDER_CORRELATION_PREFIX, 
} from './constants';

const ALLOWED_INSTRUMENT_TYPES: DhanHistoricalInstrumentType[] = ['EQUITY', 'INDEX', 'FUTIDX', 'FUTSTK', 'FUTCOM', 'OPTIDX', 'OPTSTK', 'OPTCOM'];
const DERIVATIVE_INSTRUMENT_TYPES: DhanHistoricalInstrumentType[] = ['FUTIDX', 'FUTSTK', 'FUTCOM', 'OPTIDX', 'OPTSTK', 'OPTCOM'];
const MIN_PAPER_BALANCE_FOR_ATE_BUY = 100; 

const isMarketOpen = (): boolean => {
    const now = new Date();
    const offsetIST = 5.5 * 60 * 60 * 1000; 
    const istTime = new Date(now.getTime() + offsetIST);
    const dayOfWeek = istTime.getUTCDay(); 
    const hour = istTime.getUTCHours();
    const minute = istTime.getUTCMinutes();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false; 
    const marketOpenHour = 9; const marketOpenMinute = 15;
    const marketCloseHour = 15; const marketCloseMinute = 30;
    const currentTimeInMinutes = hour * 60 + minute;
    const marketOpenTimeInMinutes = marketOpenHour * 60 + marketOpenMinute;
    const marketCloseTimeInMinutes = marketCloseHour * 60 + marketCloseMinute;
    return currentTimeInMinutes >= marketOpenTimeInMinutes && currentTimeInMinutes < marketCloseTimeInMinutes;
};


interface AteConfig {
  stockListFilter: string; // "NIFTY50", "ALL", or comma-separated symbols
  paperCapitalAllocationPercent: number; // e.g., 2 for 2%
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('idle');
  const [currentSearchedSymbol, setCurrentSearchedSymbol] = useState<string | null>(null);
  const [stockData, setStockData] = useState<DhanStockData | null>(null);
  const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiAnalysis | null>(null);
  const [strategies, setStrategies] = useState<SwingStrategy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);

  const [currentTradeSignal, setCurrentTradeSignal] = useState<TradeSignal | null>(null);
  const [userHoldings, setUserHoldings] = useState<DhanHolding[]>([]);
  const [openPositions, setOpenPositions] = useState<DhanPosition[]>([]); 
  const [tradeOrders, setTradeOrders] = useState<DhanOrderResponse[]>([]);
  const [fundLimits, setFundLimits] = useState<DhanFundLimit | null>(null); 
  const [showTradeDecisionPanel, setShowTradeDecisionPanel] = useState<boolean>(false);
  const [isConvertingPosition, setIsConvertingPosition] = useState<boolean>(false); 
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false); 


  const [nseStockListFull, setNseStockListFull] = useState<NseTotalMarketStockInfo[]>([]);
  const [isNseListLoaded, setIsNseListLoaded] = useState(false);

  // State for Automated Trading Engine
  const [isAutoTradingActive, setIsAutoTradingActive] = useState<boolean>(false);
  const [autoTradingStatusLog, setAutoTradingStatusLog] = useState<AutomatedTradingLogEntry[]>([]);
  const [automatedShortlistedTrades, setAutomatedShortlistedTrades] = useState<TradeSignal[]>([]);
  const [isAutoEngineViewActive, setIsAutoEngineViewActive] = useState<boolean>(false); 
  const [ateConfig, setAteConfig] = useState<AteConfig>({
    stockListFilter: 'NIFTY50', // Default
    paperCapitalAllocationPercent: 2, // Default 2%
  });


  // --- Paper Trading State ---
  const [tradingMode, setTradingMode] = useState<TradingMode>('paper'); 
  const [paperTradingSettings, setPaperTradingSettings] = useState<PaperTradingSettings>({
    initialBudget: DEFAULT_PAPER_BUDGET,
    currentBalance: DEFAULT_PAPER_BUDGET,
    sessionActive: false,
    persistenceEnabled: false, // Will be updated after first load attempt
    persistenceStatus: undefined,
    sheetError: false,
    error: undefined,
  });
  const [paperHoldings, setPaperHoldings] = useState<DhanHolding[]>([]);
  const [paperPositions, setPaperPositions] = useState<DhanPosition[]>([]); 
  const [paperTradeHistory, setPaperTradeHistory] = useState<DhanOrderResponse[]>([]);
  const [paperLedgerEntries, setPaperLedgerEntries] = useState<PaperLedgerEntry[]>([]);
  const [isPaperDataLoading, setIsPaperDataLoading] = useState<boolean>(false);


  // --- Margin Calculator State ---
  const [marginCalcResult, setMarginCalcResult] = useState<DhanMarginCalculatorResponse | null>(null);
  const [marginCalcLoading, setMarginCalcLoading] = useState<boolean>(false);
  const [marginCalcError, setMarginCalcError] = useState<string | null>(null);

  // --- Super Order State ---
  const [superOrders, setSuperOrders] = useState<DhanSuperOrderListItem[]>([]);
  const [isLoadingSuperOrders, setIsLoadingSuperOrders] = useState<boolean>(false);
  const [superOrdersError, setSuperOrdersError] = useState<string | null>(null);


  useEffect(() => {
    const fetchNseList = async () => {
      try {
        const response = await fetch('public/NseTotalMarketStockDetails.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} while fetching stock list.`);
        const data: NseTotalMarketStockInfo[] = await response.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error("Fetched stock list data is empty or not an array.");
        
        const enrichedNseList = data.map(stock => {
          let dhanExchangeSegment: DhanExchangeSegment | undefined = undefined;
          let dhanInstrumentType: DhanHistoricalInstrumentType | undefined = undefined;
          if (stock.SYMBOL.endsWith('BE') || stock.SERIES === 'EQ') { dhanExchangeSegment = 'NSE_EQ'; dhanInstrumentType = 'EQUITY'; }
          else if (stock.SYMBOL.startsWith('NIFTY') || stock.SYMBOL.includes('INDEX')) {  dhanExchangeSegment = 'IDX_I';  dhanInstrumentType = 'INDEX'; }
          return { ...stock, DHAN_SECURITY_ID: stock["SECURITY ID"] ? String(stock["SECURITY ID"]) : undefined, DHAN_EXCHANGE_SEGMENT: dhanExchangeSegment, DHAN_INSTRUMENT_TYPE: dhanInstrumentType };
        });
        setNseStockListFull(enrichedNseList);
        setInitialLoadError(null); 
      } catch (e) {
        console.error("Failed to load NSE stock list:", e);
        const errorMessage = e instanceof Error ? e.message : NSE_DATA_LOAD_ERROR;
        setInitialLoadError(errorMessage);
        setError(prev => prev === null ? NSE_DATA_LOAD_ERROR : prev); 
      } finally { setIsNseListLoaded(true); }
    };
    fetchNseList();
  }, []);

  const addAutoTradingLog = useCallback((message: string, type: AutomatedTradingLogEntry['type'], details?: any) => {
    setAutoTradingStatusLog(prev => { const newLog = { id: `${AUTO_TRADE_LOG_ID_PREFIX}${Date.now()}_${prev.length}`, timestamp: new Date().toISOString(), message, type, details }; return [newLog, ...prev.slice(0,99)]; });
  }, []);

  const googleSheetsInitialized = paperTradingSettings.persistenceEnabled; // Read from settings

  const loadPaperTradingData = useCallback(async () => {
    if (tradingMode !== 'paper') return;
    setIsPaperDataLoading(true);
    try {
      const data = await fetchPaperTradingData();
      setPaperTradingSettings(data.settings);
      setPaperHoldings(data.holdings);
      setPaperLedgerEntries(data.ledger);
      setPaperTradeHistory(data.history);
      if (data.settings && data.settings.sheetError) { 
        addAutoTradingLog("Warning: Paper trading data persistence may have failed for the last operation.", 'error', data.settings.error);
      }
      if (!data.settings.sessionActive) {
        console.log("No active paper trading session found on the backend.");
        addAutoTradingLog("No active paper trading session found on backend.", 'info');
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Failed to load paper trading data.";
      setError(prev => prev ? `${prev}. ${errorMsg}` : errorMsg);
      addAutoTradingLog(`Failed to load paper trading data: ${errorMsg}`, 'error', e);
      setPaperTradingSettings({ 
        initialBudget: DEFAULT_PAPER_BUDGET,
        currentBalance: DEFAULT_PAPER_BUDGET,
        sessionActive: false, 
        persistenceEnabled: paperTradingSettings.persistenceEnabled, // Keep previous knowledge of sheets init
        persistenceStatus: 'failed',
        sheetError: true,
        error: errorMsg,
      });
      setPaperHoldings([]); setPaperLedgerEntries([]); setPaperTradeHistory([]);
    } finally { setIsPaperDataLoading(false); }
  }, [tradingMode, addAutoTradingLog, paperTradingSettings.persistenceEnabled]);


  const initializePaperTradingSession = useCallback(async (newBudget: number, mode: 'reset' | 'redefine') => {
    if (tradingMode !== 'paper') return;
    setIsPaperDataLoading(true); setError(null);
    try {
      const newSettings = await startNewPaperSession(newBudget, mode);
      setPaperTradingSettings(newSettings);
      await loadPaperTradingData(); 
      alert(`Paper trading session ${mode === 'redefine' ? 'budget updated' : 'started/reset'} with a budget of ₹${newBudget.toLocaleString()}.`);
      if (newSettings.sheetError) {
         addAutoTradingLog(`Warning: Issue saving paper session to Google Sheets. Session active in memory. Error: ${newSettings.error || 'Unknown sheet error'}`, 'error');
         alert("Warning: Issue saving paper session to Google Sheets. Session active in memory.");
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : `Failed to ${mode === 'redefine' ? 'update' : 'start'} paper session.`;
      setError(errorMsg); 
      alert(`Error ${mode === 'redefine' ? 'updating' : 'starting'} paper session: ${errorMsg}`);
      addAutoTradingLog(`Failed to ${mode} paper session: ${errorMsg}`, 'error', e);
      setPaperTradingSettings(prevSettings => ({
        ...prevSettings, 
        initialBudget: mode === 'reset' ? DEFAULT_PAPER_BUDGET : prevSettings.initialBudget, 
        currentBalance: mode === 'reset' ? DEFAULT_PAPER_BUDGET : prevSettings.currentBalance, 
        sessionActive: false, 
        persistenceEnabled: prevSettings.persistenceEnabled, 
        persistenceStatus: 'failed',
        sheetError: true,
        error: errorMsg,
      }));
    } finally { setIsPaperDataLoading(false); }
  }, [tradingMode, loadPaperTradingData, addAutoTradingLog]);


  const handleFetchSuperOrders = useCallback(async () => {
    if (tradingMode !== 'live') { setSuperOrders([]); setSuperOrdersError(null); return; }
    setIsLoadingSuperOrders(true); setSuperOrdersError(null);
    try {
        const fetchedSuperOrders = await getDhanSuperOrdersList();
        setSuperOrders(fetchedSuperOrders || []);
    } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Failed to fetch super orders.";
        console.error("Error fetching super orders:", e);
        setSuperOrdersError(errorMsg); setSuperOrders([]);
    } finally { setIsLoadingSuperOrders(false); }
  }, [tradingMode]);

  const handlePlaceSuperOrder = useCallback(async (request: DhanSuperOrderPlaceRequest, signalIdToAssociate?: string, orderedStockSymbol?: string) => {
    if (tradingMode !== 'live') { alert("Super Orders can only be placed in Live Trading mode."); return; }
    const symbolForAlert = orderedStockSymbol || stockData?.symbol || request.securityId;
    const tradeDetails = `SUPER ${request.transactionType} ${request.quantity} ${symbolForAlert} @ ${request.orderType}${request.orderType === 'LIMIT' ? ' ' + request.price : ''} (TGT: ${request.targetPrice}, SL: ${request.stopLossPrice})`;
    const confirmationMessage = `${LIVE_TRADE_CONFIRMATION_MSG_PREFIX}\nTrade: ${tradeDetails}\n${LIVE_TRADE_CONFIRMATION_MSG_SUFFIX}`;
    if (request.correlationId?.includes("AUTO_LIVE") || window.confirm(confirmationMessage)) { // Auto ATE live super orders skip manual confirm
        setIsPlacingOrder(true); setSuperOrdersError(null);
        try {
          const finalRequest = {...request, dhanClientId: DHAN_MOCK_CLIENT_ID, correlationId: request.correlationId || `${SUPER_ORDER_CORRELATION_PREFIX}USER_LIVE_${Date.now()}` };
          const response = await placeDhanSuperOrder(finalRequest);
          const alertMsg = `LIVE Super Order for ${symbolForAlert} placed. ID: ${response.orderId}, Status: ${response.orderStatus}. Monitor Dhan account.`;
          if(!request.correlationId?.includes("AUTO_LIVE")) alert(alertMsg); // Don't alert for ATE auto orders
          addAutoTradingLog(alertMsg, 'trade_placed', {...response, tradingSymbol: symbolForAlert, signalId: signalIdToAssociate, correlationId: finalRequest.correlationId});
          await handleFetchSuperOrders(); 
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : "Failed to place super order.";
          setSuperOrdersError(errorMsg); 
          if(!request.correlationId?.includes("AUTO_LIVE")) alert(`Error placing LIVE super order for ${symbolForAlert}: ${errorMsg}`);
          addAutoTradingLog(`Error placing LIVE super order for ${symbolForAlert}: ${errorMsg}`, 'error', {...request, error: errorMsg});
        } finally { setIsPlacingOrder(false); }
    } else {
        addAutoTradingLog(`User rejected LIVE Super Order placement for ${symbolForAlert}.`, 'info', request);
        alert(`LIVE Super Order for ${symbolForAlert} rejected by user.`);
    }
  }, [tradingMode, stockData, handleFetchSuperOrders, addAutoTradingLog]);

  const handleModifySuperOrder = useCallback(async (orderId: string, request: DhanSuperOrderModifyRequest) => {
     if (tradingMode !== 'live') return;
     if (!window.confirm(`Modify Super Order ${orderId} leg ${request.legName}? This is a LIVE action.`)) return;
     setIsLoadingSuperOrders(true); setSuperOrdersError(null);
     try {
        const finalRequest = {...request, dhanClientId: DHAN_MOCK_CLIENT_ID };
        const response = await modifyDhanSuperOrder(orderId, finalRequest);
        alert(`Super Order ${orderId} modification submitted. Status: ${response.orderStatus}`);
        await handleFetchSuperOrders();
     } catch (e) { const errorMsg = e instanceof Error ? e.message : `Failed to modify super order ${orderId}.`; setSuperOrdersError(errorMsg); alert(`Error modifying super order: ${errorMsg}`);
     } finally { setIsLoadingSuperOrders(false); }
  }, [tradingMode, handleFetchSuperOrders]);

  const handleCancelSuperOrderLeg = useCallback(async (orderId: string, legName: DhanLegName) => {
    if (tradingMode !== 'live') return;
    if (!window.confirm(`Cancel ${legName} for Super Order ${orderId}? This is a LIVE action.`)) return;
    setIsLoadingSuperOrders(true); setSuperOrdersError(null);
    try {
        const response = await cancelDhanSuperOrderLeg(orderId, legName);
        alert(`Super Order ${orderId} Leg ${legName} cancellation submitted. Status: ${response.orderStatus}`);
        await handleFetchSuperOrders();
    } catch (e) { const errorMsg = e instanceof Error ? e.message : `Failed to cancel leg ${legName} for SO ${orderId}.`; setSuperOrdersError(errorMsg); alert(`Error cancelling super order leg: ${errorMsg}`);
    } finally { setIsLoadingSuperOrders(false); }
  }, [tradingMode, handleFetchSuperOrders]);


  const fetchAccountData = useCallback(async () => {
    if (tradingMode === 'paper') { await loadPaperTradingData(); return; }
    setAppState('loading'); let collectedErrorMessages = [];
    try {
      const fetchedHoldings = await getDhanHoldings(); 
      setUserHoldings(fetchedHoldings.map(h => ({ ...h, investedValue: parseFloat((h.totalQty * h.averageCostPrice).toFixed(2)), currentValue: parseFloat((h.totalQty * (h.ltp ?? h.averageCostPrice)).toFixed(2)), pnl: parseFloat(((h.totalQty * (h.ltp ?? h.averageCostPrice)) - (h.totalQty * h.averageCostPrice)).toFixed(2)), dayPnl: parseFloat((((h.ltp ?? h.averageCostPrice) - (h.closePrice ?? h.averageCostPrice * 0.99)) * h.totalQty).toFixed(2)), })));
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to load holdings.";
        console.error("Error loading holdings:", e);
        if (e instanceof Error && e.message.includes("/portfolio/holdings") && (e.message.includes("DH-1111") || e.message.toLowerCase().includes("no holdings available"))) setUserHoldings([]); 
        else collectedErrorMessages.push(`Holdings: ${errorMessage}`);
    }
    try { const fetchedPositions = await getDhanPositions(); setOpenPositions(fetchedPositions);
    } catch (e) { const errorMessage = e instanceof Error ? e.message : "Failed to load positions."; console.error("Error loading positions:", e); collectedErrorMessages.push(`Positions: ${errorMessage}`); }
    try { const fetchedOrders = await getDhanOrderBook();  setTradeOrders(fetchedOrders.map(o => ({ ...o, signalId: `${INITIAL_LOAD_SIGNAL_ID_PREFIX}${o.orderId}` })));
    } catch (e) { const errorMessage = e instanceof Error ? e.message : "Failed to load order book."; console.error("Error loading order book:", e); collectedErrorMessages.push(`Orders: ${errorMessage}`); }
    try { const fetchedFundLimits = await getDhanFundLimits(); setFundLimits(fetchedFundLimits);
    } catch (e) { const errorMessage = e instanceof Error ? e.message : "Failed to load fund limits."; console.error("Error loading fund limits:", e); collectedErrorMessages.push(`Fund Limits: ${errorMessage}`); }
    await handleFetchSuperOrders(); 
    if (collectedErrorMessages.length > 0) { const fullErrorMessage = `Error loading live account data: ${collectedErrorMessages.join('; ')}`; setInitialLoadError(prev => prev ? `${prev}. ${fullErrorMessage}` : fullErrorMessage); setError(prev => prev ? `${prev}. ${fullErrorMessage}` : fullErrorMessage); setAppState('error'); 
    } else { if (error && !currentSearchedSymbol) setError(null);  setAppState(currentSearchedSymbol ? 'success' : 'idle');  }
  }, [tradingMode, currentSearchedSymbol, error, loadPaperTradingData, handleFetchSuperOrders]); 


  useEffect(() => { if (isNseListLoaded) { fetchAccountData(); } }, [isNseListLoaded, fetchAccountData, tradingMode]); 

  const createPlaceholderStockData = ( symbol: string, name: string, dhanSecurityId?: string, exchangeSegment?: DhanExchangeSegment, instrumentType?: DhanInstrumentType ): DhanStockData => {
    let historicalInstrumentType: DhanHistoricalInstrumentType = 'EQUITY';
    if (instrumentType === 'INDEX') historicalInstrumentType = 'INDEX';
    else if (instrumentType && DERIVATIVE_INSTRUMENT_TYPES.includes(instrumentType as DhanHistoricalInstrumentType)) historicalInstrumentType = instrumentType as DhanHistoricalInstrumentType;
    return { symbol: symbol.toUpperCase(), name: name || `${symbol.toUpperCase()} Company`, dhanSecurityId: dhanSecurityId, exchangeSegment: exchangeSegment || DEFAULT_EXCHANGE_SEGMENT, instrumentType: instrumentType || DEFAULT_INSTRUMENT_TYPE, currentPrice: 0, priceChange: 0, priceChangePercent: 0, historicalData: [] as StockPricePoint[], volume: "N/A", dayHigh: 0, dayLow: 0, fundamentals: undefined, technicals: undefined, };
  };

  const mapToHistoricalInstrumentType = (instrumentType: DhanInstrumentType | undefined): DhanHistoricalInstrumentType => {
    if (!instrumentType) return 'EQUITY'; 
    const mapping: Record<DhanInstrumentType, DhanHistoricalInstrumentType | null> = { 'EQUITY': 'EQUITY', 'INDEX': 'INDEX', 'FUTIDX': 'FUTIDX', 'FUTSTK': 'FUTSTK', 'FUTCOM': 'FUTCOM', 'OPTIDX': 'OPTIDX', 'OPTSTK': 'OPTSTK', 'OPTCOM': 'OPTCOM', 'CURRENCY': null, 'COMMODITY': null, };
    return mapping[instrumentType] || 'EQUITY'; 
  };


  const handleSearch = useCallback(async (symbol: string) => {
    if (!symbol) return;
    setAppState('loading'); setError(null); setStockData(null); setGeminiAnalysis(null); setStrategies([]); setCurrentSearchedSymbol(symbol); setCurrentTradeSignal(null); setShowTradeDecisionPanel(false); setIsAutoEngineViewActive(false); setMarginCalcResult(null); setMarginCalcError(null);
    if (isNseListLoaded && nseStockListFull.length === 0 && !initialLoadError) { setError(NSE_DATA_LOAD_ERROR + " Check console. Search might be unreliable."); setAppState('error'); return; }
    try {
      const upperSymbol = symbol.toUpperCase();
      const nseStockInfo = nseStockListFull.find(s => s.SYMBOL === upperSymbol);
      let baseStockData: DhanStockData = createPlaceholderStockData( upperSymbol, nseStockInfo?.["NAME OF COMPANY"] || `${upperSymbol} Company`, nseStockInfo?.DHAN_SECURITY_ID, nseStockInfo?.DHAN_EXCHANGE_SEGMENT, (nseStockInfo?.DHAN_INSTRUMENT_TYPE as DhanInstrumentType) );
      if (!baseStockData.dhanSecurityId && tradingMode === 'live') { 
        addAutoTradingLog(`DhanSecurityId not found locally for ${upperSymbol}. Searching via backend...`, 'info', 'handleSearch');
        const instruments: DhanInstrument[] = await searchDhanInstruments(upperSymbol, baseStockData.exchangeSegment);
        if (instruments && instruments.length > 0) {
          const foundInstrument = instruments[0]; baseStockData.dhanSecurityId = foundInstrument.SEM_SECURITY_ID; baseStockData.name = foundInstrument.SM_SYMBOL_NAME || baseStockData.name; 
          if (foundInstrument.SEM_EXM_EXCH_ID && foundInstrument.SEM_SEGMENT) {
            let resolvedSegment: DhanExchangeSegment | undefined;
            if(foundInstrument.SEM_EXM_EXCH_ID === 'NSE' && foundInstrument.SEM_SEGMENT === 'E') resolvedSegment = 'NSE_EQ'; else if(foundInstrument.SEM_EXM_EXCH_ID === 'NSE' && foundInstrument.SEM_SEGMENT === 'D') resolvedSegment = 'NSE_FNO'; else if(foundInstrument.SEM_EXM_EXCH_ID === 'BSE' && foundInstrument.SEM_SEGMENT === 'E') resolvedSegment = 'BSE_EQ'; else if(foundInstrument.SEM_EXM_EXCH_ID === 'MCX' && foundInstrument.SEM_SEGMENT === 'C') resolvedSegment = 'MCX_COMM'; else if(foundInstrument.SEM_EXM_EXCH_ID === 'IDX' && foundInstrument.SEM_SEGMENT === 'I') resolvedSegment = 'IDX_I';
            if(resolvedSegment) baseStockData.exchangeSegment = resolvedSegment;
          }
           const name = foundInstrument.SEM_INSTRUMENT_NAME?.toUpperCase();
           if (name) { if (ALLOWED_INSTRUMENT_TYPES.includes(name as DhanHistoricalInstrumentType)) baseStockData.instrumentType = name as DhanInstrumentType; else if (name.startsWith('FUTIDX')) baseStockData.instrumentType = 'FUTIDX'; else if (name.startsWith('FUTSTK')) baseStockData.instrumentType = 'FUTSTK'; else if (name.startsWith('OPTIDX')) baseStockData.instrumentType = 'OPTIDX'; else if (name.startsWith('OPTSTK')) baseStockData.instrumentType = 'OPTSTK'; else if (name === 'EQ' || name === 'EQUITY') baseStockData.instrumentType = 'EQUITY'; else if (name === 'INDEX') baseStockData.instrumentType = 'INDEX'; }
        } else { addAutoTradingLog(`Could not find Dhan instrument details for ${upperSymbol} via backend. Analysis limited.`, 'error', 'handleSearch'); }
      }
      if (baseStockData.dhanSecurityId && baseStockData.exchangeSegment && tradingMode === 'live') { 
        const toDate = new Date(); const fromDate = new Date(); fromDate.setDate(toDate.getDate() - 90); 
        const historicalRequest: DhanHistoricalDataRequest = { securityId: baseStockData.dhanSecurityId, exchangeSegment: baseStockData.exchangeSegment!, instrument: mapToHistoricalInstrumentType(baseStockData.instrumentType), fromDate: fromDate.toISOString().split('T')[0], toDate: toDate.toISOString().split('T')[0], };
        try {
          const historicalResponse = await getDhanHistoricalDailyData(historicalRequest);
          if (historicalResponse && historicalResponse.timestamp && historicalResponse.timestamp.length > 0) {
            const transformedHistoricalData: StockPricePoint[] = historicalResponse.timestamp.map((ts, index) => { const rawClosePrice = historicalResponse.close?.[index]; if (typeof rawClosePrice === 'number' && isFinite(rawClosePrice)) return { date: new Date(ts * 1000).toISOString().split('T')[0], price: rawClosePrice, }; console.warn(`Invalid close price at index ${index} for ${baseStockData.symbol}.`); return null; }).filter(Boolean) as StockPricePoint[];
            baseStockData.historicalData = transformedHistoricalData.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            if (baseStockData.historicalData.length > 0) {
              const latestPoint = baseStockData.historicalData[baseStockData.historicalData.length - 1];
              if (latestPoint && typeof latestPoint.price === 'number' && isFinite(latestPoint.price)) baseStockData.currentPrice = Number(latestPoint.price.toFixed(2));
              else { baseStockData.currentPrice = 0; console.warn(`Latest point price invalid for ${baseStockData.symbol}.`); }
              if (baseStockData.historicalData.length > 1) {
                const prevPoint = baseStockData.historicalData[baseStockData.historicalData.length - 2];
                if (latestPoint && typeof latestPoint.price === 'number' && isFinite(latestPoint.price) && prevPoint && typeof prevPoint.price === 'number' && isFinite(prevPoint.price)) { const priceDiff = latestPoint.price - prevPoint.price; baseStockData.priceChange = Number(priceDiff.toFixed(2)); baseStockData.priceChangePercent = (prevPoint.price !== 0 && isFinite(prevPoint.price)) ? Number(((priceDiff / prevPoint.price) * 100).toFixed(2)) : 0; }
                else { baseStockData.priceChange = 0; baseStockData.priceChangePercent = 0; console.warn(`Prev/latest point price invalid for ${baseStockData.symbol} change calc.`); }
              } else { baseStockData.priceChange = 0; baseStockData.priceChangePercent = 0; }
            } else { addAutoTradingLog(`No valid historical data points for ${baseStockData.symbol}. Using defaults.`, 'info', 'handleSearch:histFilter'); baseStockData.currentPrice = 0; baseStockData.priceChange = 0; baseStockData.priceChangePercent = 0; }
            const lastDayOriginalIndex = historicalResponse.timestamp.length - 1;
            const rawHigh = historicalResponse.high?.[lastDayOriginalIndex];
            if (typeof rawHigh === 'number' && isFinite(rawHigh)) baseStockData.dayHigh = Number(rawHigh.toFixed(2));
            else { baseStockData.dayHigh = baseStockData.currentPrice; console.warn(`Latest raw high invalid for ${baseStockData.symbol}.`); }
            const rawLow = historicalResponse.low?.[lastDayOriginalIndex];
            if (typeof rawLow === 'number' && isFinite(rawLow)) baseStockData.dayLow = Number(rawLow.toFixed(2));
            else { baseStockData.dayLow = baseStockData.currentPrice; console.warn(`Latest raw low invalid for ${baseStockData.symbol}.`); }
            if (baseStockData.dayHigh < baseStockData.dayLow && !(typeof rawHigh === 'number' && isFinite(rawHigh)) && !(typeof rawLow === 'number' && isFinite(rawLow))) baseStockData.dayLow = baseStockData.dayHigh; 
            const rawVolume = historicalResponse.volume?.[lastDayOriginalIndex];
            if (typeof rawVolume === 'number' && isFinite(rawVolume)) baseStockData.volume = rawVolume.toLocaleString('en-IN');
            else { baseStockData.volume = "N/A"; console.warn(`Latest raw volume invalid for ${baseStockData.symbol}.`); }
          } else { addAutoTradingLog(`No historical data/timestamps for ${baseStockData.symbol}. Analysis limited.`, 'info', 'handleSearch:noHistData'); baseStockData.currentPrice = 0; baseStockData.priceChange = 0; baseStockData.priceChangePercent = 0; baseStockData.dayHigh = 0; baseStockData.dayLow = 0; baseStockData.volume = "N/A"; baseStockData.historicalData = []; }
        } catch (histError) { const errorMsg = histError instanceof Error ? histError.message : String(histError); console.error(`Failed to fetch hist data for ${baseStockData.symbol}: ${errorMsg}`); addAutoTradingLog(`Failed to fetch hist data for ${baseStockData.symbol}: ${errorMsg}. Limited data.`, 'error', `handleSearch:histError`); baseStockData.currentPrice = 0; baseStockData.priceChange = 0; baseStockData.priceChangePercent = 0; baseStockData.dayHigh = 0; baseStockData.dayLow = 0; baseStockData.volume = "N/A"; baseStockData.historicalData = []; }
      } else if (tradingMode === 'paper') {
         const mockPrice = parseFloat((Math.random() * 3000 + 50).toFixed(2)); baseStockData.currentPrice = mockPrice; baseStockData.dayHigh = parseFloat((mockPrice * 1.02).toFixed(2)); baseStockData.dayLow = parseFloat((mockPrice * 0.98).toFixed(2)); baseStockData.priceChange = parseFloat((Math.random() * 20 - 10).toFixed(2)); baseStockData.priceChangePercent = parseFloat(((baseStockData.priceChange / (mockPrice - baseStockData.priceChange)) * 100).toFixed(2)); baseStockData.volume = `${(Math.random() * 5 + 0.5).toFixed(1)}M`; baseStockData.historicalData = [{date: new Date().toISOString().split('T')[0], price: mockPrice}];
         addAutoTradingLog(`Using mock price data for ${baseStockData.symbol} in paper mode for manual search.`, 'info');
      } else { addAutoTradingLog(`Cannot fetch hist data for ${baseStockData.symbol} due to missing Dhan ID/Segment.`, 'error', 'handleSearch:missingDhanId'); baseStockData.currentPrice = 0; baseStockData.priceChange = 0; baseStockData.priceChangePercent = 0; baseStockData.dayHigh = 0; baseStockData.dayLow = 0; baseStockData.volume = "N/A"; baseStockData.historicalData = []; }
      setStockData(baseStockData);
      const analysis = await generateStockAnalysis(baseStockData); setGeminiAnalysis(analysis);
      const swingStrategies = await generateSwingStrategies(baseStockData, analysis); setStrategies(swingStrategies);
      setAppState('awaiting_trade_decision');
      const decision = await generateTradeDecision(baseStockData, analysis, tradingMode === 'paper' ? paperHoldings : userHoldings);
      setCurrentTradeSignal(decision); setShowTradeDecisionPanel(true); setAppState('success');
    } catch (err) { console.error("Error during stock processing:", err); setError(err instanceof Error ? err.message : APP_FALLBACK_ERROR_MESSAGE); setAppState('error'); }
  }, [userHoldings, paperHoldings, nseStockListFull, isNseListLoaded, initialLoadError, addAutoTradingLog, tradingMode]);


  const handlePlaceOrder = async (orderRequest: DhanOrderRequest, signalIdToAssociate?: string, orderedStockSymbol?: string, orderedStockCurrentPrice?: number) => {
    const currentPriceForFill = typeof orderedStockCurrentPrice === 'number' ? orderedStockCurrentPrice : (stockData && typeof stockData.currentPrice === 'number' ? stockData.currentPrice : 0); 
    if (tradingMode === 'paper') {
        if (!paperTradingSettings.sessionActive) { alert("Paper trading session not active."); addAutoTradingLog("Paper trade aborted: Session not active.", 'error', orderRequest); return; }
        if (currentPriceForFill === 0 && orderRequest.orderType === 'MARKET') { alert("Cannot place paper market order: stock price unavailable."); addAutoTradingLog("Paper market order aborted: Stock price unavailable.", 'error', orderRequest); return; }
        setIsPlacingOrder(true); setError(null);
        try {
            const response = await executePaperTradeOrder(orderRequest, currentPriceForFill);
            setPaperTradingSettings(response.updatedSettings); setPaperHoldings(response.updatedHoldings); setPaperTradeHistory(prev => [response.executedOrder, ...prev]);
            if (response.newLedgerEntry) setPaperLedgerEntries(prev => [response.newLedgerEntry!, ...prev.slice(0, 199)]); else await loadPaperTradingData(); 
            alert(`Paper order for ${orderedStockSymbol || orderRequest.securityId} (${orderRequest.transactionType} ${orderRequest.quantity} @ ${response.executedOrder.averageTradedPrice.toFixed(2)}) simulated. ID: ${response.executedOrder.orderId}`);
            if (response.updatedSettings && response.updatedSettings.sheetError) addAutoTradingLog(`Warning: Paper trade for ${orderedStockSymbol} processed, but failed to save to Sheets. Error: ${response.updatedSettings.error || 'Unknown sheet error'}`, 'error');
            if (orderRequest.correlationId?.includes("AUTO")) addAutoTradingLog(`Paper trade executed: ${response.executedOrder.transactionType} ${response.executedOrder.quantity} ${response.executedOrder.tradingSymbol} @ ${response.executedOrder.averageTradedPrice.toFixed(2)}`, 'trade_placed', response.executedOrder);
            return response.executedOrder;
        } catch (e) { const errorMsg = e instanceof Error ? e.message : "Paper trade simulation failed."; setError(errorMsg); addAutoTradingLog(`Paper trade failed for ${orderedStockSymbol}: ${errorMsg}`, 'error', e as Error); await loadPaperTradingData(); throw e;
        } finally { setIsPlacingOrder(false); }
    }
    const symbolForAlert = orderedStockSymbol || stockData?.symbol || orderRequest.securityId;
    const priceForSim = currentPriceForFill;
    const tradeDetails = `${orderRequest.transactionType} ${orderRequest.quantity} ${symbolForAlert} @ ${orderRequest.orderType}${orderRequest.orderType === 'LIMIT' ? ' ' + orderRequest.price : ''}`;
    const confirmationMessage = `${LIVE_TRADE_CONFIRMATION_MSG_PREFIX}\nTrade: ${tradeDetails}\n${LIVE_TRADE_CONFIRMATION_MSG_SUFFIX}`;
    if (!window.confirm(confirmationMessage)) {
        addAutoTradingLog(LIVE_TRADE_ORDER_REJECTED_BY_USER_MSG, 'info', { tradeDetails }); alert(LIVE_TRADE_ORDER_REJECTED_BY_USER_MSG);
        const rejectedOrderSim: DhanOrderResponse = { dhanClientId: DHAN_MOCK_CLIENT_ID, orderId: `${REJECTED_ORDER_ID_PREFIX}LIVE_${Date.now()}`, correlationId: orderRequest.correlationId || `${AI_TRADE_CORRELATION_PREFIX}LIVE_USER_REJECT_${Date.now()}`, signalId: signalIdToAssociate, securityId: orderRequest.securityId, tradingSymbol: symbolForAlert, transactionType: orderRequest.transactionType, quantity: orderRequest.quantity, orderType: orderRequest.orderType, price: orderRequest.price || 0, orderStatus: 'CANCELLED_BY_USER' as DhanOrderStatus, createdTime: new Date().toISOString(), filledQty:0, averageTradedPrice:0, exchangeSegment: orderRequest.exchangeSegment, productType: orderRequest.productType, validity: orderRequest.validity, omsErrorDescription: LIVE_TRADE_ORDER_REJECTED_BY_USER_MSG, };
        setTradeOrders(prevOrders => [rejectedOrderSim, ...prevOrders]); return; 
    }
    setIsPlacingOrder(true); setError(null); addAutoTradingLog(`Attempting to place LIVE order: ${tradeDetails}`, 'info');
    const finalOrderRequest = { ...orderRequest, dhanClientId: DHAN_MOCK_CLIENT_ID, correlationId: orderRequest.correlationId || `${AI_TRADE_CORRELATION_PREFIX}LIVE_${Date.now()}` };
    try {
        const placedOrderResponse = await placeDhanOrder(finalOrderRequest);
        const newOrder = { ...placedOrderResponse, tradingSymbol: placedOrderResponse.tradingSymbol || symbolForAlert, signalId: signalIdToAssociate || finalOrderRequest.correlationId };
        setTradeOrders(prevOrders => [newOrder, ...prevOrders]);
        alert(`LIVE Order for ${symbolForAlert} submitted to Dhan. ID: ${newOrder.orderId}. Monitor Dhan account.`);
        addAutoTradingLog(`LIVE Order for ${symbolForAlert} submitted to Dhan. ID: ${newOrder.orderId}`, 'trade_placed', newOrder);
        setTimeout(async () => { await fetchAccountData(); setTradeOrders(prevOrders => prevOrders.map(o => o.orderId === newOrder.orderId && o.orderStatus !== 'TRADED' ? { ...o, orderStatus: 'TRADED' as DhanOrderStatus, filledQty: o.quantity, remainingQuantity: 0, averageTradedPrice: typeof priceForSim === 'number' && isFinite(priceForSim) ? Number((priceForSim + (Math.random() - 0.5) * 0.05 * priceForSim).toFixed(2)) : o.price || 0, exchangeTime: new Date().toISOString(), updateTime: new Date().toISOString(), } : o )); }, 3500); 
        return placedOrderResponse;
    } catch (e) {
        console.error(`${LIVE_TRADE_ORDER_FAILED_TITLE} for ${symbolForAlert}:`, e); const errorMessage = e instanceof Error ? e.message : "Unknown error during order placement."; setError(`${ORDER_PLACEMENT_FAILED_ERROR_PREFIX}${errorMessage}`); alert(`${LIVE_TRADE_ORDER_FAILED_TITLE} for ${symbolForAlert}: ${errorMessage}. Check Dhan account.`); addAutoTradingLog(`${LIVE_TRADE_ORDER_FAILED_TITLE} for ${symbolForAlert}: ${errorMessage}`, 'error', e as Error);
        const failedOrder: DhanOrderResponse = { dhanClientId: finalOrderRequest.dhanClientId, orderId: `${FAILED_ORDER_ID_PREFIX}LIVE_${Date.now()}`, correlationId: finalOrderRequest.correlationId, signalId: signalIdToAssociate || finalOrderRequest.correlationId, securityId: finalOrderRequest.securityId, tradingSymbol: symbolForAlert, transactionType: finalOrderRequest.transactionType, quantity: finalOrderRequest.quantity, price: finalOrderRequest.price || 0, orderType: finalOrderRequest.orderType, orderStatus: 'REJECTED' as DhanOrderStatus, omsErrorCode: "BROKER_REJECT", omsErrorDescription: errorMessage, createdTime: new Date().toISOString(), filledQty: 0, averageTradedPrice: 0, exchangeSegment: finalOrderRequest.exchangeSegment, productType: finalOrderRequest.productType, validity: finalOrderRequest.validity, };
        setTradeOrders(prevOrders => [failedOrder, ...prevOrders]); throw e; 
    } finally { setIsPlacingOrder(false); }
};


  const handleApproveTrade = async (signal: TradeSignal) => {
    if (!signal.relatedStockData || (!signal.relatedStockData.dhanSecurityId && tradingMode === 'live') || (!signal.relatedStockData.exchangeSegment && tradingMode === 'live')) { setError(MISSING_DHAN_INSTRUMENT_DATA_ERROR); alert(MISSING_DHAN_INSTRUMENT_DATA_ERROR); return; }
    if (signal.action === 'HOLD') { console.log("HOLD signal acknowledged."); setShowTradeDecisionPanel(false); setCurrentTradeSignal(null); return; }
    const orderRequest: DhanOrderRequest = { dhanClientId: tradingMode === 'paper' ? 'PAPER_CLIENT' : DHAN_MOCK_CLIENT_ID, securityId: signal.relatedStockData.dhanSecurityId || signal.symbol, exchangeSegment: signal.relatedStockData.exchangeSegment || DEFAULT_EXCHANGE_SEGMENT, transactionType: signal.action === 'BUY' ? 'BUY' : 'SELL', productType: DEFAULT_PRODUCT_TYPE, orderType: 'MARKET', quantity: signal.quantity || 1, validity: DEFAULT_VALIDITY, correlationId: `${AI_TRADE_CORRELATION_PREFIX}${tradingMode === 'paper' ? 'PAPER_AI_' : 'LIVE_AI_'}${Date.now()}` };
    await handlePlaceOrder(orderRequest, signal.id, signal.relatedStockData.symbol, signal.relatedStockData.currentPrice);
    setShowTradeDecisionPanel(false); setCurrentTradeSignal(null);
  };

  const handleRejectTrade = (signal: TradeSignal) => {
    console.log("Trade Rejected by user:", signal); setShowTradeDecisionPanel(false); setCurrentTradeSignal(null);
    const rejectedOrderSim: DhanOrderResponse = { dhanClientId: tradingMode === 'paper' ? 'PAPER_CLIENT' : DHAN_MOCK_CLIENT_ID, orderId: `${REJECTED_ORDER_ID_PREFIX}${tradingMode === 'paper' ? 'PAPER_' : 'LIVE_'}${Date.now()}`, exchangeOrderId: `${REJECTED_ORDER_ID_PREFIX}EXCH_${Date.now().toString().slice(-5)}`, correlationId: `${REJECTED_ORDER_ID_PREFIX}CORR_${Date.now().toString().slice(-5)}`, signalId: signal.id, securityId: signal.relatedStockData?.dhanSecurityId || "UNKNOWN_SEC_ID", tradingSymbol: signal.symbol, transactionType: signal.action === 'HOLD' ? (Math.random() > 0.5 ? 'BUY' : 'SELL') : signal.action as DhanTransactionType, quantity: signal.quantity || 1, disclosedQuantity: signal.quantity || 1, orderType: DEFAULT_ORDER_TYPE, price: 0, triggerPrice: 0, orderStatus: 'CANCELLED_BY_USER' as DhanOrderStatus, createdTime: new Date().toISOString(), updateTime: new Date().toISOString(), filledQty:0, averageTradedPrice:0, remainingQuantity: 0, exchangeSegment: signal.relatedStockData?.exchangeSegment || DEFAULT_EXCHANGE_SEGMENT, productType: DEFAULT_PRODUCT_TYPE, validity: DEFAULT_VALIDITY, afterMarketOrder: false, omsErrorDescription: "User rejected AI signal", };
    if (tradingMode === 'paper') { setPaperTradeHistory(prevOrders => [rejectedOrderSim, ...prevOrders]); addAutoTradingLog(`User rejected paper trade signal for ${signal.symbol}`, 'info', rejectedOrderSim); }
    else { setTradeOrders(prevOrders => [rejectedOrderSim, ...prevOrders]); }
  };

  const handleConvertPosition = async (position: DhanPosition, toProductType: DhanProductType) => {
    if (tradingMode === 'paper') { alert("Position conversion not applicable in Paper Trading."); return; }
    const conversionConfirmation = `Convert REAL position for ${position.tradingSymbol} (${Math.abs(position.netQty)} Qty) from ${position.productType} to ${toProductType}? This uses REAL MONEY. Are you sure?`;
    if (!window.confirm(conversionConfirmation)) { alert("Position conversion cancelled."); return; }
    console.log(`Attempting to convert position for ${position.tradingSymbol} from ${position.productType} to ${toProductType}`);
    setIsConvertingPosition(true); setError(null);
    const convertRequest: DhanPositionConvertRequest = { dhanClientId: DHAN_MOCK_CLIENT_ID, fromProductType: position.productType, toProductType: toProductType, exchangeSegment: position.exchangeSegment, positionType: position.positionType, securityId: position.securityId, convertQty: Math.abs(position.netQty), };
    try {
      const response = await convertDhanPosition(convertRequest); console.log("Position conversion response:", response);
      if (response && (response.status === 'success' || response.httpStatusCode === 202)) { alert(`Position ${position.tradingSymbol} conversion to ${toProductType} initiated. Monitor Dhan account.`); await fetchAccountData(); }
      else { throw new Error(response?.message || `Position conversion for ${position.tradingSymbol} failed. Status: ${response?.httpStatusCode}.`); }
    } catch (err) { console.error("Error converting position:", err); const convertError = err instanceof Error ? err.message : "Failed to convert position."; setError(`Conversion Error: ${convertError}`); alert(`Error converting ${position.tradingSymbol}: ${convertError}`);
    } finally { setIsConvertingPosition(false); }
  };
  
  const isAutoTradingActiveRef = React.useRef(isAutoTradingActive);
  useEffect(() => { isAutoTradingActiveRef.current = isAutoTradingActive; }, [isAutoTradingActive]);

  
  const handleStartAutomatedTrading = useCallback(async () => {
    if (!isNseListLoaded || nseStockListFull.length === 0) { addAutoTradingLog("Cannot start ATE: NSE stock list not available.", 'error'); return; }
    if (tradingMode === 'paper' && !paperTradingSettings.sessionActive) { 
        addAutoTradingLog("Cannot start ATE in Paper Mode: Session not active. Please start or reset a paper session.", 'error'); 
        alert("Paper trading session not active. Please start or reset a paper session from the 'Paper Trading Setup' panel."); 
        return; 
    }
    if (tradingMode === 'live') { const liveEngineConfirm = `START AUTOMATED TRADING ENGINE IN LIVE (REAL MONEY) MODE? This may place trades automatically. ARE YOU SURE?`; if (!window.confirm(liveEngineConfirm)) { addAutoTradingLog("ATE Live start cancelled by user.", 'info'); return; } addAutoTradingLog("USER CONFIRMED: Starting ATE in LIVE (REAL MONEY) mode.", 'info'); }

    isAutoTradingActiveRef.current = true; setIsAutoTradingActive(true); setIsAutoEngineViewActive(true); setAutoTradingStatusLog([]); setAutomatedShortlistedTrades([]); 
    addAutoTradingLog(`ATE started in ${tradingMode.toUpperCase()} mode. Filter: ${ateConfig.stockListFilter}. Paper Alloc: ${ateConfig.paperCapitalAllocationPercent}%.`, 'info');

    let marketIndexTrendSummary = "Market index trend data unavailable.";
    try {
        const toDateIndex = new Date(); const fromDateIndex = new Date(); fromDateIndex.setDate(toDateIndex.getDate() - 30); 
        const indexHistoricalRequest: DhanHistoricalDataRequest = { securityId: BENCHMARK_INDEX_CONFIG.dhanSecurityId, exchangeSegment: BENCHMARK_INDEX_CONFIG.exchangeSegment, instrument: BENCHMARK_INDEX_CONFIG.historicalInstrumentType, fromDate: fromDateIndex.toISOString().split('T')[0], toDate: toDateIndex.toISOString().split('T')[0], };
        const indexResponse = await getDhanHistoricalDailyData(indexHistoricalRequest); 
        if (indexResponse && indexResponse.close && indexResponse.close.length > 0 && indexResponse.status !== "error") {
            const firstClose = indexResponse.close[0]; const lastClose = indexResponse.close[indexResponse.close.length - 1]; const trend = lastClose > firstClose ? "uptrend" : lastClose < firstClose ? "downtrend" : "neutral"; marketIndexTrendSummary = `${BENCHMARK_INDEX_CONFIG.symbol} shows a general ${trend} over the last 30 days (From ${firstClose.toFixed(2)} to ${lastClose.toFixed(2)}).`;
            addAutoTradingLog(`Fetched NIFTY 50 data: ${marketIndexTrendSummary}`, 'info');
        } else { const errorDetail = indexResponse?.remarks?.message ? `(${indexResponse.remarks.message})` : '(Dhan API Error)'; addAutoTradingLog(`Could not fetch NIFTY 50 data ${errorDetail}. Proceeding without market context.`, 'error'); }
    } catch (indexError) { addAutoTradingLog(`Error fetching NIFTY 50 data: ${indexError instanceof Error ? indexError.message : String(indexError)}. Proceeding without market context.`, 'error'); }

    let stocksToProcess = nseStockListFull;
    if (ateConfig.stockListFilter && ateConfig.stockListFilter.toUpperCase() !== "ALL") {
        if (ateConfig.stockListFilter.toUpperCase() === "NIFTY50") { // Placeholder for actual NIFTY50 list
            stocksToProcess = nseStockListFull.filter(s => BENCHMARK_INDEX_CONFIG.symbol !== s.SYMBOL); // Simplified
        } else {
            const filterSymbols = ateConfig.stockListFilter.toUpperCase().split(',').map(s => s.trim());
            stocksToProcess = nseStockListFull.filter(s => filterSymbols.includes(s.SYMBOL));
        }
    }
    addAutoTradingLog(`ATE will process ${stocksToProcess.length} stocks based on filter: "${ateConfig.stockListFilter}".`, 'info');


    for (const nseStock of stocksToProcess) {
      if (!isAutoTradingActiveRef.current) { addAutoTradingLog(`Engine stopping mid-process at ${nseStock.SYMBOL}.`, 'info'); break; }
      addAutoTradingLog(`Processing stock: ${nseStock.SYMBOL}`, 'info', `ATE: ${nseStock.SYMBOL}`);
      if (DEFAULT_PRODUCT_TYPE === 'INTRADAY' && !isMarketOpen()) { addAutoTradingLog(`Market closed. Skipping INTRADAY for ${nseStock.SYMBOL}.`, 'info'); continue; }
      if (tradingMode === 'paper' && paperTradingSettings.currentBalance < MIN_PAPER_BALANCE_FOR_ATE_BUY) { addAutoTradingLog(`Paper balance (₹${paperTradingSettings.currentBalance.toFixed(2)}) too low. Halting new BUYs.`, 'error'); }

      try {
        let securityIdFromNse: string | undefined = nseStock.DHAN_SECURITY_ID;
        let exchangeSegmentFromNse: DhanExchangeSegment = nseStock.DHAN_EXCHANGE_SEGMENT || DEFAULT_EXCHANGE_SEGMENT;
        let generalInstrumentTypeFromNse: DhanInstrumentType = (nseStock.DHAN_INSTRUMENT_TYPE as DhanInstrumentType) || DEFAULT_INSTRUMENT_TYPE;
        let currentStockPrice = 0;

        if (!securityIdFromNse) { 
            addAutoTradingLog(`DhanSecurityId not found locally for ${nseStock.SYMBOL}. Searching...`, 'info');
            const instruments = await searchDhanInstruments(nseStock.SYMBOL, exchangeSegmentFromNse);
            if (instruments && instruments.length > 0) {
                const dhanInstrument = instruments[0]; securityIdFromNse = dhanInstrument.SEM_SECURITY_ID;
                if (dhanInstrument.SEM_EXM_EXCH_ID && dhanInstrument.SEM_SEGMENT) { let resolvedSegment: DhanExchangeSegment | undefined; if(dhanInstrument.SEM_EXM_EXCH_ID === 'NSE' && dhanInstrument.SEM_SEGMENT === 'E') resolvedSegment = 'NSE_EQ'; else if(dhanInstrument.SEM_EXM_EXCH_ID === 'NSE' && dhanInstrument.SEM_SEGMENT === 'D') resolvedSegment = 'NSE_FNO'; else if(dhanInstrument.SEM_EXM_EXCH_ID === 'BSE' && dhanInstrument.SEM_SEGMENT === 'E') resolvedSegment = 'BSE_EQ'; else if(dhanInstrument.SEM_EXM_EXCH_ID === 'MCX' && dhanInstrument.SEM_SEGMENT === 'C') resolvedSegment = 'MCX_COMM'; else if(dhanInstrument.SEM_EXM_EXCH_ID === 'IDX' && dhanInstrument.SEM_SEGMENT === 'I') resolvedSegment = 'IDX_I'; if(resolvedSegment) exchangeSegmentFromNse = resolvedSegment; }
                const name = dhanInstrument.SEM_INSTRUMENT_NAME?.toUpperCase(); if (name) { if (ALLOWED_INSTRUMENT_TYPES.includes(name as DhanHistoricalInstrumentType)) generalInstrumentTypeFromNse = name as DhanInstrumentType; else if (name.startsWith('FUTIDX')) generalInstrumentTypeFromNse = 'FUTIDX'; else if (name.startsWith('FUTSTK')) generalInstrumentTypeFromNse = 'FUTSTK'; else if (name.startsWith('OPTIDX')) generalInstrumentTypeFromNse = 'OPTIDX'; else if (name.startsWith('OPTSTK')) generalInstrumentTypeFromNse = 'OPTSTK'; else if (name === 'EQ' || name === 'EQUITY') generalInstrumentTypeFromNse = 'EQUITY'; else if (name === 'INDEX') generalInstrumentTypeFromNse = 'INDEX'; }
            } else { addAutoTradingLog(`Could not find Dhan instrument details for ${nseStock.SYMBOL}. Skipping.`, 'error'); continue; }
        }
        if (!securityIdFromNse || !exchangeSegmentFromNse) { addAutoTradingLog(`Skipping AI analysis for ${nseStock.SYMBOL} due to missing Dhan ID/Segment.`, 'error', `ATE: ${nseStock.SYMBOL}`); continue; }

        const toDateGeneric = new Date();
        const fromDateDaily = new Date(); fromDateDaily.setDate(toDateGeneric.getDate() - 90); // 90 days for daily
        const fromDateIntra = new Date(); fromDateIntra.setDate(toDateGeneric.getDate() - 5);  // 5 days for 15-min

        // Fetch Daily Data for the stock
        const dailyRequest: DhanHistoricalDataRequest = { securityId: securityIdFromNse, exchangeSegment: exchangeSegmentFromNse!, instrument: mapToHistoricalInstrumentType(generalInstrumentTypeFromNse), fromDate: fromDateDaily.toISOString().split('T')[0], toDate: toDateGeneric.toISOString().split('T')[0] };
        const dailyResponse = await getDhanHistoricalDailyData(dailyRequest);
        let processedDailyData: HistoricalDataPoint[] = [];
        if (dailyResponse && dailyResponse.close && dailyResponse.close.length > 0) {
            processedDailyData = dailyResponse.timestamp.map((ts, index) => ({ date: new Date(ts * 1000).toLocaleDateString('en-IN'), open: dailyResponse.open[index], high: dailyResponse.high[index], low: dailyResponse.low[index], close: dailyResponse.close[index], volume: dailyResponse.volume[index], openInterest: dailyResponse.open_interest?.[index] })).filter(dp => dp.open && dp.high && dp.low && dp.close && dp.volume) as HistoricalDataPoint[];
            if (processedDailyData.length > 0) currentStockPrice = processedDailyData[processedDailyData.length - 1].close; // Update current price from daily
        } else { addAutoTradingLog(`No daily data for ${nseStock.SYMBOL}.`, 'info');}
        
        // Fetch Intraday Data
        const intradayRequest: DhanHistoricalDataRequest = { securityId: securityIdFromNse, exchangeSegment: exchangeSegmentFromNse!, instrument: mapToHistoricalInstrumentType(generalInstrumentTypeFromNse), fromDate: fromDateIntra.toISOString().split('T')[0], toDate: toDateGeneric.toISOString().split('T')[0], interval: '15' };
        const intradayResponse = await getDhanHistoricalIntradayData(intradayRequest);
        let processedIntradayData: HistoricalDataPoint[] = [];
        if (intradayResponse && intradayResponse.close && intradayResponse.close.length > 0) {
            processedIntradayData = intradayResponse.timestamp.map((ts, index) => ({ date: new Date(ts * 1000).toLocaleString('en-IN'), open: intradayResponse.open[index], high: intradayResponse.high[index], low: intradayResponse.low[index], close: intradayResponse.close[index], volume: intradayResponse.volume[index], openInterest: intradayResponse.open_interest?.[index] })).filter(dp => dp.open && dp.high && dp.low && dp.close && dp.volume) as HistoricalDataPoint[];
            if (processedIntradayData.length > 0 && currentStockPrice === 0) currentStockPrice = processedIntradayData[processedIntradayData.length - 1].close; // Fallback to intraday if daily was empty
        } else { addAutoTradingLog(`No intraday data for ${nseStock.SYMBOL}.`, 'info'); }

        if (currentStockPrice === 0) { addAutoTradingLog(`No price data for ${nseStock.SYMBOL}. Skipping detailed analysis.`, 'error'); continue; }

        let latestSmaIntra: number|null = null, latestRsiIntra: number|null = null, latestSmaDaily: number|null = null, latestRsiDaily: number|null = null;
        if (processedIntradayData.length >= 20) latestSmaIntra = calculateSMA(processedIntradayData.map(p=>p.close), 20).pop() || null;
        if (processedIntradayData.length >= 15) latestRsiIntra = calculateRSI(processedIntradayData.map(p=>p.close), 14).pop() || null;
        if (processedDailyData.length >= 20) latestSmaDaily = calculateSMA(processedDailyData.map(p=>p.close), 20).pop() || null;
        if (processedDailyData.length >= 15) latestRsiDaily = calculateRSI(processedDailyData.map(p=>p.close), 14).pop() || null;
        
        addAutoTradingLog(`Data for ${nseStock.SYMBOL}: Price ${currentStockPrice.toFixed(2)}, Daily(SMA/RSI): ${latestSmaDaily?.toFixed(2)||'N/A'}/${latestRsiDaily?.toFixed(2)||'N/A'}, Intra(SMA/RSI): ${latestSmaIntra?.toFixed(2)||'N/A'}/${latestRsiIntra?.toFixed(2)||'N/A'}`, 'info');
        
        const aiSignal = await generateHistoricalAnalysisAndShortlist( nseStock.SYMBOL, securityIdFromNse, processedIntradayData, processedDailyData, latestSmaIntra, latestRsiIntra, latestSmaDaily, latestRsiDaily, marketIndexTrendSummary, currentStockPrice );

        if (aiSignal) {
          addAutoTradingLog(`AI decision for ${nseStock.SYMBOL}: ${aiSignal.action}. Conf: ${aiSignal.confidence}. Target: ${aiSignal.targetPrice}, SL: ${aiSignal.stopLossPrice}. Reason: ${aiSignal.reasoning}`, 'ai_decision', aiSignal);
          if (securityIdFromNse && exchangeSegmentFromNse) {
            setAutomatedShortlistedTrades(prev => [aiSignal, ...prev.slice(0,19)]); 
            
            let orderQty = aiSignal.quantity && aiSignal.quantity > 0 ? aiSignal.quantity : 1; 
            if (tradingMode === 'paper' && aiSignal.action === 'BUY' && ateConfig.paperCapitalAllocationPercent > 0) {
                const calculatedQty = Math.floor((paperTradingSettings.currentBalance * (ateConfig.paperCapitalAllocationPercent / 100)) / currentStockPrice);
                orderQty = Math.max(1, calculatedQty); 
            }
            
            // Enhanced Logging for Paper Trade Feasibility (Simulated Margin Check)
            if (tradingMode === 'paper' && (aiSignal.action === 'BUY' || aiSignal.action === 'SELL')) {
                const tradeValue = currentStockPrice * orderQty;
                addAutoTradingLog(
                    `ATE Paper Trade Feasibility for ${nseStock.SYMBOL} ${aiSignal.action}: Required Capital approx ₹${tradeValue.toFixed(2)}. Available Balance: ₹${paperTradingSettings.currentBalance.toFixed(2)}.`, 
                    'info'
                );
            }

            const canAffordPaperBuy = tradingMode === 'paper' && paperTradingSettings.currentBalance >= (currentStockPrice * orderQty);
            const hasPaperHoldingsForSell = tradingMode === 'paper' && paperHoldings.some(h => (h.securityId === securityIdFromNse || h.tradingSymbol === nseStock.SYMBOL) && h.availableQty >= orderQty);

            if (aiSignal.action === 'BUY') {
                 if (tradingMode === 'paper' && !canAffordPaperBuy) { addAutoTradingLog(`Paper BUY for ${nseStock.SYMBOL} skipped: Insufficient balance. Need approx ₹${(currentStockPrice * orderQty).toFixed(2)}.`, 'info'); continue; }
            } else if (aiSignal.action === 'SELL') {
                if (tradingMode === 'paper' && !hasPaperHoldingsForSell) { addAutoTradingLog(`Paper SELL for ${nseStock.SYMBOL} skipped: Not enough quantity in paper holdings.`, 'info'); continue; }
                if (tradingMode === 'live') { addAutoTradingLog(`AI suggested SELL for ${nseStock.SYMBOL} in LIVE. Logging signal, no auto execution.`, 'info', aiSignal); continue; }
            }

            if ((aiSignal.action === 'BUY' || (aiSignal.action === 'SELL' && tradingMode === 'paper')) && aiSignal.targetPrice && aiSignal.stopLossPrice) {
                const superOrderRequest: DhanSuperOrderPlaceRequest = {
                    dhanClientId: tradingMode === 'paper' ? 'PAPER_CLIENT' : DHAN_MOCK_CLIENT_ID,
                    securityId: securityIdFromNse, exchangeSegment: exchangeSegmentFromNse,
                    transactionType: aiSignal.action as DhanTransactionType, productType: DEFAULT_PRODUCT_TYPE,
                    orderType: 'MARKET', quantity: orderQty, price: 0, 
                    targetPrice: aiSignal.targetPrice, stopLossPrice: aiSignal.stopLossPrice,
                    correlationId: `${SUPER_ORDER_CORRELATION_PREFIX}AUTO_${tradingMode === 'paper' ? 'PAPER_' : 'LIVE_'}${Date.now()}`
                };
                addAutoTradingLog(`Attempting to place SUPER ${aiSignal.action} order for ${nseStock.SYMBOL} (Qty: ${orderQty}) Target:${aiSignal.targetPrice} SL:${aiSignal.stopLossPrice} in ${tradingMode.toUpperCase()} mode...`, 'info');
                try {
                    if (tradingMode === 'live') {
                         if (aiSignal.action === 'BUY') { 
                            await handlePlaceSuperOrder(superOrderRequest, aiSignal.id, nseStock.SYMBOL); 
                         } else {
                            addAutoTradingLog(`LIVE ATE decided SELL for ${nseStock.SYMBOL} with Super Order parameters. Manual placement advised.`, 'info', superOrderRequest);
                         }
                    } else { 
                        const paperEntryOrderRequest: DhanOrderRequest = { ...superOrderRequest, orderType: 'MARKET', price: undefined, validity: DEFAULT_VALIDITY };
                        const placedEntryOrder = await handlePlaceOrder(paperEntryOrderRequest, aiSignal.id, nseStock.SYMBOL, currentStockPrice);
                        if (placedEntryOrder && placedEntryOrder.orderStatus === 'PAPER_TRADED') {
                             addAutoTradingLog(`Paper Super Order (Entry) for ${nseStock.SYMBOL} processed. Entry ID: ${placedEntryOrder.orderId}. Target: ${aiSignal.targetPrice}, SL: ${aiSignal.stopLossPrice}`, 'trade_placed', { entry: placedEntryOrder, target: aiSignal.targetPrice, sl: aiSignal.stopLossPrice });
                        }
                    }
                } catch (orderError) { addAutoTradingLog(`Failed to place SUPER order for ${nseStock.SYMBOL} in ${tradingMode.toUpperCase()} mode: ${orderError instanceof Error ? orderError.message : 'Unknown order error'}`, 'error', orderError as Error); }
            } else if (aiSignal.action !== 'HOLD') { 
                const orderRequest: DhanOrderRequest = { securityId: securityIdFromNse, exchangeSegment: exchangeSegmentFromNse, transactionType: aiSignal.action as DhanTransactionType, productType: DEFAULT_PRODUCT_TYPE, orderType: 'MARKET', quantity: orderQty, validity: DEFAULT_VALIDITY, correlationId: `${AI_TRADE_CORRELATION_PREFIX}AUTO_${tradingMode === 'paper' ? 'PAPER_' : 'LIVE_'}${Date.now()}` };
                addAutoTradingLog(`Attempting to place simple ${aiSignal.action} order for ${nseStock.SYMBOL} (Qty: ${orderQty}) in ${tradingMode.toUpperCase()} mode... (No TGT/SL from AI)`, 'info');
                try { const placedOrder = await handlePlaceOrder(orderRequest, aiSignal.id, nseStock.SYMBOL, currentStockPrice); if(placedOrder) addAutoTradingLog(`Simple Order for ${nseStock.SYMBOL} in ${tradingMode.toUpperCase()} mode processed. ID: ${placedOrder.orderId}, Status: ${placedOrder.orderStatus}`, 'trade_placed', placedOrder); else if (tradingMode === 'live' && aiSignal.action === 'BUY') addAutoTradingLog(`LIVE BUY simple order for ${nseStock.SYMBOL} was cancelled or did not proceed.`, 'info'); }
                catch (orderError) { addAutoTradingLog(`Failed to place simple order for ${nseStock.SYMBOL} in ${tradingMode.toUpperCase()} mode: ${orderError instanceof Error ? orderError.message : 'Unknown order error'}`, 'error', orderError as Error); }
            }
          }
        } else { addAutoTradingLog(`No actionable AI signal for ${nseStock.SYMBOL}.`, 'info', `ATE: ${nseStock.SYMBOL}`); }
      } catch (stockProcessingError) { addAutoTradingLog(`Error processing ${nseStock.SYMBOL}: ${stockProcessingError instanceof Error ? stockProcessingError.message : 'Unknown error'}`, 'error', stockProcessingError as Error); }
      // Removed artificial delay: await new Promise(resolve => setTimeout(resolve, tradingMode === 'paper' ? 200 : (tradingMode === 'live' ? 1000: 300))); 
    }
    addAutoTradingLog(`ATE (${tradingMode.toUpperCase()} mode) cycle complete.`, 'info');
    setIsAutoTradingActive(false); setIsAutoEngineViewActive(false); isAutoTradingActiveRef.current = false;
    if (tradingMode === 'live') fetchAccountData(); else if (tradingMode === 'paper') loadPaperTradingData(); 
  }, [isNseListLoaded, nseStockListFull, addAutoTradingLog, handlePlaceOrder, fetchAccountData, tradingMode, paperTradingSettings, initializePaperTradingSession, paperHoldings, loadPaperTradingData, ateConfig, handlePlaceSuperOrder]);


  const handleStopAutomatedTrading = useCallback(() => {
    setIsAutoTradingActive(false); setIsAutoEngineViewActive(false); isAutoTradingActiveRef.current = false;
    addAutoTradingLog("ATE stopping...", 'info');
  }, [addAutoTradingLog]);


  const loadingMessage = isPaperDataLoading ? "Loading paper trading data..." : isAutoTradingActive && !isAutoEngineViewActive ? "ATE processing in background..." : isAutoTradingActive && isAutoEngineViewActive ? "ATE processing..." : isPlacingOrder ? `Placing order...` : isConvertingPosition ? "Processing position conversion..." : marginCalcLoading ? "Calculating margin..." : isLoadingSuperOrders ? "Processing Super Order..." : appState === 'loading' ? (currentSearchedSymbol ? `Fetching for ${currentSearchedSymbol}...` : "Loading account data...") : appState === 'awaiting_trade_decision' ? `AI generating decision for ${currentSearchedSymbol || 'stock'}...` : "Loading...";


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-8 antialiased">
      <header className="text-center mb-6">
        <h1 className="text-4xl sm:text-5xl font-bold text-emerald-400">{APP_TITLE} - Dhan API Portfolio Ready</h1>
        <p className="text-gray-400 mt-2 text-sm sm:text-base"> {APP_SUBTITLE} ({tradingMode === 'paper' ? PAPER_TRADING_MODE_LABEL : LIVE_TRADING_MODE_LABEL}) </p>
        <div className="mt-4"> <span className="mr-2 text-gray-300">Mode:</span> <button onClick={() => setTradingMode('live')} className={`px-3 py-1 text-sm rounded-l-md ${tradingMode === 'live' ? 'bg-sky-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`} aria-pressed={tradingMode === 'live'} disabled={isAutoTradingActive || isPaperDataLoading} > {LIVE_TRADING_MODE_LABEL} </button> <button onClick={() => setTradingMode('paper')} className={`px-3 py-1 text-sm rounded-r-md ${tradingMode === 'paper' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`} aria-pressed={tradingMode === 'paper'} disabled={isAutoTradingActive || isPaperDataLoading} > {PAPER_TRADING_MODE_LABEL} </button> </div>
        <p className="text-xs text-yellow-300 mt-2"> Market Hours (IST): 09:15 AM - 03:30 PM (Mon-Fri) </p>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        {initialLoadError && (!error || error === initialLoadError || error.includes(NSE_DATA_LOAD_ERROR)) && appState !== 'error' && ( <ErrorDisplay message="Initial Data Load Issue" details={initialLoadError} /> )}
        {!isAutoEngineViewActive && ( <StockSearch onSearch={handleSearch} isLoading={appState === 'loading' || appState === 'awaiting_trade_decision' || isPlacingOrder || isAutoTradingActive || marginCalcLoading || isPaperDataLoading || isLoadingSuperOrders} nseStockList={nseStockListFull} /> )}
        {(appState === 'loading' || appState === 'awaiting_trade_decision' || isConvertingPosition || isPlacingOrder || marginCalcLoading || isPaperDataLoading || (isAutoTradingActive && !isAutoEngineViewActive) || isLoadingSuperOrders) && <LoadingSpinner message={loadingMessage} /> }
        {appState === 'error' && error && <ErrorDisplay message="Process Failed" details={error} />}
        {superOrdersError && <ErrorDisplay message="Super Order Error" details={superOrdersError} />}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`space-y-6 ${isAutoEngineViewActive ? 'md:col-span-3' : 'md:col-span-2'}`}>
            {isAutoEngineViewActive ? (
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl"> <h2 className="text-2xl font-semibold text-sky-400 mb-4 border-b border-gray-700 pb-2">{AUTO_ENGINE_VIEW_TITLE} ({tradingMode.toUpperCase()} Mode)</h2> <AutomatedTradingEnginePanel onStartEngine={handleStartAutomatedTrading} onStopEngine={handleStopAutomatedTrading} logs={autoTradingStatusLog} isActive={isAutoTradingActive} isLoadingInitially={!isNseListLoaded || (tradingMode === 'paper' && !paperTradingSettings.sessionActive && !isPaperDataLoading)} shortlistedTrades={automatedShortlistedTrades} /> </div>
            ) : (
              <>
                {showTradeDecisionPanel && currentTradeSignal && stockData && ( <TradeDecisionPanel signal={currentTradeSignal} stockData={stockData} onApprove={handleApproveTrade} onReject={handleRejectTrade} /> )}
                 {appState === 'success' && stockData && (
                  <>
                    <OrderPlacementPanel stockData={stockData} onPlaceOrder={(orderReq) => handlePlaceOrder(orderReq, undefined, stockData.symbol, stockData.currentPrice)} isLoading={isPlacingOrder || isPaperDataLoading} tradingMode={tradingMode} />
                    {tradingMode === 'live' && ( <SuperOrderPlacementPanel stockData={stockData} onPlaceSuperOrder={(req) => handlePlaceSuperOrder(req, undefined, stockData.symbol)} isLoading={isPlacingOrder || isLoadingSuperOrders} /> )}
                    <MarginCalculatorPanel stockData={stockData} dhanClientId={DHAN_MOCK_CLIENT_ID} onCalculateMargin={calculateDhanMargin} isLoading={marginCalcLoading} setIsLoading={setMarginCalcLoading} result={marginCalcResult} setResult={setMarginCalcResult} error={marginCalcError} setError={setMarginCalcError} tradingMode={tradingMode} />
                    <StockDashboard stockData={stockData} analysis={geminiAnalysis} strategies={strategies} tradingMode={tradingMode} />
                  </>
                )}
                 {appState === 'idle' && !stockData && !error && !initialLoadError && isNseListLoaded && !isPaperDataLoading && ( <div className="text-center py-10 text-gray-500 h-96 flex items-center justify-center"> <p>{IDLE_MESSAGE_APP_START}</p> </div> )}
                 {appState === 'idle' && !stockData && !error && initialLoadError && isNseListLoaded && !isPaperDataLoading && ( <div className="text-center py-10 text-gray-500 h-96 flex items-center justify-center"> <p>{IDLE_MESSAGE_APP_START} (Note: Some initial data may be missing).</p> </div> )}
                <HistoricalDataFetcher nseStockList={nseStockListFull} fetchInstrumentsFunction={searchDhanInstruments} fetchHistoricalDataFunction={getDhanHistoricalDailyData} />
              </>
            )}
          </div>
          
          <div className={`${isAutoEngineViewActive ? 'hidden md:block' : ''} md:col-span-1 space-y-6`}>
             {!isAutoEngineViewActive && ( <AutomatedTradingEngineConfigPanel currentConfig={ateConfig} onSaveConfig={setAteConfig} /> )}
             {!isAutoEngineViewActive && ( <AutomatedTradingEnginePanel onStartEngine={handleStartAutomatedTrading} onStopEngine={handleStopAutomatedTrading} logs={autoTradingStatusLog} isActive={isAutoTradingActive} isLoadingInitially={!isNseListLoaded || (tradingMode === 'paper' && !paperTradingSettings.sessionActive && !isPaperDataLoading)} shortlistedTrades={automatedShortlistedTrades} /> )}
             {tradingMode === 'paper' && ( <> <PaperTradingControlPanel settings={paperTradingSettings} onSessionStart={initializePaperTradingSession} isLoading={isPaperDataLoading} /> <PaperLedgerPanel entries={paperLedgerEntries} /> </> )}
            <FundLimitsPanel fundLimits={fundLimits} paperBalance={paperTradingSettings.currentBalance} tradingMode={tradingMode} isLoading={(appState === 'loading' && !stockData && tradingMode === 'live') || isPlacingOrder || isAutoTradingActive || isPaperDataLoading} />
            {tradingMode === 'live' && ( <SuperOrderListPanel superOrders={superOrders} isLoading={isLoadingSuperOrders} onRefresh={handleFetchSuperOrders} onModify={handleModifySuperOrder} onCancelLeg={handleCancelSuperOrderLeg} /> )}
            <ActiveHoldingsPanel holdings={tradingMode === 'paper' ? paperHoldings : userHoldings} tradingMode={tradingMode} /> 
            <OpenPositionsPanel positions={tradingMode === 'paper' ? paperPositions : openPositions} onConvertPosition={handleConvertPosition} isLoading={isConvertingPosition} tradingMode={tradingMode} />
            <OrderHistoryPanel orders={tradingMode === 'paper' ? paperTradeHistory : tradeOrders} tradingMode={tradingMode} /> 
          </div>
        </div>
        {appState === 'idle' && !isNseListLoaded && !isConvertingPosition && !isPlacingOrder && !isAutoTradingActive && !marginCalcLoading && !isPaperDataLoading && ( <LoadingSpinner message="Loading initial application data..." /> )}
      </main>

      <footer className="text-center mt-12 py-6 border-t border-gray-700">
        <p className="text-sm text-gray-500"> {FOOTER_COPYRIGHT_TEXT_PREFIX}{new Date().getFullYear()}{FOOTER_COPYRIGHT_TEXT_SUFFIX} </p>
        <p className="text-xs text-red-400 mt-1"> {FOOTER_RISK_DISCLAIMER} When in '{LIVE_TRADING_MODE_LABEL}', actions interact with your REAL Dhan account. </p>
      </footer>
    </div>
  );
};

export default App;
