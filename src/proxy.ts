import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { inquiryOpenStamp } from "@/domain/inquiry";
import { copySetCookies } from "@/domain/session";

function stampInquiry(request: NextRequest, response: NextResponse) {
  if (request.nextUrl.pathname !== "/richiesta") return response;
  response.cookies.set(
    "inquiry_opened",
    inquiryOpenStamp(request.cookies.get("inquiry_opened")?.value, Date.now()),
    { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 },
  );
  return response;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    if (path.startsWith("/app")) {
      const login = request.nextUrl.clone();
      login.pathname = "/login";
      return NextResponse.redirect(login);
    }
    return stampInquiry(request, NextResponse.next());
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  if (path.startsWith("/app") && !data.user) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    const redirect = NextResponse.redirect(login);
    copySetCookies(response.headers.getSetCookie(), redirect.headers);
    return redirect;
  }
  if (path === "/login" && data.user) {
    const app = request.nextUrl.clone();
    app.pathname = "/app";
    const redirect = NextResponse.redirect(app);
    copySetCookies(response.headers.getSetCookie(), redirect.headers);
    return redirect;
  }
  return stampInquiry(request, response);
}

export const config = {
  matcher: ["/app/:path*", "/login", "/richiesta"],
};
