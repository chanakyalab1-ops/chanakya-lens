import { existsSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("web app manifest", () => {
  const m = manifest();
  it("is installable: name, start url, standalone display", () => {
    expect(m.name).toBe("Chanakya Lens");
    expect(m.start_url).toBe("/");
    expect(m.display).toBe("standalone");
  });
  it("has 192 and 512 icons, including a maskable one, and every file exists", () => {
    const sizes = (m.icons ?? []).map((i) => i.sizes);
    expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    expect((m.icons ?? []).some((i) => i.purpose === "maskable")).toBe(true);
    for (const i of m.icons ?? []) expect(existsSync(join(process.cwd(), "public", i.src))).toBe(true);
  });
});
