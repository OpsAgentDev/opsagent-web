import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HumanReviewView } from "@/components/human-review";
import { FindingReviewButton } from "@/components/human-review-dialog";
import { ReviewerProfile } from "@/components/reviewer-profile";
import type { Connection, HumanReviews } from "@/lib/api/client";

const data: HumanReviews = {
  offers: [
    { kind: "finding", price_cents: 9900, title: "Finding review", description: "Fix plan for one finding." },
    { kind: "account", price_cents: 49900, title: "Account review", description: "Whole account report." },
  ],
  requests: [],
};
const conns = [{ id: "c1", display_name: "prod", status: "connected" }] as Connection[];
const view = (owner: boolean) =>
  renderToStaticMarkup(createElement(HumanReviewView, { org: "o", owner, data, connections: conns, onSent: () => {} }));

describe("human review", () => {
  it("profile has the photo and no links", () => {
    const html = renderToStaticMarkup(createElement(ReviewerProfile));
    expect(html).toContain('alt="Harun R. Rayhan"');
    expect(html).toContain("Trinax SG");
    expect(html).not.toMatch(/<a[\s>]/);
    expect(html).not.toMatch(/https?:\/\//);
  });
  it("prices come from the API", () => {
    const html = view(true);
    expect(html).toContain("$99");
    expect(html).toContain("$499");
    expect(html).toContain("Harun will reply within 1 business day with a confirmation and invoice. Nothing is changed in your account.");
  });
  it("owner sees the form, member does not", () => {
    expect(view(true)).toContain("Request an account review");
    const member = view(false);
    expect(member).not.toContain("<textarea");
    expect(member).toContain("Only owners can request a review.");
  });
});

describe("finding review button", () => {
  const btn = (role: string) =>
    renderToStaticMarkup(createElement(FindingReviewButton, { org: "o", findingId: "f1", role }));
  it("is disabled with a hint for members", () => {
    const html = btn("member");
    expect(html).toMatch(/<button[^>]*disabled/);
    expect(html).toContain("Only owners can request a review");
  });
});
