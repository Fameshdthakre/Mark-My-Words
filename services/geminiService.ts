

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { DhanStockData, SwingStrategy, GeminiAnalysis, TradeSignal, DhanHolding, StockPricePoint, HistoricalDataPoint } from '../types'; 
import { 
  GEMINI_TEXT_MODEL, 
  MAX_STRATEGIES,
  ERROR_MSG_API_KEY_MISSING_TITLE,
  ERROR_MSG_API_KEY_MISSING_DETAIL,
  ERROR_MSG_ANALYSIS_TITLE,
  ERROR_MSG_ANALYSIS_DETAIL,
  ERROR_MSG_ANALYSIS_API_ERROR_DETAIL,
  ERROR_MSG_STRATEGY_PARSE_TITLE,
  ERROR_MSG_STRATEGY_PARSE_DETAIL,
  ERROR_MSG_STRATEGY_API_TITLE,
  ERROR_MSG_STRATEGY_API_DETAIL,
  TRADE_SIGNAL_ID_PREFIX,
  ERROR_MSG_TRADE_DECISION_API_ERROR,
  AUTO_TRADE_SIGNAL_ID_PREFIX
} from '../constants';

if (!process.env.API_KEY) {
  console.error("API_KEY environment variable not set for Gemini API. The application may not function correctly.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const parseGeminiJsonResponse = <T>(responseText: string, primaryKeyForValidation?: string): T | null => {
  let jsonStrToParse = responseText.trim();
  
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const fenceMatch = jsonStrToParse.match(fenceRegex); 
  if (fenceMatch && fenceMatch[2]) {
    jsonStrToParse = fenceMatch[2].trim();
  }

  const firstBracketPos = jsonStrToParse.indexOf('[');
  const firstBracePos = jsonStrToParse.indexOf('{');

  let startIndex = -1;
  let startChar: string | null = null;

  if (firstBracketPos !== -1 && (firstBracePos === -1 || firstBracketPos < firstBracePos)) {
    startIndex = firstBracketPos;
    startChar = '[';
  } else if (firstBracePos !== -1) {
    startIndex = firstBracePos;
    startChar = '{';
  }

  if (startIndex !== -1 && startChar !== null) {
    const endChar = startChar === '[' ? ']' : '}';
    let balance = 0;
    let endIndex = -1;
    for (let i = startIndex; i < jsonStrToParse.length; i++) {
      if (jsonStrToParse[i] === startChar) {
        balance++;
      } else if (jsonStrToParse[i] === endChar) {
        balance--;
        if (balance === 0) {
          endIndex = i;
          break; 
        }
      }
    }

    if (endIndex !== -1) {
      const potentialJson = jsonStrToParse.substring(startIndex, endIndex + 1);
      if ((potentialJson.startsWith('[') && potentialJson.endsWith(']')) || (potentialJson.startsWith('{') && potentialJson.endsWith('}'))) {
        jsonStrToParse = potentialJson;
      } else {
        console.warn("parseGeminiJsonResponse: Extracted segment from balanced counting didn't look like valid JSON.");
      }
    } else {
      console.warn("parseGeminiJsonResponse: Could not find a balanced JSON structure.");
    }
  } else {
     console.warn("parseGeminiJsonResponse: No JSON start token '[' or '{' found.");
  }

  try {
    const parsed = JSON.parse(jsonStrToParse);
    
    if (primaryKeyForValidation) {
      let isValid = false;
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
            isValid = true; 
        } else if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null) {
          if (Object.prototype.hasOwnProperty.call(parsed[0], primaryKeyForValidation)) {
            isValid = true;
          }
        }
      } else if (typeof parsed === 'object' && parsed !== null) {
        if (Object.prototype.hasOwnProperty.call(parsed, primaryKeyForValidation)) {
          isValid = true;
        }
      }

      if (isValid) {
        return parsed as T;
      } else {
        console.warn(`Parsed JSON is missing expected primary key '${String(primaryKeyForValidation)}' or is not of expected structure. Parsed data:`, parsed, "Attempted to parse:", jsonStrToParse);
        return null;
      }
    }
    return parsed as T;
  } catch (e) {
    console.error("Failed to parse JSON response from Gemini:", e, "Attempted to parse:", jsonStrToParse, "Original text was:", responseText);
    return null;
  }
};


export const generateStockAnalysis = async (stockData: DhanStockData): Promise<GeminiAnalysis | null> => {
  if (!process.env.API_KEY) {
    console.error(ERROR_MSG_API_KEY_MISSING_DETAIL);
    return { marketSentiment: ERROR_MSG_API_KEY_MISSING_TITLE, keyObservations: ERROR_MSG_API_KEY_MISSING_DETAIL};
  }

  let historicalDataSummary = "No detailed historical data provided.";
  if (stockData.historicalData && stockData.historicalData.length > 0) {
    const firstPoint = stockData.historicalData[0];
    const lastPoint = stockData.historicalData[stockData.historicalData.length - 1];
    historicalDataSummary = `Historical daily prices for ${stockData.historicalData.length} days available, from ${firstPoint.date} (Price: ${firstPoint.price.toFixed(2)}) to ${lastPoint.date} (Price: ${lastPoint.price.toFixed(2)}). Current reported price is ${stockData.currentPrice.toFixed(2)}.`;
  }


  const prompt = `
    Analyze the following Indian stock data for ${stockData.name} (${stockData.symbol}):
    Dhan Security ID: ${stockData.dhanSecurityId || 'N/A'}, Exchange Segment: ${stockData.exchangeSegment || 'N/A'}
    Current Price: ${stockData.currentPrice} INR
    Price Change: ${stockData.priceChange} (${stockData.priceChangePercent}%)
    Volume: ${stockData.volume || 'N/A'}
    Day High: ${stockData.dayHigh || 'N/A'}, Day Low: ${stockData.dayLow || 'N/A'}
    Fundamentals:
      Market Cap: ${stockData.fundamentals?.marketCap || 'N/A'}
      P/E Ratio: ${stockData.fundamentals?.peRatio || 'N/A'}
      EPS: ${stockData.fundamentals?.eps || 'N/A'}
      Dividend Yield: ${stockData.fundamentals?.dividendYield || 'N/A'}%
      Book Value: ${stockData.fundamentals?.bookValue || 'N/A'}
    Technicals:
      50-Day SMA: ${stockData.technicals?.sma50 || 'N/A'}
      200-Day SMA: ${stockData.technicals?.sma200 || 'N/A'}
      RSI (14): ${stockData.technicals?.rsi || 'N/A'}
      MACD Line: ${stockData.technicals?.macdLine || 'N/A'}, MACD Signal: ${stockData.technicals?.macdSignal || 'N/A'}
      Support: ${stockData.technicals?.supportLevel || 'N/A'}, Resistance: ${stockData.technicals?.resistanceLevel || 'N/A'}
    
    Historical Data Summary: ${historicalDataSummary}
    (Note: The full historical dataset was used for this analysis if available, summary is for context).

    Provide your analysis strictly in JSON format with two keys: "marketSentiment" (string, e.g., "Bullish", "Bearish", "Neutral") and "keyObservations" (string, a brief paragraph).
    In your keyObservations, integrate insights from the historical price trend and volume trends along with other data points. Do not include any text outside the JSON object.
    Example JSON:
    {
      "marketSentiment": "Moderately Bullish based on recent upward trend and technicals",
      "keyObservations": "The stock shows strong upward momentum, breaking out from a consolidation phase seen in historical data, supported by increasing volume. RSI is approaching overbought but fundamentals remain supportive. Consider the historical resistance near [price] if applicable."
    }
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const analysisResult = parseGeminiJsonResponse<GeminiAnalysis>(response.text, 'marketSentiment');
    return analysisResult ?? { marketSentiment: ERROR_MSG_ANALYSIS_TITLE, keyObservations: ERROR_MSG_ANALYSIS_DETAIL};
  } catch (error) {
    console.error("Error generating stock analysis:", error);
    return { marketSentiment: ERROR_MSG_API_KEY_MISSING_TITLE, keyObservations: ERROR_MSG_ANALYSIS_API_ERROR_DETAIL};
  }
};


export const generateSwingStrategies = async (stockData: DhanStockData, analysis: GeminiAnalysis | null): Promise<SwingStrategy[]> => {
  if (!process.env.API_KEY) {
    console.error(ERROR_MSG_API_KEY_MISSING_DETAIL);
    return [{ strategyTitle: ERROR_MSG_API_KEY_MISSING_TITLE, entryCondition: 'N/A', targetPrice: 'N/A', stopLoss: 'N/A', riskAssessment: ERROR_MSG_API_KEY_MISSING_DETAIL }];
  }
  
  const analysisText = analysis ? `AI Sentiment: ${analysis.marketSentiment}. Observations: ${analysis.keyObservations}` : "No AI analysis available.";
  let historicalDataSummary = "No detailed historical data provided for strategy generation.";
  if (stockData.historicalData && stockData.historicalData.length > 0) {
    const firstPoint = stockData.historicalData[0];
    const lastPoint = stockData.historicalData[stockData.historicalData.length - 1];
    historicalDataSummary = `Recent historical data (${stockData.historicalData.length} days) shows prices moving from ~${firstPoint.price.toFixed(2)} (${firstPoint.date}) to ~${lastPoint.price.toFixed(2)} (${lastPoint.date}). Current price is ${stockData.currentPrice.toFixed(2)}. Consider volume trends from historical data.`;
  }

  const prompt = `
    Given the following data for Indian stock ${stockData.name} (${stockData.symbol}, Dhan Security ID: ${stockData.dhanSecurityId || 'N/A'}):
    Current Price: ${stockData.currentPrice} INR
    Volume: ${stockData.volume || 'N/A'}
    Day High: ${stockData.dayHigh || 'N/A'}, Day Low: ${stockData.dayLow || 'N/A'}
    Fundamentals: Market Cap: ${stockData.fundamentals?.marketCap || 'N/A'}, P/E Ratio: ${stockData.fundamentals?.peRatio || 'N/A'}, EPS: ${stockData.fundamentals?.eps || 'N/A'}
    Technicals: 50-Day SMA: ${stockData.technicals?.sma50 || 'N/A'}, 200-Day SMA: ${stockData.technicals?.sma200 || 'N/A'}, RSI (14): ${stockData.technicals?.rsi || 'N/A'}, Support: ${stockData.technicals?.supportLevel || 'N/A'}, Resistance: ${stockData.technicals?.resistanceLevel || 'N/A'}
    AI Analysis Summary: ${analysisText}
    Historical Data Context: ${historicalDataSummary} 
    (Note: The full historical dataset, including volume, was considered for strategy generation if available).

    Based on *all* provided information, including a multi-timeframe analysis considering the historical price and volume data, generate ${MAX_STRATEGIES} distinct swing trading strategies for ${stockData.name} for potential opportunities today or in the next few trading days.
    Provide the response strictly as a JSON array. Each object in the array must represent a single strategy and must contain the keys: "strategyTitle" (string), "entryCondition" (string, specific price levels or conditions, referencing historical patterns and volume confirmation if relevant), "targetPrice" (string, specific price or percentage), "stopLoss" (string, specific price or percentage), and "riskAssessment" (string, e.g., "Low", "Medium", "High", with brief justification).
    Ensure entry/target/stop loss are derived considering historical volatility, support/resistance levels evident from the data, current price, and volume trends. Do not include any text outside the JSON array.

    Example of the expected JSON array structure:
    [
      {
        "strategyTitle": "Breakout from Historical Consolidation on Volume Surge",
        "entryCondition": "Enter on a confirmed close above resistance level of ${stockData.technicals?.resistanceLevel || (stockData.currentPrice * 1.02).toFixed(2)} INR, which aligns with a previous historical high, with significantly increased volume (e.g., >1.5x average daily volume).",
        "targetPrice": "${(stockData.currentPrice * 1.08).toFixed(2)} INR (approx. 8% upside, targeting next historical supply zone).",
        "stopLoss": "Set stop-loss below recent swing low seen in historical data around ${stockData.technicals?.supportLevel || (stockData.currentPrice * 0.98).toFixed(2)} INR, or a 3% trail from entry.",
        "riskAssessment": "Medium risk. Relies on strong breakout confirmation with volume. Market volatility could affect outcome."
      }
    ]
    Make sure each JSON object is complete and correctly formatted. Calculate example target and stop loss based on provided data, incorporating historical context and volume.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const strategiesResult = parseGeminiJsonResponse<SwingStrategy[]>(response.text, 'strategyTitle');
    if (strategiesResult === null) {
      return [{ strategyTitle: ERROR_MSG_STRATEGY_PARSE_TITLE, entryCondition: 'N/A', targetPrice: 'N/A', stopLoss: 'N/A', riskAssessment: ERROR_MSG_STRATEGY_PARSE_DETAIL }];
    }
    return strategiesResult.slice(0, MAX_STRATEGIES);
  } catch (error) {
    console.error("Error generating swing strategies:", error);
    return [{ strategyTitle: ERROR_MSG_STRATEGY_API_TITLE, entryCondition: 'N/A', targetPrice: 'N/A', stopLoss: 'N/A', riskAssessment: ERROR_MSG_STRATEGY_API_DETAIL }];
  }
};


export const generateTradeDecision = async (
  stockData: DhanStockData, 
  analysis: GeminiAnalysis | null,
  currentHoldings?: DhanHolding[] 
): Promise<TradeSignal | null> => {
  if (!process.env.API_KEY) {
    console.error(ERROR_MSG_API_KEY_MISSING_DETAIL);
    return null; 
  }
  const holdingKey = stockData.dhanSecurityId || stockData.symbol;
  const existingHolding = currentHoldings?.find(h => (stockData.dhanSecurityId && h.securityId === stockData.dhanSecurityId) || h.tradingSymbol.startsWith(stockData.symbol));
  
  const holdingsInfo = existingHolding
    ? `User currently holds ${existingHolding.totalQty} shares of ${existingHolding.tradingSymbol} (Average Cost Price: ${existingHolding.averageCostPrice}, Invested: ${existingHolding.investedValue || 'N/A'}, Current Value: ${existingHolding.currentValue || 'N/A'}, P&L: ${existingHolding.pnl || 'N/A'}).`
    : `User has no current holding in ${stockData.symbol}.`;

  let historicalDataInfo = "No detailed historical data available for this decision.";
  if (stockData.historicalData && stockData.historicalData.length > 0) {
    const lastPoint = stockData.historicalData[stockData.historicalData.length - 1];
    historicalDataInfo = `Recent historical daily data (last ${stockData.historicalData.length} days) indicates a closing price of ${lastPoint.price.toFixed(2)} on ${lastPoint.date}. Current live price is ${stockData.currentPrice.toFixed(2)}.`;
  }

  const prompt = `
    You are an AI trading assistant for the Indian stock market (NSE/BSE), providing suggestions for swing trading focusing on opportunities for today or the next trading day.
    Based on the live market data for ${stockData.name} (${stockData.symbol}, Dhan SecID: ${stockData.dhanSecurityId || 'N/A'}), AI analysis, recent historical daily price data (including volume trends), and the user's current holdings, suggest a single, actionable trade decision (BUY, SELL, or HOLD).

    Current Market Data for ${stockData.name}:
    - Price: ${stockData.currentPrice} INR
    - Volume: ${stockData.volume || 'N/A'} (Today's volume)
    - Day High: ${stockData.dayHigh || 'N/A'}, Day Low: ${stockData.dayLow || 'N/A'}
    - Key Technicals: 50-Day SMA: ${stockData.technicals?.sma50 || 'N/A'}, 200-Day SMA: ${stockData.technicals?.sma200 || 'N/A'}, RSI (14): ${stockData.technicals?.rsi || 'N/A'}, Support: ${stockData.technicals?.supportLevel || 'N/A'}, Resistance: ${stockData.technicals?.resistanceLevel || 'N/A'}
    - Fundamentals Snapshot: Market Cap: ${stockData.fundamentals?.marketCap || 'N/A'}, P/E Ratio: ${stockData.fundamentals?.peRatio || 'N/A'}

    AI Analysis: ${analysis ? `Sentiment: ${analysis.marketSentiment}. Observations: ${analysis.keyObservations}` : "No AI-generated analysis available."}
    Historical Price Context: ${historicalDataInfo} (The full historical daily dataset, including volume, was considered if available).

    User's Holdings Information: ${holdingsInfo}

    Your Task:
    Provide a trade signal as a JSON object. The JSON object must contain the following keys:
    - "id": string (generate a unique ID like "${TRADE_SIGNAL_ID_PREFIX}${Date.now()}")
    - "symbol": string (should be "${stockData.symbol}")
    - "action": string (must be one of: "BUY", "SELL", or "HOLD")
    - "quantity": number (suggest 1-5 units for BUY/SELL. If HOLD, quantity can be 0 or based on existing holding if any.)
    - "confidence": string (must be one of: "High", "Medium", "Low")
    - "reasoning": string (a concise explanation, 1-2 sentences, for the suggested action, referencing specific data points including historical context, volume patterns, or technical indicators if they influence the decision for today/next day)
    - "targetPrice": number (optional, suggest a realistic target if action is BUY or SELL. If HOLD, this can be null or current resistance/support.)
    - "stopLossPrice": number (optional, suggest a realistic stop-loss if action is BUY or SELL. If HOLD, this can be null or current support/resistance.)
    - "timestamp": string (current ISO date string, e.g., "${new Date().toISOString()}")

    Example for a BUY signal:
    {
      "id": "${TRADE_SIGNAL_ID_PREFIX}${Date.now()}",
      "symbol": "${stockData.symbol}",
      "action": "BUY",
      "quantity": 2,
      "confidence": "Medium",
      "reasoning": "Stock showing resilience near historical daily support around ${ (stockData.technicals?.supportLevel || stockData.currentPrice * 0.98).toFixed(2) } with increasing daily volume. Current technicals (RSI: ${stockData.technicals?.rsi?.toFixed(2) || 'N/A'}) suggest potential for a bounce. Market sentiment is ${analysis ? analysis.marketSentiment : 'Neutral'}.",
      "targetPrice": ${parseFloat((stockData.currentPrice * 1.05).toFixed(2))},
      "stopLossPrice": ${parseFloat((stockData.currentPrice * 0.98).toFixed(2))},
      "timestamp": "${new Date().toISOString()}"
    }
    Generate only the JSON object. No extra text or explanation outside the JSON.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const tradeSignalResult = parseGeminiJsonResponse<Omit<TradeSignal, 'relatedStockData'>>(response.text, 'action');
    if (tradeSignalResult) {
      let quantity = typeof tradeSignalResult.quantity === 'number' && !isNaN(tradeSignalResult.quantity) ? tradeSignalResult.quantity : 1;
      if (tradeSignalResult.action === 'HOLD') {
          quantity = existingHolding ? existingHolding.totalQty : 0;
      } else {
          quantity = Math.max(1, Math.round(quantity)); 
      }
      
      return { 
          ...tradeSignalResult, 
          quantity,
          relatedStockData: stockData 
      };
    }
    return null;
  } catch (error) {
    console.error(ERROR_MSG_TRADE_DECISION_API_ERROR, error);
    return null;
  }
};

export const generateHistoricalAnalysisAndShortlist = async (
  stockSymbol: string,
  dhanSecurityId: string,
  intradayHistoricalData: HistoricalDataPoint[], // 15-min data for last 5 days
  dailyHistoricalData: HistoricalDataPoint[], // Daily data for e.g., last 90 days
  latestCalculatedSmaIntraday: number | null, // From 15-min
  latestCalculatedRsiIntraday: number | null,  // From 15-min
  latestCalculatedSmaDaily: number | null,   // From daily
  latestCalculatedRsiDaily: number | null,    // From daily
  marketIndexTrendSummary: string, 
  currentPrice: number 
): Promise<TradeSignal | null> => {
  if (!process.env.API_KEY) {
    console.error(ERROR_MSG_API_KEY_MISSING_DETAIL);
    return null;
  }

  let intradaySummary = "No intraday data provided.";
  if (intradayHistoricalData.length > 0) {
    const firstPoint = intradayHistoricalData[0];
    const lastPoint = intradayHistoricalData[intradayHistoricalData.length - 1];
    const volumes = intradayHistoricalData.map(p => p.volume);
    const avgVolume = volumes.length > 0 ? volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length : 0;
    intradaySummary = `Recent ${intradayHistoricalData.length} 15-min intervals from ${firstPoint.date} (Price: ${firstPoint.close.toFixed(2)}) to ${lastPoint.date} (Price: ${lastPoint.close.toFixed(2)}). Average 15-min volume: ${avgVolume.toFixed(0)}. Latest 15-min Close: ${lastPoint.close.toFixed(2)}.`;
  }

  let dailySummary = "No daily data provided.";
  if (dailyHistoricalData.length > 0) {
    const firstPoint = dailyHistoricalData[0];
    const lastPoint = dailyHistoricalData[dailyHistoricalData.length - 1];
    const dailyVolumes = dailyHistoricalData.map(p => p.volume);
    const avgDailyVolume = dailyVolumes.length > 0 ? dailyVolumes.reduce((sum, vol) => sum + vol, 0) / dailyVolumes.length : 0;
    dailySummary = `Recent ${dailyHistoricalData.length} daily candles from ${firstPoint.date} (Price: ${firstPoint.close.toFixed(2)}) to ${lastPoint.date} (Price: ${lastPoint.close.toFixed(2)}). Average daily volume: ${avgDailyVolume.toFixed(0)}. Latest Daily Close: ${lastPoint.close.toFixed(2)}.`;
  }
  
  const prompt = `
    You are an AI automated trading engine for the Indian stock market, focusing on short-term swing trades (today/next day), outputting signals for potential Super Orders.
    Analyze stock: ${stockSymbol} (Dhan SecID: ${dhanSecurityId}).
    Current Price (or latest close): ${currentPrice.toFixed(2)} INR.
    Market Context: ${marketIndexTrendSummary}
    
    Daily Historical Data (e.g., last 90 days):
    Summary: ${dailySummary}
    (Full daily OHLCV data for ${dailyHistoricalData.length} periods was considered).
    Calculated Daily Technicals:
    - Daily SMA (e.g., 20-period): ${latestCalculatedSmaDaily !== null ? latestCalculatedSmaDaily.toFixed(2) : 'N/A'}
    - Daily RSI (e.g., 14-period): ${latestCalculatedRsiDaily !== null ? latestCalculatedRsiDaily.toFixed(2) : 'N/A'}

    Intraday Data (15-min intervals, last 5 days):
    Summary: ${intradaySummary}
    (Full intraday OHLCV data for ${intradayHistoricalData.length} periods was considered).
    Calculated Intraday Technicals (latest values from 15-min data):
    - Intraday SMA (e.g., 20-period): ${latestCalculatedSmaIntraday !== null ? latestCalculatedSmaIntraday.toFixed(2) : 'N/A'}
    - Intraday RSI (e.g., 14-period): ${latestCalculatedRsiIntraday !== null ? latestCalculatedRsiIntraday.toFixed(2) : 'N/A'}

    Task:
    Based on BOTH daily and intraday data (price action, volume trends, key levels), calculated technicals, current price, and market index trend, decide if this stock is a potential BUY, SELL, or HOLD candidate for a short-term swing trade.
    Consider:
    - Daily chart trend: Is it aligned with the intraday signal?
    - Daily support/resistance levels.
    - Daily volume patterns supporting a potential move.
    - Intraday price momentum, volume spikes, SMA crossovers, RSI levels.
    - Confirmation between daily and intraday signals.

    If it's a BUY candidate (strong daily and intraday alignment):
    - targetPrice: Suggest a realistic target based on daily chart resistance or a % gain (e.g., 3-7% from current price).
    - stopLossPrice: Suggest a realistic stop-loss based on daily chart support or recent intraday low (e.g., 1.5-3% below current price/entry).
    - Quantity: Suggest 1 unit for now.
    If it's a SELL candidate (strong daily and intraday alignment for a downward move):
    - targetPrice: Suggest a realistic downward target.
    - stopLossPrice: Suggest a realistic stop-loss above entry.
    - Quantity: Suggest 1 unit for now.
    If signals are mixed, unclear, or high risk, suggest HOLD (quantity 0).

    Provide your decision strictly as a JSON object with the following keys:
    - "id": string (use prefix "${AUTO_TRADE_SIGNAL_ID_PREFIX}" followed by current timestamp)
    - "symbol": string ("${stockSymbol}")
    - "action": string ("BUY", "SELL", or "HOLD")
    - "quantity": number (1 for BUY/SELL, 0 for HOLD)
    - "confidence": string ("High", "Medium", "Low")
    - "reasoning": string (1-2 sentences explaining decision, referencing specific daily and intraday patterns, volume, SMA, RSI, and market context)
    - "targetPrice": number (if BUY/SELL, calculated target; else null)
    - "stopLossPrice": number (if BUY/SELL, calculated stop-loss; else null)
    - "timestamp": string (current ISO date string)

    Example for a BUY signal considering both timeframes:
    {
      "id": "${AUTO_TRADE_SIGNAL_ID_PREFIX}${Date.now()}",
      "symbol": "${stockSymbol}",
      "action": "BUY",
      "quantity": 1,
      "confidence": "High",
      "reasoning": "Daily chart shows stock bouncing from 20-SMA with strong volume. Intraday breakout above recent high on 15-min chart also confirmed with volume. RSI (daily & intraday) supportive.",
      "targetPrice": ${parseFloat((currentPrice * 1.05).toFixed(2))},
      "stopLossPrice": ${parseFloat((currentPrice * 0.97).toFixed(2))},
      "timestamp": "${new Date().toISOString()}"
    }
    Generate only the JSON object. No extra text. Ensure targetPrice and stopLossPrice are numbers or null.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL, 
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
      }
    });

    const rawSignal = parseGeminiJsonResponse<Omit<TradeSignal, 'relatedStockData'>>(response.text, 'action');
    
    if (rawSignal) {
      let quantity = 0;
      if (rawSignal.action === 'BUY' || rawSignal.action === 'SELL') {
        quantity = typeof rawSignal.quantity === 'number' && !isNaN(rawSignal.quantity) && rawSignal.quantity > 0 ? rawSignal.quantity : 1;
      }

      const targetPrice = (rawSignal.action === 'BUY' || rawSignal.action === 'SELL') && typeof rawSignal.targetPrice === 'number' && isFinite(rawSignal.targetPrice) ? rawSignal.targetPrice : undefined;
      const stopLossPrice = (rawSignal.action === 'BUY' || rawSignal.action === 'SELL') && typeof rawSignal.stopLossPrice === 'number' && isFinite(rawSignal.stopLossPrice) ? rawSignal.stopLossPrice : undefined;

      const minimalRelatedStockData: Partial<DhanStockData> = {
        symbol: stockSymbol,
        dhanSecurityId: dhanSecurityId,
        currentPrice: currentPrice,
      };

      return {
        ...rawSignal,
        quantity,
        targetPrice,
        stopLossPrice,
        relatedStockData: minimalRelatedStockData as DhanStockData, 
      };
    }
    return null;
  } catch (error) {
    console.error(`Error generating historical analysis for ${stockSymbol}:`, error);
    return null;
  }
};
