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
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const idToken = authHeader.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    return null;
  }
}

export const handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  // Verify user
  const uid = await verifyIdToken(event.headers["authorization"]);
  if (!uid) {
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

  let { prompt } = body || {};
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No prompt provided." }),
    };
  }

  let profession = "";
  let summary = "";
  let section = "";
  try {
    profession = body.profession || "";
    summary = body.summary || "";
    section = body.section || "";
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request body" }),
    };
  }

  if (
    section === "personal" &&
    (!profession || profession.trim().length === 0)
  ) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error:
          "Please provide a job title in the personal information section.",
      }),
    };
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  console.log("Debug - API Key exists:", !!apiKey);
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "OpenAI API key not configured" }),
    };
  }

  console.log("Section:", section);
  console.log("Profession:", profession);
  console.log("Debug - Section:", section);
  console.log("Debug - Profession:", profession);

  const generatePersonalSuggestions = (profession) => {
    if (!profession || profession.trim().length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "Please provide a job title in the personal information section.",
        }),
      };
    }
    return `List 5 essential tips for creating a professional resume for a ${profession}. Each tip should be clear, actionable, and specifically helpful for someone seeking a ${profession} position. Return as bullet points.`;
  };

  const generateSummarySuggestions = (profession) => {
    if (!profession || profession.trim().length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "Please provide a job title in the personal information section to get suggestions.",
        }),
      };
    }
    return `Generate 5 professional summary statements tailored for a ${profession}. Each summary should be concise, compelling, and highlight the candidate's strengths for this role. Focus on their overall professional identity, key skills, and career goals. Return as bullet points.`;
  };

  const generateEmploymentSuggestions = (profession) => {
    return `Given the job title: ${profession}, generate 5 impactful resume bullet points describing achievements, responsibilities, or results that would impress a recruiter. Use action verbs, quantify results where possible, and keep each point concise. Return as bullet points.`;
  };

  console.log("Debug - Prompt:", prompt);

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
          {
            role: "system",
            content: `You are an expert resume writer and career coach. Focus on:\n1. Professional, concise, and compelling language\n2. Resume-appropriate tone\n3. Action-oriented and achievement-focused statements\n4. For employment history, focus on bullet points that describe what the candidate did at the job that would help them land an interview. Use action verbs and quantify results where possible.\nReturn only the 5 best bullet points as bullet points.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: errorData.error?.message || "Failed to generate suggestions",
        }),
      };
    }

    const data = await response.json();
    // Debug log to check the output returned
    console.log("Debug - API Response:", data);
    // The OpenAI response is in data.choices[0].message.content
    const content = data.choices?.[0]?.message?.content || "";
    const total_tokens = data.usage?.total_tokens || 0;

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
      body: JSON.stringify({ content, total_tokens }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message || "Failed to generate suggestions",
      }),
    };
  }
};
