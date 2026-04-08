const roundCurrency = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const getDurationInMonths = (duration = {}) => {
  switch (duration.unit) {
    case "days":
      return duration.value / 30;
    case "weeks":
      return duration.value / 4;
    case "years":
      return duration.value * 12;
    case "months":
    default:
      return duration.value;
  }
};

const getPaymentSchedule = (durationInMonths, paymentFrequency = "monthly") => {
  switch (paymentFrequency) {
    case "weekly":
      return {
        numberOfPayments: Math.max(1, Math.round(durationInMonths * 4)),
        periodsPerYear: 52,
      };
    case "biweekly":
      return {
        numberOfPayments: Math.max(1, Math.round(durationInMonths * 2)),
        periodsPerYear: 26,
      };
    case "quarterly":
      return {
        numberOfPayments: Math.max(1, Math.round(durationInMonths / 3)),
        periodsPerYear: 4,
      };
    case "monthly":
    default:
      return {
        numberOfPayments: Math.max(1, Math.round(durationInMonths)),
        periodsPerYear: 12,
      };
  }
};

export const calculateLoanDetails = (amount, plan) => {
  const principal = Number(amount);
  const durationInMonths = getDurationInMonths(plan.duration);
  const { numberOfPayments, periodsPerYear } = getPaymentSchedule(
    durationInMonths,
    plan.paymentFrequency
  );

  const annualRate = Number(plan.interestRate) / 100;
  let installmentAmount = 0;
  let totalInterest = 0;
  let totalPayable = 0;

  if (plan.interestType === "reducing" || plan.interestType === "compound") {
    const periodicRate = annualRate / periodsPerYear;

    if (periodicRate > 0) {
      installmentAmount =
        (principal * periodicRate * Math.pow(1 + periodicRate, numberOfPayments)) /
        (Math.pow(1 + periodicRate, numberOfPayments) - 1);
    } else {
      installmentAmount = principal / numberOfPayments;
    }

    totalPayable = installmentAmount * numberOfPayments;
    totalInterest = totalPayable - principal;
  } else {
    totalInterest = principal * annualRate * (durationInMonths / 12);
    totalPayable = principal + totalInterest;
    installmentAmount = totalPayable / numberOfPayments;
  }

  installmentAmount = roundCurrency(installmentAmount);
  totalInterest = roundCurrency(totalInterest);
  totalPayable = roundCurrency(totalPayable);

  return {
    durationMonths: roundCurrency(durationInMonths),
    numberOfPayments,
    totalInterest,
    totalPayable,
    installmentAmount,
    monthlyInstallment: installmentAmount,
    remainingBalance: totalPayable,
  };
};
