import { IEntity } from '../../../Entity/IEntity';
import { Asset } from '../../../Entity/Asset';
import { StockTimeSeries } from '../../../Entity/Stock/StockTimeSeries';
import { IYahooFinanceClient } from '../../../application/services/IYahooFinanceClient';
import { ElectronYahooFinanceClient } from '../../../infrastructure/electron/ElectronYahooFinanceClient';
import { IKeylessDataGateway } from '../IKeylessDataGateway';

export class YFinanceStockGateway implements IKeylessDataGateway {
  sourceName: string = 'Yahoo Finance (unofficial) Community API';
  private readonly yahooFinanceClient: IYahooFinanceClient;

  constructor(yahooFinanceClient: IYahooFinanceClient = new ElectronYahooFinanceClient()) {
    this.yahooFinanceClient = yahooFinanceClient;
  }

  connect(): void {
    throw new Error('This gateway requires no special connection');
  }

  disconnect(): void {
    throw new Error('This gateway requires no special connection, so no disconnection is necessary');
  }

  create(entity: IEntity, action: string): Promise<Boolean> {
    throw new Error('This gateway does not have the ability to post content');
  }

  async read(entity: IEntity, action: string): Promise<IEntity[]> {
    let data;
    if (action === 'lookup') {
      data = await this.searchSymbol(entity);
    } else if (action === 'intraday' || action === 'quote') {
      data = await this.getIntradayData(entity);
    } else if (action === 'interday') {
      data = await this.getInterdayData(entity);
    } else {
      throw new Error('Either no action was sent in the request or an incorrect action was used.');
    }

    let entities;
    if (action === 'lookup') {
      entities = this.formatLookupResponse(data);
    } else if (action === 'quote') {
      entities = this.formatQuoteResponse(data, entity);
    } else {
      entities = this.formatDataResponse(data, entity, action);
    }

    return entities;
  }

  formatQuoteResponse(data: any, entity: IEntity): any {
    const array: Array<IEntity> = [];
    const formattedData = this.formatDataResponse(data, entity, 'intraday');
    const latestQuote = formattedData[formattedData.length - 1] ?? formattedData[0];

    if (latestQuote) {
      const latestPoint = latestQuote.getFieldValue('data')?.slice(-1)[0] ?? null;
      if (latestPoint) {
        latestQuote.setFieldValue('quotePrice', latestPoint.price ?? null);
        latestQuote.setFieldValue('startDate', latestPoint.date ?? null);
        latestQuote.setFieldValue('endDate', latestPoint.date ?? null);
      }
      array.push(latestQuote);
    }

    return array;
  }

  formatDataResponse(data: any, entity: IEntity, action: string): any {
    const array: Array<IEntity> = [];
    let closingPriceKey = 'close';

    if (action === 'interday') {
      closingPriceKey = 'adjClose';
    } else if (action === 'intraday') {
      data = data['quotes'];
    }

    const formattedData: Array<{ [key: string]: any }> = [];
    for (const item of data) {
      const date = new Date(item['date']);

      if (item[closingPriceKey] > 1) {
        formattedData.push({
          date: date.toLocaleDateString(),
          time: action === 'intraday' ? date.toLocaleTimeString() : '',
          price: item[closingPriceKey] ? Math.round(item[closingPriceKey] * 100) / 100 : null,
          volume: item['volume'],
        });
      }
    }

    entity.setFieldValue('data', formattedData);
    array.push(entity);

    return array;
  }

  formatLookupResponse(data: any): any {
    const array: Array<IEntity> = [];

    for (const item of data) {
      const entity = new Asset();
      entity.setFieldValue('ticker', item['ticker'] ?? item['symbol']);
      entity.setFieldValue('symbol', item['ticker'] ?? item['symbol']);
      entity.setFieldValue('companyName', item['companyName'] ?? item['shortname']);
      entity.setFieldValue('name', item['companyName'] ?? item['shortname']);
      array.push(entity);
    }

    return array;
  }

  update(entity: IEntity, action: string): Promise<number> {
    throw new Error('This gateway does not have the ability to update content');
  }

  delete(entity: IEntity, action: string): Promise<number> {
    throw new Error('This gateway does not have the ability to delete content');
  }

  private async searchSymbol(entity: IEntity) {
    const keyword = entity.getFieldValue('keyword');

    try {
      const searchOptions = {
        quotesCount: 10,
      };
      const searchResult = await this.yahooFinanceClient.search(keyword, searchOptions);

      return searchResult.quotes
        .filter((result: any) => result.symbol)
        .map((result: any) => ({
          ticker: result.symbol,
          companyName: result.shortName,
        }));
    } catch (error: any) {
      throw new Error('Error occurred while searching for symbols: ' + error.message);
    }
  }

  private isPreMarketOpen() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    return hour < 9 || (hour === 9 && minute < 30);
  }

  private async getQuote(entity: IEntity) {
    try {
      return this.getInterdayData(entity);
    } catch (error: any) {
      throw new Error('Error occurred while fetching a quote: ' + error.message);
    }
  }

  private async getIntradayData(entity: IEntity) {
    try {
      let currentDate = new Date();
      const date = new Date();

      if (currentDate.getDay() === 6) {
        currentDate = new Date(currentDate.setDate(currentDate.getDate() - 1));
      } else if (currentDate.getDay() === 0) {
        currentDate = new Date(currentDate.setDate(currentDate.getDate() - 2));
      }

      if ((currentDate.getDay() !== 0 || currentDate.getDay() !== 6) && this.isPreMarketOpen()) {
        if (currentDate.getDay() === 1) {
          currentDate = new Date(currentDate.setDate(currentDate.getDate() - 3));
        } else {
          currentDate = new Date(currentDate.setDate(currentDate.getDate() - 1));
        }
      }

      const startDate = new Date(date.setDate(currentDate.getDate()));
      startDate.setHours(9);
      startDate.setMinutes(30);
      startDate.setMilliseconds(0);

      const endDate = new Date(date.setDate(currentDate.getDate()));
      endDate.setHours(16);
      endDate.setMinutes(0);
      endDate.setMilliseconds(0);

      const queryOptions = {
        period1: startDate,
        period2: endDate,
        interval: '1m',
      };

      return await this.yahooFinanceClient.chart(entity.getFieldValue('ticker'), queryOptions);
    } catch (error: any) {
      throw new Error('Error occurred while fetching intraday data: ' + error.message);
    }
  }

  private async getInterdayData(entity: IEntity) {
    let period1;
    const currentDate = new Date();
    const previousDate = new Date();

    const fiveDaysAgo = new Date(previousDate.setDate(currentDate.getDate() - 5));
    const oneMonthAgo = new Date(previousDate.setDate(currentDate.getDate() - 30));
    const sixMonthsAgo = new Date(previousDate.setDate(currentDate.getDate() - 180));
    const oneYearAgo = new Date(previousDate.setDate(currentDate.getDate() - 365));
    const fiveYearsAgo = new Date(previousDate.setDate(currentDate.getDate() - 2190));
    const twentyYearsAgo = new Date(previousDate.setDate(currentDate.getDate() - 7300));

    const period1Map: { [key: string]: any } = {
      '5D': fiveDaysAgo,
      '1M': oneMonthAgo,
      '6M': sixMonthsAgo,
      '1Y': oneYearAgo,
      '5Y': fiveYearsAgo,
      Max: twentyYearsAgo,
    };

    period1 = period1Map[entity.getFieldValue('interval')];

    try {
      return await this.yahooFinanceClient.historical(entity.getFieldValue('ticker'), {
        period1,
        period2: new Date(),
      });
    } catch (error: any) {
      throw new Error('Error occurred while fetching interday data: ' + error.message);
    }
  }
}
