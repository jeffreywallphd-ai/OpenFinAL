import {
  IYahooFinanceChartOptions,
  IYahooFinanceClient,
  IYahooFinanceHistoricalOptions,
  IYahooFinanceSearchOptions,
} from '../../application/services/IYahooFinanceClient';

export class ElectronYahooFinanceClient implements IYahooFinanceClient {
  async search(keyword: string, options?: IYahooFinanceSearchOptions): Promise<any> {
    return window.yahooFinance.search(keyword, options as unknown as Record<string, unknown> | undefined);
  }

  async chart(ticker: string, options: IYahooFinanceChartOptions): Promise<any> {
    return window.yahooFinance.chart(ticker, options as unknown as Record<string, unknown>);
  }

  async historical(ticker: string, options: IYahooFinanceHistoricalOptions): Promise<any> {
    return window.yahooFinance.historical(ticker, options as unknown as Record<string, unknown>);
  }
}
