import express from "express";
import { env } from "./config/env.ts";
import authRoutes from "./routes/authRoutes.ts";
import userManagementRoutes from "./routes/userManagementRoutes.ts";
import projectRoutes from "./routes/projectRoutes.ts";

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/manage", userManagementRoutes);
app.use("/api/projects", projectRoutes);

app.get("/", (req, res) => {
    res.json({ 
        message: "Welcome to TenantShield!", 
        version: "1.0.0",
        endpoints: {
            auth: "/api/auth",
            admin: "/api/manage",
            projects: "/api/projects"
        }
    });
});

app.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    console.log(`🗄️  Database: ${env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});

export default app;