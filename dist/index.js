"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const health_route_1 = __importDefault(require("./routes/health.route"));
const resource_route_1 = __importDefault(require("./routes/resource.route"));
const db_1 = __importDefault(require("./config/db"));
const migrate_1 = require("./generator/migrate");
const app = (0, express_1.default)();
const port = process.env.PORT ?? 3000;
// ─── Global Middlewares ───────────────────────────────────────────────────────
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/health", health_route_1.default);
app.use("/", resource_route_1.default);
async function bootstrap() {
    try {
        // Verify database connection
        await db_1.default.raw("SELECT 1");
        console.log("Database connected.");
        // Auto migrate
        await (0, migrate_1.migrate)();
        // Start server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
}
bootstrap();
