import {
  mapLegacyStockRequestToEntity,
  mapLookupEntitiesToOutputDto,
  mapLookupInputDtoToEntity,
  mapQuoteEntitiesToOutputDto,
  mapQuoteInputDtoToEntity,
} from '../application/stock/StockMappers';
import { IDataGateway } from '../Gateway/Data/IDataGateway';
import { StockGatewayFactory } from '../Gateway/Data/StockGatewayFactory';
import { StockQuoteGatewayFactory } from '../Gateway/Data/StockQuoteGatewayFactory';
import { SQLiteAssetGateway } from '../Gateway/Data/SQLite/SQLiteAssetGateway';
import { IRequestModel } from '../Gateway/Request/IRequestModel';
import {
  mapTransportToLookupInputDto,
  mapTransportToQuoteInputDto,
  parseStockTransportModel,
  serializeLookupOutputDto,
  serializeQuoteOutputDto,
} from '../Gateway/Transport/StockTransport';
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
    const transportModel = parseStockTransportModel(requestModel);
    const action = transportModel.request.stock.action;

    if (action === 'lookup') {
      return this.lookup(transportModel);
    }

    if (action === 'quote') {
      return this.quote(transportModel);
    }

    return this.readLegacyStockAction(transportModel);
  }

  async put(requestModel: IRequestModel): Promise<IResponseModel> {
    return this.get(requestModel);
  }

  async delete(requestModel: IRequestModel): Promise<IResponseModel> {
    return this.get(requestModel);
  }

  private async lookup(transportModel: ReturnType<typeof parseStockTransportModel>): Promise<IResponseModel> {
    const inputDto = mapTransportToLookupInputDto(transportModel);
    const entity = mapLookupInputDtoToEntity(inputDto);
    const gateway = new SQLiteAssetGateway();
    const results = await gateway.read(entity, 'lookup');

    return serializeLookupOutputDto(mapLookupEntitiesToOutputDto(results ?? []), gateway.sourceName) as unknown as unknown as IResponseModel;
  }

  private async quote(transportModel: ReturnType<typeof parseStockTransportModel>): Promise<IResponseModel> {
    const config = await this.configService.load();
    const inputDto = mapTransportToQuoteInputDto(transportModel);
    const entity = mapQuoteInputDtoToEntity(inputDto);
    const gateway = await this.stockQuoteGatewayFactory.createGateway(config);

    if ('key' in gateway && gateway.key) {
      entity.setFieldValue('key', gateway.key);
    }

    const results = await gateway.read(entity, 'quote');

    if (!results) {
      return this.noDataResponse();
    }

    return serializeQuoteOutputDto(mapQuoteEntitiesToOutputDto(results), gateway.sourceName) as unknown as unknown as IResponseModel;
  }

  private async readLegacyStockAction(transportModel: ReturnType<typeof parseStockTransportModel>): Promise<IResponseModel> {
    const action = transportModel.request.stock.action;
    const date = new Date();
    const config = await this.configService.load();
    const stock = mapLegacyStockRequestToEntity(transportModel.request.stock);

    let stockGateway: IDataGateway;

    if (action === 'downloadPublicCompanies') {
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
            return { status: 200, ok: true } as unknown as IResponseModel;
          }

          return {
            status: 500,
            data: {
              error: 'The cache failed to update.',
            },
          } as unknown as IResponseModel;
        }

        return { status: 200, ok: true } as unknown as IResponseModel;
      } catch (_downloadError) {
        return {
          status: 500,
          data: { error: 'An unknown error occured while updated the system cache.' },
        } as unknown as IResponseModel;
      }
    }

    if (action === 'selectRandomSP500') {
      stockGateway = new SQLiteAssetGateway();
    } else {
      stockGateway = await this.stockGatewayFactory.createGateway(config);
      if ('key' in stockGateway && stockGateway.key) {
        stock.setFieldValue('key', stockGateway.key);
      }
    }

    const results = await stockGateway.read(stock, action);

    if (results) {
      return {
        response: {
          ok: true,
          status: 200,
          results: results.map((entity) => {
            const result: Record<string, any> = {};
            for (const [name, obj] of entity.getFields()) {
              if (obj.value !== null) {
                result[name] = obj.value;
              }
            }
            return result;
          }),
        },
        source: stockGateway.sourceName,
      } as unknown as IResponseModel;
    }

    return this.noDataResponse();
  }

  private noDataResponse(): IResponseModel {
    return {
      status: 400,
      data: {
        error: 'No data is available for this stock.',
      },
    } as unknown as IResponseModel;
  }
}
