import type { Knex } from "knex";

const config: Knex.Config = {
    client: "pg",

    connection: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    },

    migrations: {
        directory: "./src/migrations"
    }
};

export default config;