import express, { Request, Response, RequestHandler } from "express";
import cors from "cors";
import compression from "compression";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import dotenv from "dotenv";
import { typeDefs } from "../src/schema";
import { resolvers } from "../src/resolvers";
import { initDb } from "../src/db";

dotenv.config();

const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: false, // Allow cross-origin browser requests from any Vercel domain
});

let serverStarted = false;

async function bootstrap() {
  if (!serverStarted) {
    await server.start();

    app.use(cors({ origin: "*", credentials: true }));
    app.use(compression());
    app.use(express.json());

    // Health check endpoint
    app.get("/health", (_req: Request, res: Response) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    const graphqlHandler = expressMiddleware(server, {
      context: async ({ req }) => ({ req }),
    }) as unknown as RequestHandler;

    // Support GraphQL on /graphql, /api/graphql, /api/index, and root POST /
    app.use("/graphql", graphqlHandler);
    app.use("/api/graphql", graphqlHandler);
    app.use("/api/index", graphqlHandler);
    app.post("/", graphqlHandler);

    // Root GET endpoint
    app.get("/", (_req: Request, res: Response) => {
      res.json({ message: "ReleaseCheck GraphQL API", graphql: "/graphql", health: "/health" });
    });

    try {
      await initDb();
    } catch (err) {
      console.warn("DB init notice:", err);
    }

    serverStarted = true;
  }
}

export default async function handler(req: Request, res: Response) {
  await bootstrap();
  return app(req, res);
}
