export interface StockLookupInputDto {
  keyword: string;
}

export interface StockLookupResultDto {
  id?: number | null;
  symbol: string;
  ticker: string;
  name: string;
  companyName: string;
  cik?: string | null;
}

export interface StockQuoteInputDto {
  ticker: string;
}

export interface StockQuotePointDto {
  date: string;
  time: string;
  price: number | string | null;
  volume: number | string | null;
}

export interface StockQuoteResultDto {
  ticker: string;
  quotePrice: number | string | null;
  date: string | null;
  startDate: string | null;
  endDate: string | null;
  data: StockQuotePointDto[];
}
