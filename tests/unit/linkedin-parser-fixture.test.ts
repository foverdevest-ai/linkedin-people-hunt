import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { parseSearchResultsCards } from "@/extension/src/parsers/searchResultsParser.js";

describe("LinkedIn parser fixture", () => {
  it("extracts person rows from fixture html", () => {
    const html = fs.readFileSync(
      path.resolve(process.cwd(), "fixtures/linkedin/search-results.html"),
      "utf8"
    );
    const dom = new JSDOM(html);
    const rows = parseSearchResultsCards(dom.window.document);
    expect(rows.length).toBe(1);
    expect(rows[0].profileUrl).toContain("/in/jane-doe");
    expect(rows[0].fullName).toBe("Jane Doe");
  });
});
