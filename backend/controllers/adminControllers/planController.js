import Plan from "../../models/admin/Plan.js";
import mongoose from "mongoose";

// Create a new loan plan
export const createPlan = async (req, res) => {
    try {
        const {
            planName,
            description,
            duration,
            interestRate,
            interestType,
            paymentFrequency,
            maxLoanAmount,
            minLoanAmount,
            latePenalty
        } = req.body;

        // Validation
        if (!planName || !duration?.value || !interestRate || !maxLoanAmount || !minLoanAmount) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        // Check if min is less than max
        if (minLoanAmount > maxLoanAmount) {
            return res.status(400).json({
                success: false,
                message: "Minimum loan amount cannot be greater than maximum loan amount"
            });
        }

        // Check if plan name already exists
        const existingPlan = await Plan.findOne({ planName });
        if (existingPlan) {
            return res.status(400).json({
                success: false,
                message: "Plan with this name already exists"
            });
        }

        const plan = new Plan({
            planName,
            description,
            duration,
            interestRate,
            interestType,
            paymentFrequency,
            maxLoanAmount,
            minLoanAmount,
            latePenalty
        });

        await plan.save();

        res.status(201).json({
            success: true,
            plan,
            message: "Loan plan created successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all loan plans
export const getAllPlans = async (req, res) => {
    try {
        const { isActive, interestType, paymentFrequency } = req.query;
        const filter = {};

        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }
        if (interestType) {
            filter.interestType = interestType;
        }
        if (paymentFrequency) {
            filter.paymentFrequency = paymentFrequency;
        }

        const plans = await Plan.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: plans.length,
            plans
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get active plans only (for users selecting a plan)
export const getActivePlans = async (req, res) => {
    try {
        const plans = await Plan.find({ isActive: true }).sort({ interestRate: 1 });

        res.status(200).json({
            success: true,
            count: plans.length,
            plans
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get plan by ID
export const getPlanById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan ID"
            });
        }

        const plan = await Plan.findById(id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found"
            });
        }

        res.status(200).json({
            success: true,
            plan
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a loan plan
export const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan ID"
            });
        }

        // Check if min is less than max when updating
        if (updates.minLoanAmount && updates.maxLoanAmount) {
            if (updates.minLoanAmount > updates.maxLoanAmount) {
                return res.status(400).json({
                    success: false,
                    message: "Minimum loan amount cannot be greater than maximum loan amount"
                });
            }
        }

        // Update the updatedAt field
        updates.updatedAt = Date.now();

        const plan = await Plan.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found"
            });
        }

        res.status(200).json({
            success: true,
            plan,
            message: "Plan updated successfully"
        });
    } catch (error) {
        // Handle unique constraint error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Plan name already exists"
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// Toggle plan active status
export const togglePlanStatus = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan ID"
            });
        }

        const plan = await Plan.findById(id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found"
            });
        }

        plan.isActive = !plan.isActive;
        plan.updatedAt = Date.now();
        await plan.save();

        res.status(200).json({
            success: true,
            plan,
            message: `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a loan plan
export const deletePlan = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan ID"
            });
        }

        const plan = await Plan.findByIdAndDelete(id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Plan deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Calculate EMI for a given loan amount and plan
export const calculateEMI = async (req, res) => {
    try {
        const { id } = req.params;
        const { loanAmount } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan ID"
            });
        }

        if (!loanAmount || loanAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid loan amount is required"
            });
        }

        const plan = await Plan.findById(id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found"
            });
        }

        // Check if loan amount is within range
        if (loanAmount < plan.minLoanAmount || loanAmount > plan.maxLoanAmount) {
            return res.status(400).json({
                success: false,
                message: `Loan amount must be between ${plan.minLoanAmount} and ${plan.maxLoanAmount}`
            });
        }

        // Convert duration to months
        let durationInMonths;
        switch (plan.duration.unit) {
            case 'days':
                durationInMonths = plan.duration.value / 30;
                break;
            case 'weeks':
                durationInMonths = plan.duration.value / 4;
                break;
            case 'months':
                durationInMonths = plan.duration.value;
                break;
            case 'years':
                durationInMonths = plan.duration.value * 12;
                break;
            default:
                durationInMonths = plan.duration.value;
        }

        // Calculate number of payments based on payment frequency
        let numberOfPayments;
        let periodsPerYear;
        switch (plan.paymentFrequency) {
            case 'weekly':
                numberOfPayments = durationInMonths * 4;
                periodsPerYear = 52;
                break;
            case 'biweekly':
                numberOfPayments = durationInMonths * 2;
                periodsPerYear = 26;
                break;
            case 'monthly':
                numberOfPayments = durationInMonths;
                periodsPerYear = 12;
                break;
            case 'quarterly':
                numberOfPayments = durationInMonths / 3;
                periodsPerYear = 4;
                break;
            default:
                numberOfPayments = durationInMonths;
                periodsPerYear = 12;
        }

        let emi, totalInterest, totalAmount;
        const principal = loanAmount;
        const annualRate = plan.interestRate / 100;

        if (plan.interestType === 'flat') {
            // Flat rate: Interest calculated on principal for entire duration
            totalInterest = principal * annualRate * (durationInMonths / 12);
            totalAmount = principal + totalInterest;
            emi = totalAmount / numberOfPayments;
        } else if (plan.interestType === 'simple') {
            // Simple interest
            totalInterest = principal * annualRate * (durationInMonths / 12);
            totalAmount = principal + totalInterest;
            emi = totalAmount / numberOfPayments;
        } else if (plan.interestType === 'reducing' || plan.interestType === 'compound') {
            // Reducing balance / Compound interest (standard EMI formula)
            const periodicRate = annualRate / periodsPerYear;
            
            if (periodicRate > 0) {
                emi = principal * periodicRate * Math.pow(1 + periodicRate, numberOfPayments) /
                      (Math.pow(1 + periodicRate, numberOfPayments) - 1);
            } else {
                emi = principal / numberOfPayments;
            }
            
            totalAmount = emi * numberOfPayments;
            totalInterest = totalAmount - principal;
        }

        // Round to 2 decimal places
        emi = Math.round(emi * 100) / 100;
        totalAmount = Math.round(totalAmount * 100) / 100;
        totalInterest = Math.round(totalInterest * 100) / 100;

        res.status(200).json({
            success: true,
            calculation: {
                planName: plan.planName,
                loanAmount: principal,
                interestRate: plan.interestRate,
                interestType: plan.interestType,
                duration: plan.duration,
                paymentFrequency: plan.paymentFrequency,
                numberOfPayments: Math.round(numberOfPayments),
                emiAmount: emi,
                totalInterest: totalInterest,
                totalRepaymentAmount: totalAmount,
                latePenalty: plan.latePenalty
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
