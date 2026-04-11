export const getDurationInMonths = (duration = {}) => {
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

export const getPaymentSchedule = (durationInMonths, paymentFrequency = "monthly") => {
  switch (paymentFrequency) {
    case "weekly":
      return Math.max(1, Math.round(durationInMonths * 4));
    case "biweekly":
      return Math.max(1, Math.round(durationInMonths * 2));
    case "quarterly":
      return Math.max(1, Math.round(durationInMonths / 3));
    case "monthly":
    default:
      return Math.max(1, Math.round(durationInMonths));
  }
};

export const calculatePreview = (amount, plan) => {
  const principal = Number(amount);

  if (!plan || !Number.isFinite(principal) || principal <= 0) {
    return null;
  }

  const durationInMonths = getDurationInMonths(plan.duration);
  const numberOfPayments = getPaymentSchedule(durationInMonths, plan.paymentFrequency);
  const annualRate = Number(plan.interestRate) / 100;
  let installmentAmount = 0;
  let totalInterest = 0;
  let totalPayable = 0;

  if (plan.interestType === "reducing" || plan.interestType === "compound") {
    const periodsPerYear =
      plan.paymentFrequency === "weekly"
        ? 52
        : plan.paymentFrequency === "biweekly"
          ? 26
          : plan.paymentFrequency === "quarterly"
            ? 4
            : 12;
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

  return {
    installmentAmount: Math.round(installmentAmount * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayable: Math.round(totalPayable * 100) / 100,
    numberOfPayments,
  };
};

export const calculatePenaltyExample = (plan, installmentAmount) => {
  const normalizedInstallment = Number(installmentAmount || 0);
  const penaltyValue = Number(plan?.latePenalty?.value || 0);

  if (!plan?.latePenalty || normalizedInstallment <= 0 || penaltyValue <= 0) {
    return 0;
  }

  if (plan.latePenalty.type === "fixed") {
    return Math.round((penaltyValue + Number.EPSILON) * 100) / 100;
  }

  return Math.round((((normalizedInstallment * penaltyValue) / 100) + Number.EPSILON) * 100) / 100;
};

export const formatDuration = (duration = {}) => {
  if (!duration.value || !duration.unit) {
    return "-";
  }

  const label =
    duration.unit === "months"
      ? duration.value === 1
        ? "Month"
        : "Months"
      : duration.unit === "years"
        ? duration.value === 1
          ? "Year"
          : "Years"
        : duration.unit === "weeks"
          ? duration.value === 1
            ? "Week"
            : "Weeks"
          : duration.value === 1
            ? "Day"
            : "Days";

  return `${duration.value} ${label}`;
};

export const formatFrequency = (frequency) => {
  const labels = {
    weekly: "Weekly",
    biweekly: "Bi-weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
  };

  return labels[frequency] || frequency || "-";
};

export const formatInterestType = (type) => {
  const labels = {
    simple: "Simple",
    compound: "Compound",
    flat: "Flat",
    reducing: "Reducing",
  };

  return labels[type] || type || "-";
};
