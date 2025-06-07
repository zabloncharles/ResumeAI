// Usage: node scripts/addDummyPaths.cjs
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function addDummyPaths() {
  const userId = "testUser123"; // Change to your test UID if needed
  const professions = [
    "Data Scientist",
    "UX Designer",
    "Cloud Engineer",
    "Product Manager",
    "Marketing Specialist",
    "AI Researcher",
    "Web Developer",
  ];
  const now = new Date();
  const docs = [
    // 3 within last 7 days
    {
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      profession: professions[0],
    },
    {
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      profession: professions[1],
    },
    {
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      profession: professions[2],
    },
    // 2 older than 7 days
    {
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      profession: professions[3],
    },
    {
      createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      profession: professions[4],
    },
    // 1 today
    { createdAt: now, profession: professions[5] },
  ];

  for (const docData of docs) {
    await db.collection("paths").add({
      createdAt: Timestamp.fromDate(docData.createdAt),
      userId,
      profession: docData.profession,
    });
    console.log("Added:", docData.profession, docData.createdAt.toISOString());
  }
  console.log("Dummy paths added!");
}

addDummyPaths();
