import mongoose from "mongoose";
import LoanCategory from "../../models/loan/LoanCategory.js";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const normalizeStringArray = (values) => {
  if (!Array.isArray(values)) {
    return undefined;
  }

  return values
    .map((value) => String(value).trim())
    .filter(Boolean);
};

const buildCategoryPayload = (body) => ({
  name: body.name?.trim(),
  code: body.code?.trim().toUpperCase(),
  description: body.description?.trim(),
  isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
  requiredDocuments: normalizeStringArray(body.requiredDocuments),
  eligiblePurposes: normalizeStringArray(body.eligiblePurposes),
  displayOrder: Number.isFinite(Number(body.displayOrder)) ? Number(body.displayOrder) : undefined,
});

export const createLoanCategory = async (req, res) => {
  try {
    const payload = buildCategoryPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existingByName = await LoanCategory.findOne({ name: payload.name });
    if (existingByName) {
      return res.status(400).json({ message: "Category already exists" });
    }

    if (payload.code) {
      const existingByCode = await LoanCategory.findOne({ code: payload.code });
      if (existingByCode) {
        return res.status(400).json({ message: "Category code already exists" });
      }
    }

    const category = new LoanCategory(payload);
    await category.save();

    return res.status(201).json({
      message: "Loan category created successfully",
      category,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAllLoanCategories = async (req, res) => {
  try {
    const categories = await LoanCategory.find().sort({ displayOrder: 1, name: 1 });
    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getLoanCategoryById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await LoanCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json(category);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateLoanCategory = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const payload = buildCategoryPayload(req.body);

    if (payload.name) {
      const existingByName = await LoanCategory.findOne({
        name: payload.name,
        _id: { $ne: req.params.id },
      });

      if (existingByName) {
        return res.status(400).json({ message: "Category already exists" });
      }
    }

    if (payload.code) {
      const existingByCode = await LoanCategory.findOne({
        code: payload.code,
        _id: { $ne: req.params.id },
      });

      if (existingByCode) {
        return res.status(400).json({ message: "Category code already exists" });
      }
    }

    const updated = await LoanCategory.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({
      message: "Category updated successfully",
      updated,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteLoanCategory = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const deleted = await LoanCategory.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
