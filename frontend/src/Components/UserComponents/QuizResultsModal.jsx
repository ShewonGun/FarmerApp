import React, { useState, useEffect } from "react";
import {
  HiCheckCircle,
  HiXCircle,
  HiLightBulb,
  HiRefresh,
} from "react-icons/hi";

export default function QuizResultsModal({
  quizResults,
  attemptId,
  onClose,
  onRetake,
}) {
  const [explanations, setExplanations] = useState([]);
  const [loadingExplanations, setLoadingExplanations] = useState(false);
  const [explanationError, setExplanationError] = useState(null);
  const [insightsGenerated, setInsightsGenerated] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const fetchAIExplanations = async () => {
    setLoadingExplanations(true);
    setExplanationError(null);
    setInsightsGenerated(true);
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/progress/${attemptId}/ai-explanations`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setExplanations(data.explanations || []);
      } else {
        setExplanationError(data.message || "Failed to fetch explanations");
      }
    } catch (err) {
      console.error("Error fetching AI explanations:", err);
      setExplanationError("Failed to load AI explanations");
    } finally {
      setLoadingExplanations(false);
    }
  };
  
  if (!quizResults) return null;

  const { percentage, passed, passingScore, correctAnswers, totalQuestions } = quizResults;
  const incorrectAnswers = totalQuestions - correctAnswers;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full my-8">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {passed ? (
              <HiCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <HiXCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
              Quiz Results
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status Banner */}
        <div className={`px-4 py-2 border-b border-t ${
          passed 
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800" 
            : "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800"
        }`}>
          <p className={`text-xs font-medium font-['Sora'] ${
            passed 
              ? "text-emerald-700 dark:text-emerald-300" 
              : "text-red-700 dark:text-red-300"
          }`}>
            {passed 
              ? incorrectAnswers > 0 
                ? "Passed • Review AI insights below to improve" 
                : "Passed • Perfect score!"
              : "Not Passed • Review and try again"}
          </p>
        </div>

        {/* Score Grid */}
        <div className="px-4 py-4 grid grid-cols-4 gap-3 border-b border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <p className={`text-2xl font-bold font-['Sora'] ${
              passed 
                ? "text-emerald-600 dark:text-emerald-400" 
                : "text-red-600 dark:text-red-400"
            }`}>
              {percentage}%
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-['Sora'] mt-0.5">
              Score
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-['Sora']">
              {correctAnswers}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-['Sora'] mt-0.5">
              Correct
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-['Sora']">
              {incorrectAnswers}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-['Sora'] mt-0.5">
              Wrong
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-400 dark:text-slate-500 font-['Sora']">
              {passingScore}%
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-['Sora'] mt-0.5">
              Required
            </p>
          </div>
        </div>

        {/* AI Insights Section */}
        {incorrectAnswers > 0 && (
          <div className="px-4 py-4 max-h-[50vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                AI Insights
              </h4>
            </div>

            {loadingExplanations ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-700 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="ml-2 text-xs text-slate-600 dark:text-slate-400 font-['Sora']">
                  Generating insights...
                </p>
              </div>
            ) : explanationError ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
                <p className="text-xs text-red-700 dark:text-red-400 font-['Sora']">
                  {explanationError}
                </p>
                <button
                  onClick={fetchAIExplanations}
                  disabled={loadingExplanations}
                  className="mt-2 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors font-['Sora']"
                >
                  Try Again
                </button>
              </div>
            ) : !insightsGenerated ? (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-md px-4 py-6 text-center">
                <HiLightBulb className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs text-slate-600 dark:text-slate-400 font-['Sora'] mb-3">
                  Get AI-powered explanations for your wrong answers
                </p>
                <button
                  onClick={fetchAIExplanations}
                  disabled={loadingExplanations}
                  className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors font-['Sora'] inline-flex items-center gap-2"
                >
                  
                  Generate Insights
                </button>
              </div>
            ) : explanations.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-md px-3 py-2">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-['Sora']">
                  No insights available for these answers.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {explanations.map((explanation, index) => (
                  <div
                    key={explanation.questionId || index}
                    className="bg-slate-50 dark:bg-slate-700/50 rounded-md p-3 border border-slate-200 dark:border-slate-600"
                  >
                    {/* Question */}
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100 mb-2 font-['Sora']">
                      {explanation.questionText}
                    </p>

                    {/* Answer Comparison */}
                    <div className="space-y-2 mb-2">
                      <div className="flex items-start gap-2">
                        <div className="w-1 h-full bg-red-300 dark:bg-red-500/30 rounded-full mt-1"></div>
                        <div className="flex-1">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-['Sora'] mb-0.5">
                            Your answer
                          </p>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-['Sora']">
                            {explanation.selectedChoice.text}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="w-1 h-full bg-emerald-300 dark:bg-emerald-500/30 rounded-full mt-1"></div>
                        <div className="flex-1">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-['Sora'] mb-0.5">
                            Correct answer
                          </p>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-['Sora']">
                            {explanation.correctChoice.text}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* AI Explanation */}
                    <div className="bg-white dark:bg-slate-800 rounded px-3 py-2 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-['Sora'] leading-relaxed">
                        {explanation.aiExplanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
          {!passed && onRetake && (
            <button
              onClick={onRetake}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors flex items-center gap-1.5 font-['Sora']"
            >
              <HiRefresh className="w-3.5 h-3.5" />
              Retake
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors font-['Sora']"
          >
            {passed ? "Continue" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
