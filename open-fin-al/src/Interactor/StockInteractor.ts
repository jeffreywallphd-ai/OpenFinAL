import { StockRequest } from '../Entity/StockRequest';
import { IDataGateway } from '../Gateway/Data/IDataGateway';
import { StockGatewayFactory } from '../Gateway/Data/StockGatewayFactory';
import { StockQuoteGatewayFactory } from '../Gateway/Data/StockQuoteGatewayFactory';
import { SQLiteAssetGateway } from '../Gateway/Data/SQLite/SQLiteAssetGateway';
import { IRequestModel } from '../Gateway/Request/IRequestModel';
import { JSONResponse } from '../Gateway/Response/JSONResponse';
import { IResponseModel } from '../Gateway/Response/IResponseModel';
import { IConfigService } from '../application/services/IConfigService';
import { ElectronConfigService } from '../infrastructure/electron/ElectronConfigService';
import { IInputBoundary } from './IInputBoundary';

interface StockInteractorDependencies {
  configService?: IConfigService;
  stockGatewayFactory?: StockGatewayFactory;
  stockQuoteGatewayFactory?: StockQuoteGatewayFactory;
}

export class StockInteractor implements IInputBoundary {
  requestModel: IRequestModel;
  responseModel: IResponseModel;

  private readonly configService: IConfigService;
  private readonly stockGatewayFactory: StockGatewayFactory;
  private readonly stockQuoteGatewayFactory: StockQuoteGatewayFactory;

  constructor({
    configService = new ElectronConfigService(),
    stockGatewayFactory = new StockGatewayFactory(),
    stockQuoteGatewayFactory = new StockQuoteGatewayFactory(),
  }: StockInteractorDependencies = {}) {
    this.configService = configService;
    this.stockGatewayFactory = stockGatewayFactory;
    this.stockQuoteGatewayFactory = stockQuoteGatewayFactory;
  }

  async post(requestModel: IRequestModel): Promise<IResponseModel> {
    return this.get(requestModel);
  }

  async get(requestModel: IRequestModel): Promise<IResponseModel> {
    let response;
    const date = new Date();
    const config = await this.configService.load();

    const stock = new StockRequest();
    stock.fillWithRequest(requestModel);

    let stockGateway: IDataGateway;

    if (requestModel.request.request.stock.action === 'quote') {
      stockGateway = await this.stockQuoteGatewayFactory.createGateway(config);
      stock.setFieldValue('key', stockGateway.key);
    }

    if (requestModel.request.request.stock.action === 'downloadPublicCompanies') {
      try {
        stockGateway = new SQLiteAssetGateway();
        const lastUpdated = await stockGateway.checkLastTableUpdate();

        let dayDiff = 0;

        if (lastUpdated !== undefined) {
          const timeDiff = Math.abs(date.getTime() - lastUpdated.getTime());
          dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        }

        if (lastUpdated === undefined || dayDiff > 30) {
          const refreshed = await stockGateway.refreshTableCache(stock);
          if (refreshed) {
            response = new JSONResponse(JSON.stringify({ status: 200, ok: true }));
          } else {
            response = new JSONResponse(
              JSON.stringify({
                status: 500,
                data: {
                  error: 'The cache failed to update.',
                },
              }),
            );
          }

          return response;
        }

        response = new JSONResponse(JSON.stringify({ status: 200, ok: true }));
        return response;
      } catch (_downloadError) {
        response = new JSONResponse(
          JSON.stringify({
            status: 500,
            data: { error: 'An unknown error occured while updated the system cache.' },
          }),
        );
        return response;
      }
    }

    if (requestModel.request.request.stock.action === 'lookup' || requestModel.request.request.stock.action === 'selectRandomSP500') {
      stockGateway = new SQLiteAssetGateway();
    } else {
      stockGateway = await this.stockGatewayFactory.createGateway(config);
      stock.setFieldValue('key', stockGateway.key);
    }

    const results = await stockGateway.read(stock, requestModel.request.request.stock.action);

    if (results) {
      response = new JSONResponse();
      response.convertFromEntity(results, false);
      response.response['source'] = stockGateway.sourceName;
    } else {
      response = new JSONResponse(JSON.stringify({ status: 400, data: { error: 'No data is available for this stock.' } }));
    }

    return response.response;
  }

  async put(requestModel: IRequestModel): Promise<IResponseModel> {
    return this.get(requestModel);
  }

  async delete(requestModel: IRequestModel): Promise<IResponseModel> {
    return this.get(requestModel);
  }
}
