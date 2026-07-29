import path from "path";
import fs from "fs";
import knexConfig from "../config/db";
import { createTable } from "./createTable";

export const migrate = async () => {

    const filePath = path.join(__dirname, "../schema.json");
    const file = fs.readFileSync(filePath, "utf8");
    const schema = JSON.parse(file);

    for (const table of schema.tables) {
        await createTable(knexConfig, table);
    }
    console.log("Migration completed");
}

migrate()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });