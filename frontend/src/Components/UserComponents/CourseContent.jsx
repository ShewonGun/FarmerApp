import {
  HiBookOpen,
  HiCheckCircle,
  HiPlay,
  HiChevronDown,
  HiChevronUp,
  HiAcademicCap,
  HiLockClosed,
} from "react-icons/hi";

export default function CourseContent({
  lessons,
  quizzes,
  enrollment,
  expandedLesson,
  toggleLesson,
  isLessonCompleted,
  isQuizCompleted,
  startQuiz,
  markLessonComplete,
  completingLesson,
  failedQuizzes,
  getYouTubeEmbedUrl,
}) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 font-['Sora']">
        Course Content
      </h2>

      {lessons.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 text-center">
          <HiBookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-400 font-['Sora']">
            No lessons available yet
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson, index) => {
            const isExpanded = expandedLesson === lesson._id;
            const lessonCompleted = isLessonCompleted(lesson._id);
            const quiz = quizzes[lesson._id];
            const quizCompleted = quiz ? isQuizCompleted(quiz._id) : false;
            const isLocked = !enrollment && index > 0;

            return (
              <div
                key={lesson._id}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                {/* Lesson Header */}
                <button
                  onClick={() => !isLocked && toggleLesson(lesson._id)}
                  disabled={isLocked}
                  className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
                    isLocked
                      ? "cursor-not-allowed opacity-60"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-xs font-['Sora'] shrink-0">
                      {index + 1}
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-0.5 font-['Sora']">
                        {lesson.title}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {lesson.youtubeUrl && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-['Sora']">
                            <HiPlay className="w-3 h-3" />
                            Video
                          </span>
                        )}
                        {lesson.isQuizAvailable && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-['Sora']">
                              <HiAcademicCap className="w-3 h-3" />
                              Quiz Available
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLocked ? (
                      <HiLockClosed className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    ) : lessonCompleted ? (
                      <HiCheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : null}
                    {!isLocked && (
                      isExpanded ? (
                        <HiChevronUp className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      ) : (
                        <HiChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      )
                    )}
                  </div>
                </button>

                {/* Lesson Content (expanded) */}
                {isExpanded && !isLocked && (
                  <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <div className="space-y-3">
                      {/* Lesson Description */}
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-['Sora'] whitespace-pre-wrap">
                          {lesson.content}
                        </p>
                      </div>

                      {/* YouTube Video */}
                      {lesson.youtubeUrl && (
                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800">
                          <iframe
                            src={getYouTubeEmbedUrl(lesson.youtubeUrl)}
                            title={lesson.title}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        </div>
                      )}

                      {/* Quiz Section */}
                      {lesson.isQuizAvailable && quiz && (
                        <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-md border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                <HiAcademicCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                                  {quiz.title}
                                </h4>
                              </div>
                              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-['Sora']">
                                Passing Score: {quiz.passingScore}%
                              </p>
                            </div>
                            {quizCompleted && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">
                                <HiCheckCircle className="w-3 h-3" />
                                Passed
                              </span>
                            )}
                          </div>
                          {enrollment ? (
                            !quizCompleted ? (
                              <button
                                onClick={() => startQuiz(lesson._id)}
                                className="w-full px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition-colors font-['Sora']"
                              >
                                {failedQuizzes[quiz._id] ? "Retake Quiz" : "Start Quiz"}
                              </button>
                            ) : null
                          ) : (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-['Sora']">
                              Enroll to access quiz
                            </p>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      {enrollment && (
                        <div className="flex gap-2 pt-1">
                          {lessonCompleted ? (
                            <span className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs font-semibold flex items-center gap-2">
                              <HiCheckCircle className="w-3.5 h-3.5" />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => markLessonComplete(lesson._id)}
                              disabled={completingLesson === lesson._id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition-colors font-['Sora'] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                              {completingLesson === lesson._id ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Marking...</span>
                                </>
                              ) : (
                                <>
                                  <HiCheckCircle className="w-3.5 h-3.5" />
                                  <span>Mark as Complete</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
