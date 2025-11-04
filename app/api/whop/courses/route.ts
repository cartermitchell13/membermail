import { NextRequest } from "next/server";
import { listCompanyCourses } from "@/lib/whop/course";

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams;
    const companyId =
      search.get("companyId") ?? process.env.NEXT_PUBLIC_WHOP_COMPANY_ID ?? undefined;

    if (!companyId) {
      return Response.json({ courses: [] });
    }

    const courses = await listCompanyCourses(companyId);
    return Response.json({ courses });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(`Failed to load courses: ${message}`, { status: 500 });
  }
}
