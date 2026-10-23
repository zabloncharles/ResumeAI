import { auth } from "../firebase";

export type AnalyticsEventType =
  | "resumeCreated"
  | "coverLetterCreated"
  | "podcastCreated"
  | "userSignup";

export type AnalyticsEventPayload = {
  type: AnalyticsEventType;
  durationSeconds?: number;
};

function analyticsEventUrl(): string {
  const base = import.meta.env.VITE_AI_FUNCTIONS_BASE?.replace(/\/$/, "");
  if (base) return `${base}/recordAnalyticsEvent`;
  return "/.netlify/functions/recordAnalyticsEvent";
}

export async function recordAnalyticsEvent(
  type: AnalyticsEventType,
  extras: { durationSeconds?: number } = {}
): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    const body: AnalyticsEventPayload = { type };
    if (typeof extras.durationSeconds === "number") {
      body.durationSeconds = Math.max(0, Math.round(extras.durationSeconds));
    }
    await fetch(analyticsEventUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn("recordAnalyticsEvent failed", type, e);
    }
  }
}
