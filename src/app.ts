import express from "express";
import helmet from "helmet";
import cors from "cors";
import { defaultLimiter, corsOptions, helmetOptions } from "./config/security.ts";
import { 
  globalErrorHandler, 
  notFoundHandler, 
} from "./middleware/error.ts";
import authRoutes from "./routes/authRoutes.ts";
import userManagementRoutes from "./routes/userManagementRoutes.ts";
import projectRoutes from "./routes/projectRoutes.ts";
import apiKeyRoutes from "./routes/apiKeyRoutes.ts";

const app = express();

// Security Middleware
app.use(helmet(helmetOptions));
app.use(cors(corsOptions));
app.use(defaultLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/manage", userManagementRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/manage-keys", apiKeyRoutes);

app.get("/", (req, res) => {
    res.json({ 
        message: "Welcome to TenantShield!", 
        version: "1.0.0",
        endpoints: {
            auth: "/api/auth",
            admin: "/api/manage",
            projects: "/api/projects",
            apiKeys: "/api/manage-keys"
        }
    });
});

// 404 Handler - after all routes
app.use(notFoundHandler);
// Global Error Handler - last middleware
app.use(globalErrorHandler);

export default app;