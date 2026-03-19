module.exports = {
  init: jest.fn(() => ({
    destroy: jest.fn(),
    preview: jest.fn(),
    render: jest.fn(),
  })),
};
