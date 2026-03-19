import { IRequestModel } from '../Request/IRequestModel';
import { JSONRequest } from '../Request/JSONRequest';
import {
  StockLookupInputDto,
  StockLookupResultDto,
  StockQuoteInputDto,
  StockQuoteResultDto,
} from '../../application/stock/StockUseCaseDtos';

export type SupportedStockAction =
  | 'lookup'
  | 'quote'
  | 'intraday'
  | 'interday'
  | 'selectRandomSP500'
  | 'downloadPublicCompanies';

export interface StockTransportModel {
  request: {
    stock: {
      action: SupportedStockAction | string;
      keyword?: string;
      ticker?: string;
      companyName?: string;
      cik?: string;
      isSP500?: number;
      interval?: string;
      key?: string;
      quotePrice?: number | string;
      startDate?: string;
      endDate?: string;
    };
  };
}

export interface StockTransportResponseModel<Result> {
  response: {
    ok: boolean;
    status: number;
    results: Result[];
  };
  source?: string;
}

export function createStockLookupRequestModel(keyword: string): IRequestModel {
  return new JSONRequest(
    JSON.stringify({
      request: {
        stock: {
          action: 'lookup',
          keyword,
        },
      },
    }),
  );
}

export function createStockQuoteRequestModel(ticker: string): IRequestModel {
  return new JSONRequest(
    JSON.stringify({
      request: {
        stock: {
          action: 'quote',
          ticker,
        },
      },
    }),
  );
}

export function parseStockTransportModel(requestModel: IRequestModel): StockTransportModel {
  const stockRequest = requestModel?.request?.request?.stock;

  if (!stockRequest || typeof stockRequest !== 'object') {
    throw new Error('Making a request about a stock requires a stock property');
  }

  return requestModel.request as StockTransportModel;
}

export function mapTransportToLookupInputDto(transportModel: StockTransportModel): StockLookupInputDto {
  return {
    keyword: transportModel.request.stock.keyword ?? '',
  };
}

export function mapTransportToQuoteInputDto(transportModel: StockTransportModel): StockQuoteInputDto {
  return {
    ticker: transportModel.request.stock.ticker ?? '',
  };
}

export function serializeLookupOutputDto(
  results: StockLookupResultDto[],
  source?: string,
): StockTransportResponseModel<StockLookupResultDto> {
  return {
    response: {
      ok: true,
      status: 200,
      results,
    },
    ...(source ? { source } : {}),
  };
}

export function serializeQuoteOutputDto(
  results: StockQuoteResultDto[],
  source?: string,
): StockTransportResponseModel<StockQuoteResultDto> {
  return {
    response: {
      ok: true,
      status: 200,
      results,
    },
    ...(source ? { source } : {}),
  };
}
