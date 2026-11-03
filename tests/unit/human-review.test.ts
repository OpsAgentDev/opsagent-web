import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HumanReviewView, ReviewNotice, sendReview } from "@/components/human-review";
import { FindingReviewButton } from "@/components/human-review-dialog";
import { ReviewerProfile } from "@/components/reviewer-profile";
import { api } from "@/lib/api/client";
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
    expect(html).toContain("Pay securely with Stripe. Harun replies within 1 business day.");
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

describe("checkout", () => {
  const post = (body: unknown) =>
    vi.spyOn(api, "POST").mockResolvedValue({ data: body, response: new Response() } as never);
  const body = { kind: "account", connection_id: "c1", note: null } as const;
  const assign = vi.fn();
  afterEach(() => {
    vi.restoreAllMocks();
    assign.mockClear();
  });
  it("redirects to a Stripe checkout URL", async () => {
    vi.stubGlobal("window", { location: { assign } });
    post({ id: "r1", checkout_url: "https://checkout.stripe.com/c/pay/x" });
    expect(await sendReview("o", body)).toBe(true);
    expect(assign).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/x");
  });
  it("refuses a non-Stripe URL", async () => {
    vi.stubGlobal("window", { location: { assign } });
    post({ id: "r1", checkout_url: "https://evil.example/pay" });
    await expect(sendReview("o", body)).rejects.toThrow("Unexpected billing redirect.");
    expect(assign).not.toHaveBeenCalled();
  });
  it("keeps the confirmation without a checkout URL", async () => {
    post({ id: "r1", checkout_url: null });
    expect(await sendReview("o", body)).toBe(false);
  });
  it("shows payment status per request", () => {
    const mk = (payment: string) => ({ id: payment, kind: "account", target_label: "t", price_cents: 100, created_at: "2026-11-03T00:00:00Z", payment, paid_at: null });
    const d = { ...data, requests: ["paid", "pending", "invoice"].map(mk) } as HumanReviews;
    const html = renderToStaticMarkup(createElement(HumanReviewView, { org: "o", owner: true, data: d, connections: conns, onSent: () => {} }));
    for (const l of ["Paid", "Awaiting payment", "Invoice"]) expect(html).toContain(`<td>${l}</td>`);
  });
  it("shows the paid and canceled notices", () => {
    expect(renderToStaticMarkup(createElement(ReviewNotice, { paid: true, canceled: false }))).toContain("Payment received. Harun will reply within 1 business day.");
    expect(renderToStaticMarkup(createElement(ReviewNotice, { paid: false, canceled: true }))).toContain("Payment canceled. Nothing was charged.");
    expect(renderToStaticMarkup(createElement(ReviewNotice, { paid: false, canceled: false }))).toBe("");
  });
});
