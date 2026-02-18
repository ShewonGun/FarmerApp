import React from "react";
import {
  HiAcademicCap,
} from "react-icons/hi";

export default function UserQuizModal({
  activeQuiz,
  quizQuestions,
  userAnswers,
  handleAnswerSelect,
  submitQuiz,
  submittingQuiz,
  closeQuiz,
}) {
  if (!activeQuiz) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full my-8">
        {/* Quiz Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiAcademicCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
              {activeQuiz.title}
            </h3>
          </div>
          <button
            onClick={closeQuiz}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quiz Info */}
        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800">
          <p className="text-xs text-slate-700 dark:text-slate-300 font-['Sora']">
            {quizQuestions.length} questions • Passing Score: {activeQuiz.passingScore}%
          </p>
        </div>

        {/* Questions */}
        <div className="px-4 py-4 max-h-[60vh] overflow-y-auto">
          {quizQuestions.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-8 font-['Sora']">
              No questions available for this quiz.
            </p>
          ) : (
            <div className="space-y-4">
              {quizQuestions.map((question, qIndex) => (
                <div key={question._id} className="pb-4 border-b border-slate-200 dark:border-slate-700 last:border-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3 font-['Sora']">
                    {qIndex + 1}. {question.questionText}
                  </p>
                  <div className="space-y-2">
                    {question.choices.map((choice) => (
                      <label
                        key={choice._id}
                        className={`flex items-start gap-2 p-2.5 rounded-md border cursor-pointer transition-all font-['Sora'] ${
                          userAnswers[question._id] === choice._id
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question._id}`}
                          checked={userAnswers[question._id] === choice._id}
                          onChange={() => handleAnswerSelect(question._id, choice._id)}
                          className="mt-0.5 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                          {choice.choiceText || choice.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quiz Footer */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-['Sora']">
            Answered: {Object.keys(userAnswers).length} / {quizQuestions.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={closeQuiz}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors font-['Sora']"
            >
              Cancel
            </button>
            <button
              onClick={submitQuiz}
              disabled={Object.keys(userAnswers).length !== quizQuestions.length || submittingQuiz}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors font-['Sora'] ${
                Object.keys(userAnswers).length === quizQuestions.length && !submittingQuiz
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
              }`}
            >
              {submittingQuiz ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
