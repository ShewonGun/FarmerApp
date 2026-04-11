import request from "supertest";
import app from "./testApp.js";
import { connectTestDB, clearTestDB, closeTestDB, setTestDbName } from "./setup.js";
import { createUserWithToken, makeAuthHeader } from "./helpers.js";

jest.setTimeout(300000);
setTestDbName("agro_integration_admin_loan");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe("Integration: Admin plans and loan categories", () => {
  test("admin can create plan, farmer cannot", async () => {
    const { token: adminToken } = await createUserWithToken({
      role: "admin",
      email: "loan.admin@example.com",
      name: "Loan Admin",
    });
    const { token: farmerToken } = await createUserWithToken({
      role: "farmer",
      email: "loan.farmer@example.com",
      name: "Loan Farmer",
    });

    const planPayload = {
      planName: "Seasonal Growth Plan",
      description: "Test plan",
      duration: { value: 12, unit: "months" },
      interestRate: 10,
      interestType: "flat",
      paymentFrequency: "monthly",
      maxLoanAmount: 500000,
      minLoanAmount: 10000,
      latePenalty: { type: "percentage", value: 2 },
    };

    const forbiddenRes = await request(app)
      .post("/api/plans")
      .set(makeAuthHeader(farmerToken))
      .send(planPayload);

    expect(forbiddenRes.status).toBe(403);

    const createdRes = await request(app)
      .post("/api/plans")
      .set(makeAuthHeader(adminToken))
      .send(planPayload);

    expect(createdRes.status).toBe(201);
    expect(createdRes.body.success).toBe(true);

    const activeRes = await request(app)
      .get("/api/plans/active")
      .set(makeAuthHeader(farmerToken));

    expect(activeRes.status).toBe(200);
    expect(activeRes.body.success).toBe(true);
    expect(activeRes.body.plans.length).toBeGreaterThanOrEqual(1);
  });

  test("admin can create loan category and public can list", async () => {
    const { token: adminToken } = await createUserWithToken({
      role: "admin",
      email: "loan.category.admin@example.com",
      name: "Category Admin",
    });

    const createRes = await request(app)
      .post("/api/loan-categories")
      .set(makeAuthHeader(adminToken))
      .send({
        name: "Equipment Loan",
        code: "EQP",
        description: "Machinery and tools",
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.category.name).toBe("Equipment Loan");

    const listRes = await request(app).get("/api/loan-categories");

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.some((cat) => cat.name === "Equipment Loan")).toBe(true);
  });
});
