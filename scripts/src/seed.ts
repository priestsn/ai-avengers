import { db, hrUsersTable, positionsTable, interviewsTable } from "@workspace/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  const hrEmail = "kristian.wasd@gmail.com";
  const existing = await db.select().from(hrUsersTable);
  if (existing.length === 0) {
    const hashedPassword = await bcrypt.hash("sviluppo1", 10);
    await db.insert(hrUsersTable).values({
      email: hrEmail,
      password: hashedPassword,
      name: "Kristian HR",
    });
    console.log("HR user created: kristian.wasd@gmail.com / sviluppo1");
  } else {
    console.log("HR user already exists, skipping.");
  }

  const existingPositions = await db.select().from(positionsTable);
  if (existingPositions.length === 0) {
    await db.insert(positionsTable).values([
      {
        title: "Fullstack Developer",
        description: "We're looking for a skilled Fullstack Developer to build and maintain scalable web applications using React on the frontend and Node.js on the backend with PostgreSQL.",
        techStack: "React / Node.js / PostgreSQL",
        questions: JSON.stringify([
          "Can you explain the difference between React hooks and class components?",
          "How do you handle state management in a large React application?",
          "Describe your experience with REST vs GraphQL APIs.",
          "How do you optimize PostgreSQL queries for performance?",
          "Explain how you would structure a Node.js Express application.",
          "What is your approach to testing fullstack applications?",
        ]),
      },
      {
        title: "Frontend Engineer",
        description: "Join our team as a Frontend Engineer to craft beautiful, responsive interfaces using React, Tailwind CSS, and TypeScript. You'll work on real-time WebRTC features.",
        techStack: "React / Tailwind CSS / TypeScript",
        questions: JSON.stringify([
          "Describe your experience with useEffect patterns and pitfalls.",
          "How do you approach responsive design with Tailwind CSS?",
          "What are your strategies for frontend performance optimization?",
          "How do you manage TypeScript types across a large codebase?",
          "Explain how WebRTC works at a high level.",
          "How do you handle accessibility in your frontend work?",
        ]),
      },
      {
        title: "Backend Developer",
        description: "We need a Backend Developer with strong Node.js and Express skills to build robust APIs, manage deployments with PM2, and integrate cloud services.",
        techStack: "Node.js / Express / AWS",
        questions: JSON.stringify([
          "How do you handle middleware ordering in Express?",
          "Explain the benefits of PM2 clustering for Node.js applications.",
          "What are AWS Lambda cold starts and how do you mitigate them?",
          "How do you secure a REST API against common vulnerabilities?",
          "Describe your approach to logging and monitoring in production.",
          "How do you handle database connection pooling in Node.js?",
        ]),
      },
    ]);
    console.log("3 positions created.");
  } else {
    console.log("Positions already exist, skipping.");
  }

  const existingInterviews = await db.select().from(interviewsTable);
  if (existingInterviews.length === 0) {
    const positions = await db.select().from(positionsTable);
    if (positions.length > 0) {
      await db.insert(interviewsTable).values([
        {
          positionId: positions[0].id,
          candidateName: "Mario Rossi",
          candidateEmail: "mario.rossi@email.com",
          preAnswers: JSON.stringify({
            experience: "5 anni di esperienza fullstack",
            motivation: "Azienda innovativa con ottima cultura",
            availability: "immediate",
          }),
          totalScore: 87,
          skillsScore: 90,
          speechScore: 82,
          confidenceScore: 78,
          fillerWordCount: 3,
          wordCount: 420,
          status: "completed",
        },
        {
          positionId: positions[1].id,
          candidateName: "Giulia Verdi",
          candidateEmail: "giulia.verdi@email.com",
          preAnswers: JSON.stringify({
            experience: "3 anni focus frontend React",
            motivation: "Passione per UI/UX moderno",
            availability: "1month",
          }),
          totalScore: 74,
          skillsScore: 75,
          speechScore: 72,
          confidenceScore: 70,
          fillerWordCount: 8,
          wordCount: 310,
          status: "completed",
        },
        {
          positionId: positions[2].id,
          candidateName: "Luca Bianchi",
          candidateEmail: "luca.bianchi@email.com",
          preAnswers: JSON.stringify({
            experience: "4 anni backend Node.js e AWS",
            motivation: "Crescita professionale",
            availability: "immediate",
          }),
          totalScore: 92,
          skillsScore: 95,
          speechScore: 88,
          confidenceScore: 85,
          fillerWordCount: 1,
          wordCount: 550,
          status: "completed",
        },
      ]);
      console.log("3 sample interviews created.");
    }
  } else {
    console.log("Interviews already exist, skipping.");
  }

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
