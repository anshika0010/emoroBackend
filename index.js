import express from "express";
import dotenv from "dotenv";
import databaseConfig from "./src/config/db.js";
import ProductRouter from "./src/router/product.route.js";
import ReviewRouter from "./src/router/review.route.js"
import cors from "cors"

dotenv.config();
databaseConfig();

const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use("/emoro/api/product", ProductRouter);
app.use("/emoro/api/review", ReviewRouter)

app.listen(port, () => {console.log(`Server run on PORT: ${port}`)})


