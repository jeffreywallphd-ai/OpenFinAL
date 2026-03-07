import { RequestSplitter } from '../RequestSplitter';

describe('RequestSplitter', () => {
  it('creates JSONRequest with top-level parent/child mapping', () => {
    const requestModel: any = {
      request: {
        quote: {
          symbol: 'AAPL',
        },
      },
    };

    const splitter = new RequestSplitter(requestModel);
    const result = splitter.split('ticker', 'quote', 'symbol');

    expect(result.request).toEqual({ ticker: 'AAPL' });
  });

  it('includes action for top-level parent/child mapping when provided', () => {
    const requestModel: any = {
      request: {
        quote: {
          symbol: 'AAPL',
        },
      },
    };

    const splitter = new RequestSplitter(requestModel);
    const result = splitter.split('ticker', 'quote', 'symbol', 'fetch');

    expect(result.request).toEqual({ ticker: 'AAPL', action: 'fetch' });
  });

  it('creates nested request object when data exists under request.request', () => {
    const requestModel: any = {
      request: {
        request: {
          report: {
            filingId: '10-K',
          },
        },
      },
    };

    const splitter = new RequestSplitter(requestModel);
    const result = splitter.split('id', 'report', 'filingId');

    expect(result.request).toEqual({
      request: {
        id: '10-K',
      },
    });
  });

  it('includes nested action when using request.request fallback path', () => {
    const requestModel: any = {
      request: {
        request: {
          report: {
            filingId: '10-Q',
          },
        },
      },
    };

    const splitter = new RequestSplitter(requestModel);
    const result = splitter.split('id', 'report', 'filingId', 'sync');

    expect(result.request).toEqual({
      request: {
        id: '10-Q',
        action: 'sync',
      },
    });
  });

  it('returns empty request object when parent/child keys are not found', () => {
    const requestModel: any = {
      request: {
        quote: {
          price: 12,
        },
      },
    };

    const splitter = new RequestSplitter(requestModel);
    const result = splitter.split('ticker', 'quote', 'symbol');

    expect(result.request).toEqual({});
  });

  it('prefers top-level request[parent][child] over request.request fallback when both exist', () => {
    const requestModel: any = {
      request: {
        quote: { symbol: 'MSFT' },
        request: {
          quote: { symbol: 'SHOULD_NOT_USE' },
        },
      },
    };

    const splitter = new RequestSplitter(requestModel);
    const result = splitter.split('ticker', 'quote', 'symbol');

    expect(result.request).toEqual({ ticker: 'MSFT' });
  });
});
