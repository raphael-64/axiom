import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { greet } from '@utils/utils'; // Adjust the path if necessary

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + hi Server");
  greet("Hello")
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});