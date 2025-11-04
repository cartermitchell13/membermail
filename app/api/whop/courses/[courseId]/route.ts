import { NextRequest } from "next/server";
import { fetchCourseStructure } from "@/lib/whop/course";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  if (!courseId) {
    return new Response("courseId is required", { status: 400 });
  }

  try {
    const course = await fetchCourseStructure(courseId);
    if (!course) {
      return new Response("Course not found", { status: 404 });
    }
    return Response.json({ course });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(`Failed to load course: ${message}`, { status: 500 });
  }
}
