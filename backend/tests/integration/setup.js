import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";

let mongoServer;
let usingExternalMongo = false;
let connectedDbName = null;

dotenv.config();

export const setTestDbName = (dbName) => {
  process.env.TEST_DB_NAME = dbName;
};

export const connectTestDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (process.env.MONGO_URI) {
    usingExternalMongo = true;
    connectedDbName = process.env.TEST_DB_NAME || "agro_integration_test";
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: connectedDbName,
    });
    return;
  }

  mongoServer = await MongoMemoryServer.create({
    binary: { version: "7.0.14" },
  });
  await mongoose.connect(mongoServer.getUri());
};

export const clearTestDB = async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
};

export const closeTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    if (!usingExternalMongo) {
      await mongoose.connection.dropDatabase();
    }
    await mongoose.connection.close();
  }
  if (!usingExternalMongo && mongoServer) {
    await mongoServer.stop();
  }
  connectedDbName = null;
};
