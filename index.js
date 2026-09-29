import express from "express";
import dotenv from "dotenv";
import cors from "cors"
import databaseConfig from "./src/config/db.js";
import ProductRouter from "./src/router/product.route.js";
import ReviewRouter from "./src/router/review.route.js"
import BannerRouter from "./src/router/banner.route.js";
import BlogRouter from "./src/router/blog.route.js";
import BlogCategoryRouter from "./src/router/blogCategory.route.js";
import ContactRouter from "./src/router/contact.route.js";
import FaqRouter from "./src/router/faq.route.js";
import InstagramRouter from "./src/router/instagram.route.js"

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
app.use("/emoro/api/reviews", ReviewRouter);
app.use("/emoro/api/banner", BannerRouter);
app.use("/emoro/api/blogs", BlogRouter);
app.use("/emoro/api/blogcategory", BlogCategoryRouter);
app.use("/emoro/api/contact", ContactRouter);
app.use("/emoro/api/faq", FaqRouter);
app.use("/emoro/api/instagram", InstagramRouter);

app.listen(port, () => {console.log(`Server run on PORT: ${port}`)})


