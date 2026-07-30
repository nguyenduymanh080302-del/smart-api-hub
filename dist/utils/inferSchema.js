"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferSchema = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const inferType = (value) => {
    if (typeof value === "number")
        return Number.isInteger(value) ? "integer" : "float";
    if (typeof value === "boolean")
        return "boolean";
    if (value instanceof Date)
        return "timestamp";
    return "string";
};
const inferSchema = () => {
    const data = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, "../schema.json"), "utf-8"));
    const table = [];
    for (const tableName in data) {
        // get table rows from json
        const rows = data[tableName];
        if (!Array.isArray(rows) || rows.length === 0)
            continue;
        // get sample row
        const sample = rows[0];
        const columns = Object.entries(sample).map(([key, value]) => ({
            name: key,
            type: key === "id" && Number.isInteger(value)
                ? "increments"
                : inferType(value),
        }));
        table.push({ name: tableName, columns });
    }
    return table;
};
exports.inferSchema = inferSchema;
