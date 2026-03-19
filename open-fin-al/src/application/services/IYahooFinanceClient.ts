export interface IYahooFinanceSearchOptions {
  quotesCount?: number;
}

export interface IYahooFinanceChartOptions {
  period1: Date;
  period2: Date;
  interval: string;
}

export interface IYahooFinanceHistoricalOptions {
  period1: Date;
  period2: Date;
}

export interface IYahooFinanceClient {
  search(keyword: string, options?: IYahooFinanceSearchOptions): Promise<any>;
  chart(ticker: string, options: IYahooFinanceChartOptions): Promise<any>;
  historical(ticker: string, options: IYahooFinanceHistoricalOptions): Promise<any>;
}
