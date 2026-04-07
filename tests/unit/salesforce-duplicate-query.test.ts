import { describe, expect, it } from "vitest";
import { buildDuplicateCheckQueries } from "@/lib/salesforce/duplicate-check";

describe("buildDuplicateCheckQueries", () => {
  it("includes ordered name/company and name/title/company fallbacks", () => {
    const queries = buildDuplicateCheckQueries({
      normalizedProfileUrl: "https://www.linkedin.com/in/jane",
      fullName: "Jane Doe",
      companyName: "Acme",
      jobTitle: "Founder"
    } as never);

    const reasons = queries.map((q) => q.reason);
    expect(reasons).toContain("name_company_exact");
    expect(reasons).toContain("name_title_company_exact");
  });
});
