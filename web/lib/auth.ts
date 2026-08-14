import { betterAuth } from "better-auth";
import { admin, createAccessControl } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, schema } from "@/db";

const ac = createAccessControl({
  user: ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "set-email", "get", "update"],
  session: ["list", "revoke", "delete"],
});

export const auth = betterAuth({
  appName: "KelasHub LMS",
  baseURL: {
    allowedHosts: [
      "localhost:*",
      "127.0.0.1:*",
      "*.trycloudflare.com",
      "*.ngrok.app",
      "*.ngrok-free.app",
      "*.vercel.app",
    ],
    fallback: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  },
  secret: process.env.BETTER_AUTH_SECRET ?? "kelashub-dev-secret-change-me",
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  user: {
    additionalFields: {
      schoolId: {
        type: "string",
        required: false,
        defaultValue: null,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "student",
        input: false, // role cannot be set through sign-up
      },
      banned: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      banReason: {
        type: "string",
        required: false,
        input: false,
      },
      banExpires: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },
  plugins: [
    admin({
      adminRoles: ["admin"],
      defaultRole: "student",
      defaultBanReason: "Diblokir oleh admin",
      roles: {
        admin: ac.newRole({
          user: ["create", "list", "set-role", "ban", "delete", "set-password", "set-email", "get", "update"],
          session: ["list", "revoke", "delete"],
        }),
        teacher: ac.newRole({ user: ["list", "get"], session: ["list"] }),
        student: ac.newRole({ user: ["get"], session: [] }),
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
