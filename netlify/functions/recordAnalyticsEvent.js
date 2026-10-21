import admin from "firebase-admin";
import { incrementAnalyticsRollups } from "../../shared/analyticsRollups.js";
import { normalizeAccountPlan } from "../../shared/accountPlans.js";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.googleapis.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    }),
  });
}

const ALLOWED_TYPES = new Set([
  "resumeCreated",
  "coverLetterCreated",
  "userSignup",
]);

function getAuthorizationHeader(event) {
  const headers = event.headers || {};
  return (
    headers.authorization ||
    headers.Authorization ||
    headers["Authorization"] ||
    ""
  );
}

async function verifyIdToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const idToken = authHeader.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded.uid;
  } catch (err) {
    console.error("verifyIdToken failed:", err?.message || err);
    return null;
  }
}

export const handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const uid = await verifyIdToken(getAuthorizationHeader(event));
  if (!uid) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  const type = String(body.type || "");
  if (!ALLOWED_TYPES.has(type)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid event type" }),
    };
  }

  try {
    if (type === "resumeCreated") {
      await Promise.all([
        incrementAnalyticsRollups(admin, { resumes: 1 }),
        admin
          .firestore()
          .collection("users")
          .doc(uid)
          .update({
            totalResumes: admin.firestore.FieldValue.increment(1),
          })
          .catch(() => {}),
      ]);
    } else if (type === "coverLetterCreated") {
      await incrementAnalyticsRollups(admin, { coverLetters: 1 });
    } else if (type === "userSignup") {
      const userSnap = await admin.firestore().collection("users").doc(uid).get();
      const plan = normalizeAccountPlan(userSnap.data()?.type);
      await incrementAnalyticsRollups(admin, { users: 1, plan });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (e) {
    console.error("recordAnalyticsEvent failed:", e?.message || e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to record event" }),
    };
  }
};
