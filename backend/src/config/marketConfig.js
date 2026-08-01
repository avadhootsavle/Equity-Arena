// Easy-to-tune configuration parameters for continuous background market drift & ticker

module.exports = {
  // Interval timing between background market ticks (in milliseconds)
  TICK_INTERVAL_MS: 6000, // 6 seconds

  // Minimum random fluctuation percent per tick
  MIN_FLUCTUATION_PERCENT: -1.5,

  // Maximum random fluctuation percent per tick
  MAX_FLUCTUATION_PERCENT: 1.5,

  // Whether continuous background ticking is enabled
  TICKER_ENABLED: true
};
