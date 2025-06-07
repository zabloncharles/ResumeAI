// Usage: node scripts/addDummyData.cjs
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function addDummyData() {
  const users = [
    {
      id: "user1",
      email: "alice@example.com",
      firstName: "Alice",
      lastName: "Smith",
      createdAt: new Date(),
      location: "34.0522,-118.2437",
      type: "free",
      state: "California",
    },
    {
      id: "user2",
      email: "bob@example.com",
      firstName: "Bob",
      lastName: "Johnson",
      createdAt: new Date(),
      location: "40.7128,-74.0060",
      type: "paid",
      state: "New York",
    },
    {
      id: "user3",
      email: "carol@example.com",
      firstName: "Carol",
      lastName: "Williams",
      createdAt: new Date(),
      location: "41.8781,-87.6298",
      type: "admin",
      state: "Illinois",
    },
  ];

  const professions = ["Data Scientist", "UX Designer", "Cloud Engineer"];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    // Add user
    await db
      .collection("users")
      .doc(user.id)
      .set({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: Timestamp.fromDate(user.createdAt),
        location: user.location,
        type: user.type,
        state: user.state,
        totalResumes: 1,
        totalApiCalls: 1,
        totalTokens: 1000,
      });
    // Add resume
    await db.collection("resumes").add({
      userId: user.id,
      createdAt: Timestamp.fromDate(new Date()),
      type: "resume",
      title: `${user.firstName}'s Resume`,
    });
    // Add cover letter
    await db.collection("resumes").add({
      userId: user.id,
      createdAt: Timestamp.fromDate(new Date()),
      type: "coverLetter",
      title: `${user.firstName}'s Cover Letter`,
    });
    // Add path
    await db.collection("paths").add({
      createdAt: Timestamp.fromDate(new Date()),
      userId: user.id,
      profession: professions[i],
    });
  }
  console.log("Dummy users, resumes, and paths added!");
}

addDummyData();
