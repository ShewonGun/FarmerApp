import LoanCategory from "../../models/loan/LoanCategory.js";


// CREATE category
export const createLoanCategory = async (req, res) => {
  try {
    console.log("createLoanCategory hit with body:", req.body);

    const { name, interestRate, maxAmount } = req.body;

    const existing = await LoanCategory.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = new LoanCategory({
      name,
      interestRate,
      maxAmount,
    });

    await category.save();

    res.status(201).json({
      message: "Loan category created successfully",
      category,
    });
  } catch (error) {
    console.error("Error in createLoanCategory:", error);
    res.status(500).json({ error: error.message });
  }
};


// GET all categories
export const getAllLoanCategories = async (req, res) => {
  try {
    const categories = await LoanCategory.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// GET single category
export const getLoanCategoryById = async (req, res) => {
  try {
    const category = await LoanCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// UPDATE category
export const updateLoanCategory = async (req, res) => {
  try {
    const { name, interestRate, maxAmount } = req.body;

    const updated = await LoanCategory.findByIdAndUpdate(
      req.params.id,
      { name, interestRate, maxAmount },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      message: "Category updated successfully",
      updated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// DELETE category
export const deleteLoanCategory = async (req, res) => {
  try {
    const deleted = await LoanCategory.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};