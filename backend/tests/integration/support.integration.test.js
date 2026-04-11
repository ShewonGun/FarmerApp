import request from "supertest";
import app from "./testApp.js";
import { connectTestDB, clearTestDB, closeTestDB, setTestDbName } from "./setup.js";
import { createUserWithToken, makeAuthHeader } from "./helpers.js";

jest.setTimeout(300000);
setTestDbName("agro_integration_support");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe("Integration: Support tickets and platform ratings", () => {
  test("farmer can create ticket, admin can view all", async () => {
    const { token: farmerToken } = await createUserWithToken({
      role: "farmer",
      email: "support.farmer@example.com",
      name: "Support Farmer",
    });
    const { token: adminToken } = await createUserWithToken({
      role: "admin",
      email: "support.admin@example.com",
      name: "Support Admin",
    });

    const createTicketRes = await request(app)
      .post("/api/support-tickets")
      .set(makeAuthHeader(farmerToken))
      .send({
        category: "loan",
        subject: "Repayment issue",
        description: "Need help with repayment schedule",
        priority: "Medium",
      });

    expect(createTicketRes.status).toBe(201);
    expect(createTicketRes.body.success).toBe(true);

    const myTicketsRes = await request(app)
      .get("/api/support-tickets/my")
      .set(makeAuthHeader(farmerToken));

    expect(myTicketsRes.status).toBe(200);
    expect(myTicketsRes.body.count).toBe(1);

    const allTicketsRes = await request(app)
      .get("/api/support-tickets")
      .set(makeAuthHeader(adminToken));

    expect(allTicketsRes.status).toBe(200);
    expect(allTicketsRes.body.count).toBe(1);
  });

  test("farmer can submit one platform rating and duplicate should fail", async () => {
    const { token: farmerToken } = await createUserWithToken({
      role: "farmer",
      email: "rating.farmer@example.com",
      name: "Rating Farmer",
    });

    const firstRes = await request(app)
      .post("/api/platform-ratings")
      .set(makeAuthHeader(farmerToken))
      .send({
        overallRating: 4,
        loanServiceRating: 4,
        trainingServiceRating: 5,
        supportServiceRating: 4,
        usabilityRating: 4,
        feedback: "Great overall platform",
      });

    expect(firstRes.status).toBe(201);
    expect(firstRes.body.success).toBe(true);

    const duplicateRes = await request(app)
      .post("/api/platform-ratings")
      .set(makeAuthHeader(farmerToken))
      .send({ overallRating: 5 });

    expect(duplicateRes.status).toBe(400);

    const publicRes = await request(app).get("/api/platform-ratings/public");
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.success).toBe(true);
    expect(Array.isArray(publicRes.body.data)).toBe(true);
  });
});
