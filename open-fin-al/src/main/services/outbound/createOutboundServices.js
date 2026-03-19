const { createAlphaVantageAdapter } = require('./providers/alphaVantageAdapter');
const { createSecAdapter } = require('./providers/secAdapter');

function createOutboundServices({ axios, certificateService, logger = console }) {
  return {
    alphaVantage: createAlphaVantageAdapter({ axios }),
    sec: createSecAdapter({ axios, certificateService, logger }),
  };
}

module.exports = {
  createOutboundServices,
};
