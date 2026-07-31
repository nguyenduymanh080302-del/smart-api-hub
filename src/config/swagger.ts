import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import fs from "fs";
import path from "path";

const apiPath = fs.existsSync(path.join(process.cwd(), "src"))
    ? path.join(process.cwd(), "src/routes/*.ts")
    : path.join(process.cwd(), "dist/routes/*.js");

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.3",
        info: {
            title: "Smart API Hub",
            version: "1.0.0",
            description: "Dynamic REST API built with Express + Knex",
        },
        servers: [
            {
                url: "http://localhost:9999",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: [apiPath],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));
}