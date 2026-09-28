import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

// ─── MAINTENANCE MODE ────────────────────────────────────────────────────────
// Set to `true` to show the maintenance page for ALL visitors.
// Set back to `false` to restore the site.
const MAINTENANCE_MODE = false;

function MaintenancePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        fontFamily: "'Inter', sans-serif",
        padding: "2rem",
        textAlign: "center",
        color: "#fff",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Animated glowing orbs */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
          top: "10%",
          left: "5%",
          animation: "pulse 4s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)",
          bottom: "10%",
          right: "5%",
          animation: "pulse 5s ease-in-out infinite 1s",
          pointerEvents: "none",
        }}
      />

      {/* GTA Logo / Icon */}
      <div
        style={{
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #a855f7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "2rem",
          boxShadow: "0 0 40px rgba(99,102,241,0.5)",
          fontSize: "2.2rem",
          animation: "spin-slow 8s linear infinite",
        }}
      >
        ✈️
      </div>

      {/* Headline */}
      <h1
        style={{
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          marginBottom: "0.5rem",
          background: "linear-gradient(90deg, #e0e7ff, #c4b5fd, #e0e7ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        We'll be back soon!
      </h1>

      {/* Sub-headline */}
      <p
        style={{
          fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
          color: "rgba(255,255,255,0.6)",
          maxWidth: 520,
          marginBottom: "2.5rem",
          lineHeight: 1.7,
        }}
      >
        <strong style={{ color: "rgba(255,255,255,0.9)" }}>Global Travel Association</strong> is
        currently under maintenance. We are working hard to improve your experience. Please check
        back shortly.
      </p>

      {/* Divider */}
      <div
        style={{
          width: 60,
          height: 3,
          background: "linear-gradient(90deg, #6366f1, #a855f7)",
          borderRadius: 2,
          marginBottom: "2rem",
        }}
      />

      {/* Contact hint */}
      <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.4)" }}>
        For urgent enquiries contact us at{" "}
        <a
          href="mailto:info@globaltravelassociation.in"
          style={{ color: "#a5b4fc", textDecoration: "none" }}
        >
          info@globaltravelassociation.in
        </a>
      </p>

      {/* CSS keyframes injected inline */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Global Travel Association (GTA) — India's Trusted Alliance of Travel Agencies" },
      {
        name: "description",
        content:
          "Global Travel Association (GTA) is an India-based association of travel agencies founded in 2024 in Chhattisgarh, uniting travel professionals PAN India through collaboration, events and ethical practice.",
      },
      { name: "author", content: "Global Travel Association" },
      { property: "og:site_name", content: "Global Travel Association" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#111111" },
      {
        property: "og:title",
        content: "Global Travel Association (GTA) — India's Trusted Alliance of Travel Agencies",
      },
      {
        name: "twitter:title",
        content: "Global Travel Association (GTA) — India's Trusted Alliance of Travel Agencies",
      },
      {
        property: "og:description",
        content:
          "Global Travel Association (GTA) is an India-based association of travel agencies founded in 2024 in Chhattisgarh, uniting travel professionals PAN India through collaboration, events and ethical practice.",
      },
      {
        name: "twitter:description",
        content:
          "Global Travel Association (GTA) is an India-based association of travel agencies founded in 2024 in Chhattisgarh, uniting travel professionals PAN India through collaboration, events and ethical practice.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/96d7bf3d-c279-4ab3-a234-87d72c2693ab/id-preview-429ca7ba--81d0b146-bb52-4a75-aebd-8701009019ab.lovable.app-1783748451021.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/96d7bf3d-c279-4ab3-a234-87d72c2693ab/id-preview-429ca7ba--81d0b146-bb52-4a75-aebd-8701009019ab.lovable.app-1783748451021.png",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", href: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  if (MAINTENANCE_MODE) {
    return <MaintenancePage />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
