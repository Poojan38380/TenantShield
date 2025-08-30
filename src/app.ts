import express from "express";
import helmet from "helmet";
import cors from "cors";
import { defaultLimiter, corsOptions, helmetOptions } from "./config/security.js";
import { 
  globalErrorHandler, 
  notFoundHandler, 
} from "./middleware/error.js";
import authRoutes from "./routes/authRoutes.js";
import userManagementRoutes from "./routes/userManagementRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import apiKeyRoutes from "./routes/apiKeyRoutes.js";

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
        service: "TenantShield",
        version: "1.0.0",
        routes: {
            auth: {
                base: "/api/auth",
                overview: [
                    { method: "POST", path: "/register", desc: "Register user/organization" },
                    { method: "POST", path: "/login", desc: "Login, returns JWT" },
                    { method: "POST", path: "/logout", desc: "Logout (JWT required)" }
                ]
            },
            projects: {
                base: "/api/projects",
                auth: "JWT or x-api-key",
                overview: [
                    { method: "GET", path: "/", desc: "List projects" },
                    { method: "GET", path: "/:projectId", desc: "Get project" },
                    { method: "POST", path: "/", desc: "Create (Admin/Manager or API key)" },
                    { method: "PUT", path: "/:projectId", desc: "Update (Admin/Manager or API key)" },
                    { method: "DELETE", path: "/:projectId", desc: "Delete (Admin/Manager or API key)" }
                ]
            },
            admin: {
                base: "/api/manage",
                auth: "JWT Admin only",
                overview: [
                    { method: "GET", path: "/users", desc: "List org users" },
                    { method: "PATCH", path: "/users/:userId/role", desc: "Change user role" },
                    { method: "DELETE", path: "/users/:userId", desc: "Delete user" }
                ]
            },
            apiKeys: {
                base: "/api/manage-keys",
                auth: "JWT Admin only",
                overview: [
                    { method: "POST", path: "/", desc: "Create API key" },
                    { method: "GET", path: "/", desc: "List API keys" },
                    { method: "PUT", path: "/:keyId/revoke", desc: "Revoke API key" },
                    { method: "PUT", path: "/:keyId/rotate", desc: "Rotate API key" },
                    { method: "DELETE", path: "/:keyId", desc: "Delete API key" }
                ]
            }
        },
        authHeaders: {
            bearer: "Authorization: Bearer <JWT>",
            apiKey: "x-api-key: <API_KEY>"
        }
    });
});

// 404 Handler - after all routes
app.use(notFoundHandler);
// Global Error Handler - last middleware
app.use(globalErrorHandler);

export default app;