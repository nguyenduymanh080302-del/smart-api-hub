"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = migrate;
const db_1 = __importDefault(require("../config/db"));
const inferSchema_1 = require("../utils/inferSchema");
const syncTable_1 = require("./syncTable");
async function migrate() {
    const schema = (0, inferSchema_1.inferSchema)();
    for (const table of schema) {
        await (0, syncTable_1.syncTable)(db_1.default, table);
    }
    console.log("Migration completed");
}
