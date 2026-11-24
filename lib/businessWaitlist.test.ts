import { describe, expect, it } from "vitest";
import { businessEmailHtml, validateBusinessSignup } from "./businessWaitlist";

const ok = { name: " Ravi ", email: "Ravi@Firm.IN", company: " Firm Exports ", role: "Exporter", interests: "Red Sea, Hormuz" };

describe("validateBusinessSignup", () => {
  it("cleans a good sign-up", () => {
    expect(validateBusinessSignup(ok)).toEqual({ name: "Ravi", email: "ravi@firm.in", company: "Firm Exports", role: "Exporter", interests: "Red Sea, Hormuz" });
  });
  it("drops an unknown role but keeps the sign-up", () => {
    expect(validateBusinessSignup({ ...ok, role: "<b>x</b>" })?.role).toBe("");
  });
  it("rejects missing fields", () => {
    expect(validateBusinessSignup({ ...ok, company: "" })).toBeNull();
    expect(validateBusinessSignup({ ...ok, email: "no" })).toBeNull();
    expect(validateBusinessSignup(null)).toBeNull();
  });
  it("escapes the name in the email", () => {
    expect(businessEmailHtml("<script>")).not.toContain("<script>");
  });
});
