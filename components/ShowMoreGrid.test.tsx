import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ShowMoreGrid } from "./ShowMoreGrid";

describe("ShowMoreGrid", () => {
  it("keeps every item in the HTML but hides those past the first batch", () => {
    const html = renderToStaticMarkup(
      <ShowMoreGrid initial={2}>
        {["a", "b", "c", "d"].map((x) => (
          <a key={x} href={`/story/${x}`}>{x}</a>
        ))}
      </ShowMoreGrid>,
    );
    for (const x of ["a", "b", "c", "d"]) expect(html).toContain(`/story/${x}`);
    expect((html.match(/class="hidden"/g) ?? []).length).toBe(2);
    expect(html).toContain("Show more (2 left)");
  });
});
