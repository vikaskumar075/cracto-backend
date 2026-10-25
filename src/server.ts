import express from "express";
import cors from "cors";
import http from "http";
import compression from "compression";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import dotenv from "dotenv";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";
import { initDb } from "./db";

dotenv.config();

const PORT = process.env.PORT || 4000;

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use(cors());
  app.use(compression()); // Gzip compression for all JSON / GraphQL responses
  app.use(express.json());

  // Configure HTTP keep-alive timeouts for high-throughput connection pooling
  httpServer.keepAliveTimeout = 65000;
  httpServer.headersTimeout = 66000;

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // GraphQL endpoint
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => ({ req }),
    }) as unknown as express.RequestHandler
  );

  // Initialize DB tables on startup
  try {
    await initDb();
  } catch (err) {
    console.warn("Could not connect to database on startup (will retry on request):", err);
  }

  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
  console.log(`🚀 ReleaseCheck GraphQL server running at http://localhost:${PORT}/graphql`);
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
