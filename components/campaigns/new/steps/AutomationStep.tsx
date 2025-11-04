"use client";

import { useEffect, useMemo, useState } from "react";
import { useCampaignComposer } from "../CampaignComposerProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SUPPORTED_AUTOMATION_EVENTS, getEventLabel, isCourseAutomationEvent } from "@/lib/automations/events";
import type { AutomationTriggerEvent } from "@/lib/automations/events";
import { cn } from "@/lib/ui/cn";
import { Select, type SelectOption } from "@/components/ui/select";
import type { CourseStructure, CourseSummary } from "@/lib/whop/course";
import type { CourseStepMetadata } from "@/lib/automations/course/types";

const DELAY_UNITS: { value: "minutes" | "hours" | "days"; label: string }[] = [
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
];

export default function AutomationStep() {
  const {
    currentStep,
    sendMode,
    setSendMode,
    triggerEvent,
    setTriggerEvent,
    triggerDelayValue,
    setTriggerDelayValue,
    triggerDelayUnit,
    setTriggerDelayUnit,
    automationStatus,
    setAutomationStatus,
    automationSequenceId,
    automationTriggerMetadata,
    setAutomationTriggerMetadata,
  } = useCampaignComposer();

  // Define these early, before any hooks or early returns
  const eventCode = triggerEvent as AutomationTriggerEvent | null;
  const isCourseTrigger = useMemo(() => (eventCode ? isCourseAutomationEvent(eventCode) : false), [eventCode]);

  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [courseStructure, setCourseStructure] = useState<CourseStructure | null>(null);
  const [courseStructureLoading, setCourseStructureLoading] = useState(false);
  const [courseStructureError, setCourseStructureError] = useState<string | null>(null);

  const selectedCourseId = automationTriggerMetadata?.courseId ?? "";
  const selectedChapterId = automationTriggerMetadata?.chapterId ?? "";
  const selectedLessonId = automationTriggerMetadata?.lessonId ?? "";

  const requiresLesson = useMemo(() => {
    if (!eventCode) return false;
    return (
      eventCode === "course_lesson_started" ||
      eventCode === "course_lesson_completed" ||
      eventCode === "course_lesson_not_started_after_x_days"
    );
  }, [eventCode]);

  const requiresChapter = useMemo(() => {
    if (!eventCode) return false;
    return requiresLesson || eventCode === "course_chapter_completed";
  }, [eventCode, requiresLesson]);

  const requiresWaitDays = eventCode === "course_lesson_not_started_after_x_days";

  useEffect(() => {
    if (sendMode === "automation" && !triggerEvent) {
      setTriggerEvent(SUPPORTED_AUTOMATION_EVENTS[0]?.code ?? null);
      setAutomationStatus("active");
    }
    if (sendMode === "manual") {
      setAutomationStatus("draft");
    }
  }, [sendMode, triggerEvent, setTriggerEvent, setAutomationStatus]);

  useEffect(() => {
    if (!isCourseTrigger || !eventCode) {
      return;
    }
    setAutomationTriggerMetadata((prev) => {
      if (!prev) {
        return {
          courseId: "",
          courseTitle: null,
          chapterId: null,
          chapterTitle: null,
          lessonId: null,
          lessonTitle: null,
          triggerKind: eventCode,
          waitDays: requiresWaitDays ? 3 : null,
        } satisfies CourseStepMetadata;
      }
      let changed = false;
      const next: CourseStepMetadata = { ...prev };
      if (next.triggerKind !== eventCode) {
        next.triggerKind = eventCode;
        changed = true;
      }
      if (requiresWaitDays) {
        const desired = next.waitDays && next.waitDays > 0 ? next.waitDays : 3;
        if (next.waitDays !== desired) {
          next.waitDays = desired;
          changed = true;
        }
      } else if (next.waitDays) {
        next.waitDays = null;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [eventCode, isCourseTrigger, requiresWaitDays, setAutomationTriggerMetadata]);

  useEffect(() => {
    if (!isCourseTrigger) {
      return;
    }
    if (courses.length > 0) {
      return;
    }
    let ignore = false;
    setCoursesLoading(true);
    setCoursesError(null);
    fetch(`/api/whop/courses`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load courses");
        }
        return res.json();
      })
      .then((data) => {
        if (ignore) return;
        const entries = Array.isArray(data?.courses) ? (data.courses as CourseSummary[]) : [];
        setCourses(entries);
      })
      .catch((error) => {
        if (ignore) return;
        setCourses([]);
        setCoursesError(error instanceof Error ? error.message : "Failed to load courses");
      })
      .finally(() => {
        if (!ignore) setCoursesLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [isCourseTrigger, courses.length]);

  useEffect(() => {
    if (!isCourseTrigger) {
      setCourseStructure(null);
      setCourseStructureError(null);
      return;
    }
    if (!selectedCourseId) {
      setCourseStructure(null);
      setCourseStructureError(null);
      return;
    }
    let ignore = false;
    setCourseStructureLoading(true);
    setCourseStructureError(null);
    fetch(`/api/whop/courses/${encodeURIComponent(selectedCourseId)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load course structure");
        }
        return res.json();
      })
      .then((data) => {
        if (ignore) return;
        setCourseStructure(data?.course ?? null);
      })
      .catch((error) => {
        if (ignore) return;
        setCourseStructure(null);
        setCourseStructureError(error instanceof Error ? error.message : "Failed to load course");
      })
      .finally(() => {
        if (!ignore) setCourseStructureLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [isCourseTrigger, selectedCourseId]);

  useEffect(() => {
    if (!isCourseTrigger) return;
    if (!automationTriggerMetadata || !automationTriggerMetadata.courseId) return;
    const course = courses.find((item) => item.id === automationTriggerMetadata.courseId);
    if (!course) return;
    setAutomationTriggerMetadata((prev) => {
      if (!prev || prev.courseId !== course.id) return prev;
      if (prev.courseTitle === (course.title ?? null)) return prev;
      return { ...prev, courseTitle: course.title ?? null };
    });
  }, [automationTriggerMetadata, courses, isCourseTrigger, setAutomationTriggerMetadata]);

  useEffect(() => {
    if (!isCourseTrigger) return;
    if (!courseStructure) return;
    setAutomationTriggerMetadata((prev) => {
      if (!prev || prev.courseId !== courseStructure.id) return prev;
      let changed = false;
      const next: CourseStepMetadata = { ...prev };
      if (next.courseTitle !== (courseStructure.title ?? null)) {
        next.courseTitle = courseStructure.title ?? null;
        changed = true;
      }
      if (next.chapterId) {
        const chapter = courseStructure.chapters.find((c) => c.id === next.chapterId);
        if (!chapter) {
          next.chapterId = null;
          next.chapterTitle = null;
          next.lessonId = null;
          next.lessonTitle = null;
          changed = true;
        } else if (next.chapterTitle !== chapter.title) {
          next.chapterTitle = chapter.title;
          changed = true;
        }
      }
      if (next.lessonId) {
        const lessonEntry = courseStructure.chapters
          .flatMap((chapter) => chapter.lessons.map((lesson) => ({ lesson, chapter })))
          .find((entry) => entry.lesson.id === next.lessonId);
        if (!lessonEntry) {
          next.lessonId = null;
          next.lessonTitle = null;
          changed = true;
        } else {
          if (next.lessonTitle !== lessonEntry.lesson.title) {
            next.lessonTitle = lessonEntry.lesson.title;
            changed = true;
          }
          if (next.chapterId !== lessonEntry.chapter.id) {
            next.chapterId = lessonEntry.chapter.id;
            next.chapterTitle = lessonEntry.chapter.title;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [courseStructure, isCourseTrigger, setAutomationTriggerMetadata]);

  if (currentStep !== 3) return null;

  const isAutomation = sendMode === "automation";

  const courseOptions: SelectOption[] = useMemo(
    () => courses.map((course) => ({ value: course.id, label: course.title ?? course.id })),
    [courses],
  );

  const chapterOptions: SelectOption[] = useMemo(() => {
    if (!courseStructure) return [];
    return courseStructure.chapters
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((chapter) => ({ value: chapter.id, label: chapter.title }));
  }, [courseStructure]);

  const lessonOptions: SelectOption[] = useMemo(() => {
    if (!courseStructure || !selectedChapterId) return [];
    const chapter = courseStructure.chapters.find((item) => item.id === selectedChapterId);
    if (!chapter) return [];
    return chapter.lessons
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((lesson) => ({ value: lesson.id, label: lesson.title }));
  }, [courseStructure, selectedChapterId]);

  const handleCourseSelect = (value: string) => {
    if (!eventCode) return;
    const course = courses.find((item) => item.id === value);
    const preservedWaitDays = requiresWaitDays
      ? automationTriggerMetadata && automationTriggerMetadata.waitDays && automationTriggerMetadata.waitDays > 0
        ? automationTriggerMetadata.waitDays
        : 3
      : null;
    setAutomationTriggerMetadata({
      courseId: value,
      courseTitle: course?.title ?? null,
      chapterId: null,
      chapterTitle: null,
      lessonId: null,
      lessonTitle: null,
      triggerKind: eventCode,
      waitDays: preservedWaitDays,
    });
  };

  const handleChapterSelect = (value: string) => {
    setAutomationTriggerMetadata((prev) => {
      if (!prev) return prev;
      const chapter = courseStructure?.chapters.find((item) => item.id === value) ?? null;
      const next: CourseStepMetadata = {
        ...prev,
        chapterId: value || null,
        chapterTitle: chapter?.title ?? null,
      };
      if (eventCode) {
        next.triggerKind = eventCode;
      }
      if (!value) {
        next.lessonId = null;
        next.lessonTitle = null;
      }
      return next;
    });
  };

  const handleLessonSelect = (value: string) => {
    setAutomationTriggerMetadata((prev) => {
      if (!prev) return prev;
      if (!value) {
        if (!prev.lessonId) return prev;
        const cleared: CourseStepMetadata = { ...prev, lessonId: null, lessonTitle: null };
        if (eventCode) {
          cleared.triggerKind = eventCode;
        }
        return cleared;
      }
      const entry = courseStructure?.chapters
        .flatMap((chapter) => chapter.lessons.map((lesson) => ({ lesson, chapter })))
        .find((item) => item.lesson.id === value);
      if (!entry) {
        return prev;
      }
      return {
        ...prev,
        chapterId: entry.chapter.id,
        chapterTitle: entry.chapter.title,
        lessonId: value,
        lessonTitle: entry.lesson.title,
        triggerKind: eventCode ?? prev.triggerKind,
      };
    });
  };

  const handleWaitDaysChange = (value: string) => {
    const numeric = Number.parseInt(value, 10);
    setAutomationTriggerMetadata((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        waitDays: Number.isNaN(numeric) ? null : Math.max(1, numeric),
      };
    });
  };

  const waitDaysValue = automationTriggerMetadata?.waitDays ?? (requiresWaitDays ? 3 : null);

  const handleModeSelect = (mode: "manual" | "automation") => {
    if (automationSequenceId && mode === "manual") return;
    setSendMode(mode);
    if (mode === "manual") {
      setTriggerEvent(null);
      setTriggerDelayValue(0);
      setTriggerDelayUnit("minutes");
      setAutomationStatus("draft");
    } else if (!triggerEvent) {
      setTriggerEvent(SUPPORTED_AUTOMATION_EVENTS[0]?.code ?? null);
      setAutomationStatus("active");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#111111]">
      <div className="mx-auto w-full max-w-5xl px-6 py-10 space-y-8">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-white">Delivery & Automation</h2>
          <p className="text-white/60 text-base">
            Choose how this campaign is delivered. Automations trigger emails based on Whop events and scheduling rules.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card
            className={cn(
              "transition-all",
              sendMode === "manual" ? "border-[#FA4616]/40 bg-[#FA4616]/5 ring-1 ring-[#FA4616]/30" : "hover:border-white/20",
              automationSequenceId ? "opacity-60" : undefined,
            )}
          >
            <button
              type="button"
              onClick={() => handleModeSelect("manual")}
              className="w-full text-left disabled:cursor-not-allowed disabled:opacity-60"
              disabled={Boolean(automationSequenceId)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  Manual send
                  {sendMode === "manual" && (
                    <span className="rounded-full bg-[#FA4616]/20 px-3 py-1 text-xs font-medium text-[#FA4616]">
                      Selected
                    </span>
                  )}
                </CardTitle>
                <p className="text-sm text-white/60">
                  Schedule and send this campaign manually. Perfect for one-off announcements and newsletters.
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-white/50">
                  {automationSequenceId ? "Managed by your automation sequence" : "Manual emails send when you trigger them."}
                </p>
              </CardContent>
            </button>
          </Card>

          <Card
            className={cn(
              "transition-all",
              isAutomation ? "border-[#FA4616]/40 bg-[#FA4616]/5 ring-1 ring-[#FA4616]/30" : "hover:border-white/20",
              automationSequenceId ? "opacity-60" : undefined,
            )}
          >
            <button
              type="button"
              onClick={() => handleModeSelect("automation")}
              className="w-full text-left disabled:cursor-not-allowed disabled:opacity-60"
              disabled={Boolean(automationSequenceId)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  Automation
                  {isAutomation && (
                    <span className="rounded-full bg-[#FA4616]/20 px-3 py-1 text-xs font-medium text-[#FA4616]">
                      Selected
                    </span>
                  )}
                </CardTitle>
                <p className="text-sm text-white/60">
                  Deliver automatically when Whop events fire—ideal for lifecycle sequences, win-backs, and dunning flows.
                </p>
              </CardHeader>
            </button>
          </Card>
        </div>

        {isAutomation && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-white">Trigger event</CardTitle>
                <p className="text-sm text-white/60">
                  Pick the Whop event that should start this automation.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {SUPPORTED_AUTOMATION_EVENTS.map((event) => {
                    const isSelected = triggerEvent === event.code;
                    return (
                      <button
                        key={event.code}
                        type="button"
                        onClick={() => setTriggerEvent(event.code)}
                        className={cn(
                          "rounded-lg border px-4 py-3 text-left transition-all",
                          isSelected
                            ? "border-[#FA4616] bg-[#FA4616]/10 text-white shadow-[#FA4616]/10 shadow"
                            : "border-white/10 text-white/80 hover:border-white/30 hover:text-white",
                        )}
                      >
                        <div className="text-sm font-semibold">{event.label}</div>
                        <div className="mt-1 text-xs text-white/40">{event.code}</div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {isAutomation && isCourseTrigger && (
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Course trigger settings</CardTitle>
                  <p className="text-sm text-white/60">
                    Choose which course activity should fire this automation step.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide text-white/40">Course (required)</div>
                    {coursesLoading ? (
                      <p className="text-xs text-white/60">Loading courses…</p>
                    ) : courseOptions.length > 0 ? (
                      <Select
                        value={selectedCourseId}
                        onChange={handleCourseSelect}
                        options={courseOptions}
                        placeholder="Select a course"
                      />
                    ) : (
                      <p className="text-xs text-white/50">No courses available for this company.</p>
                    )}
                    {coursesError && <p className="text-xs text-red-300">{coursesError}</p>}
                  </div>

                  {selectedCourseId && (
                    <>
                      <div className="space-y-1">
                        <div className="text-xs uppercase tracking-wide text-white/40">
                          Chapter {requiresChapter ? "(required)" : "(optional)"}
                        </div>
                        {courseStructureLoading ? (
                          <p className="text-xs text-white/60">Loading chapters…</p>
                        ) : courseStructureError ? (
                          <p className="text-xs text-red-300">{courseStructureError}</p>
                        ) : chapterOptions.length > 0 ? (
                          <Select
                            value={selectedChapterId}
                            onChange={handleChapterSelect}
                            options={chapterOptions}
                            placeholder={requiresChapter ? "Select a chapter" : "Select a chapter (optional)"}
                          />
                        ) : (
                          <p className="text-xs text-white/50">This course has no chapters yet.</p>
                        )}
                      </div>

                      {requiresLesson && (
                        <div className="space-y-1">
                          <div className="text-xs uppercase tracking-wide text-white/40">Lesson (required)</div>
                          {courseStructureLoading ? (
                            <p className="text-xs text-white/60">Loading lessons…</p>
                          ) : lessonOptions.length > 0 ? (
                            <Select
                              value={selectedLessonId}
                              onChange={handleLessonSelect}
                              options={lessonOptions}
                              placeholder={selectedChapterId ? "Select a lesson" : "Select a chapter first"}
                            />
                          ) : (
                            <p className="text-xs text-white/50">
                              {selectedChapterId
                                ? "This chapter does not contain any lessons yet."
                                : "Select a chapter to choose a lesson."}
                            </p>
                          )}
                        </div>
                      )}

                      {requiresWaitDays && (
                        <div className="space-y-1">
                          <div className="text-xs uppercase tracking-wide text-white/40">Wait days</div>
                          <Input
                            type="number"
                            min={1}
                            value={waitDaysValue ?? ""}
                            onChange={(event) => handleWaitDaysChange(event.target.value)}
                            className="bg-white/5 text-white border-white/10 w-32"
                          />
                          <p className="text-xs text-white/50">
                            We will trigger this automation if the selected lesson is still untouched after the chosen number of days.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-white">Send timing</CardTitle>
                  <p className="text-sm text-white/60">
                    Delay the send after the trigger event fires.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={0}
                        value={triggerDelayValue}
                        onChange={(event) => {
                          const next = Number.parseInt(event.target.value, 10);
                          setTriggerDelayValue(Number.isNaN(next) ? 0 : Math.max(0, next));
                        }}
                        className="bg-white/5 text-white border-white/10"
                      />
                      <select
                        value={triggerDelayUnit}
                        onChange={(event) => setTriggerDelayUnit(event.target.value as typeof triggerDelayUnit)}
                        className="rounded-md border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FA4616]"
                      >
                        {DELAY_UNITS.map((unit) => (
                          <option key={unit.value} value={unit.value}>
                            {unit.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-white/50">
                      Emails will queue immediately when the event arrives and respect quiet hours before delivery.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-white">Automation status</CardTitle>
                  <p className="text-sm text-white/60">
                    Pause automations without deleting your configuration.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="inline-flex rounded-md border border-white/10 bg-white/5 p-1">
                    <Button
                      type="button"
                      variant={automationStatus === "active" ? "default" : "ghost"}
                      onClick={() => setAutomationStatus("active")}
                      className={cn(
                        automationStatus === "active"
                          ? "bg-[#FA4616] text-white hover:bg-[#FA4616]/90"
                          : "text-white/70 hover:text-white",
                      )}
                    >
                      Active
                    </Button>
                    <Button
                      type="button"
                      variant={automationStatus === "paused" ? "default" : "ghost"}
                      onClick={() => setAutomationStatus("paused")}
                      className={cn(
                        automationStatus === "paused"
                          ? "bg-white/10 text-white hover:bg-white/20"
                          : "text-white/70 hover:text-white",
                      )}
                    >
                      Paused
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-white/50">
                    When paused, incoming events are ignored until you reactivate.
                  </p>
                </CardContent>
              </Card>
            </div>

            {triggerEvent && (
              <Card className="border-white/20 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Automation summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-white/70">
                  <p>
                    <span className="text-white">Trigger:</span>{" "}
                    {getEventLabel(triggerEvent as AutomationTriggerEvent)} ({triggerEvent})
                  </p>
                  <p>
                    <span className="text-white">Initial delay:</span> {triggerDelayValue} {triggerDelayUnit}
                  </p>
                  <p>
                    <span className="text-white">Status:</span> {automationStatus === "active" ? "Active" : "Paused"}
                  </p>
                  {isCourseTrigger && automationTriggerMetadata?.courseId && (
                    <p>
                      <span className="text-white">Course:</span> {automationTriggerMetadata.courseTitle ?? automationTriggerMetadata.courseId}
                    </p>
                  )}
                  {isCourseTrigger && automationTriggerMetadata?.chapterId && (
                    <p>
                      <span className="text-white">Chapter:</span> {automationTriggerMetadata.chapterTitle ?? automationTriggerMetadata.chapterId}
                    </p>
                  )}
                  {isCourseTrigger && automationTriggerMetadata?.lessonId && (
                    <p>
                      <span className="text-white">Lesson:</span> {automationTriggerMetadata.lessonTitle ?? automationTriggerMetadata.lessonId}
                    </p>
                  )}
                  {requiresWaitDays && automationTriggerMetadata?.waitDays && (
                    <p>
                      <span className="text-white">Lesson not started after:</span> {automationTriggerMetadata.waitDays} day(s)
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}






