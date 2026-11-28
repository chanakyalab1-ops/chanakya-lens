import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

vi.mock("next/script", () => ({ default: () => null }));
import CheckoutLanding from "./CheckoutLanding";

describe("CheckoutLanding", () => {
  it("explains itself and has no buy button", () => {
    const html = renderToString(<CheckoutLanding token="live_abc" sandbox={false} />);
    expect(html).toContain("Secure checkout");
    expect(html).not.toMatch(/<button/);
    expect(html).toContain("Back to Chanakya Lens");
  });
  it("says there is nothing to do when no token is set", () => {
    const html = renderToString(<CheckoutLanding token="" sandbox={false} />);
    expect(html).toContain("nothing to do here");
  });
});
