import { Field } from '../Field';
import { IEntity } from '../IEntity';
import { IRequestModel } from '../../Gateway/Request/IRequestModel';
import { IResponseModel } from '../../Gateway/Response/IResponseModel';

export class StockSearchCriteria implements IEntity {
  fields: Map<string, Field> = new Map();

  constructor() {
    this.fields.set('keyword', new Field('keyword', 'string', null));
    this.fields.set('ticker', new Field('ticker', 'string', null));
    this.fields.set('companyName', new Field('companyName', 'string', null));
    this.fields.set('cik', new Field('cik', 'string', null));
    this.fields.set('isSP500', new Field('isSP500', 'integer', null));
    this.fields.set('interval', new Field('interval', 'string', null));
    this.fields.set('key', new Field('key', 'string', null));
  }

  fillWithRequest(_requestModel: IRequestModel): void {
    throw new Error('StockSearchCriteria should be populated through a stock use-case mapper.');
  }

  fillWithResponse(_responseModel: IResponseModel): void {
    throw new Error('Method not implemented.');
  }

  setFieldValue(field: string, value: any): void {
    if (!this.fields.has(field)) {
      throw new Error('The requested data property does not exist.');
    }

    this.fields.get(field)?.setValue(value);
  }

  getFields(): Map<string, Field> {
    return this.fields;
  }

  getFieldValue(field: string): any {
    return this.fields.get(field)?.value;
  }

  getId(): any {
    return null;
  }
}
