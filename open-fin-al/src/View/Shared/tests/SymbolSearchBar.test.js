import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SymbolSearchBar } from '../SymbolSearchBar';
import { StockInteractor } from '../../../Interactor/StockInteractor';
import { JSONRequest } from '../../../Gateway/Request/JSONRequest';

jest.mock('../../../Interactor/StockInteractor', () => ({
  StockInteractor: jest.fn(),
}));

jest.mock('../../../Gateway/Request/JSONRequest', () => ({
  JSONRequest: jest.fn(),
}));

jest.mock('react-icons/fa', () => ({
  FaSearch: () => <span data-testid="search-icon" />,
}));

const baseState = {
  initializing: true,
  data: { points: [] },
  newsData: { stories: [] },
  secData: { filings: [] },
  ticker: 'AAPL',
  cik: '000000',
  error: null,
  priceMin: 1,
  priceMax: 10,
  maxVolume: 100,
  yAxisStart: 0,
  yAxisEnd: 100,
};

const getInput = () => screen.getByPlaceholderText('Please enter a ticker symbol');

const setupStockLookup = (results) => {
  const getMock = jest.fn().mockResolvedValue({ response: { results } });
  StockInteractor.mockImplementation(() => ({ get: getMock }));
  JSONRequest.mockImplementation((payload) => ({ payload }));
  return { getMock };
};

describe('SymbolSearchBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the input and applies state.searchRef from props', () => {
    setupStockLookup([]);

    render(<SymbolSearchBar state={{ ...baseState, searchRef: 'TSLA' }} fetchData={jest.fn()} />);

    expect(getInput()).toHaveValue('TSLA');
    expect(screen.getByRole('button')).toBeEnabled();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('uppercases the typed keyword and requests symbol matches on regular key presses', async () => {
    const { getMock } = setupStockLookup([{ id: '1', symbol: 'META', name: 'Meta Platforms' }]);
    const fetchData = jest.fn();

    const { container } = render(<SymbolSearchBar state={baseState} fetchData={fetchData} />);

    await userEvent.clear(getInput());
    await userEvent.type(getInput(), 'meta');

    await waitFor(() => expect(getMock).toHaveBeenCalled());

    expect(getInput()).toHaveValue('META');
    expect(JSONRequest).toHaveBeenLastCalledWith(expect.stringContaining('"keyword": "META"'));
    expect(fetchData).not.toHaveBeenCalled();
    expect(container.querySelector('datalist option')).toHaveTextContent('Meta Platforms');
  });

  it('submits selected data list value on Unidentified key and forwards composed state', async () => {
    const results = [{ id: '2', symbol: 'MSFT', name: 'Microsoft' }];
    setupStockLookup(results);
    const fetchData = jest.fn().mockResolvedValue(undefined);

    render(<SymbolSearchBar state={baseState} fetchData={fetchData} />);

    await userEvent.clear(getInput());
    await userEvent.type(getInput(), 'msft');
    fireEvent.keyUp(getInput(), { key: 'Unidentified' });

    await waitFor(() => expect(fetchData).toHaveBeenCalledTimes(1));

    expect(fetchData).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'intraday',
        interval: '1D',
        initializing: false,
        searchRef: 'MSFT',
        securitiesList: results,
        isLoading: false,
        priceMin: baseState.priceMin,
        priceMax: baseState.priceMax,
      })
    );
  });

  it('submits on Enter and forwards the same composed state object shape', async () => {
    const results = [{ id: '3', symbol: 'NVDA', name: 'NVIDIA' }];
    setupStockLookup(results);
    const fetchData = jest.fn().mockResolvedValue(undefined);

    render(<SymbolSearchBar state={baseState} fetchData={fetchData} />);

    await userEvent.clear(getInput());
    await userEvent.type(getInput(), 'nvda{enter}');

    await waitFor(() => expect(fetchData).toHaveBeenCalled());
    expect(fetchData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        searchRef: 'NVDA',
        securitiesList: results,
      })
    );
  });

  it('toggles searching state while a lookup is pending', async () => {
    let resolveLookup;
    const lookupPromise = new Promise((resolve) => {
      resolveLookup = resolve;
    });

    const getMock = jest.fn().mockReturnValue(lookupPromise);
    StockInteractor.mockImplementation(() => ({ get: getMock }));
    JSONRequest.mockImplementation((payload) => ({ payload }));

    render(<SymbolSearchBar state={baseState} fetchData={jest.fn()} />);

    fireEvent.change(getInput(), { target: { value: 'amzn' } });
    fireEvent.keyUp(getInput(), { key: 'a' });

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    resolveLookup({ response: { results: [{ id: '4', symbol: 'AMZN', name: 'Amazon' }] } });

    await waitFor(() => expect(button).toBeEnabled());
  });

  it('submits via the form button and calls fetchData with lookup state', async () => {
    const results = [{ id: '5', symbol: 'IBM', name: 'IBM' }];
    setupStockLookup(results);
    const fetchData = jest.fn().mockResolvedValue(undefined);

    render(<SymbolSearchBar state={baseState} fetchData={fetchData} />);

    await userEvent.clear(getInput());
    await userEvent.type(getInput(), 'ibm');
    await userEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(fetchData).toHaveBeenCalled());
    expect(fetchData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        searchRef: 'IBM',
        securitiesList: results,
      })
    );
  });

  it('does not call APIs when the input is empty', async () => {
    const { getMock } = setupStockLookup([]);
    const fetchData = jest.fn();

    render(<SymbolSearchBar state={baseState} fetchData={fetchData} />);

    await userEvent.clear(getInput());
    await userEvent.type(getInput(), 'a');
    await userEvent.clear(getInput());
    await userEvent.type(getInput(), '{enter}');

    await waitFor(() => expect(fetchData).toHaveBeenCalledWith(undefined));
    expect(getMock).toHaveBeenCalledTimes(1);
  });
});
