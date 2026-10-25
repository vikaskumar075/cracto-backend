"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const compression_1 = __importDefault(require("compression"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
const dotenv_1 = __importDefault(require("dotenv"));
const schema_1 = require("./schema");
const resolvers_1 = require("./resolvers");
const db_1 = require("./db");
dotenv_1.default.config();
const PORT = process.env.PORT || 4000;
async function startServer() {
    const app = (0, express_1.default)();
    const httpServer = http_1.default.createServer(app);
    const server = new server_1.ApolloServer({
        typeDefs: schema_1.typeDefs,
        resolvers: resolvers_1.resolvers,
        plugins: [(0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer })],
    });
    await server.start();
    app.use((0, cors_1.default)());
    app.use((0, compression_1.default)()); // Gzip compression for all JSON / GraphQL responses
    app.use(express_1.default.json());
    // Configure HTTP keep-alive timeouts for high-throughput connection pooling
    httpServer.keepAliveTimeout = 65000;
    httpServer.headersTimeout = 66000;
    // Health check endpoint
    app.get("/health", (_req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    });
    // GraphQL endpoint
    app.use("/graphql", (0, express4_1.expressMiddleware)(server, {
        context: async ({ req }) => ({ req }),
    }));
    // Initialize DB tables on startup
    try {
        await (0, db_1.initDb)();
    }
    catch (err) {
        console.warn("Could not connect to database on startup (will retry on request):", err);
    }
    await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
    console.log(`🚀 ReleaseCheck GraphQL server running at http://localhost:${PORT}/graphql`);
}
startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
