import { auth } from "../firebase";

export type AnalyticsEventType =
  | "resumeCreated"
  | "coverLetterCreated"
  | "userSignup";

function analyticsEventUrl(): string {
  const base = import.meta.env.VITE_AI_FUNCTIONS_BASE?.replace(/\/$/, "");
  if (base) return `${base}/recordAnalyticsEvent`;
  return "/.netlify/functions/recordAnalyticsEvent";
}

export async function recordAnalyticsEvent(
  type: AnalyticsEventType
): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    await fetch(analyticsEventUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type }),
    });
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn("recordAnalyticsEvent failed", type, e);
    }
  }
}
