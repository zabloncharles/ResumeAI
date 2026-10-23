import { randomUUID } from "crypto";
import { join } from "path";
import { pathToFileURL } from "url";
import { chunkPodcastScript } from "./chunkPodcastScript.js";
import { chunkTranscript } from "./chunkTranscript.js";
import {
  pcmToWavBuffer,
  wavDurationSecondsFromBuffer,
} from "./pcmToWavBuffer.js";
import { incrementAnalyticsRollups } from "./analyticsRollups.js";
import { normalizeStudyCategoryId } from "./studyCategoryIds.js";

const STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET || "resumeai-69b70.firebasestorage.app";

function functionsBaseUrl() {
  const raw =
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    process.env.DEPLOY_URL ||
    "";
  return String(raw).replace(/\/$/, "");
}

function useInlineFunctionCalls() {
  return !functionsBaseUrl() || process.env.PODCAST_JOB_INLINE === "1";
}

async function patchJob(db, jobId, patch) {
  await db
    .collection("podcastJobs")
    .doc(jobId)
    .set(
      {
        ...patch,
        updatedAt: new Date(),
      },
      { merge: true }
    );
}

async function callFunctionInline(name, authHeader, body) {
  const filePath = join(process.cwd(), "netlify/functions", `${name}.js`);
  const mod = await import(
    `${pathToFileURL(filePath).href}?t=${Date.now()}`
  );
  const result = await mod.handler(
    {
      httpMethod: "POST",
      headers: {
        authorization: authHeader,
        Authorization: authHeader,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    },
    {}
  );
  const status = result?.statusCode ?? 500;
  let data = {};
  try {
    data =
      typeof result?.body === "string"
        ? JSON.parse(result.body || "{}")
        : result?.body || {};
  } catch {
    data = {};
  }
  if (status < 200 || status >= 300) {
    throw new Error(data.error || `${name} failed (${status})`);
  }
  return data;
}

async function callFunctionHttp(name, authHeader, body) {
  const response = await fetch(
    `${functionsBaseUrl()}/.netlify/functions/${name}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    }
  );
  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = {};
  }
  if (!response.ok) {
    throw new Error(data.error || `${name} failed (${response.status})`);
  }
  return data;
}

async function callFunction(name, authHeader, body) {
  if (useInlineFunctionCalls()) {
    return callFunctionInline(name, authHeader, body);
  }
  try {
    return await callFunctionHttp(name, authHeader, body);
  } catch (err) {
    if (String(err?.message || err).includes("fetch failed")) {
      return callFunctionInline(name, authHeader, body);
    }
    throw err;
  }
}

function dedupeCards(cards) {
  const seen = new Set();
  const out = [];
  for (const card of cards) {
    const front = String(card?.front || "").trim();
    const back = String(card?.back || "").trim();
    if (!front || !back) continue;
    const key = `${front.toLowerCase()}::${back.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      front,
      back,
      category: String(card?.category || "").trim(),
      difficulty:
        card?.difficulty === "easy" ||
        card?.difficulty === "medium" ||
        card?.difficulty === "hard"
          ? card.difficulty
          : "medium",
    });
  }
  return out;
}

async function uploadWav(admin, path, buffer) {
  const bucket = admin.storage().bucket(STORAGE_BUCKET);
  const file = bucket.file(path);
  const token = randomUUID();
  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType: "audio/wav",
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

export async function runPodcastCreateJob(admin, {
  jobId,
  uid,
  authHeader,
}) {
  const db = admin.firestore();
  const FieldValue = admin.firestore.FieldValue;
  const jobRef = db.collection("podcastJobs").doc(jobId);
  const jobSnap = await jobRef.get();
  if (!jobSnap.exists) {
    throw new Error("Podcast job not found.");
  }
  const job = jobSnap.data() || {};
  if (job.createdBy !== uid) {
    throw new Error("Podcast job does not belong to this user.");
  }
  if (job.status === "done") {
    return { podcastId: job.podcastId, studySetId: job.studySetId };
  }

  const content = String(job.content || "").trim();
  const emotion = job.emotion;
  const mannerism = job.mannerism;
  const voice = job.voice;
  const folderId =
    typeof job.folderId === "string" && job.folderId ? job.folderId : null;

  if (!content) {
    throw new Error("Podcast job has no content.");
  }

  await patchJob(db, jobId, {
    status: "running",
    phase: "script",
    progress: 8,
    error: null,
  });

  const scriptResult = await callFunction("generatePodcastScript", authHeader, {
    content,
    emotion,
    mannerism,
  });

  const title =
    String(scriptResult.title || "Teaching podcast").trim() ||
    "Teaching podcast";
  const script = String(scriptResult.script || "").trim();
  const categoryId = normalizeStudyCategoryId(
    scriptResult.categoryId || job.categoryId
  );
  const usedEmotion = scriptResult.emotion || emotion;
  const usedMannerism = scriptResult.mannerism || mannerism;

  if (!script) {
    throw new Error("Script generation returned empty script.");
  }

  await patchJob(db, jobId, {
    phase: "audio_cards",
    progress: 22,
    title,
    categoryId,
  });

  const scriptChunks = chunkPodcastScript(script);
  const contentChunks = chunkTranscript(content);

  const audioPromise = (async () => {
    const pcmParts = [];
    let sampleRate = 24000;
    let channels = 1;
    let bitDepth = 16;
    for (let i = 0; i < scriptChunks.length; i++) {
      await patchJob(db, jobId, {
        phase: "audio_cards",
        audioCurrent: i + 1,
        audioTotal: scriptChunks.length,
        progress: 22 + Math.round(((i + 1) / Math.max(scriptChunks.length, 1)) * 38),
      });
      const part = await callFunction("generatePodcastAudio", authHeader, {
        text: scriptChunks[i],
        emotion: usedEmotion,
        mannerism: usedMannerism,
        voice,
      });
      if (!part.audioBase64) {
        throw new Error("Audio generation returned no data.");
      }
      pcmParts.push(Buffer.from(part.audioBase64, "base64"));
      sampleRate = part.sampleRate || sampleRate;
      channels = part.channels || channels;
      bitDepth = part.bitDepth || bitDepth;
    }
    const wav = pcmToWavBuffer(pcmParts, { sampleRate, channels, bitDepth });
    return {
      wav,
      durationSeconds: Math.round(wavDurationSecondsFromBuffer(wav)),
    };
  })();

  const cardsPromise = (async () => {
    try {
      const allCards = [];
      let description = "";
      let cardsTitle = `${title} flashcards`;
      for (let i = 0; i < contentChunks.length; i++) {
        await patchJob(db, jobId, {
          cardsCurrent: i + 1,
          cardsTotal: contentChunks.length,
        });
        const part = await callFunction(
          "generateStudyCardsFromTranscript",
          authHeader,
          {
            transcript: contentChunks[i],
            depth: "high-level",
            title: cardsTitle,
            chunkIndex: i + 1,
            chunkCount: contentChunks.length,
          }
        );
        if (i === 0 && part.title) {
          cardsTitle = String(part.title).trim() || cardsTitle;
        }
        if (part.description) {
          description = [description, part.description].filter(Boolean).join(" ");
        }
        if (Array.isArray(part.cards)) {
          allCards.push(...part.cards);
        }
      }
      return {
        title: cardsTitle,
        description: description.trim() || `Flashcards for ${title}`,
        cards: dedupeCards(allCards).slice(0, 80),
      };
    } catch (err) {
      console.error("Podcast flashcard generation failed:", err?.message || err);
      return { title: `${title} flashcards`, description: "", cards: [] };
    }
  })();

  const [audioResult, cardsResult] = await Promise.all([
    audioPromise,
    cardsPromise,
  ]);

  await patchJob(db, jobId, {
    phase: "save",
    progress: 88,
  });

  const podcastRef = db.collection("podcasts").doc();
  const audioPath = `podcasts/${uid}/${podcastRef.id}.wav`;
  const audioUrl = await uploadWav(admin, audioPath, audioResult.wav);

  let studySetId = null;
  if (cardsResult.cards.length > 0) {
    const setRef = db.collection("studySets").doc();
    studySetId = setRef.id;
    const batch = db.batch();
    batch.set(setRef, {
      title: cardsResult.title,
      description: cardsResult.description,
      categoryId,
      category: categoryId,
      folderId,
      isPublic: false,
      createdBy: uid,
      createdAt: FieldValue.serverTimestamp(),
      lastStudied: null,
      podcastId: podcastRef.id,
      cardCount: cardsResult.cards.length,
      totalCards: cardsResult.cards.length,
      masteredCards: 0,
      totalStudyTime: 0,
      totalSessions: 0,
      averageScore: 0,
      progress: "not_started",
    });
    for (const card of cardsResult.cards) {
      const cardRef = setRef.collection("flashcards").doc();
      batch.set(cardRef, {
        front: card.front,
        back: card.back,
        category: card.category,
        difficulty: card.difficulty,
        mastery: 0,
        createdBy: uid,
        isPublic: false,
        createdAt: FieldValue.serverTimestamp(),
        lastReviewed: null,
      });
    }
    await batch.commit();
  }

  await podcastRef.set({
    title,
    emotion: usedEmotion,
    mannerism: usedMannerism,
    voice,
    script,
    audioUrl,
    audioPath,
    durationSeconds: audioResult.durationSeconds,
    sourcePreview: content.slice(0, 240),
    categoryId,
    category: categoryId,
    folderId,
    studySetId,
    createdBy: uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  if (folderId) {
    await db
      .collection("studyFolders")
      .doc(folderId)
      .set({ updatedAt: FieldValue.serverTimestamp() }, { merge: true })
      .catch(() => {});
  }

  await incrementAnalyticsRollups(admin, {
    podcasts: 1,
    podcastSeconds: audioResult.durationSeconds,
  });

  await patchJob(db, jobId, {
    status: "done",
    phase: "done",
    progress: 100,
    podcastId: podcastRef.id,
    studySetId,
    title,
    durationSeconds: audioResult.durationSeconds,
    error: null,
  });

  return { podcastId: podcastRef.id, studySetId };
}
