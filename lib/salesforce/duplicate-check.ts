import { HuntProspect } from "@prisma/client";
import { authenticateSalesforce, salesforceFetch, salesforceConfigured } from "@/lib/salesforce/client";
import { env } from "@/lib/env";

type DuplicateResult = {
  status: "matched" | "not_found" | "error";
  matchId?: string;
  reason?: string;
};

function escapeSoql(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function queryLeadId(soql: string) {
  const auth = await authenticateSalesforce();
  const response = await salesforceFetch(auth, `/query?q=${encodeURIComponent(soql)}`);
  if (!response.ok) {
    throw new Error(`Salesforce duplicate query failed (${response.status}): ${await response.text()}`);
  }
  const json = (await response.json()) as { records?: Array<{ Id?: string }> };
  return json.records?.[0]?.Id;
}

export function buildDuplicateCheckQueries(
  prospect: Pick<HuntProspect, "normalizedProfileUrl" | "fullName" | "companyName" | "jobTitle">
) {
  const queries: Array<{ reason: string; soql: string }> = [];
  if (env.SALESFORCE_FIELD_LINKEDIN_URL && prospect.normalizedProfileUrl) {
    queries.push({
      reason: "linkedin_url_exact",
      soql:
        `SELECT Id FROM Lead WHERE ${env.SALESFORCE_FIELD_LINKEDIN_URL} = '` +
        `${escapeSoql(prospect.normalizedProfileUrl)}' ORDER BY CreatedDate DESC LIMIT 1`
    });
  }
  if (prospect.fullName && prospect.companyName) {
    queries.push({
      reason: "name_company_exact",
      soql:
        "SELECT Id FROM Lead WHERE " +
        `Name = '${escapeSoql(prospect.fullName)}' AND Company = '${escapeSoql(prospect.companyName)}' ` +
        "ORDER BY CreatedDate DESC LIMIT 1"
    });
  }
  if (prospect.fullName && prospect.companyName && prospect.jobTitle) {
    queries.push({
      reason: "name_title_company_exact",
      soql:
        "SELECT Id FROM Lead WHERE " +
        `Name = '${escapeSoql(prospect.fullName)}' AND Company = '${escapeSoql(prospect.companyName)}' AND Title = '${escapeSoql(prospect.jobTitle)}' ` +
        "ORDER BY CreatedDate DESC LIMIT 1"
    });
  }
  return queries;
}

export async function checkSalesforceDuplicate(prospect: HuntProspect): Promise<DuplicateResult> {
  if (!salesforceConfigured()) return { status: "not_found" };
  try {
    const queries = buildDuplicateCheckQueries(prospect);
    for (const query of queries) {
      const id = await queryLeadId(query.soql);
      if (id) {
        return { status: "matched", matchId: id, reason: query.reason };
      }
    }
    return { status: "not_found" };
  } catch (error) {
    return {
      status: "error",
      reason: error instanceof Error ? error.message : "unknown_duplicate_check_error"
    };
  }
}
