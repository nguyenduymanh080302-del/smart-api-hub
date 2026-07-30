import fs from "fs"
import path from "path";

const inferType = (value: unknown) => {
    if (typeof value === "number") return Number.isInteger(value) ? "integer" : "float"
    if (typeof value === "boolean") return "boolean";
    if (value instanceof Date) return "timestamp";
    return "string";
}

export const inferSchema = (): TableSchema[] => {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, "../schema.json"), "utf-8"))
    const table: TableSchema[] = []
    for (const tableName in data) {
        // get table rows from json
        const rows = data[tableName];
        if (!Array.isArray(rows) || rows.length === 0) continue;

        // get sample row
        const sample = rows[0];
        const columns: ColumnSchema[] = Object.entries(sample).map(
            ([key, value]) => ({
                name: key,
                type:
                    key === "id" && Number.isInteger(value)
                        ? "increments"
                        : inferType(value),
            })
        );
        table.push({ name: tableName, columns })
    }
    return table;
}