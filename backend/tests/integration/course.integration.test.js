import request from "supertest";
import app from "./testApp.js";
import { connectTestDB, clearTestDB, closeTestDB, setTestDbName } from "./setup.js";
import { createUserWithToken, makeAuthHeader } from "./helpers.js";
import Course from "../../models/course/Course.js";

jest.setTimeout(300000);
setTestDbName("agro_integration_course");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe("Integration: Course, lesson, enrollment", () => {
  test("admin can create course, farmer cannot", async () => {
    const { token: adminToken } = await createUserWithToken({
      role: "admin",
      email: "course.admin@example.com",
      name: "Course Admin",
    });

    const { token: farmerToken } = await createUserWithToken({
      role: "farmer",
      email: "course.farmer@example.com",
      name: "Course Farmer",
    });

    const payload = {
      title: "Soil Science Basics",
      description: "Intro to soil health",
      isPublished: true,
    };

    const forbiddenRes = await request(app)
      .post("/api/courses")
      .set(makeAuthHeader(farmerToken))
      .send(payload);

    expect(forbiddenRes.status).toBe(403);

    const createdRes = await request(app)
      .post("/api/courses")
      .set(makeAuthHeader(adminToken))
      .send(payload);

    expect(createdRes.status).toBe(201);
    expect(createdRes.body.success).toBe(true);

    const inDb = await Course.findOne({ title: "Soil Science Basics" });
    expect(inDb).toBeTruthy();
  });

  test("farmer can enroll and mark lesson complete", async () => {
    const { token: adminToken } = await createUserWithToken({
      role: "admin",
      email: "course2.admin@example.com",
      name: "Course Admin 2",
    });
    const { user: farmer, token: farmerToken } = await createUserWithToken({
      role: "farmer",
      email: "course2.farmer@example.com",
      name: "Course Farmer 2",
    });

    const courseRes = await request(app)
      .post("/api/courses")
      .set(makeAuthHeader(adminToken))
      .send({
        title: "Water Management",
        description: "Efficient irrigation techniques",
        isPublished: true,
      });

    expect(courseRes.status).toBe(201);
    const courseId = courseRes.body.course._id;

    const lessonRes = await request(app)
      .post(`/api/lessons/course/${courseId}`)
      .set(makeAuthHeader(adminToken))
      .send({
        title: "Irrigation Types",
        content: "Drip and sprinkler overview",
      });

    expect(lessonRes.status).toBe(201);
    const lessonId = lessonRes.body.lesson._id;

    const enrollRes = await request(app)
      .post(`/api/enrollments/${farmer._id}/course/${courseId}/enroll`)
      .set(makeAuthHeader(farmerToken));

    expect(enrollRes.status).toBe(201);
    expect(enrollRes.body.success).toBe(true);

    const completeRes = await request(app)
      .put(`/api/enrollments/${farmer._id}/course/${courseId}/lesson/${lessonId}/complete`)
      .set(makeAuthHeader(farmerToken));

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.success).toBe(true);
    expect(completeRes.body.enrollment.progress).toBeGreaterThanOrEqual(100);
  });
});
