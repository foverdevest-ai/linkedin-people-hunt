import { z } from "zod";

function emptyToUndefined(value: string | undefined) {
  if (!value || value.trim() === "") return undefined;
  return value;
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:5432/linkedin_people_hunt"),
  AUTH_SECRET: z.string().min(1).default("change-me"),
  AUTH_URL: z.string().optional(),
  AUTH_COOKIE_DOMAIN: z.string().optional(),
  BASE_URL: z.string().min(1).default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("LinkedIn People Hunt"),
  NEXT_PUBLIC_HUB_LEAD_IMPORT_URL: z.string().optional(),
  NEXT_PUBLIC_HUB_JOB_IMPORT_URL: z.string().optional(),
  NEXT_PUBLIC_HUB_PEOPLE_HUNT_URL: z.string().optional(),
  NEXT_PUBLIC_HUB_META_ACTIVATION_URL: z.string().optional(),
  HUB_INTERNAL_AUTH_KEY: z.string().min(1).default("change-me"),
  LINKEDIN_EXTENSION_SHARED_SECRET: z.string().min(1).default("change-me"),
  DEFAULT_DAILY_SEND_CAP: z.coerce.number().int().min(1).max(300).default(40),
  DEFAULT_RUN_MAX_PAGES: z.coerce.number().int().min(1).max(50).default(5),
  SALESFORCE_LOGIN_URL: z.string().url().default("https://login.salesforce.com"),
  SALESFORCE_CLIENT_ID: z.string().optional(),
  SALESFORCE_CLIENT_SECRET: z.string().optional(),
  SALESFORCE_USERNAME: z.string().optional(),
  SALESFORCE_PASSWORD: z.string().optional(),
  SALESFORCE_SECURITY_TOKEN: z.string().optional(),
  SALESFORCE_FIELD_LINKEDIN_URL: z.string().optional(),
  SALESFORCE_FIELD_SEARCH_URL: z.string().optional(),
  SALESFORCE_FIELD_REPLY_SNIPPET: z.string().optional()
});

export const env = envSchema.parse({
  DATABASE_URL: emptyToUndefined(process.env.DATABASE_URL),
  AUTH_SECRET: emptyToUndefined(process.env.AUTH_SECRET),
  AUTH_URL: emptyToUndefined(process.env.AUTH_URL),
  AUTH_COOKIE_DOMAIN: emptyToUndefined(process.env.AUTH_COOKIE_DOMAIN),
  BASE_URL: emptyToUndefined(process.env.BASE_URL),
  NEXT_PUBLIC_APP_NAME: emptyToUndefined(process.env.NEXT_PUBLIC_APP_NAME),
  NEXT_PUBLIC_HUB_LEAD_IMPORT_URL: emptyToUndefined(process.env.NEXT_PUBLIC_HUB_LEAD_IMPORT_URL),
  NEXT_PUBLIC_HUB_JOB_IMPORT_URL: emptyToUndefined(process.env.NEXT_PUBLIC_HUB_JOB_IMPORT_URL),
  NEXT_PUBLIC_HUB_PEOPLE_HUNT_URL: emptyToUndefined(process.env.NEXT_PUBLIC_HUB_PEOPLE_HUNT_URL),
  NEXT_PUBLIC_HUB_META_ACTIVATION_URL: emptyToUndefined(process.env.NEXT_PUBLIC_HUB_META_ACTIVATION_URL),
  HUB_INTERNAL_AUTH_KEY: emptyToUndefined(process.env.HUB_INTERNAL_AUTH_KEY),
  LINKEDIN_EXTENSION_SHARED_SECRET: emptyToUndefined(process.env.LINKEDIN_EXTENSION_SHARED_SECRET),
  DEFAULT_DAILY_SEND_CAP: emptyToUndefined(process.env.DEFAULT_DAILY_SEND_CAP),
  DEFAULT_RUN_MAX_PAGES: emptyToUndefined(process.env.DEFAULT_RUN_MAX_PAGES),
  SALESFORCE_LOGIN_URL: emptyToUndefined(process.env.SALESFORCE_LOGIN_URL),
  SALESFORCE_CLIENT_ID: emptyToUndefined(process.env.SALESFORCE_CLIENT_ID),
  SALESFORCE_CLIENT_SECRET: emptyToUndefined(process.env.SALESFORCE_CLIENT_SECRET),
  SALESFORCE_USERNAME: emptyToUndefined(process.env.SALESFORCE_USERNAME),
  SALESFORCE_PASSWORD: emptyToUndefined(process.env.SALESFORCE_PASSWORD),
  SALESFORCE_SECURITY_TOKEN: emptyToUndefined(process.env.SALESFORCE_SECURITY_TOKEN),
  SALESFORCE_FIELD_LINKEDIN_URL: emptyToUndefined(process.env.SALESFORCE_FIELD_LINKEDIN_URL),
  SALESFORCE_FIELD_SEARCH_URL: emptyToUndefined(process.env.SALESFORCE_FIELD_SEARCH_URL),
  SALESFORCE_FIELD_REPLY_SNIPPET: emptyToUndefined(process.env.SALESFORCE_FIELD_REPLY_SNIPPET)
});
