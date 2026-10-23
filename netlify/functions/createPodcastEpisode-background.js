import admin from "firebase-admin";
import { dirname, join } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { statSync } from "fs";

const here = dirname(fileURLToPath(import.meta.url));

async function loadRunPodcastCreateJob() {
  const file = join(here, "../../shared/runPodcastCreateJob.js");
  const href = `${pathToFileURL(file).href}?t=${statSync(file).mtimeMs}`;
  return import(href);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    }),
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET || "resumeai-69b70.firebasestorage.app",
  });
}

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
  } catch {
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

  const authHeader = getAuthorizationHeader(event);
  const uid = await verifyIdToken(authHeader);
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

  const jobId = String(body.jobId || "").trim();
  if (!jobId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "jobId is required" }),
    };
  }

  try {
    const { runPodcastCreateJob } = await loadRunPodcastCreateJob();
    await runPodcastCreateJob(admin, { jobId, uid, authHeader });
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, jobId }),
    };
  } catch (err) {
    console.error("createPodcastEpisode-background failed:", err?.message || err);
    try {
      await admin
        .firestore()
        .collection("podcastJobs")
        .doc(jobId)
        .set(
          {
            status: "error",
            phase: "error",
            error:
              err instanceof Error
                ? err.message
                : "Could not create podcast. Try again.",
            updatedAt: new Date(),
          },
          { merge: true }
        );
    } catch {
      // ignore status write failures
    }
    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          err instanceof Error
            ? err.message
            : "Could not create podcast. Try again.",
      }),
    };
  }
};
