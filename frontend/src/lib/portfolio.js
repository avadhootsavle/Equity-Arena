/**
 * Centralized Portfolio & P&L Calculation Engine for Equity Arena
 * 
 * Rules & Invariants:
 * 1. Starting Balance: Fixed at 20,000 Ignite Credits (IC).
 * 2. Total Money (Portfolio Value) = Cash Left + Money in Stocks (market value of all open positions).
 * 3. Total Profit = Total Money - Starting Balance (20,000).
 * 4. Total Profit % = (Total Profit / 20,000) * 100 (always against starting balance of 20,000).
 * 5. Unrealized Profit = Money in Stocks - Total Cost of Open Positions.
 * 6. Realized Profit = Total Profit - Unrealized Profit.
 * 
 * INVARIANT: portfolioValue === 20000 + totalPnL
 */

export const STARTING_BALANCE = 20000;

/**
 * Calculates complete portfolio metrics from starting balance, cash, positions, and stocks.
 */
export function calculatePortfolio(arg1 = STARTING_BALANCE, arg2 = STARTING_BALANCE, arg3 = [], arg4 = []) {
  let baseStartingBalance = STARTING_BALANCE;
  let currentCash = STARTING_BALANCE;
  let holdings = [];
  let stocks = [];

  if (typeof arg1 === 'object' && arg1 !== null) {
    // Called with (portfolioObj, stocksArray)
    baseStartingBalance = Number(arg1.startingBalance || STARTING_BALANCE);
    currentCash = Number(arg1.walletBalance ?? arg1.availableWalletBalance ?? arg1.cash ?? STARTING_BALANCE);
    holdings = Array.isArray(arg1.holdings) ? arg1.holdings : [];
    stocks = Array.isArray(arg2) ? arg2 : [];
  } else {
    // Called with (startingBalance, cash, holdings, stocks)
    baseStartingBalance = Number(arg1 || STARTING_BALANCE);
    currentCash = Number(arg2 || STARTING_BALANCE);
    holdings = Array.isArray(arg3) ? arg3 : [];
    stocks = Array.isArray(arg4) ? arg4 : [];
  }

  if (baseStartingBalance <= 0) baseStartingBalance = STARTING_BALANCE;

  let invested = 0;
  let costBasis = 0;

  for (const h of holdings) {
    const qty = Number(h.quantity || 0);
    if (qty <= 0) continue;

    const avgBuy = Number(h.avgBuyPrice || 0);
    const stock = stocks.find((s) => s.id === h.stockId);
    const currentPrice = Number(stock?.currentPrice ?? h.currentPrice ?? avgBuy);

    invested += qty * currentPrice;
    costBasis += qty * avgBuy;
  }

  // Keep full floating-point precision internally
  const portfolioValue = currentCash + invested;
  const totalPnL = portfolioValue - baseStartingBalance;
  const unrealizedPnL = invested - costBasis;
  const realizedPnL = totalPnL - unrealizedPnL;
  const totalPnLPercent = (totalPnL / baseStartingBalance) * 100;

  // Dev-mode Invariant Assertion
  const invariantDiff = Math.abs(portfolioValue - (baseStartingBalance + totalPnL));
  if (invariantDiff > 0.001) {
    console.error(
      `[PORTFOLIO INVARIANT VIOLATION]: portfolioValue (${portfolioValue}) !== startingBalance (${baseStartingBalance}) + totalPnL (${totalPnL})`
    );
  }

  return {
    startingBalance: baseStartingBalance,
    portfolioValue,
    cash: currentCash,
    invested,
    costBasis,
    realizedPnL,
    unrealizedPnL,
    totalPnL,
    totalPnLPercent
  };
}

/**
 * Format currency with thousands separators and 2 decimals
 */
export function formatCurrency(num, decimals = 2) {
  const val = Number(num || 0);
  return val.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Format P&L metrics into simple, high-contrast display text
 */
export function formatPnL(amount, percent) {
  const numAmount = Number(amount || 0);
  const numPercent = Number(percent || 0);
  
  const isGain = numAmount > 0;
  const isLoss = numAmount < 0;
  const sign = isGain ? '+' : isLoss ? '−' : '';
  const signPercent = isGain ? '+' : isLoss ? '−' : '';
  
  const formattedAmount = formatCurrency(Math.abs(numAmount));
  const formattedPercent = Math.abs(numPercent).toFixed(2);
  
  return {
    isGain,
    isLoss,
    sign,
    signPercent,
    formattedAmount,
    formattedPercent,
    textAmount: `${sign}${formattedAmount}`,
    textPercent: `${signPercent}${formattedPercent}%`,
    fullText: `${sign}${formattedAmount} IC (${signPercent}${formattedPercent}%)`
  };
}
