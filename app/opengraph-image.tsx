import { ImageResponse } from "next/og";

// The preview card for links to the homepage and any page without its own image.
export const alt = "Chanakya Lens: geopolitics traced to you";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0A112A 0%, #131F47 60%, #0A112A 100%)",
          padding: "64px 72px",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: "linear-gradient(90deg, #D9694A, #7EC0CC)" }} />
        <div style={{ display: "flex", fontSize: 34, letterSpacing: 8, color: "#7EC0CC", fontWeight: 800, textTransform: "uppercase" }}>
          Chanakya Lens
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 800, color: "#EEF2F6", lineHeight: 1.02, letterSpacing: -2 }}>
            Global moves.
          </div>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 800, color: "#7EC0CC", lineHeight: 1.02, letterSpacing: -2 }}>
            Local math.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#8E9DC0", letterSpacing: 2 }}>
          chanakyalens.com  ·  Geopolitics, traced to you
        </div>
      </div>
    ),
    size,
  );
}
