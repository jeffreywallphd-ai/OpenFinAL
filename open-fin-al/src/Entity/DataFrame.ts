import { Series } from "./Series";

export type DataFrameRow = Record<string, any>;

export class DataFrame {
    private readonly rows: DataFrameRow[];
    private readonly rowIndex: Array<number | string>;

    constructor(rows: DataFrameRow[] = [], options?: { index?: Array<number | string> }) {
        this.rows = rows.map((row) => ({ ...row }));
        this.rowIndex = options?.index ? [...options.index] : rows.map((_, i) => i);

        if (this.rowIndex.length !== this.rows.length) {
            throw new Error("DataFrame index length must match number of rows.");
        }
    }

    static fromRecords(rows: DataFrameRow[]): DataFrame {
        return new DataFrame(rows);
    }

    get shape(): [number, number] {
        return [this.rows.length, this.columns.length];
    }

    get columns(): string[] {
        const uniqueColumns = new Set<string>();
        for (const row of this.rows) {
            for (const columnName of Object.keys(row)) {
                uniqueColumns.add(columnName);
            }
        }
        return Array.from(uniqueColumns);
    }

    get(index: number): DataFrameRow | undefined;
    get(column: string): Series<any>;
    get(input: number | string): DataFrameRow | Series<any> | undefined {
        if (typeof input === "number") {
            return this.iloc(input);
        }

        return this.column(input);
    }

    column<T = any>(columnName: string): Series<T> {
        return new Series<T>(
            this.rows.map((row) => row[columnName]),
            { name: columnName, index: this.rowIndex }
        );
    }

    iloc(position: number): DataFrameRow | undefined {
        const row = this.rows[position];
        return row ? { ...row } : undefined;
    }

    loc(label: number | string): DataFrameRow | undefined {
        const idx = this.rowIndex.findIndex((key) => key === label);
        const row = idx >= 0 ? this.rows[idx] : undefined;
        return row ? { ...row } : undefined;
    }

    head(count: number = 5): DataFrame {
        return new DataFrame(this.rows.slice(0, count), { index: this.rowIndex.slice(0, count) });
    }

    tail(count: number = 5): DataFrame {
        return new DataFrame(this.rows.slice(-count), { index: this.rowIndex.slice(-count) });
    }

    select(columns: string[]): DataFrame {
        const selected = this.rows.map((row) => {
            const next: DataFrameRow = {};
            for (const column of columns) {
                next[column] = row[column];
            }
            return next;
        });

        return new DataFrame(selected, { index: this.rowIndex });
    }

    withColumn(columnName: string, values: any[] | Series<any>): DataFrame {
        const sourceValues = values instanceof Series ? values.toArray() : values;

        if (sourceValues.length !== this.rows.length) {
            throw new Error("Column length must match row count.");
        }

        const updatedRows = this.rows.map((row, i) => ({
            ...row,
            [columnName]: sourceValues[i],
        }));

        return new DataFrame(updatedRows, { index: this.rowIndex });
    }

    toRecords(): DataFrameRow[] {
        return this.rows.map((row) => ({ ...row }));
    }

    toJSON() {
        return {
            index: [...this.rowIndex],
            columns: this.columns,
            rows: this.toRecords(),
            shape: this.shape,
        };
    }
}
