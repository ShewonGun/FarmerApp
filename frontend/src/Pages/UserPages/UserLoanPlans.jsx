import { useState, useEffect } from "react";
import UserLoanPlanCard from "../../Components/UserComponents/UserLoanPlanCard";
import { HiCreditCard, HiInformationCircle } from "react-icons/hi";

export default function LoanPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("http://localhost:5000/api/plans/active", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setPlans(data.plans);
      } else {
        setError(data.message || "Failed to fetch loan plans");
      }
    } catch (err) {
      setError("Failed to connect to server. Please try again later.");
      console.error("Error fetching plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyForLoan = (plan) => {
    // Handle loan application - you can navigate to application form or open modal
    console.log("Applying for loan plan:", plan);
    alert(`Application for "${plan.planName}" will be implemented soon!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Page Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight font-['Sora'] mb-2">
              Loan Plans
            </h1>
           
          </div>
          <span className="text-sm text-gray-400 dark:text-slate-500 font-medium font-['Sora']">
            {loading ? "..." : `${plans.length} plans available`}
          </span>
        </div>

       </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-['Sora']">
              Loading loan plans...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center justify-center py-20 px-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1 font-['Sora']">
                  Error loading plans
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 font-['Sora']">
                  {error}
                </p>
                <button
                  onClick={fetchPlans}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors font-['Sora']"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && plans.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <HiCreditCard className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2 font-['Sora']">
              No loan plans available
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
              There are no active loan plans at the moment. Please check back later.
            </p>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      {!loading && !error && plans.length > 0 && (
        <div className="px-6 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {plans.map((plan) => (
              <UserLoanPlanCard
                key={plan._id}
                plan={plan}
                onApply={handleApplyForLoan}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
