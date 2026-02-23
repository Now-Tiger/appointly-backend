import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import tenantsRoute from "./routes/tenants.route";

/**
 * Composition root — builds and returns a fully configured Fastify
 * instance without starting the server. This separation makes the
 * app importable for integration tests without binding to a port.
 */
export const buildApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: {
      transport:
        process.env.ENV === "development"
          ? { target: "pino-pretty" }
          : undefined,
    },
  });

  await app.register(cors);
  await app.register(helmet);
  await app.register(tenantsRoute, { prefix: "/v1"})

  app.get("/", async () => ({ success: true, status: 200, message: 'Home page' }));
  app.get("/health", async () => ({ sucess: true, status: 200, message: 'Health check Ok!' }));

  return app;
};




