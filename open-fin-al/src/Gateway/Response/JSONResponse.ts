import {IResponseModel} from "./IResponseModel";
import {IEntity} from "../../Entity/IEntity";
import {Field} from "../../Entity/Field";

export class JSONResponse implements IResponseModel {
    response: any = {response: {}};

    constructor(json?: string) {
        if (typeof json !== 'undefined') {
            this.response = JSON.parse(json);
        }
    }

    convertFromEntity(entities: IEntity[], allowNullValues:boolean=true): void {
        var responseData:any = {};
        var resultsArray:Array<any> = [];

        if(entities) {
            for (var entity of entities) {
                var result:any = {};

                var fields: Map<string, Field> = entity.getFields();
                for (var [name, obj] of fields) {
                    if(allowNullValues === false && obj.value === null) {
                        continue;
                    } 

                    const fieldValue = obj.value as any;
                    if(fieldValue && typeof fieldValue.toJSON === "function") {
                        result[obj.name] = fieldValue.toJSON();
                    } else {
                        result[obj.name] = fieldValue;
                    }
                }

                resultsArray.push(result);
            }

            this.response.response["ok"] = true;
            this.response.response["status"] = 200;
        }

        this.response.response["results"] = resultsArray;
    }

    toString() {
        return JSON.stringify(this.response);
    }
}