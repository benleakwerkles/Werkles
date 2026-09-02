import assert from "node:assert/strict";

import { storeMemberIntake } from "../../lib/squibb/member-intake-custody.ts";
import { EMPTY_INTAKE_ANSWERS } from "../../lib/squibb/concierge-intake-v0.ts";

const userId = "11111111-1111-4111-8111-111111111111";
const clientSubmissionId = "22222222-2222-4222-8222-222222222222";
const capturedAt = "2026-08-21T04:00:00.000Z";
let inserted: Record<string, unknown> | null = null;

const supabase = {
  from(table: string) {
    assert.equal(table, "member_concierge_intakes");
    return {
      insert(payload: Record<string, unknown>) {
        inserted = payload;
        return {
          select() {
            return {
              async single() {
                return {
                  data: {
                    intake_id: payload.intake_id,
                    client_submission_id: payload.client_submission_id,
                    captured_at: capturedAt,
                    answers: payload.answers
                  },
                  error: null
                };
              }
            };
          }
        };
      }
    };
  }
};

const answers = {
  ...EMPTY_INTAKE_ANSWERS,
  heaviest_lift: "Make a repair service steadier."
};

async function main() {
const result = await storeMemberIntake({
  supabase: supabase as never,
  userId,
  clientSubmissionId,
  answers
});
assert.equal(result.capturedAt, capturedAt);
assert.ok(inserted);
assert.deepEqual(Object.keys(inserted).sort(), ["answers", "client_submission_id", "intake_id"]);
assert.equal("user_id" in inserted, false);
assert.equal("captured_at" in inserted, false);

await assert.rejects(
  storeMemberIntake({
    supabase: supabase as never,
    userId,
    clientSubmissionId,
    answers: { ...answers, extra: "caller field" } as never
  }),
  /answers are invalid/
);
await assert.rejects(
  storeMemberIntake({
    supabase: supabase as never,
    userId,
    clientSubmissionId,
    answers: { ...answers, heaviest_lift: "x".repeat(1601) }
  }),
  /answers are invalid/
);
await assert.rejects(
  storeMemberIntake({
    supabase: supabase as never,
    userId,
    clientSubmissionId,
    answers: { ...EMPTY_INTAKE_ANSWERS }
  }),
  /answers are invalid/
);

console.log("Member Intake custody runtime boundary: PASS");
}

void main();
