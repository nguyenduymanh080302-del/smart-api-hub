interface ReferenceSchema {
    table: string;
    column: string;
}

interface ColumnSchema {
    name: string;
    type: "increments" | "integer" | "string" | "boolean" | "text" | "timestamp";
    required?: boolean;
    unique?: boolean;
    references?: ReferenceSchema;
}

interface TableSchema {
    name: string;
    columns: ColumnSchema[];
}

interface DatabaseSchema {
    tables: TableSchema[];
}