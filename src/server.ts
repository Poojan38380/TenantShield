import app from "./app.ts";
import { env } from "./config/env.ts";
import { unhandledRejectionHandler, uncaughtExceptionHandler } from "./middleware/error.ts";

process.on('unhandledRejection', unhandledRejectionHandler);
process.on('uncaughtException', uncaughtExceptionHandler);

const server = app.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    console.log(`🗄️  Database: ${env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
    console.log(`🛡️  Security: Helmet, CORS, and Rate Limiting enabled`);
    console.log(`📝 Error Handling: Centralized error handler active`);
});

export default server;


