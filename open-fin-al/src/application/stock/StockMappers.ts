import { IEntity } from '../../Entity/IEntity';
import { StockSearchCriteria } from '../../Entity/Stock/StockSearchCriteria';
import { StockTimeSeries } from '../../Entity/Stock/StockTimeSeries';
import {
  StockLookupInputDto,
  StockLookupResultDto,
  StockQuoteInputDto,
  StockQuoteResultDto,
} from './StockUseCaseDtos';

export function mapLookupInputDtoToEntity(input: StockLookupInputDto): StockSearchCriteria {
  const criteria = new StockSearchCriteria();
  criteria.setFieldValue('keyword', input.keyword);
  return criteria;
}

export function mapQuoteInputDtoToEntity(input: StockQuoteInputDto): StockTimeSeries {
  const series = new StockTimeSeries();
  series.setFieldValue('ticker', input.ticker);
  return series;
}

export function mapLegacyStockRequestToEntity(stockRequest: {
  keyword?: string;
  ticker?: string;
  companyName?: string;
  cik?: string;
  isSP500?: number;
  interval?: string;
}): StockSearchCriteria | StockTimeSeries {
  const hasTimeSeriesFields =
    typeof stockRequest.ticker !== 'undefined' ||
    typeof stockRequest.interval !== 'undefined' ||
    typeof stockRequest.companyName !== 'undefined' ||
    typeof stockRequest.cik !== 'undefined';

  const entity = hasTimeSeriesFields ? new StockTimeSeries() : new StockSearchCriteria();

  for (const [field, value] of Object.entries(stockRequest)) {
    if (typeof value !== 'undefined' && value !== null) {
      entity.setFieldValue(field, value);
    }
  }

  return entity;
}

export function mapLookupEntitiesToOutputDto(entities: IEntity[]): StockLookupResultDto[] {
  return entities.map((entity) => {
    const symbol = readString(entity, 'symbol') ?? readString(entity, 'ticker') ?? '';
    const name = readString(entity, 'name') ?? readString(entity, 'companyName') ?? '';

    return {
      id: readNumber(entity, 'id'),
      symbol,
      ticker: readString(entity, 'ticker') ?? symbol,
      name,
      companyName: readString(entity, 'companyName') ?? name,
      cik: readString(entity, 'cik'),
    };
  });
}

export function mapQuoteEntitiesToOutputDto(entities: IEntity[]): StockQuoteResultDto[] {
  return entities.map((entity) => {
    const data = safelyRead(entity, 'data');
    const normalizedData = Array.isArray(data) ? data : [];
    const latestPoint = normalizedData[normalizedData.length - 1] ?? null;
    const latestDate = latestPoint?.date ?? null;

    return {
      ticker: readString(entity, 'ticker') ?? '',
      quotePrice: safelyRead(entity, 'quotePrice') ?? latestPoint?.price ?? null,
      date: readString(entity, 'endDate') ?? latestDate,
      startDate: readString(entity, 'startDate') ?? latestDate,
      endDate: readString(entity, 'endDate') ?? latestDate,
      data: normalizedData,
    };
  });
}

function safelyRead(entity: IEntity, field: string): any {
  try {
    return entity.getFieldValue(field);
  } catch (_error) {
    return null;
  }
}

function readString(entity: IEntity, field: string): string | null {
  const value = safelyRead(entity, field);
  return value ?? null;
}

function readNumber(entity: IEntity, field: string): number | null {
  const value = safelyRead(entity, field);
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}
