import { isCustomerPlan, normalizeAccountPlan } from "./accountPlans.js";

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function analyticsMonthKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getUTCFullYear()}-${pad2(now.getUTCMonth() + 1)}`;
  }
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
}

function planField(plan) {
  if (plan === "free") return "usersFree";
  if (plan === "premium") return "usersPremium";
  if (plan === "pro") return "usersPro";
  return null;
}

/**
 * Increment platform analytics rollups (Admin SDK only).
 * @param {import('firebase-admin')} admin
 * @param {{
 *   apiCalls?: number,
 *   tokens?: number,
 *   resumes?: number,
 *   coverLetters?: number,
 *   podcasts?: number,
 *   podcastSeconds?: number,
 *   users?: number,
 *   plan?: string,
 *   at?: Date,
 * }} deltas
 */
export async function incrementAnalyticsRollups(admin, deltas = {}) {
  const apiCalls = Math.max(0, Number(deltas.apiCalls) || 0);
  const tokens = Math.max(0, Number(deltas.tokens) || 0);
  const resumes = Math.max(0, Number(deltas.resumes) || 0);
  const coverLetters = Math.max(0, Number(deltas.coverLetters) || 0);
  const podcasts = Math.max(0, Number(deltas.podcasts) || 0);
  const podcastSeconds = Math.max(0, Math.round(Number(deltas.podcastSeconds) || 0));
  const users = Math.max(0, Number(deltas.users) || 0);
  const plan = deltas.plan ? normalizeAccountPlan(deltas.plan) : null;
  const planKey = plan && isCustomerPlan(plan) ? planField(plan) : null;

  if (
    apiCalls === 0 &&
    tokens === 0 &&
    resumes === 0 &&
    coverLetters === 0 &&
    podcasts === 0 &&
    podcastSeconds === 0 &&
    users === 0 &&
    !planKey
  ) {
    return;
  }

  const db = admin.firestore();
  const FieldValue = admin.firestore.FieldValue;
  const monthKey = analyticsMonthKey(deltas.at || new Date());

  const globalPatch = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  const monthPatch = {
    monthKey,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (apiCalls) {
    globalPatch.totalApiCalls = FieldValue.increment(apiCalls);
    monthPatch.apiCalls = FieldValue.increment(apiCalls);
  }
  if (tokens) {
    globalPatch.totalTokens = FieldValue.increment(tokens);
    monthPatch.tokens = FieldValue.increment(tokens);
  }
  if (resumes) {
    globalPatch.totalResumes = FieldValue.increment(resumes);
    monthPatch.resumes = FieldValue.increment(resumes);
  }
  if (coverLetters) {
    globalPatch.totalCoverLetters = FieldValue.increment(coverLetters);
    monthPatch.coverLetters = FieldValue.increment(coverLetters);
  }
  if (podcasts) {
    globalPatch.totalPodcasts = FieldValue.increment(podcasts);
    monthPatch.podcasts = FieldValue.increment(podcasts);
  }
  if (podcastSeconds) {
    globalPatch.totalPodcastSeconds = FieldValue.increment(podcastSeconds);
    monthPatch.podcastSeconds = FieldValue.increment(podcastSeconds);
  }
  if (users) {
    globalPatch.totalUsers = FieldValue.increment(users);
    monthPatch.users = FieldValue.increment(users);
  }
  if (planKey && users) {
    globalPatch[planKey] = FieldValue.increment(users);
    monthPatch[planKey] = FieldValue.increment(users);
  }

  await Promise.all([
    db.collection("analytics").doc("global").set(globalPatch, { merge: true }),
    db
      .collection("analytics")
      .doc("monthly")
      .collection("months")
      .doc(monthKey)
      .set(monthPatch, { merge: true }),
  ]);
}
