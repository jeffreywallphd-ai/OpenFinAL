import { Field } from "./Field";
import { IEntity } from "./IEntity";
import { IRequestModel } from "../Gateway/Request/IRequestModel";
import { IResponseModel } from "../Gateway/Response/IResponseModel";

export type TimeSeriesRow = {
    date: string;
    time: string;
    price: number | null;
    volume: number | null;
};

export class StockPriceVolumeDataFrame implements IEntity {
    fields: Map<string, Field> = new Map();

    constructor(rows: Array<{ [key: string]: any }> = []) {
        const columns = new Field("columns", "array", ["date", "time", "price", "volume"]);
        this.fields.set("columns", columns);

        const normalizedRows = new Field("rows", "array", this.normalizeRows(rows));
        this.fields.set("rows", normalizedRows);

        const rowCount = new Field("rowCount", "integer", normalizedRows.value.length);
        this.fields.set("rowCount", rowCount);
    }

    static fromRows(rows: Array<{ [key: string]: any }>): StockPriceVolumeDataFrame {
        return new StockPriceVolumeDataFrame(rows);
    }

    fillWithRequest(_requestModel: IRequestModel): void {
        throw new Error("Method not implemented.");
    }

    fillWithResponse(_responseModel: IResponseModel): void {
        throw new Error("Method not implemented.");
    }

    setFieldValue(field: string, value: any): void {
        if (this.fields.has(field)) {
            this.fields.get(field)?.setValue(value);

            if (field === "rows") {
                const normalizedRows = this.normalizeRows(value);
                this.fields.get("rows")?.setValue(normalizedRows);
                this.fields.get("rowCount")?.setValue(normalizedRows.length);
            }
        } else {
            throw new Error("The requested data property does not exist.");
        }
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

    toJSON() {
        return {
            columns: this.getFieldValue("columns"),
            rows: this.getFieldValue("rows"),
            rowCount: this.getFieldValue("rowCount"),
        };
    }

    toArray(): TimeSeriesRow[] {
        return this.getFieldValue("rows");
    }

    private normalizeRows(rows: Array<{ [key: string]: any }>): TimeSeriesRow[] {
        if (!Array.isArray(rows)) {
            return [];
        }

        return rows
            .map((row) => ({
                date: row?.date ? String(row.date) : "",
                time: row?.time ? String(row.time) : "",
                price: row?.price !== undefined && row?.price !== null ? Number(row.price) : null,
                volume: row?.volume !== undefined && row?.volume !== null ? Number(row.volume) : null,
            }))
            .filter((row) => row.date !== "");
    }
}
