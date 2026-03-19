// Mock for @xenova/transformers to avoid ES module import issues in Jest
module.exports = {
  env: {},
  pipeline: jest.fn(() => Promise.resolve(jest.fn(() => Promise.resolve([
    { generated_text: 'mock response' },
  ])))),
};
