export class Series<T = any> {
    private readonly values: T[];
    private readonly index: (string | number)[];
    readonly name?: string;

    constructor(values: T[] = [], options?: { name?: string; index?: Array<string | number> }) {
        this.values = [...values];
        this.name = options?.name;
        this.index = options?.index ? [...options.index] : values.map((_, i) => i);

        if (this.index.length !== this.values.length) {
            throw new Error("Series index length must match values length.");
        }
    }

    get length(): number {
        return this.values.length;
    }

    get(index: number | string): T | undefined {
        if (typeof index === "number") {
            return this.values[index];
        }

        const idx = this.index.findIndex((key) => key === index);
        return idx >= 0 ? this.values[idx] : undefined;
    }

    iloc(position: number): T | undefined {
        return this.values[position];
    }

    loc(label: string | number): T | undefined {
        const idx = this.index.findIndex((key) => key === label);
        return idx >= 0 ? this.values[idx] : undefined;
    }

    toArray(): T[] {
        return [...this.values];
    }

    toJSON() {
        return {
            name: this.name,
            index: [...this.index],
            values: [...this.values],
        };
    }
}
