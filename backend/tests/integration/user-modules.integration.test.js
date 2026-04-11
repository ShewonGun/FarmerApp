import request from "supertest";
import app from "./testApp.js";
import { connectTestDB, clearTestDB, closeTestDB, setTestDbName } from "./setup.js";
import { createUserWithToken, makeAuthHeader } from "./helpers.js";

jest.setTimeout(300000);
setTestDbName("agro_integration_user_modules");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe("Integration: User sub-modules", () => {
  test("financial, location, and training routes support farmer CRUD + admin list", async () => {
    const { user: farmer, token: farmerToken } = await createUserWithToken({
      role: "farmer",
      email: "usermod.farmer@example.com",
      name: "User Modules Farmer",
    });
    const { token: adminToken } = await createUserWithToken({
      role: "admin",
      email: "usermod.admin@example.com",
      name: "User Modules Admin",
    });

    const financialCreate = await request(app)
      .post("/api/financial")
      .set(makeAuthHeader(farmerToken))
      .send({ dependentNames: "Guarantor A, Guarantor B", estimatedIncome: 120000 });
    expect(financialCreate.status).toBe(201);

    const financialMy = await request(app)
      .get("/api/financial/my")
      .set(makeAuthHeader(farmerToken));
    expect(financialMy.status).toBe(200);

    const financialAdmin = await request(app)
      .get("/api/financial")
      .set(makeAuthHeader(adminToken));
    expect(financialAdmin.status).toBe(200);

    const locationCreate = await request(app)
      .post("/api/location-farming")
      .set(makeAuthHeader(farmerToken))
      .send({ district: "Gampaha", farmSize: 2.5, farmSizeUnit: "acres" });
    expect(locationCreate.status).toBe(201);

    const locationAdmin = await request(app)
      .get("/api/location-farming")
      .set(makeAuthHeader(adminToken));
    expect(locationAdmin.status).toBe(200);

    const trainingCreate = await request(app)
      .post("/api/training-engagement")
      .set(makeAuthHeader(farmerToken))
      .send({ literacyLevel: "basic", preferredLanguage: "english" });
    expect(trainingCreate.status).toBe(201);

    const trainingAdmin = await request(app)
      .get("/api/training-engagement")
      .set(makeAuthHeader(adminToken));
    expect(trainingAdmin.status).toBe(200);

    const verificationCreate = await request(app)
      .post("/api/verification-trust")
      .set(makeAuthHeader(farmerToken))
      .send({ governmentNicNumber: "123456789V", agreedToTerms: true, consentToDataPolicy: true });
    expect(verificationCreate.status).toBe(201);

    const verificationByAdmin = await request(app)
      .get(`/api/verification-trust/${farmer._id}`)
      .set(makeAuthHeader(adminToken));
    expect(verificationByAdmin.status).toBe(200);
  });
});
