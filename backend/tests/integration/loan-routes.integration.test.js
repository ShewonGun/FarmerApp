import request from "supertest";
import app from "./testApp.js";
import { connectTestDB, clearTestDB, closeTestDB, setTestDbName } from "./setup.js";
import { createUserWithToken, makeAuthHeader } from "./helpers.js";

jest.setTimeout(300000);
setTestDbName("agro_integration_loan_routes");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe("Integration: Loan route access and responses", () => {
  test("/api/loans/my is farmer-only and /api/loans/admin is admin-only", async () => {
    const { token: farmerToken } = await createUserWithToken({ role: "farmer", email: "loanroutes.farmer@example.com" });
    const { token: adminToken } = await createUserWithToken({ role: "admin", email: "loanroutes.admin@example.com" });

    const farmerMyRes = await request(app)
      .get("/api/loans/my")
      .set(makeAuthHeader(farmerToken));
    expect(farmerMyRes.status).toBe(200);
    expect(farmerMyRes.body.success).toBe(true);

    const farmerAdminRes = await request(app)
      .get("/api/loans/admin")
      .set(makeAuthHeader(farmerToken));
    expect(farmerAdminRes.status).toBe(403);

    const adminAdminRes = await request(app)
      .get("/api/loans/admin")
      .set(makeAuthHeader(adminToken));
    expect(adminAdminRes.status).toBe(200);
    expect(adminAdminRes.body.success).toBe(true);
  });
});
