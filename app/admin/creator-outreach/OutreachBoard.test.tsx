import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

vi.mock("./actions", () => ({ addCreator: vi.fn(), markSent: vi.fn(), removeDraft: vi.fn(), setOutreachStatus: vi.fn() }));
import { OutreachBoard, type OutreachRow } from "./OutreachBoard";

const row = (o: Partial<OutreachRow>): OutreachRow => ({ id: "1", name: "Priya Sharma", email: "p@x.com", channel_url: "", video_title: "Why oil moves", topic: "oil", specific: "explain it", version: "geo", status: "draft", sent_at: null, followup_sent_at: null, created_at: "2026-11-01T00:00:00Z", ...o });

describe("OutreachBoard", () => {
  it("shows a draft with an Open in Gmail link and no auto-send", () => {
    const html = renderToString(<OutreachBoard rows={[row({})]} />);
    expect(html).toContain("To send (1)");
    expect(html).toContain("https://mail.google.com/mail/?view=cm");
    expect(html).toContain("I sent it");
  });
  it("never offers to email someone who said no", () => {
    const html = renderToString(<OutreachBoard rows={[row({ status: "no" })]} />);
    expect(html).toContain("Do not contact");
    expect(html).not.toContain("mail.google.com");
    expect(html).not.toContain("I sent it");
  });
  it("lists replied creators under done and offers no email link", () => {
    const html = renderToString(<OutreachBoard rows={[row({ status: "replied", sent_at: "2026-11-01T00:00:00Z" })]} />);
    expect(html).toContain("Replied or done (1)");
    expect(html).not.toContain("mail.google.com");
  });
  it("will not open a draft that is not personalised yet", () => {
    const html = renderToString(<OutreachBoard rows={[row({ video_title: "", specific: "" })]} />);
    expect(html).toContain("Add the video you watched");
    expect(html).not.toContain("mail.google.com");
    expect(html).toContain("Add many at once");
  });
});
