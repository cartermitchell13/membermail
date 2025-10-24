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
  | "refund_created"
  | "refund_updated";

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
    ],
    label: "Membership cancellation updated",
  },
  {
    code: "membership_experience_claimed",
    aliases: ["membership_experience_claimed"],
    label: "Experience claimed",
  },
  {
    code: "membership_metadata_updated",
    aliases: ["membership_metadata_updated"],
    label: "Membership metadata updated",
  },
  {
    code: "membership_went_invalid",
    aliases: ["membership_went_invalid"],
    label: "Membership became invalid",
  },
  {
    code: "membership_went_valid",
    aliases: ["membership_went_valid"],
    label: "Membership became valid",
  },
  {
    code: "payment_failed",
    aliases: ["payment_failed", "payment.failed"],
    label: "Payment failed",
  },
  {
    code: "payment_pending",
    aliases: ["payment_pending", "payment.pending"],
    label: "Payment pending",
  },
  {
    code: "payment_succeeded",
    aliases: ["payment_succeeded", "payment.succeeded"],
    label: "Payment succeeded",
  },
  {
    code: "refund_created",
    aliases: ["refund_created", "refund.created"],
    label: "Refund created",
  },
  {
    code: "refund_updated",
    aliases: ["refund_updated", "refund.updated"],
    label: "Refund updated",
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
