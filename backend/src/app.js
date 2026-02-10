import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import routes from "./routes/index.js";

dotenv.config();

const app = express();

app.use(helmet());

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes par défaut
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requêtes par défaut
  message: {
    success: false,
    message: "Trop de requêtes, veuillez réessayer plus tard",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

//app.use("/api", limiter);

app.use(express.json({ limit: "10mb" }));

app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(compression());

if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Gestion Vagues - Bienvenue",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      users: "/api/users",
      vagues: "/api/vagues",
      inscriptions: "/api/inscriptions",
      niveaux: "/api/niveaux",
      finances: "/api/finances",
      reference: "/api/reference",
    },
  });
});

app.use("/api", routes);

// Route 404
app.use(notFound);

// Error handling
app.use(errorHandler);

export default app;
