import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: "linear-gradient(135deg, #020617 0%, #0f172a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "28%",
          border: "16px solid #1e293b",
          position: "relative",
        }}
      >
        {/* Glow backdrop ring */}
        <div
          style={{
            position: "absolute",
            width: "320px",
            height: "320px",
            background: "radial-gradient(circle, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0) 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Central Vehicle Shield Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "220px",
            height: "220px",
            borderRadius: "44px",
            background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
            boxShadow: "0 20px 40px rgba(16, 185, 129, 0.4)",
          }}
        >
          <svg
            width="130"
            height="130"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Minimalist Car Silhouette */}
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 11.3 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg>
        </div>

        {/* Brand Text Badge */}
        <div
          style={{
            marginTop: "24px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "38px",
              fontWeight: 900,
              letterSpacing: "4px",
              color: "#ffffff",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            PARK
          </span>
          <span
            style={{
              fontSize: "38px",
              fontWeight: 900,
              letterSpacing: "4px",
              color: "#34d399",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            TALK
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}