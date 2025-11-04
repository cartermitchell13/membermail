export type AutomationTriggerEvent =
  | "member.created"
  | "access_pass.removed"
  | "membership_cancel_at_period_end_changed"
  | "membership_experience_claimed"
  | "membership_metadata_updated"
  | "membership_went_invalid"
  | "membership_went_valid"
  | "payment_failed"
  | "payment_pending"
  | "payment_succeeded"
  | "payment_affiliate_reward_created"
  | "refund_created"
  | "refund_updated"
  | "dispute_created"
  | "dispute_updated"
  | "dispute_alert_created"
  | "resolution_created"
  | "resolution_updated"
  | "resolution_decided"
  | "app_membership_cancel_at_period_end_changed"
  | "app_membership_went_invalid"
  | "app_membership_went_valid"
  | "app_payment_failed"
  | "app_payment_pending"
  | "app_payment_succeeded"
  | "course_lesson_started"
  | "course_lesson_completed"
  | "course_chapter_completed"
  | "course_started"
  | "course_completed"
  | "course_lesson_not_started_after_x_days";

type EventDefinition = {
  code: AutomationTriggerEvent;
  aliases: string[];
  label: string;
};

const EVENT_DEFINITIONS: EventDefinition[] = [
  {
    code: "member.created",
    aliases: ["member.created", "member_created"],
    label: "New member joined",
  },
  {
    code: "access_pass.removed",
    aliases: ["access_pass.removed", "access_pass_removed"],
    label: "Member access removed",
  },
  {
    code: "membership_cancel_at_period_end_changed",
    aliases: [
      "membership_cancel_at_period_end_changed",
      "membership.cancel_at_period_end.changed",
      "membership_cancellation_changed",
    ],
    label: "Membership Cancellation Changed",
  },
  {
    code: "membership_experience_claimed",
    aliases: ["membership_experience_claimed"],
    label: "Membership Experience Claimed",
  },
  {
    code: "membership_metadata_updated",
    aliases: ["membership_metadata_updated"],
    label: "Membership Metadata Updated",
  },
  {
    code: "membership_went_invalid",
    aliases: ["membership_went_invalid", "membership.went_invalid", "membership_expired"],
    label: "Membership Expired",
  },
  {
    code: "membership_went_valid",
    aliases: ["membership_went_valid", "membership.went_valid", "membership_activated"],
    label: "Membership Activated",
  },
  {
    code: "payment_failed",
    aliases: ["payment_failed", "payment.failed"],
    label: "Payment Failed",
  },
  {
    code: "payment_pending",
    aliases: ["payment_pending", "payment.pending"],
    label: "Payment Pending",
  },
  {
    code: "payment_succeeded",
    aliases: ["payment_succeeded", "payment.succeeded"],
    label: "Payment Successful",
  },
  {
    code: "payment_affiliate_reward_created",
    aliases: ["payment_affiliate_reward_created", "payment.affiliate_reward.created"],
    label: "Affiliate Reward Created",
  },
  {
    code: "refund_created",
    aliases: ["refund_created", "refund.created"],
    label: "Refund Created",
  },
  {
    code: "refund_updated",
    aliases: ["refund_updated", "refund.updated"],
    label: "Refund Updated",
  },
  {
    code: "dispute_created",
    aliases: ["dispute_created", "dispute.created"],
    label: "Dispute Created",
  },
  {
    code: "dispute_updated",
    aliases: ["dispute_updated", "dispute.updated"],
    label: "Dispute Updated",
  },
  {
    code: "dispute_alert_created",
    aliases: ["dispute_alert_created", "dispute.alert_created"],
    label: "Dispute Alert Created",
  },
  {
    code: "resolution_created",
    aliases: ["resolution_created", "resolution.created"],
    label: "Resolution Created",
  },
  {
    code: "resolution_updated",
    aliases: ["resolution_updated", "resolution.updated"],
    label: "Resolution Updated",
  },
  {
    code: "resolution_decided",
    aliases: ["resolution_decided", "resolution.decided"],
    label: "Resolution Decided",
  },
  {
    code: "app_membership_cancel_at_period_end_changed",
    aliases: [
      "app_membership_cancel_at_period_end_changed",
      "app.membership_cancel_at_period_end_changed",
      "app_membership_cancellation_changed",
    ],
    label: "App: Membership Cancellation Changed",
  },
  {
    code: "app_membership_went_invalid",
    aliases: ["app_membership_went_invalid", "app.membership_went_invalid"],
    label: "App: Membership Expired",
  },
  {
    code: "app_membership_went_valid",
    aliases: ["app_membership_went_valid", "app.membership_went_valid"],
    label: "App: Membership Activated",
  },
  {
    code: "app_payment_failed",
    aliases: ["app_payment_failed", "app.payment_failed"],
    label: "App: Payment Failed",
  },
  {
    code: "app_payment_pending",
    aliases: ["app_payment_pending", "app.payment_pending"],
    label: "App: Payment Pending",
  },
  {
    code: "app_payment_succeeded",
    aliases: ["app_payment_succeeded", "app.payment_succeeded"],
    label: "App: Payment Successful",
  },
  {
    code: "course_lesson_started",
    aliases: ["course_lesson_started", "course.lesson_started"],
    label: "Course: Lesson Started",
  },
  {
    code: "course_lesson_completed",
    aliases: [
      "course_lesson_completed",
      "course.lesson_completed",
      "course_lesson_interaction.completed",
    ],
    label: "Course: Lesson Completed",
  },
  {
    code: "course_chapter_completed",
    aliases: ["course_chapter_completed", "course.chapter_completed"],
    label: "Course: Chapter Completed",
  },
  {
    code: "course_started",
    aliases: ["course_started", "course.started"],
    label: "Course: Course Started",
  },
  {
    code: "course_completed",
    aliases: ["course_completed", "course.completed"],
    label: "Course: Course Completed",
  },
  {
    code: "course_lesson_not_started_after_x_days",
    aliases: [
      "course_lesson_not_started_after_x_days",
      "course.lesson_not_started_after_x_days",
    ],
    label: "Course: Lesson Not Started (After X Days)",
  },
];

const ALIAS_LOOKUP: Record<string, AutomationTriggerEvent> = EVENT_DEFINITIONS.reduce(
  (acc, definition) => {
    definition.aliases.forEach((alias) => {
      acc[alias.toLowerCase()] = definition.code;
    });
    return acc;
  },
  {} as Record<string, AutomationTriggerEvent>,
);

const EVENT_LABELS: Record<AutomationTriggerEvent, string> = EVENT_DEFINITIONS.reduce(
  (acc, definition) => {
    acc[definition.code] = definition.label;
    return acc;
  },
  {} as Record<AutomationTriggerEvent, string>,
);

export function normalizeWhopEvent(action: string | null | undefined): AutomationTriggerEvent | null {
  if (!action) return null;
  const normalized = action.toLowerCase();
  return ALIAS_LOOKUP[normalized] ?? null;
}

export function getEventLabel(event: AutomationTriggerEvent): string {
  return EVENT_LABELS[event];
}

export const SUPPORTED_AUTOMATION_EVENTS = EVENT_DEFINITIONS.map((definition) => ({
  code: definition.code,
  label: definition.label,
}));

export const COURSE_AUTOMATION_EVENTS = new Set<AutomationTriggerEvent>([
  "course_lesson_started",
  "course_lesson_completed",
  "course_chapter_completed",
  "course_started",
  "course_completed",
  "course_lesson_not_started_after_x_days",
]);

export function isCourseAutomationEvent(event: AutomationTriggerEvent): boolean {
  return COURSE_AUTOMATION_EVENTS.has(event);
}
