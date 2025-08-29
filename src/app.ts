import express from "express";
import { env } from "./config/env.js";

const app = express();

app.get("/", (req, res) => {
    res.json({ message: "Welcome to TenantShield!" });
});

app.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    console.log(`🗄️  Database: ${env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});

export default app;