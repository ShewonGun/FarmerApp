import request from "supertest";
import app from "./testApp.js";
import { connectTestDB, clearTestDB, closeTestDB, setTestDbName } from "./setup.js";
import { createUserWithToken, makeAuthHeader } from "./helpers.js";

jest.setTimeout(300000);
setTestDbName("agro_integration_auth");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe("Integration: Auth and user routes", () => {
  test("POST /api/signup and POST /api/login should work end-to-end", async () => {
    const signupRes = await request(app)
      .post("/api/signup")
      .send({
        name: "Integration Farmer",
        email: "integration.farmer@example.com",
        password: "password123",
        role: "farmer",
      });

    expect(signupRes.status).toBe(201);
    expect(signupRes.body.success).toBe(true);
    expect(signupRes.body.token).toBeTruthy();

    const loginRes = await request(app)
      .post("/api/login")
      .send({
        email: "integration.farmer@example.com",
        password: "password123",
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.user.email).toBe("integration.farmer@example.com");
  });

  test("GET /api/users should require admin role", async () => {
    const { token: farmerToken } = await createUserWithToken({
      name: "Farmer",
      email: "farmer.integration@example.com",
      role: "farmer",
    });

    const farmerRes = await request(app)
      .get("/api/users")
      .set(makeAuthHeader(farmerToken));

    expect(farmerRes.status).toBe(403);
    expect(farmerRes.body.success).toBe(false);

    const { token: adminToken } = await createUserWithToken({
      name: "Admin",
      email: "admin.integration@example.com",
      role: "admin",
    });

    const adminRes = await request(app)
      .get("/api/users")
      .set(makeAuthHeader(adminToken));

    expect(adminRes.status).toBe(200);
    expect(adminRes.body.success).toBe(true);
    expect(Array.isArray(adminRes.body.users)).toBe(true);
  });

  test("GET /api/user/:userId should block non-owner non-admin", async () => {
    const { user: owner, token: ownerToken } = await createUserWithToken({
      name: "Owner",
      email: "owner.integration@example.com",
      role: "farmer",
    });

    const { token: otherFarmerToken } = await createUserWithToken({
      name: "Other",
      email: "other.integration@example.com",
      role: "farmer",
    });

    const forbiddenRes = await request(app)
      .get(`/api/user/${owner._id}`)
      .set(makeAuthHeader(otherFarmerToken));

    expect(forbiddenRes.status).toBe(403);

    const ownerRes = await request(app)
      .get(`/api/user/${owner._id}`)
      .set(makeAuthHeader(ownerToken));

    expect(ownerRes.status).toBe(200);
    expect(ownerRes.body.success).toBe(true);
  });
});
