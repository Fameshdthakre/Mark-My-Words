
import React, { useState, useEffect, useCallback } from 'react';
import {
  NseTotalMarketStockInfo,
  DhanHistoricalDataRequest,
  DhanHistoricalDataResponse,
  HistoricalDataPoint,
  DhanInstrument,
  DhanExchangeSegment,
  DhanHistoricalInstrumentType,
} from '../types';
import { searchDhanInstruments, getDhanHistoricalDailyData, getDhanHistoricalIntradayData } from '../services/dhanBrokerService'; // Added getDhanHistoricalIntradayData
import Card from './shared/Card';
import LoadingSpinner from './shared/LoadingSpinner';
import ErrorDisplay from './shared/ErrorDisplay';

interface HistoricalDataFetcherProps {
  nseStockList: NseTotalMarketStockInfo[];
  fetchInstrumentsFunction: typeof searchDhanInstruments;
  fetchHistoricalDataFunction: typeof getDhanHistoricalDailyData; // This prop is specifically for daily
}

const DATE_FORMAT_YYYY_MM_DD = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const ALLOWED_EXCHANGE_SEGMENTS: DhanExchangeSegment[] = ['NSE_EQ', 'NSE_FNO', 'BSE_EQ', 'BSE_FNO', 'MCX_COMM', 'IDX_I'];
const ALLOWED_INSTRUMENT_TYPES: DhanHistoricalInstrumentType[] = ['EQUITY', 'INDEX', 'FUTIDX', 'FUTSTK', 'FUTCOM', 'OPTIDX', 'OPTSTK', 'OPTCOM'];
const DERIVATIVE_INSTRUMENT_TYPES: DhanHistoricalInstrumentType[] = ['FUTIDX', 'FUTSTK', 'FUTCOM', 'OPTIDX', 'OPTSTK', 'OPTCOM'];


const HistoricalDataFetcher: React.FC<HistoricalDataFetcherProps> = ({
  nseStockList,
  fetchInstrumentsFunction,
  fetchHistoricalDataFunction, // Used for daily data
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [securityId, setSecurityId] = useState<string>('');
  const [exchangeSegment, setExchangeSegment] = useState<DhanExchangeSegment>('NSE_EQ');
  const [instrumentType, setInstrumentType] = useState<DhanHistoricalInstrumentType>('EQUITY');
  const [selectedExpiryCode, setSelectedExpiryCode] = useState<number>(0); 

  const today = DATE_FORMAT_YYYY_MM_DD(new Date());
  const oneMonthAgo = DATE_FORMAT_YYYY_MM_DD(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const oneDayAgo = DATE_FORMAT_YYYY_MM_DD(new Date(new Date().setDate(new Date().getDate() - 1)));


  const [chartDataType, setChartDataType] = useState<'DAILY' | 'INTRADAY'>('DAILY');
  const [interval, setInterval] = useState<'1' | '5' | '15' | '25' | '60'>('1');
  
  const [fromDate, setFromDate] = useState<string>(chartDataType === 'DAILY' ? oneMonthAgo : oneDayAgo);
  const [toDate, setToDate] = useState<string>(today);
  const [includeOi, setIncludeOi] = useState<boolean>(false);
  
  const [fetchedData, setFetchedData] = useState<HistoricalDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isDerivativeSelected = DERIVATIVE_INSTRUMENT_TYPES.includes(instrumentType);

  useEffect(() => {
    if (chartDataType === 'DAILY') {
      setFromDate(oneMonthAgo);
      // For daily, toDate often defaults to today, which is already its initial state
      // or set by date pickers/buttons.
    } else { // INTRADAY
      setFromDate(oneDayAgo); // Default fromDate for intraday is yesterday
      setToDate(today);       // Default toDate for intraday is today
    }
  }, [chartDataType, oneMonthAgo, oneDayAgo, today]);

  const populateStockDetails = useCallback(async (symbol: string) => {
    if (!symbol) return;
    const stockInfo = nseStockList.find(s => s.SYMBOL === symbol);

    let derivedInstTypeFromSymbol: DhanHistoricalInstrumentType = 'EQUITY'; 
    if (stockInfo?.DHAN_INSTRUMENT_TYPE && ALLOWED_INSTRUMENT_TYPES.includes(stockInfo.DHAN_INSTRUMENT_TYPE)) {
        derivedInstTypeFromSymbol = stockInfo.DHAN_INSTRUMENT_TYPE;
    }

    if (stockInfo?.DHAN_SECURITY_ID && stockInfo?.DHAN_EXCHANGE_SEGMENT) {
        setSecurityId(stockInfo.DHAN_SECURITY_ID);
        if (ALLOWED_EXCHANGE_SEGMENTS.includes(stockInfo.DHAN_EXCHANGE_SEGMENT)) {
            setExchangeSegment(stockInfo.DHAN_EXCHANGE_SEGMENT);
        } else {
            setExchangeSegment('NSE_EQ'); 
        }
        setInstrumentType(derivedInstTypeFromSymbol);
        if (!DERIVATIVE_INSTRUMENT_TYPES.includes(derivedInstTypeFromSymbol)) {
            setSelectedExpiryCode(0); 
        }
    } else {
        try {
            setIsLoading(true);
            setError(null);
            const instruments: DhanInstrument[] = await fetchInstrumentsFunction(symbol, exchangeSegment); // Use current exchangeSegment state
            if (instruments && instruments.length > 0) {
                const mainInstrument = instruments[0];
                setSecurityId(mainInstrument.SEM_SECURITY_ID);
                
                let segment: DhanExchangeSegment = 'NSE_EQ';
                let newDerivedInstrumentType: DhanHistoricalInstrumentType = 'EQUITY';

                if (mainInstrument.SEM_EXM_EXCH_ID === 'NSE') {
                    if (mainInstrument.SEM_SEGMENT === 'E') segment = 'NSE_EQ';
                    else if (mainInstrument.SEM_SEGMENT === 'D') segment = 'NSE_FNO';
                } else if (mainInstrument.SEM_EXM_EXCH_ID === 'BSE' && mainInstrument.SEM_SEGMENT === 'E') {
                    segment = 'BSE_EQ';
                } else if (mainInstrument.SEM_EXM_EXCH_ID === 'MCX' && mainInstrument.SEM_SEGMENT === 'E') { 
                    segment = 'MCX_COMM';
                } else if (mainInstrument.SEM_EXM_EXCH_ID === 'IDX' && mainInstrument.SEM_SEGMENT === 'I') { 
                    segment = 'IDX_I';
                    newDerivedInstrumentType = 'INDEX';
                }

                const dhanInstName = mainInstrument.SEM_INSTRUMENT_NAME?.toUpperCase();
                if (dhanInstName === 'INDEX') newDerivedInstrumentType = 'INDEX';
                else if (dhanInstName === 'EQUITY') newDerivedInstrumentType = 'EQUITY';
                else if (dhanInstName && ALLOWED_INSTRUMENT_TYPES.includes(dhanInstName as DhanHistoricalInstrumentType)) {
                     newDerivedInstrumentType = dhanInstName as DhanHistoricalInstrumentType;
                } else if (dhanInstName?.startsWith('FUT')) newDerivedInstrumentType = 'FUTSTK'; 
                else if (dhanInstName?.startsWith('OPT')) newDerivedInstrumentType = 'OPTSTK'; 
                
                if (ALLOWED_EXCHANGE_SEGMENTS.includes(segment)) setExchangeSegment(segment);
                
                setInstrumentType(newDerivedInstrumentType);
                if (!DERIVATIVE_INSTRUMENT_TYPES.includes(newDerivedInstrumentType)) {
                    setSelectedExpiryCode(0); 
                }

            } else {
                setError(`Could not find Dhan instrument details for ${symbol}.`);
                setSecurityId('');
            }
        } catch (err) {
            setError(`Error fetching instrument details for ${symbol}: ${err instanceof Error ? err.message : String(err)}`);
            setSecurityId('');
        } finally {
            setIsLoading(false);
        }
    }
  }, [nseStockList, fetchInstrumentsFunction, exchangeSegment]);


  useEffect(() => {
    if (selectedSymbol) {
      populateStockDetails(selectedSymbol);
    } else if (nseStockList.length > 0 && nseStockList[0]?.SYMBOL) {
      setSelectedSymbol(nseStockList[0].SYMBOL);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSymbol, nseStockList]); // populateStockDetails removed to prevent re-triggering from its own state updates


  const handleFetchData = async () => {
    if (!securityId || !exchangeSegment) {
      setError('Please select a stock with valid Security ID and Exchange Segment.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setFetchedData([]);
    
    const requestPayload: DhanHistoricalDataRequest = {
      securityId,
      exchangeSegment,
      instrument: instrumentType,
      fromDate,
      toDate,
      oi: includeOi,
      ...(chartDataType === 'INTRADAY' && { interval: interval }),
      // Conditionally include expiryCode only for derivative instruments.
      ...(DERIVATIVE_INSTRUMENT_TYPES.includes(instrumentType) && { expiryCode: selectedExpiryCode }),
    };
    
    let apiFunction: (req: DhanHistoricalDataRequest) => Promise<DhanHistoricalDataResponse>;

    if (chartDataType === 'INTRADAY') {
        apiFunction = getDhanHistoricalIntradayData;
    } else { // DAILY
        apiFunction = fetchHistoricalDataFunction; 
    }

    try {
      const response: DhanHistoricalDataResponse = await apiFunction(requestPayload);
      if (response && response.timestamp && response.timestamp.length > 0) {
        const transformedData: HistoricalDataPoint[] = response.timestamp.map((ts, index) => {
            const openVal = response.open?.[index];
            const highVal = response.high?.[index];
            const lowVal = response.low?.[index];
            const closeVal = response.close?.[index];
            const volumeVal = response.volume?.[index];
            const oiVal = response.open_interest?.[index];

            if (typeof openVal !== 'number' || !isFinite(openVal) ||
                typeof highVal !== 'number' || !isFinite(highVal) ||
                typeof lowVal !== 'number' || !isFinite(lowVal) ||
                typeof closeVal !== 'number' || !isFinite(closeVal) ||
                typeof volumeVal !== 'number' || !isFinite(volumeVal) ||
                (includeOi && oiVal !== undefined && (typeof oiVal !== 'number' || !isFinite(oiVal)))
            ) {
                console.warn(`HistoricalDataFetcher: Invalid or missing data at index ${index} for ${securityId}. Timestamp: ${ts}. Skipping point.`);
                return null;
            }

            return {
              date: chartDataType === 'INTRADAY' 
                    ? new Date(ts * 1000).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) 
                    : new Date(ts * 1000).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
              open: openVal,
              high: highVal,
              low: lowVal,
              close: closeVal,
              volume: volumeVal,
              openInterest: (typeof oiVal === 'number' && isFinite(oiVal)) ? oiVal : undefined,
            };
        }).filter(Boolean) as HistoricalDataPoint[];
        setFetchedData(transformedData);
      } else if (response && response.status === 'error' && response.remarks) {
         setError(`API Error: ${response.remarks.title} - ${response.remarks.message}`);
      } else if (response && response.timestamp && response.timestamp.length === 0) {
        setFetchedData([]);
        setError('No historical data found for the selected criteria.');
      } else {
        setFetchedData([]);
        setError('Received empty or unexpected data format from API.');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to fetch historical data: ${errorMsg}`);
      console.error("Historical data fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const setPredefinedRange = (months: number | 'YTD') => {
    const newToDate = new Date();
    let newFromDate = new Date();
    if (chartDataType === 'INTRADAY') { 
        // This logic should not be hit by daily buttons, but added for safety
        if (months === 1) newFromDate.setDate(newToDate.getDate() - 7); 
        else if (months === 3) newFromDate.setDate(newToDate.getDate() - 1); 
        else if (months === 'YTD' || months === 6 || months === 12) newFromDate.setDate(newToDate.getDate() - 1);
        else newFromDate.setDate(newToDate.getDate() -1); 
    } else { // DAILY
        if (months === 'YTD') {
          newFromDate = new Date(newToDate.getFullYear(), 0, 1);
        } else {
          newFromDate.setMonth(newToDate.getMonth() - months);
        }
    }
    setFromDate(DATE_FORMAT_YYYY_MM_DD(newFromDate));
    setToDate(DATE_FORMAT_YYYY_MM_DD(newToDate));
  };

  const inputClass = "w-full bg-gray-700 border border-gray-600 text-gray-100 py-2 px-3 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1";
  const selectClass = `${inputClass} appearance-none`;
  const buttonClass = "px-3 py-1.5 text-xs bg-sky-600 hover:bg-sky-700 rounded-md text-white transition-colors";
  const dateButtonContainerClass = "flex flex-wrap gap-2 mb-3";

  return (
    <Card title="Dhan Historical Data Fetcher" className="mt-6">
      {/* Chart Type Selection */}
      <div className="mb-4">
        <label className={labelClass}>Chart Type</label>
        <div className="flex space-x-4">
            {(['DAILY', 'INTRADAY'] as const).map(type => (
                <label key={type} className="flex items-center space-x-2 text-sm cursor-pointer">
                    <input 
                        type="radio" 
                        name="chartDataType" 
                        value={type} 
                        checked={chartDataType === type} 
                        onChange={() => setChartDataType(type)}
                        className="form-radio text-emerald-500 bg-gray-700 border-gray-600 focus:ring-emerald-500"
                    />
                    <span>{type.charAt(0) + type.slice(1).toLowerCase()}</span>
                </label>
            ))}
        </div>
      </div>
      
      {/* Interval Dropdown (for Intraday) */}
      {chartDataType === 'INTRADAY' && (
        <div className="mb-4">
          <label htmlFor="histInterval" className={labelClass}>Interval</label>
          <select 
            id="histInterval" 
            value={interval} 
            onChange={e => setInterval(e.target.value as typeof interval)} 
            className={selectClass}
          >
            {(['1', '5', '15', '25', '60'] as const).map(val => (
              <option key={val} value={val}>{val} Minute{val !== '1' ? 's' : ''}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div>
          <label htmlFor="histStockSymbol" className={labelClass}>Stock Symbol</label>
          <select
            id="histStockSymbol"
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className={selectClass}
          >
            <option value="">Select Stock</option>
            {nseStockList.map(stock => (
              <option key={stock.SYMBOL} value={stock.SYMBOL}>
                {stock.SYMBOL} - {stock["NAME OF COMPANY"]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="histInstrumentType" className={labelClass}>Instrument Type</label>
          <select 
            id="histInstrumentType" 
            value={instrumentType} 
            onChange={e => {
                const newType = e.target.value as DhanHistoricalInstrumentType;
                setInstrumentType(newType);
                if (!DERIVATIVE_INSTRUMENT_TYPES.includes(newType)) {
                    setSelectedExpiryCode(0); 
                }
            }} 
            className={selectClass}
          >
            {ALLOWED_INSTRUMENT_TYPES.map(it => (
              <option key={it} value={it}>{it}</option>
            ))}
          </select>
        </div>
         <div>
          <label htmlFor="histExchangeSegment" className={labelClass}>Exchange Segment</label>
           <select 
            id="histExchangeSegment" 
            value={exchangeSegment} 
            onChange={e => setExchangeSegment(e.target.value as DhanExchangeSegment)} 
            className={selectClass}
          >
            {ALLOWED_EXCHANGE_SEGMENTS.map(es => (
              <option key={es} value={es}>{es}</option>
            ))}
          </select>
           <p className="text-[10px] text-gray-500 mt-0.5">Current: {securityId ? exchangeSegment : 'N/A'}</p>
        </div>
        <div>
          <label htmlFor="histSecurityId" className={labelClass}>Security ID (Dhan)</label>
          <input type="text" id="histSecurityId" value={securityId} onChange={(e) => setSecurityId(e.target.value)} className={inputClass} placeholder="e.g., 1333 (RELIANCE)" />
          <p className="text-[10px] text-gray-500 mt-0.5">Current: {securityId ? securityId : 'N/A'}</p>
        </div>

        {isDerivativeSelected && (
            <div>
                <label htmlFor="histExpiryCode" className={labelClass}>Expiry Code (Derivatives)</label>
                <select
                    id="histExpiryCode"
                    value={selectedExpiryCode}
                    onChange={e => setSelectedExpiryCode(parseInt(e.target.value, 10))}
                    className={selectClass}
                >
                    <option value={0}>Current/Near Expiry</option>
                    <option value={1}>Next Expiry</option>
                    <option value={2}>Far Expiry</option>
                </select>
            </div>
        )}
      </div>

      <div className={dateButtonContainerClass}>
        {chartDataType === 'DAILY' && (
            <>
                <button onClick={() => setPredefinedRange(1)} className={buttonClass}>1M</button>
                <button onClick={() => setPredefinedRange(3)} className={buttonClass}>3M</button>
                <button onClick={() => setPredefinedRange(6)} className={buttonClass}>6M</button>
                <button onClick={() => setPredefinedRange(12)} className={buttonClass}>1Y</button>
                <button onClick={() => setPredefinedRange('YTD')} className={buttonClass}>YTD</button>
            </>
        )}
        {chartDataType === 'INTRADAY' && ( 
             <>
                <button onClick={() => {const now = new Date(); setFromDate(DATE_FORMAT_YYYY_MM_DD(now)); setToDate(DATE_FORMAT_YYYY_MM_DD(now));}} className={buttonClass}>Today</button>
                <button onClick={() => { const yesterday = new Date(); yesterday.setDate(yesterday.getDate() -1); setFromDate(DATE_FORMAT_YYYY_MM_DD(yesterday)); setToDate(DATE_FORMAT_YYYY_MM_DD(yesterday));}} className={buttonClass}>Yesterday</button>
                 <button onClick={() => { const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() -3); setFromDate(DATE_FORMAT_YYYY_MM_DD(threeDaysAgo)); setToDate(DATE_FORMAT_YYYY_MM_DD(new Date()));}} className={buttonClass}>Last 3 Days</button>
             </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="histFromDate" className={labelClass}>From Date</label>
          <input type="date" id="histFromDate" value={fromDate} onChange={e => setFromDate(e.target.value)} className={inputClass} max={today}/>
        </div>
        <div>
          <label htmlFor="histToDate" className={labelClass}>To Date</label>
          <input type="date" id="histToDate" value={toDate} onChange={e => setToDate(e.target.value)} className={inputClass} max={today} min={fromDate}/>
        </div>
      </div>
      
      <div className="flex items-center space-x-3 mb-4">
          <input 
            type="checkbox" 
            id="histIncludeOi" 
            checked={includeOi} 
            onChange={e => setIncludeOi(e.target.checked)} 
            className="form-checkbox h-4 w-4 text-emerald-500 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500"
          />
          <label htmlFor="histIncludeOi" className="text-sm text-gray-300">Include Open Interest (if applicable)</label>
      </div>

      <button
        onClick={handleFetchData}
        disabled={isLoading || !securityId}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-500 text-white font-semibold py-2.5 px-4 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 mb-4"
      >
        {isLoading ? 'Fetching Data...' : `Fetch ${chartDataType === 'DAILY' ? 'Daily' : 'Intraday'} Data`}
      </button>

      {isLoading && <LoadingSpinner message="Fetching historical data..." />}
      {error && <ErrorDisplay message="Data Fetch Error" details={error} />}

      {fetchedData.length > 0 && (
        <div className="mt-6 max-h-96 overflow-y-auto">
          <h4 className="text-lg font-semibold text-emerald-400 mb-2">
            {chartDataType === 'DAILY' ? 'Daily' : `Intraday (${interval} min)`} Data for {selectedSymbol} ({securityId}) - {fetchedData.length} records
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-emerald-400 uppercase bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-4 py-2">Date{chartDataType === 'INTRADAY' ? '/Time' : ''}</th>
                  <th scope="col" className="px-4 py-2">Open</th>
                  <th scope="col" className="px-4 py-2">High</th>
                  <th scope="col" className="px-4 py-2">Low</th>
                  <th scope="col" className="px-4 py-2">Close</th>
                  <th scope="col" className="px-4 py-2">Volume</th>
                  {includeOi && fetchedData.some(d => d.openInterest !== undefined) && (
                    <th scope="col" className="px-4 py-2">Open Interest</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {fetchedData.map((dataPoint, index) => (
                  <tr key={index} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700">
                    <td className="px-4 py-2">{dataPoint.date}</td>
                    <td className="px-4 py-2">{dataPoint.open.toFixed(2)}</td>
                    <td className="px-4 py-2">{dataPoint.high.toFixed(2)}</td>
                    <td className="px-4 py-2">{dataPoint.low.toFixed(2)}</td>
                    <td className="px-4 py-2">{dataPoint.close.toFixed(2)}</td>
                    <td className="px-4 py-2">{dataPoint.volume.toLocaleString('en-IN')}</td>
                    {includeOi && fetchedData.some(d => d.openInterest !== undefined) && (
                       <td className="px-4 py-2">
                        {dataPoint.openInterest !== undefined ? dataPoint.openInterest.toLocaleString('en-IN') : 'N/A'}
                       </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      { !isLoading && !error && fetchedData.length === 0 && selectedSymbol && securityId && (
         <p className="text-gray-500 mt-4">No data loaded yet, or no data found for current criteria. Click "Fetch Historical Data".</p>
      )}
    </Card>
  );
};

export default HistoricalDataFetcher;
