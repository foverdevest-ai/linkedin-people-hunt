import { env } from "@/lib/env";

export type SalesforceAuth = {
  access_token: string;
  instance_url: string;
  token_type: string;
};

export function salesforceConfigured() {
  return Boolean(
    env.SALESFORCE_CLIENT_ID &&
      env.SALESFORCE_CLIENT_SECRET &&
      env.SALESFORCE_USERNAME &&
      env.SALESFORCE_PASSWORD
  );
}

export async function authenticateSalesforce() {
  if (!salesforceConfigured()) {
    throw new Error("Salesforce credentials are not configured.");
  }

  const loginUrl = env.SALESFORCE_LOGIN_URL.trim().replace(/\/+$/, "");
  const tokenUrl = `${loginUrl}/services/oauth2/token`;

  const body = new URLSearchParams();
  body.set("grant_type", "password");
  body.set("client_id", env.SALESFORCE_CLIENT_ID!);
  body.set("client_secret", env.SALESFORCE_CLIENT_SECRET!);
  body.set("username", env.SALESFORCE_USERNAME!);
  body.set("password", `${env.SALESFORCE_PASSWORD}${env.SALESFORCE_SECURITY_TOKEN ?? ""}`);

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new Error(`Salesforce auth failed (${response.status}): ${await response.text()}`);
  }
  return (await response.json()) as SalesforceAuth;
}

export async function salesforceFetch(auth: SalesforceAuth, path: string, init: RequestInit = {}) {
  return fetch(`${auth.instance_url}/services/data/v61.0${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${auth.access_token}`,
      ...(init.headers ?? {})
    }
  });
}
