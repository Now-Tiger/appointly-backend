import dotenv from "dotenv";
import { buildApp } from "./app";

dotenv.config();

const fakePort: number = 3000;
const fakeHost: string = "0.0.0.0";

const start = async () => {
  const app = await buildApp();
  try {
    const port = Number(process.env.PORT) || fakePort;
    await app.listen({ port, host: process.env.HOST ?? fakeHost });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
