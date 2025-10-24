import test from "node:test";
import assert from "node:assert/strict";
import { normalizeWhopEvent, getEventLabel } from "@/lib/automations/events";

test("normalizeWhopEvent returns canonical codes", () => {
  assert.equal(normalizeWhopEvent("payment_failed"), "payment_failed");
  assert.equal(normalizeWhopEvent("PAYMENT.SUCCEEDED"), "payment_succeeded");
  assert.equal(normalizeWhopEvent("membership_went_invalid"), "membership_went_invalid");
});

test("normalizeWhopEvent rejects unknown codes", () => {
  assert.equal(normalizeWhopEvent("unknown_event"), null);
});

test("getEventLabel provides human readable labels", () => {
  assert.equal(getEventLabel("payment_failed"), "Payment failed");
  assert.equal(getEventLabel("membership_went_valid"), "Membership became valid");
});
