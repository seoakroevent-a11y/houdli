import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "./env";

export async function updateAdminSession(request: NextRequest) {
  const env = supabaseEnv();
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";

  if (!env) {
    if (isLogin) {
      const response = NextResponse.next();
      response.headers.set("x-robots-tag", "noindex, nofollow");
      return response;
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    isAdmin = profile?.role === "admin";
  }

  if (!user || !isAdmin) {
    if (isLogin) {
      response.headers.set("x-robots-tag", "noindex, nofollow");
      return response;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    if (user && !isAdmin) url.searchParams.set("error", "forbidden");
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  if (isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}
