import React, { useEffect, useState } from 'react';
import { MdClose, MdBook, MdQuiz, MdVisibility, MdVisibilityOff, MdExpandMore, MdCheckCircle, MdRadioButtonUnchecked } from 'react-icons/md';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const PreviewModal = ({ isOpen, onClose, course }) => {
  const [expandedQuizzes, setExpandedQuizzes] = useState({});
  const [quizQuestions, setQuizQuestions] = useState({});
  
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setExpandedQuizzes({});
      setQuizQuestions({});
    }
  }, [isOpen]);

  // Fetch questions for a quiz
  const fetchQuizQuestions = async (quizId) => {
    if (quizQuestions[quizId]) return; // Already fetched
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/quiz/${quizId}/questions`,
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        setQuizQuestions(prev => ({
          ...prev,
          [quizId]: response.data.questions
        }));
      }
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
    }
  };

  // Toggle quiz expansion
  const toggleQuiz = (quizId) => {
    const isExpanding = !expandedQuizzes[quizId];
    
    setExpandedQuizzes(prev => ({
      ...prev,
      [quizId]: isExpanding
    }));

    if (isExpanding) {
      fetchQuizQuestions(quizId);
    }
  };

  if (!isOpen || !course) return null;

  const {
    title,
    description,
    thumbnailUrl,
    enrollmentCount,
    isPublished,
    noOfLessons,
    createdAt,
    lessons = [],
    quizzes = []
  } = course;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-lg shadow-2xl shadow-slate-900/20 dark:shadow-slate-950/60 border border-slate-200 dark:border-slate-700/60 overflow-hidden">

        {/* Header */}
        <div className={`px-4 py-3 flex items-center justify-between ${isPublished ? 'bg-linear-to-br from-emerald-500 to-teal-600' : 'bg-linear-to-br from-slate-400 to-slate-500'}`}>
          <div className="flex items-center gap-3">
            <h2 className="text-white font-bold text-[15px] leading-tight font-['Sora']">
                  Course Preview
                </h2>
            <div className="flex items-center gap-1.5 bg-white/20 text-white text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full font-['Sora']">
              {isPublished ? (
                <>
                  <MdVisibility className="text-xs" />
                  <span>Active</span>
                </>
              ) : (
                <>
                  <MdVisibilityOff className="text-xs" />
                  <span>Inactive</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="group bg-transparent border border-transparent text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-colors duration-150"
          >
            <MdClose className="text-base text-white transition-colors duration-150 group-hover:text-red-500 dark:group-hover:text-red-400" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto">
          {/* Course Info Section */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
            {/* Thumbnail */}
            {thumbnailUrl && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img
                  src={thumbnailUrl}
                  alt={title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Title */}
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2 leading-tight tracking-tight font-['Sora']">
              {title}
            </h2>

            {/* Description */}
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 font-['Sora']">
              {description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isPublished ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-100 dark:bg-slate-700/20'}`}>
                <MdBook className={`text-base ${isPublished ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className={`text-sm font-bold font-['Sora'] ${isPublished ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {lessons.length || noOfLessons || 0} Lessons
                </span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isPublished ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-slate-100 dark:bg-slate-700/20'}`}>
                <MdQuiz className={`text-base ${isPublished ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className={`text-sm font-bold font-['Sora'] ${isPublished ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {quizzes.length || 0} Quizzes
                </span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-['Sora']">
                {createdAt ? `Created ${new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
              </div>
            </div>
          </div>

          {/* Lessons Section */}
          {lessons && lessons.length > 0 && (
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider font-['Sora']">
                Course Lessons
              </h3>
              <div className="space-y-3">
                {lessons.map((lesson, index) => {
                  const youtubeVideoId = getYouTubeVideoId(lesson.youtubeUrl);
                  
                  return (
                    <div
                      key={lesson.id || lesson._id || index}
                      className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 overflow-hidden"
                    >
                      <div className="flex items-start gap-3 p-3">
                        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-['Sora'] ${
                          isPublished
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-['Sora'] mb-1">
                            {lesson.title}
                          </h4>
                          {lesson.content && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-['Sora'] line-clamp-2">
                              {lesson.content}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* YouTube Video Embed */}
                      {youtubeVideoId && (
                        <div className="px-3 pb-3">
                          <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                            <iframe
                              className="absolute top-0 left-0 w-full h-full"
                              src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                              title={lesson.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Lesson Thumbnail (if no YouTube video) */}
                      {!youtubeVideoId && lesson.thumbnailUrl && (
                        <div className="px-3 pb-3">
                          <img
                            src={lesson.thumbnailUrl}
                            alt={lesson.title}
                            className="w-full h-40 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quizzes Section */}
          {quizzes && quizzes.length > 0 && (
            <div className="px-6 py-5">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider font-['Sora']">
                Course Quizzes
              </h3>
              <div className="space-y-3">
                {quizzes.map((quiz, index) => {
                  const quizId = quiz._id || quiz.id;
                  const isExpanded = expandedQuizzes[quizId];
                  const questions = quizQuestions[quizId] || [];
                  
                  return (
                    <div
                      key={quizId || index}
                      className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 overflow-hidden"
                    >
                      {/* Quiz Header - Clickable */}
                      <button
                        onClick={() => toggleQuiz(quizId)}
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-100 dark:hover:bg-slate-700/30 transition-colors duration-150 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-['Sora'] ${
                            isPublished
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                              : 'bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400'
                          }`}>
                            Q{index + 1}
                          </div>
                          <div className="text-left">
                            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-['Sora']">
                              {quiz.title}
                            </h4>
                            {quiz.passingScore && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-['Sora']">
                                Passing score: {quiz.passingScore}%
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {quiz.questionCount > 0 && (
                            <span className={`text-xs font-semibold font-['Sora'] ${
                              isPublished
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}>
                              {quiz.questionCount} Questions
                            </span>
                          )}
                          <MdExpandMore 
                            className={`text-xl text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {/* Questions List - Expandable */}
                      {isExpanded && (
                        <div className="border-t border-slate-200 dark:border-slate-700">
                          {questions.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                              Loading questions...
                            </div>
                          ) : (
                            <div className="p-3 space-y-3">
                              {questions.map((question, qIndex) => (
                                <div
                                  key={question._id || question.id || qIndex}
                                  className="p-3 rounded-lg bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
                                >
                                  {/* Question Text */}
                                  <div className="flex items-start gap-2 mb-3">
                                    <span className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold font-['Sora'] ${
                                      isPublished
                                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                        : 'bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400'
                                    }`}>
                                      {qIndex + 1}
                                    </span>
                                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 font-['Sora'] flex-1">
                                      {question.questionText}
                                    </p>
                                  </div>

                                  {/* Choices */}
                                  <div className="space-y-2 ml-8">
                                    {question.choices && question.choices.map((choice, cIndex) => (
                                      <div
                                        key={cIndex}
                                        className={`flex items-start gap-2 p-2 rounded-md transition-colors ${
                                          choice.isCorrect
                                            ? isPublished
                                              ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50'
                                              : 'bg-slate-100 dark:bg-slate-700/20 border border-slate-300 dark:border-slate-600/50'
                                            : 'bg-slate-50 dark:bg-slate-800/30'
                                        }`}
                                      >
                                        {choice.isCorrect ? (
                                          <MdCheckCircle className={`shrink-0 text-sm mt-0.5 ${
                                            isPublished
                                              ? 'text-emerald-600 dark:text-emerald-400'
                                              : 'text-slate-600 dark:text-slate-400'
                                          }`} />
                                        ) : (
                                          <MdRadioButtonUnchecked className="shrink-0 text-sm mt-0.5 text-slate-400 dark:text-slate-500" />
                                        )}
                                        <span className={`text-xs font-['Sora'] ${
                                          choice.isCorrect
                                            ? 'font-semibold text-slate-800 dark:text-slate-200'
                                            : 'text-slate-600 dark:text-slate-400'
                                        }`}>
                                          {choice.choiceText}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {(!lessons || lessons.length === 0) && (!quizzes || quizzes.length === 0) && (
            <div className="px-6 py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <MdBook className="text-3xl text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2 font-['Sora']">
                No Content Yet
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
                Add lessons and quizzes to this course to get started.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-md text-[12px] font-semibold text-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer font-['Sora'] active:scale-95 ${
              isPublished
                ? 'bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-200 dark:shadow-emerald-900/30 hover:shadow-emerald-200/80 dark:hover:shadow-emerald-900/40'
                : 'bg-linear-to-r from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600 shadow-slate-200 dark:shadow-slate-900/30 hover:shadow-slate-200/80 dark:hover:shadow-slate-900/40'
            }`}
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
