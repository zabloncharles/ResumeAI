const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json"); // Place your Firebase service account key here

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function main() {
  // 1. Add a sample resume document
  const resumeData = {
    userId: "sampleUser1",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    length: 2,
    type: "resume",
    status: "completed",
    education: [
      {
        degree: "BSc Computer Science",
        school: "UCLA",
        startDate: "2015",
        endDate: "2019",
      },
    ],
    experience: [
      {
        company: "Tech Co",
        title: "Developer",
        description: ["Built web apps"],
        startDate: "2019-06",
        endDate: "2021-08",
      },
    ],
    personalInfo: {
      email: "jane.doe@example.com",
      fullName: "Jane Doe",
      location: "Los Angeles, USA",
      phone: "1234567890",
      photo: "",
      title: "Software Engineer",
      profile: "Passionate about building products.",
    },
    websites: [{ label: "Portfolio", url: "https://janedoe.com" }],
  };
  const resumeRef = await db.collection("resumes").add(resumeData);

  // 2. Add a sample user with resumeIds field
  const userRef = db.collection("users").doc("sampleUser1");
  await userRef.set({
    createdAt: "2025-06-03T21:41:43.008Z",
    email: "zab.cahrles+mike@gmail.com",
    firstName: "Mike",
    lastName: "Coxsmall",
    location: "34.0522,-118.2437",
    phone: "",
    resumeIds: [resumeRef.id],
    state: "AK",
    zip: "99580",
    callCount: 5,
    totalTokens: 100,
  });

  // 3. Add a sample analytics document
  await db.collection("analytics").doc("global").set({
    totalUsers: 1,
    totalResumes: 1,
    resumesThisWeek: 1,
  });

  console.log("Firestore initialized with sample data.");
}

main()
  .then(() => process.exit())
  .catch(console.error);
