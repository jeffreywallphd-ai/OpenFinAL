import { Asset } from '../../../Entity/Asset';
import { StockTimeSeries } from '../../../domain/stock/StockTimeSeries';
import {
  mapLookupEntitiesToOutputDto,
  mapLookupInputDtoToEntity,
  mapQuoteEntitiesToOutputDto,
  mapQuoteInputDtoToEntity,
} from '../../../application/stock/StockMappers';
import {
  createStockLookupRequestModel,
  createStockQuoteRequestModel,
  mapTransportToLookupInputDto,
  mapTransportToQuoteInputDto,
  parseStockTransportModel,
  serializeLookupOutputDto,
  serializeQuoteOutputDto,
} from '../../../Gateway/Transport/StockTransport';

describe('stock mapper separation helpers', () => {
  test('maps lookup transport models into use-case inputs and back into transport results', () => {
    const transport = parseStockTransportModel(createStockLookupRequestModel('apple'));
    const inputDto = mapTransportToLookupInputDto(transport);
    const criteria = mapLookupInputDtoToEntity(inputDto);

    const asset = new Asset();
    asset.setFieldValue('id', 17);
    asset.setFieldValue('symbol', 'AAPL');
    asset.setFieldValue('name', 'Apple Inc.');
    asset.setFieldValue('cik', '0000320193');

    const outputDto = mapLookupEntitiesToOutputDto([asset]);
    const response = serializeLookupOutputDto(outputDto, 'SQLite Database');

    expect(criteria.getFieldValue('keyword')).toBe('apple');
    expect(response).toEqual({
      response: {
        ok: true,
        status: 200,
        results: [
          {
            id: 17,
            symbol: 'AAPL',
            ticker: 'AAPL',
            name: 'Apple Inc.',
            companyName: 'Apple Inc.',
            cik: '0000320193',
          },
        ],
      },
      source: 'SQLite Database',
    });
  });

  test('maps quote transport models into use-case inputs and normalizes quote output DTOs', () => {
    const transport = parseStockTransportModel(createStockQuoteRequestModel('AAPL'));
    const inputDto = mapTransportToQuoteInputDto(transport);
    const quoteRequest = mapQuoteInputDtoToEntity(inputDto);

    const quote = new StockTimeSeries();
    quote.setFieldValue('ticker', 'AAPL');
    quote.setFieldValue('data', [
      { date: '1/2/2024', time: '9:30:00 AM', price: 189.12, volume: 1000 },
      { date: '1/2/2024', time: '9:31:00 AM', price: 190.34, volume: 1200 },
    ]);

    const outputDto = mapQuoteEntitiesToOutputDto([quote]);
    const response = serializeQuoteOutputDto(outputDto, 'Yahoo Finance (unofficial) Community API');

    expect(quoteRequest.getFieldValue('ticker')).toBe('AAPL');
    expect(response).toEqual({
      response: {
        ok: true,
        status: 200,
        results: [
          {
            ticker: 'AAPL',
            quotePrice: 190.34,
            date: '1/2/2024',
            startDate: '1/2/2024',
            endDate: '1/2/2024',
            data: [
              { date: '1/2/2024', time: '9:30:00 AM', price: 189.12, volume: 1000 },
              { date: '1/2/2024', time: '9:31:00 AM', price: 190.34, volume: 1200 },
            ],
          },
        ],
      },
      source: 'Yahoo Finance (unofficial) Community API',
    });
  });
});
