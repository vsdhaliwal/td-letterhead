import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "letterhead_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function unauthorizedResponse() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Tax Deliver Letterhead Tool"',
      "Cache-Control": "no-store",
    },
  });
}

function credentialsMatch(
  username: string,
  password: string,
  expectedUsername: string,
  expectedPassword: string,
): boolean {
  return username === expectedUsername && password === expectedPassword;
}

function createSessionValue(username: string, password: string): string {
  return btoa(`${username}:${password}`)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function readSessionValue(
  value: string,
  expectedUsername: string,
  expectedPassword: string,
): boolean {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4;
    const base64 = pad ? padded + "=".repeat(4 - pad) : padded;
    const decoded = atob(base64);
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex < 0) return false;
    const username = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);
    return credentialsMatch(
      username,
      password,
      expectedUsername,
      expectedPassword,
    );
  } catch {
    return false;
  }
}

function readCredentialsFromQuery(request: NextRequest): {
  username: string;
  password: string;
} | null {
  const username =
    request.nextUrl.searchParams.get("user") ??
    request.nextUrl.searchParams.get("username");
  const password =
    request.nextUrl.searchParams.get("pass") ??
    request.nextUrl.searchParams.get("password");

  if (!username || !password) return null;
  return { username, password };
}

function redirectWithoutAuthParams(request: NextRequest): NextResponse {
  const cleanUrl = request.nextUrl.clone();
  cleanUrl.searchParams.delete("user");
  cleanUrl.searchParams.delete("pass");
  cleanUrl.searchParams.delete("username");
  cleanUrl.searchParams.delete("password");
  return NextResponse.redirect(cleanUrl);
}

function setSessionCookie(response: NextResponse, username: string, password: string) {
  response.cookies.set(SESSION_COOKIE, createSessionValue(username, password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export function proxy(request: NextRequest) {
  const configuredPassword = process.env.APP_ACCESS_PASSWORD;
  const configuredUsername = process.env.APP_ACCESS_USERNAME || "team";

  // If no password is configured, keep the app accessible.
  if (!configuredPassword) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (
    sessionCookie &&
    readSessionValue(sessionCookie, configuredUsername, configuredPassword)
  ) {
    return NextResponse.next();
  }

  const queryCredentials = readCredentialsFromQuery(request);
  if (queryCredentials) {
    if (
      credentialsMatch(
        queryCredentials.username,
        queryCredentials.password,
        configuredUsername,
        configuredPassword,
      )
    ) {
      const response = redirectWithoutAuthParams(request);
      setSessionCookie(
        response,
        queryCredentials.username,
        queryCredentials.password,
      );
      return response;
    }
    return unauthorizedResponse();
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return unauthorizedResponse();
  }

  const base64Credentials = authHeader.slice("Basic ".length);
  let decoded = "";
  try {
    decoded = atob(base64Credentials);
  } catch {
    return unauthorizedResponse();
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex < 0) {
    return unauthorizedResponse();
  }

  const username = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  if (!credentialsMatch(username, password, configuredUsername, configuredPassword)) {
    return unauthorizedResponse();
  }

  const response = NextResponse.next();
  setSessionCookie(response, username, password);
  return response;
}

export const config = {
  matcher: [
    /*
     * Protect all app/api routes, skip Next internals and static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
