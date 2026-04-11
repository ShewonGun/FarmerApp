import request from "supertest";
import app from "./testApp.js";
import { connectTestDB, clearTestDB, closeTestDB, setTestDbName } from "./setup.js";
import { createUserWithToken, makeAuthHeader } from "./helpers.js";

jest.setTimeout(300000);
setTestDbName("agro_integration_misc_components");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe("Integration: Misc components (weather/upload/ticket ratings)", () => {
  test("weather and upload endpoints handle request/validation correctly", async () => {
    const weatherRes = await request(app).get("/api/weather");
    expect(weatherRes.status).toBe(400);

    const { token } = await createUserWithToken({ role: "farmer", email: "misc.upload@example.com" });

    const uploadRes = await request(app)
      .post("/api/upload/image")
      .set(makeAuthHeader(token))
      .send({});
    expect(uploadRes.status).toBe(400);
  });

  test("ticket rating lifecycle works after ticket is resolved", async () => {
    const { user: farmer, token: farmerToken } = await createUserWithToken({ role: "farmer", email: "misc.farmer@example.com" });
    const { token: adminToken } = await createUserWithToken({ role: "admin", email: "misc.admin@example.com" });

    const ticketRes = await request(app)
      .post("/api/support-tickets")
      .set(makeAuthHeader(farmerToken))
      .send({
        category: "loan",
        subject: "Need repayment support",
        description: "Issue details",
        priority: "Medium",
      });
    expect(ticketRes.status).toBe(201);

    const ticketId = ticketRes.body.data._id;

    const resolveRes = await request(app)
      .put(`/api/support-tickets/${ticketId}/reply`)
      .set(makeAuthHeader(adminToken))
      .send({ adminReply: "Resolved" });
    expect(resolveRes.status).toBe(200);

    const rateRes = await request(app)
      .post("/api/ticket-ratings")
      .set(makeAuthHeader(farmerToken))
      .send({
        ticketId,
        rating: 5,
        responseQuality: 5,
        resolutionSpeed: 4,
        helpfulness: 5,
        feedback: "Great support",
      });
    expect(rateRes.status).toBe(201);

    const getRatingRes = await request(app)
      .get(`/api/ticket-ratings/ticket/${ticketId}`)
      .set(makeAuthHeader(farmerToken));
    expect(getRatingRes.status).toBe(200);

    const deleteRatingRes = await request(app)
      .delete(`/api/ticket-ratings/ticket/${ticketId}`)
      .set(makeAuthHeader(farmerToken));
    expect(deleteRatingRes.status).toBe(200);

    const adminRatingsRes = await request(app)
      .get("/api/ticket-ratings")
      .set(makeAuthHeader(adminToken));
    expect(adminRatingsRes.status).toBe(200);

    const adminGetUserRating = await request(app)
      .get(`/api/platform-ratings/${farmer._id}`)
      .set(makeAuthHeader(adminToken));
    expect([200, 404]).toContain(adminGetUserRating.status);
  });
});
