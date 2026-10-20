export async function recordUserAiUsage(admin, uid, totalTokens) {
  if (!uid) return;

  const tokens = Number(totalTokens);
  const tokenIncrement = Number.isFinite(tokens) ? Math.max(0, tokens) : 0;

  try {
    await admin.firestore().collection("users").doc(uid).update({
      totalApiCalls: admin.firestore.FieldValue.increment(1),
      totalTokens: admin.firestore.FieldValue.increment(tokenIncrement),
      lastUsed: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error("Failed to record AI usage for user", uid, e?.message || e);
  }
}
