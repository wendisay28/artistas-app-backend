import passport from "passport";
import session from "express-session";
import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
const { Issuer, Client, TokenSet } = require('openid-client');
type ClientMetadata = {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
  response_types: string[];
  scope: string;
  issuer: any;
};
import { storage } from "./storage/index.js";



interface IOpenIDClient {
  authorizationUrl(params: any): string;
  callbackParams(req: Request): any;
  callback(redirectUri: string, params: any, checks: any): Promise<any>;
  userinfo(token: string): Promise<any>;
}

type VerifyFunction = (tokenSet: any, userinfo: any, done: (err: any, user?: any) => void) => void;

class Strategy extends passport.Strategy {
  private static instance: Strategy;

  static getInstance(clientId: string, clientSecret: string, redirectUri: string, verify: VerifyFunction): Strategy {
    if (!clientId || !clientSecret || !redirectUri || !verify) {
      throw new Error('Missing required parameters for Strategy initialization');
    }
    if (!Strategy.instance) {
      Strategy.instance = new Strategy(clientId, clientSecret, redirectUri, verify);
    }
    return Strategy.instance;
  }
  private client: typeof Client;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private verify: VerifyFunction;
  name: string;

  constructor(clientId: string, clientSecret: string, redirectUri: string, verify: VerifyFunction) {
    super();
    this.name = 'oidc';
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.verify = verify;
  }

  async getClient(): Promise<InstanceType<typeof Client>> {
    const issuer = await Issuer.discover(process.env.ISSUER_URL ?? "https://replit.com/oidc");
    const clientConfig: ClientMetadata = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uris: [this.redirectUri],
      response_types: ['code'],
      scope: 'openid email profile offline_access',
      issuer: issuer
    };
    return new Client(clientConfig);
  }

  authenticate(req: Request): void {
    // Implementation will be added later
  }
}

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    const issuer = await Issuer.discover(process.env.ISSUER_URL ?? "https://replit.com/oidc");
    return issuer;
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: any
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const issuer = await getOidcConfig();

  const verify: VerifyFunction = async (tokenSet: any, userinfo: any, done: (err: any, user?: any) => void) => {
    const user = {};
    updateUserSession(user, tokenSet);
    await upsertUser(userinfo);
    done(null, user);
  };

  const domains = process.env.REPLIT_DOMAINS!.split(",");
  for (const domain of domains) {
    const client = new Client({
      client_id: process.env.REPL_ID!,
      client_secret: process.env.REPL_SECRET!,
      redirect_uris: [`https://${domain}/api/callback`],
      response_types: ['code'],
      scope: 'openid email profile offline_access',
      issuer: issuer
    });
    const strategy = Strategy.getInstance(process.env.REPLIT_CLIENT_ID!, process.env.REPLIT_CLIENT_SECRET!, process.env.REPLIT_REDIRECT_URI!, verify);
    passport.use(`replitauth:${domain}`, strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        issuer.buildEndSessionUrl({
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.redirect("/api/login");
  }

  try {
    const issuer = await getOidcConfig();
    const tokenResponse = await issuer.refresh(refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    return res.redirect("/api/login");
  }
};
