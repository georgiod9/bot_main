import express, { Router } from "express";

const app = express();

app.use(express.json());

const routes = Router();

routes.get('/order', )

app.use("api/v1", routes);