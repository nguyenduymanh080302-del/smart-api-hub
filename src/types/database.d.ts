interface ReferenceSchema {
    table: string;
    column: string;
}

type ColumnType =
    | "increments"
    | "integer"
    | "float"
    | "string"
    | "boolean"
    | "text"
    | "timestamp";

interface ColumnSchema {
    name: string;
    type: ColumnType;
}

interface TableSchema {
    name: string;
    columns: ColumnSchema[];
}

interface DatabaseSchema {
    tables: TableSchema[];
}