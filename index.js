import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { config } from "dotenv";

import router from "./routes/index.js";

const app = express();
config();

app.use(bodyParser.json({ limit: "30mb" }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true}));
app.use(cors());

app.use(router);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running PORT : ${PORT}`)
})