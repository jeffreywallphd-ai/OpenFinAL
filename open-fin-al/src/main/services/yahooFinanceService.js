function createYahooFinanceService({ getYF }) {
  async function yahooChart(ticker, options) {
    const yf = await getYF();
    return yf.chart(ticker, options);
  }

  async function yahooSearch(keyword, options) {
    const yf = await getYF();
    return yf.search(keyword, options);
  }

  async function yahooHistorical(ticker, options) {
    const yf = await getYF();
    return yf.historical(ticker, options);
  }

  return {
    yahooChart,
    yahooHistorical,
    yahooSearch,
  };
}

module.exports = {
  createYahooFinanceService,
};
