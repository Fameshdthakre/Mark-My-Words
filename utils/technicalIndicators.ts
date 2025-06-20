// src/utils/technicalIndicators.ts

/**
 * Calculates Simple Moving Average (SMA) for a given period.
 * @param prices Array of numbers (typically closing prices).
 * @param period The period for SMA calculation.
 * @returns Array of SMA values. The first `period-1` values will be NaN.
 */
export const calculateSMA = (prices: number[], period: number): number[] => {
  if (period <= 0 || prices.length < period) {
    return new Array(prices.length).fill(NaN);
  }

  const smaValues: number[] = new Array(prices.length).fill(NaN);
  let sum = 0;

  // Calculate sum for the first period
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  smaValues[period - 1] = sum / period;

  // Calculate subsequent SMA values
  for (let i = period; i < prices.length; i++) {
    sum = sum - prices[i - period] + prices[i];
    smaValues[i] = sum / period;
  }

  return smaValues;
};

/**
 * Calculates Relative Strength Index (RSI) for a given period.
 * @param prices Array of numbers (typically closing prices).
 * @param period The period for RSI calculation (commonly 14).
 * @returns Array of RSI values. The first `period` values will be NaN.
 */
export const calculateRSI = (prices: number[], period: number = 14): number[] => {
  if (period <= 0 || prices.length <= period) {
    return new Array(prices.length).fill(NaN);
  }

  const rsiValues: number[] = new Array(prices.length).fill(NaN);
  let gains: number[] = [];
  let losses: number[] = [];

  // Calculate initial average gains and losses
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains.push(change);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(Math.abs(change));
    }
  }

  let avgGain = gains.reduce((acc, val) => acc + val, 0) / period;
  let avgLoss = losses.reduce((acc, val) => acc + val, 0) / period;

  if (avgLoss === 0) {
    rsiValues[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    rsiValues[period] = 100 - (100 / (1 + rs));
  }

  // Calculate subsequent RSI values
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    let currentGain = 0;
    let currentLoss = 0;

    if (change > 0) {
      currentGain = change;
    } else {
      currentLoss = Math.abs(change);
    }

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    if (avgLoss === 0) {
      rsiValues[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsiValues[i] = 100 - (100 / (1 + rs));
    }
  }
  return rsiValues;
};
