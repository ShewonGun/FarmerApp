export const calculateLoanDetails = (
  amount, 
  interestRate, 
  durationMonths
) => {
  const interestAmount = (amount * interestRate) / 100;
  const totalPayable = amount + interestAmount;
  const monthlyInstallment = totalPayable / durationMonths;

  return {
    totalPayable,
    monthlyInstallment,
    remainingBalance: totalPayable,
  };
};
