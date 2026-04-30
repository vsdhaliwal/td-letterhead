import { NextRequest, NextResponse } from "next/server";

function unauthorizedResponse() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Tax Deliver Letterhead Tool"',
      "Cache-Control": "no-store",
    },
  });
}

export function proxy(request: NextRequest) {
  const configuredPassword = process.env.APP_ACCESS_PASSWORD;
  const configuredUsername = process.env.APP_ACCESS_USERNAME || "team";

  // If no password is configured, keep the app accessible.
  if (!configuredPassword) {
    return NextResponse.next();
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

  if (username !== configuredUsername || password !== configuredPassword) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Protect all app/api routes, skip Next internals and static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
