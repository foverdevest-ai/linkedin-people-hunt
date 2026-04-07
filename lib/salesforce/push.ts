import { ProspectMessagingStatus, ProspectSalesforceStatus, User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { authenticateSalesforce, salesforceConfigured, salesforceFetch } from "@/lib/salesforce/client";
import { buildSalesforceLeadPayload } from "@/lib/salesforce/mapping";

export async function pushRepliedProspectToSalesforce(prospectId: string, actor: User) {
  const prospect = await prisma.huntProspect.findUnique({ where: { id: prospectId } });
  if (!prospect) throw new Error("Prospect not found");
  if (prospect.userId !== actor.id) throw new Error("Prospect ownership mismatch");
  if (prospect.messagingStatus !== ProspectMessagingStatus.replied) {
    throw new Error("Only replied prospects can be pushed");
  }
  if (!actor.salesforceOwnerId) {
    throw new Error("Current user has no Salesforce owner mapping");
  }
  if (!salesforceConfigured()) {
    throw new Error("Salesforce credentials are not configured");
  }

  const auth = await authenticateSalesforce();
  const payload = buildSalesforceLeadPayload(prospect, actor);
  const response = await salesforceFetch(auth, "/sobjects/Lead", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const message = await response.text();
    await prisma.huntProspect.update({
      where: { id: prospect.id },
      data: { salesforceStatus: ProspectSalesforceStatus.push_failed }
    });
    throw new Error(`Salesforce push failed (${response.status}): ${message}`);
  }

  const json = (await response.json()) as { id?: string };
  await prisma.huntProspect.update({
    where: { id: prospect.id },
    data: {
      salesforceStatus: ProspectSalesforceStatus.pushed,
      salesforceCreatedId: json.id,
      pushedToSalesforceAt: new Date(),
      messagingStatus: ProspectMessagingStatus.pushed_to_salesforce
    }
  });

  return json;
}
