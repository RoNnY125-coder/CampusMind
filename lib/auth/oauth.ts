const DEFAULT_AUTH_REDIRECT_PATH = "/onboard";
const OAUTH_NEXT_COOKIE = "cm-oauth-next";

function isLocalhostHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function normalizeAuthRedirectPath(path?: string | null) {
  if (!path) return DEFAULT_AUTH_REDIRECT_PATH;
  return path.startsWith("/") ? path : `/${path}`;
}

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (typeof window !== "undefined") {
    const currentOrigin = window.location.origin;
    const currentUrl = new URL(currentOrigin);

    if (isLocalhostHost(currentUrl.hostname)) {
      return currentOrigin;
    }

    return configured || currentOrigin;
  }

  return configured || "http://localhost:3000";
}

export function getOAuthCallbackUrl() {
  return new URL("/auth/callback", getSiteUrl()).toString();
}

export function persistOAuthRedirectPath(path?: string | null) {
  if (typeof document === "undefined") return;

  const nextPath = encodeURIComponent(normalizeAuthRedirectPath(path));
  document.cookie = `${OAUTH_NEXT_COOKIE}=${nextPath}; Path=/; Max-Age=600; SameSite=Lax`;
}

export function clearOAuthRedirectPath() {
  if (typeof document === "undefined") return;

  document.cookie = `${OAUTH_NEXT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getOAuthRedirectCookieName() {
  return OAUTH_NEXT_COOKIE;
}

export function getOAuthErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Google sign-in failed. Please try again.";
}
