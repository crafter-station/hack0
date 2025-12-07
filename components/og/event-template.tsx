/** @jsxImportSource react */
import type { CSSProperties } from "react";

interface EventOGTemplateProps {
  eventName: string;
  organizerName: string;
  organizerAvatar?: string;
  eventImage?: string;
  date: string;
  location: string;
  prizePool?: string;
  eventType: string;
  isJuniorFriendly?: boolean;
  status?: "open" | "upcoming" | "ongoing" | "ended";
}

export function EventOGTemplate({
  eventName,
  organizerName,
  organizerAvatar,
  eventImage,
  date,
  location,
  prizePool,
  eventType,
  isJuniorFriendly,
  status = "upcoming",
}: EventOGTemplateProps) {
  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    ongoing: { bg: "rgba(16, 185, 129, 0.1)", text: "#10b981", dot: "#10b981" },
    open: { bg: "rgba(59, 130, 246, 0.1)", text: "#3b82f6", dot: "#3b82f6" },
    upcoming: { bg: "rgba(245, 158, 11, 0.1)", text: "#f59e0b", dot: "#f59e0b" },
    ended: { bg: "rgba(148, 163, 184, 0.1)", text: "#94a3b8", dot: "#94a3b8" },
  };

  const statusLabels: Record<string, string> = {
    ongoing: "En curso",
    open: "Abierto",
    upcoming: "Próximamente",
    ended: "Finalizado",
  };

  const currentStatus = statusColors[status];
  const statusLabel = statusLabels[status];

  const gradientOverlay: CSSProperties = {
    background: "linear-gradient(135deg, rgba(204, 208, 201, 0.1) 0%, rgba(210, 152, 80, 0.1) 33%, rgba(114, 177, 191, 0.1) 66%, rgba(99, 78, 88, 0.1) 100%)",
    position: "absolute",
    inset: "0",
  };

  const noisePattern: CSSProperties = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
    position: "absolute",
    inset: "0",
  };

  return (
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        position: "relative",
        backgroundColor: "#09090b",
        overflow: "hidden",
      }}
    >
      {/* Background gradient */}
      <div style={gradientOverlay} />

      {/* Noise texture */}
      <div style={noisePattern} />

      {/* Event image background (if available) */}
      {eventImage && (
        <div
          style={{
            position: "absolute",
            inset: "0",
            display: "flex",
          }}
        >
          <img
            src={eventImage}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.25,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "0",
              background: "linear-gradient(to right, rgba(9, 9, 11, 0.8), rgba(9, 9, 11, 0.7))",
            }}
          />
        </div>
      )}

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          position: "relative",
          width: "100%",
        }}
      >
        {/* Header - Logo + Status */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#fafafa",
                letterSpacing: "-0.02em",
              }}
            >
              hack0.dev
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: currentStatus.bg,
              color: currentStatus.text,
              padding: "10px 20px",
              borderRadius: "9999px",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: currentStatus.dot,
              }}
            />
            {statusLabel}
          </div>
        </div>

        {/* Event Info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            maxWidth: "900px",
          }}
        >
          {/* Badges */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                backgroundColor: "rgba(250, 250, 250, 0.1)",
                color: "#a1a1aa",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "500",
              }}
            >
              {eventType}
            </div>
            {isJuniorFriendly && (
              <div
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  color: "#f59e0b",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                ✨ Junior Friendly
              </div>
            )}
          </div>

          {/* Event name */}
          <div
            style={{
              fontSize: "64px",
              fontWeight: "700",
              color: "#fafafa",
              lineHeight: "1.1",
              letterSpacing: "-0.02em",
              maxHeight: "140px",
              overflow: "hidden",
            }}
          >
            {eventName}
          </div>

          {/* Meta info */}
          <div
            style={{
              display: "flex",
              gap: "32px",
              fontSize: "22px",
              color: "#a1a1aa",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              📅 {date}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              📍 {location}
            </div>
            {prizePool && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: "#f59e0b",
                  fontWeight: "600",
                }}
              >
                🏆 {prizePool}
              </div>
            )}
          </div>
        </div>

        {/* Footer - Organizer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            borderTop: "1px solid rgba(250, 250, 250, 0.1)",
            paddingTop: "24px",
          }}
        >
          {organizerAvatar ? (
            <img
              src={organizerAvatar}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                border: "2px solid rgba(250, 250, 250, 0.2)",
              }}
            />
          ) : (
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "rgba(250, 250, 250, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: "600",
                color: "#a1a1aa",
                lineHeight: "48px",
                textAlign: "center",
              }}
            >
              {organizerName.charAt(0).toUpperCase()}
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                color: "#71717a",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Organizado por
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#fafafa",
              }}
            >
              {organizerName}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
