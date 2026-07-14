"use client";
import { useActionState } from "react";
import { subscribeAction, type SubscribeResult } from "@/app/(storefront)/newsletter/actions";

/**
 * Client wrapper around the newsletter server action.
 * Provides live subscribe / success / already-subscribed / error feedback.
 * Kept in `components/hero` so the sanctum homepage owns its own presentational rules.
 */
export function NewsletterForm() {
  const [state, formAction, pending] = useActionState<SubscribeResult | null, FormData>(subscribeAction, null);

  const status: null | { tone: "ok" | "warn" | "err"; msg: string } =
    state == null
      ? null
      : state.ok
      ? state.already
        ? { tone: "warn", msg: "You're already on the list — thank you." }
        : { tone: "ok", msg: "Subscribed. Look for the first note next month." }
      : state.error === "invalid"
      ? { tone: "err", msg: "That doesn't look like a valid email." }
      : { tone: "err", msg: "Something went wrong — please try again in a moment." };

  return (
    <>
      <form action={formAction} aria-describedby="sa-nl-status">
        <input
          type="email"
          name="email"
          required
          disabled={pending}
          placeholder="your@email.com"
          aria-label="Email address"
        />
        <button type="submit" disabled={pending}>
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </form>
      <div
        id="sa-nl-status"
        role="status"
        aria-live="polite"
        className={status ? `sa-nl-status ${status.tone}` : "sa-nl-status"}
      >
        {status?.msg ?? ""}
      </div>
    </>
  );
}
