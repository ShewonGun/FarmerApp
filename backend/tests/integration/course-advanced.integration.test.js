import request from "supertest";
import app from "./testApp.js";
import { connectTestDB, clearTestDB, closeTestDB, setTestDbName } from "./setup.js";
import { createUserWithToken, makeAuthHeader } from "./helpers.js";

jest.setTimeout(300000);
setTestDbName("agro_integration_course_advanced");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe("Integration: Advanced course components", () => {
  test("quiz + question + progress routes work together", async () => {
    const { token: adminToken } = await createUserWithToken({ role: "admin", email: "advcourse.admin@example.com" });
    const { user: farmer, token: farmerToken } = await createUserWithToken({ role: "farmer", email: "advcourse.farmer@example.com" });

    const courseRes = await request(app)
      .post("/api/courses")
      .set(makeAuthHeader(adminToken))
      .send({ title: "Advanced Course", description: "Course for integration", isPublished: true });
    expect(courseRes.status).toBe(201);

    const lessonRes = await request(app)
      .post(`/api/lessons/course/${courseRes.body.course._id}`)
      .set(makeAuthHeader(adminToken))
      .send({ title: "Lesson A", content: "Lesson content" });
    expect(lessonRes.status).toBe(201);

    const quizRes = await request(app)
      .post(`/api/quizzes/lessons/${lessonRes.body.lesson._id}`)
      .set(makeAuthHeader(adminToken))
      .send({ title: "Lesson A Quiz", passingScore: 60 });
    expect(quizRes.status).toBe(201);

    const questionRes = await request(app)
      .post(`/api/questions/quiz/${quizRes.body.quiz._id}`)
      .set(makeAuthHeader(adminToken))
      .send({
        questionText: "Best nutrient for root development?",
        choices: [
          { choiceText: "Phosphorus", isCorrect: true },
          { choiceText: "Salt", isCorrect: false }
        ]
      });
    expect(questionRes.status).toBe(201);

    const enrollRes = await request(app)
      .post(`/api/enrollments/${farmer._id}/course/${courseRes.body.course._id}/enroll`)
      .set(makeAuthHeader(farmerToken));
    expect(enrollRes.status).toBe(201);

    const attemptRes = await request(app)
      .post(`/api/progress/${farmer._id}/quiz/${quizRes.body.quiz._id}/attempt`)
      .set(makeAuthHeader(farmerToken))
      .send({
        answers: [
          { questionId: questionRes.body.question._id, selectedChoiceId: questionRes.body.question.choices[0]._id }
        ]
      });
    expect(attemptRes.status).toBe(201);

    const attemptId = attemptRes.body.progress._id;

    const detailRes = await request(app)
      .get(`/api/progress/attempt/${attemptId}`)
      .set(makeAuthHeader(farmerToken));
    expect(detailRes.status).toBe(200);

    const aiInvalidRes = await request(app)
      .get("/api/ai/not-a-valid-id/explanations")
      .set(makeAuthHeader(farmerToken));
    expect(aiInvalidRes.status).toBe(400);

    const certInvalidRes = await request(app)
      .get("/api/certificates/not-an-id/course/not-an-id")
      .set(makeAuthHeader(farmerToken));
    expect([400, 403]).toContain(certInvalidRes.status);
  });
});
