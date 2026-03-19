import {IEntity} from "../../../Entity/IEntity";
import {IKeyedDataGateway} from "../IKeyedDataGateway";
import { MarketStatus } from "../../../Entity/MarketStatus";

export class AlphaVantageMarketGateway implements IKeyedDataGateway {
    baseURL: string = "https://www.alphavantage.co/query";
    key: string;
    sourceName: string = "AlphaVantage Market Status API";

    constructor(key: string) {
        this.key = key;
    }

    connect(): void {
        //no connection needed for this data gateway
        throw new Error("This gateway requries no special connection");
    }

    disconnect(): void {
        //no disconnection needed for this data gateway
        throw new Error("This gateway requries no special connection, so no disconnection is necessary");
    }

    create(entity: IEntity, action: string): Promise<Boolean> {
        //This API has no post capabilities
        throw new Error("This gateway does not have the ability to post content");
    }

    async read(entity: IEntity, action: string): Promise<Array<IEntity>> { 
        const data = await window.outbound.alphaVantage.marketStatus(entity.getFieldValue("key"));
        let entities: Array<IEntity> = [];

        if("Information" in data) {
            window.console.log("Your AlphaVantage key has reached its daily limit");
            return entities;
        }

        entities = this.formatDataResponse(data);
        window.console.log(entities);
        return entities;
    }

    private formatDataResponse(data: { [key: string]: any }) {
        var array: Array<IEntity> = [];
        var marketData = data["markets"]
        
        for(var market of marketData) {
            const entity = new MarketStatus();

            if(market["market_type"]==="Equity" && market["region"]!=="United States") {
                continue;
            }

            entity.setFieldValue("type", market["market_type"]);
            entity.setFieldValue("region", market["region"]);
            entity.setFieldValue("open", market["local_open"]);
            entity.setFieldValue("close", market["local_close"]);
            entity.setFieldValue("status", market["current_status"]);

            array.push(entity);
        }

        return array;
    }

    private createDataItem(newsFeed: any) {
        const item = {
            date: newsFeed["time_published"].split("T")[0],
            time: newsFeed["time_published"].split("T")[1],
            title: newsFeed["title"],
            url: newsFeed["url"],
            authors: newsFeed["authors"].join(", "),
            summary: newsFeed["summary"],
            thumbnail: newsFeed["banner_image"],
            source: newsFeed["source"]
        };

        return item;
    }

    update(entity: IEntity, action: string): Promise<number> {
        throw new Error("This gateway does not have the ability to update content");
    }

    delete(entity: IEntity, action: string): Promise<number> {
        throw new Error("This gateway does not have the ability to delete content");
    }    
}
