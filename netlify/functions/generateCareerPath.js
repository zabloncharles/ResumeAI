import admin from "firebase-admin";

// Initialize Firebase Admin with environment variables
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    }),
  });
}

async function verifyIdToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Invalid auth header format");
    return null;
  }
  const idToken = authHeader.split(" ")[1];
  try {
    console.log("Verifying token...");
    const decoded = await admin.auth().verifyIdToken(idToken);
    console.log("Token verified for user:", decoded.uid);
    return decoded.uid;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

export const handler = async function (event, context) {
  console.log("Function called with headers:", event.headers);

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  // Verify user
  const uid = await verifyIdToken(event.headers["authorization"]);
  if (!uid) {
    console.log("Unauthorized: No valid user ID");
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request body" }),
    };
  }

  const { profession } = body || {};
  if (
    !profession ||
    typeof profession !== "string" ||
    profession.trim().length === 0
  ) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No profession provided." }),
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "OpenAI API key not configured" }),
    };
  }

  const prompt = `You are a career coach and job market expert. For someone who wants to become a ${profession}, provide a step-by-step career roadmap as a JSON array of steps. Each step should have:\n- id: a unique string identifier (use lowercase, hyphenated, e.g. \"bachelor-degree\")\n- title: the step title\n- description: a brief description\n- prerequisiteIds: an array of step ids that must be completed before this step (empty array if none)\n- childrenIds: an array of step ids that follow from this step (empty array if none)\n- links: (optional) array of {label, url} for recommended courses or certifications\n\nThe roadmap should support branching (e.g., after a degree, multiple career paths may be possible). Make sure the ids in prerequisiteIds and childrenIds match the ids of other steps.\n\nRespond with ONLY a valid JSON array, no explanation, no markdown, and no extra text.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful AI career assistant." },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 900,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: errorData.error?.message || "Failed to generate career path",
        }),
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const total_tokens = data.usage?.total_tokens || 0;
    // Try to parse the JSON array from the AI response
    let steps = [];
    try {
      const jsonStart = content.indexOf("[");
      const jsonEnd = content.lastIndexOf("]");
      steps = JSON.parse(content.substring(jsonStart, jsonEnd + 1));
      // Log each step for debugging
      steps.forEach((step, idx) => {
        console.log(`Step ${idx + 1}:`);
        console.log(`  id: ${step.id}`);
        console.log(`  title: ${step.title}`);
        console.log(
          `  prerequisiteIds: ${JSON.stringify(step.prerequisiteIds)}`
        );
        console.log(`  childrenIds: ${JSON.stringify(step.childrenIds)}`);
      });
      // Log the top/root step (no prerequisites)
      const rootStep = steps.find(
        (step) =>
          Array.isArray(step.prerequisiteIds) &&
          step.prerequisiteIds.length === 0
      );
      if (rootStep) {
        console.log("Top/root step:");
        console.log(`  id: ${rootStep.id}`);
        console.log(`  title: ${rootStep.title}`);
      }
    } catch (e) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "AI did not return valid JSON." }),
      };
    }

    // Increment user's totalTokens in Firestore
    try {
      await admin
        .firestore()
        .collection("users")
        .doc(uid)
        .update({
          totalTokens: admin.firestore.FieldValue.increment(total_tokens),
        });
    } catch (e) {
      // Log but do not block response
      console.error("Failed to increment totalTokens", e);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ steps, total_tokens }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message || "Failed to generate career path",
      }),
    };
  }
};
