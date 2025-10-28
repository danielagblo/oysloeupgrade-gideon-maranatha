import { readFileSync } from "node:fs";

import cors from "cors";
import type { Application } from "express";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import passport from "passport";
import swaggerUi from "swagger-ui-express";

import { config } from "./config/env.js";
import "./config/passport.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import { createAuthRoutes } from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import fcmRoutes from "./routes/fcm.routes.js";
import fcmTestRoutes from "./routes/fcm-test.routes.js";
import googleRoutes from "./routes/google.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import uploadRoutes from "./modules/uploads/routes.js";
import productRoutes from "./routes/product.routes.js";
import referralRoutes from "./routes/referral.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import searchRoutes from "./routes/search.routes.js";
import userRoutes from "./routes/user.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import { AuthService } from "./services/auth.service.js";
import { makeNotificationService } from "./services/notification.factory.js";
import { logInfo } from "./utils/logger.js";

export const createApp = (): Application => {
  const app = express();

  const notificationService = makeNotificationService();
  const authService = new AuthService({ notification: notificationService });
  const authRoutes = createAuthRoutes(authService);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          scriptSrc: [
            "'self'",
            "https://cdn.jsdelivr.net",
            "https://unpkg.com",
          ],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
    })
  );

  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    })
  );

  app.use(
    session({
      secret: config.session.secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: config.server.env,
    });
  });

  app.get("/openapi.json", (_req, res) => {
    try {
      const spec = readFileSync("spec/openapi.json", "utf8");
      res.type("application/json").send(spec);
    } catch (err) {
      console.error("Failed to read spec/openapi.json:", err);
      res
        .status(500)
        .json({ error: "OpenAPI spec not found. Run: bun run spec:gen" });
    }
  });

  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
      swaggerOptions: {
        url: "/openapi.json",
      },
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Oysloe API Documentation",
    })
  );

  const apiPrefix = `/api-${config.server.apiVersion}`;

  logInfo(`API routes will be mounted at ${apiPrefix}`);

  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/auth`, googleRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(`${apiPrefix}/products`, productRoutes);
  app.use(`${apiPrefix}/wallet`, walletRoutes);
  app.use(`${apiPrefix}/coupons`, couponRoutes);
  app.use(`${apiPrefix}/referrals`, referralRoutes);
  app.use(`${apiPrefix}/reviews`, reviewRoutes);
  app.use(`${apiPrefix}/search`, searchRoutes);
  app.use(`${apiPrefix}/analytics`, analyticsRoutes);
  app.use(`${apiPrefix}/notifications`, notificationRoutes);
  app.use(`${apiPrefix}/uploads`, uploadRoutes);

  app.use(`${apiPrefix}/fcm/test`, fcmTestRoutes);
  app.use(`${apiPrefix}/fcm`, fcmRoutes);
  app.use(`${apiPrefix}/chat`, chatRoutes);

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
};
