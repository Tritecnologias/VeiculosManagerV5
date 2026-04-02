import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { generalLimiter, logSecurityEvent } from "./security";

const app = express();

// CORS - permite qualquer origem em desenvolvimento
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Configurações de segurança com Helmet
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  originAgentCluster: false,
  hsts: false,
}));

// Aplicar rate limiting geral
app.use(generalLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Log seguro - apenas método, path, status e duração
      // NUNCA logar dados de resposta que podem conter informações sensíveis
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Para rotas sensíveis, adicionar indicador sem expor dados
      if (path.includes('/login') || path.includes('/users') || path.includes('/password')) {
        logLine += ' [SENSITIVE]';
      }

      log(logLine);
    }
  });

  next();
});



(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  const listenOptions: Record<string, unknown> = { port, host: "0.0.0.0" };
  // reusePort is Linux-only; skip on Windows to avoid ENOTSUP
  if (process.platform !== "win32") {
    listenOptions.reusePort = true;
  }
  server.listen(listenOptions, () => {
    log(`serving on port ${port}`);
  });
})();
