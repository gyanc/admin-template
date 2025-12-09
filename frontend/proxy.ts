import { NextResponse, NextRequest } from "next/server";
import { publicRoutes, authRoutes } from "./lib/navigation";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isApi = pathname.startsWith("/api");
  const isNextAsset = pathname.startsWith("/_next");
  if (isApi || isNextAsset) {
    return NextResponse.next();
  }

  const isPublic = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const accessToken = req.cookies.get("access_token")?.value;

  if (!isPublic && !accessToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && accessToken) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - assets (asset files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public|assets).*)",
  ],
};
