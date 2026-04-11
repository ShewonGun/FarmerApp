import { uploadImage, deleteImage } from "../../../controllers/sharedControllers/uploadController.js";
import { mockRequest, mockResponse } from "../../setup.js";

jest.mock("../../../config/cloudinary.js", () => ({
  uploader: {
    upload: jest.fn(),
    destroy: jest.fn(),
    upload_stream: jest.fn(),
  },
}));

import cloudinary from "../../../config/cloudinary.js";

describe("uploadImage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should upload base64 image and return 200", async () => {
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: "https://cdn.example.com/img.jpg",
      public_id: "courses/test-id",
    });

    const req = mockRequest({
      body: {
        file: "data:image/png;base64,AAA",
        folder: "courses",
      },
    });
    const res = mockResponse();

    await uploadImage(req, res);

    expect(cloudinary.uploader.upload).toHaveBeenCalledWith("data:image/png;base64,AAA", {
      folder: "courses",
      resource_type: "auto",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        url: "https://cdn.example.com/img.jpg",
        publicId: "courses/test-id",
      })
    );
  });

  test("should return 400 when no file is provided", async () => {
    const req = mockRequest({ body: {} });
    const res = mockResponse();

    await uploadImage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "No image file provided",
      })
    );
  });

  test("should return 500 when cloudinary upload fails", async () => {
    cloudinary.uploader.upload.mockRejectedValue(new Error("Cloudinary error"));

    const req = mockRequest({
      body: {
        file: "data:image/png;base64,BBB",
      },
    });
    const res = mockResponse();

    await uploadImage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Failed to upload image",
      })
    );
  });
});

describe("deleteImage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return 400 when publicId is missing", async () => {
    const req = mockRequest({ body: {} });
    const res = mockResponse();

    await deleteImage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "No public ID provided",
      })
    );
  });

  test("should delete image and return 200", async () => {
    cloudinary.uploader.destroy.mockResolvedValue({ result: "ok" });

    const req = mockRequest({ body: { publicId: "courses/test-id" } });
    const res = mockResponse();

    await deleteImage(req, res);

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("courses/test-id");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Image deleted successfully",
      })
    );
  });

  test("should return 500 when cloudinary delete fails", async () => {
    cloudinary.uploader.destroy.mockRejectedValue(new Error("Delete failed"));

    const req = mockRequest({ body: { publicId: "courses/test-id" } });
    const res = mockResponse();

    await deleteImage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Failed to delete image",
      })
    );
  });
});

