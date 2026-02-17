import React, { useState } from 'react';
import { MdPeople, MdBook, MdEdit, MdDelete, MdVisibility, MdVisibilityOff, MdAdd } from 'react-icons/md';
import AddLessonModal from './AddLessonModal';
import AddQuizModal from './AddQuizModal';
import PreviewModal from './PreviewModal';
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

const CourseCard = ({ course, onEdit, onDelete, onToggleActive, onAddLesson, onEditLesson, onDeleteLesson, onAddQuiz, onEditQuiz, onDeleteQuiz }) => {
  const [activeTab, setActiveTab] = useState('lessons');
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [selectedLessonForQuiz, setSelectedLessonForQuiz] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  const {
    _id,
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

  const handleLessonSubmit = async (lessonData) => {
    if (editingLesson) {
      await onEditLesson(editingLesson._id || editingLesson.id, lessonData);
    } else {
      await onAddLesson(_id, lessonData);
    }
    setEditingLesson(null);
    setIsLessonModalOpen(false);
  };

  const openEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setIsLessonModalOpen(true);
  };

  const handleLessonModalClose = () => {
    setEditingLesson(null);
    setIsLessonModalOpen(false);
  };

  const openAddQuizToLesson = (lesson) => {
    setSelectedLessonForQuiz(lesson);
    setIsQuizModalOpen(true);
  };

  const handleQuizSubmit = async (quizData) => {
    if (editingQuiz) {
      await onEditQuiz(editingQuiz._id || editingQuiz.id, quizData);
    } else if (onAddQuiz && selectedLessonForQuiz) {
      await onAddQuiz(selectedLessonForQuiz._id || selectedLessonForQuiz.id, quizData);
    }
    setEditingQuiz(null);
    setSelectedLessonForQuiz(null);
    setIsQuizModalOpen(false);
  };

  const handleQuizModalClose = () => {
    setEditingQuiz(null);
    setSelectedLessonForQuiz(null);
    setIsQuizModalOpen(false);
  };

  const openEditQuiz = async (quiz) => {
    try {
      // Fetch the full quiz data with questions from the backend
      const response = await axios.get(
        `${API_BASE_URL}/lessons/${quiz.lesson}/quiz`,
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        const fullQuizData = response.data.quiz;
        setEditingQuiz(fullQuizData);
        setIsQuizModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching quiz details:', error);
      // Fallback to opening with basic data if fetch fails
      setEditingQuiz(quiz);
      setIsQuizModalOpen(true);
    }
  };

  return (
    <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-300 w-full">
      {/* Header Stripe */}
      <div className={`px-3 py-2 flex items-center justify-between ${isPublished ? 'bg-linear-to-br from-emerald-500 to-teal-600' : 'bg-linear-to-br from-slate-400 to-slate-500'}`}>
        <div className="flex items-center gap-2">
          
          <button
            onClick={() => onToggleActive && onToggleActive(_id, isPublished)}
            title={isPublished ? "Click to make inactive" : "Click to make active"}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full font-['Sora'] transition-colors duration-150 cursor-pointer"
          >
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
          </button>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => onEdit && onEdit(course)}
            title="Edit Course"
            className="group bg-transparent border border-transparent text-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer transition-colors duration-150"
          >
            <MdEdit className="text-sm text-white transition-colors duration-150 group-hover:text-emerald-500 dark:group-hover:text-emerald-400" />
          </button>
          <button
            onClick={() => onDelete && onDelete(_id, title)}
            title="Delete Course"
            className="group bg-transparent border border-transparent text-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer transition-colors duration-150"
          >
            <MdDelete className="text-sm text-white transition-colors duration-150 group-hover:text-red-500 dark:group-hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-14">
        {/* Course Name */}
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1.5 leading-tight tracking-tight font-['Sora'] truncate">
          {title}
        </h2>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight mb-3 font-['Sora'] truncate">
          {description}
        </p>

        {/* Stats Row */}
        <div className={`flex items-center rounded-lg py-2 mb-3 ${isPublished ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-100 dark:bg-slate-700/20'}`}>
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className={`text-base font-bold font-['Sora'] ${isPublished ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {lessons.length || noOfLessons || 0}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-['Sora']">
              Lessons
            </span>
          </div>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-600" />
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className={`text-base font-bold font-['Sora'] ${isPublished ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {quizzes.length || 0}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-['Sora']">
              Quizzes
            </span>
          </div>
          
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-slate-200 dark:border-slate-700 mb-1">
          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-3 py-1.5 text-xs font-semibold tracking-wide border-b-2 -mb-px transition-colors duration-150 font-['Sora'] ${
              activeTab === 'lessons'
                ? isPublished 
                  ? 'text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 border-slate-600 dark:border-slate-400'
                : 'text-slate-400 dark:text-slate-500 border-transparent hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Lessons
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-3 py-1.5 text-xs font-semibold tracking-wide border-b-2 -mb-px transition-colors duration-150 font-['Sora'] ${
              activeTab === 'quizzes'
                ? isPublished 
                  ? 'text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 border-slate-600 dark:border-slate-400'
                : 'text-slate-400 dark:text-slate-500 border-transparent hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Quizzes
          </button>
        </div>

        {/* Lessons Tab Content */}
        {activeTab === 'lessons' && (
          <ul className="list-none p-0 py-1 m-0 max-h-18.75 overflow-y-auto">
            {(!lessons || lessons.length === 0) && (
              <li className="text-center text-slate-400 dark:text-slate-500 py-3 text-xs font-['Sora']">
                No lessons yet.
              </li>
            )}
            {lessons && lessons.map((lesson, i) => (
              <li
                key={lesson.id || lesson._id || i}
                className="group/lesson flex items-center justify-between py-1.5 px-1 border-b border-slate-200 dark:border-slate-700 gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors duration-200"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 shrink-0 font-['Sora'] ${
                    isPublished 
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
                      : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/30'
                  }`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 truncate font-['Sora']">
                    {lesson.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 max-w-0 overflow-hidden group-hover/lesson:max-w-xs transition-all duration-300 ease-out">
                  <button
                    onClick={() => openEditLesson(lesson)}
                    title="Edit lesson"
                    className="group p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors duration-150"
                  >
                    <MdEdit className={`text-[12px] text-slate-400 dark:text-slate-500 transition-colors duration-150 ${
                      isPublished 
                        ? 'group-hover:text-emerald-500 dark:group-hover:text-emerald-400'
                        : 'group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`} />
                  </button>
                  <button
                    onClick={() => onDeleteLesson && onDeleteLesson(lesson._id || lesson.id, lesson.title)}
                    title="Delete lesson"
                    className="group p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors duration-150"
                  >
                    <MdDelete className="text-[12px] text-slate-400 dark:text-slate-500 transition-colors duration-150 group-hover:text-red-500 dark:group-hover:text-red-400" />
                  </button>
                  <button
                    onClick={() => openAddQuizToLesson(lesson)}
                    title="Add quiz to this lesson"
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-all duration-150 cursor-pointer whitespace-nowrap ${
                      isPublished
                        ? 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50'
                        : 'bg-slate-100 dark:bg-slate-700/20 hover:bg-slate-200 dark:hover:bg-slate-700/30 border border-slate-300 dark:border-slate-600/50'
                    }`}
                  >
                    <MdAdd className={`text-[10px] ${isPublished ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`} />
                    <span className={`text-[9px] font-medium font-['Sora'] ${isPublished ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>Quiz</span>
                  </button>
                </div>
              </li>
            ))}
            {/* Add Lesson Button */}
            <li className="py-1.5 px-1">
              <button
                onClick={() => setIsLessonModalOpen(true)}
                className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all duration-150 cursor-pointer group ${
                  isPublished
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50'
                    : 'bg-slate-100 dark:bg-slate-700/20 hover:bg-slate-200 dark:hover:bg-slate-700/30 border border-slate-300 dark:border-slate-600/50'
                }`}
              >
                <MdAdd className={`text-sm ${isPublished ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`} />
                <span className={`text-xs font-medium font-['Sora'] ${isPublished ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>Add Lesson</span>
              </button>
            </li>
          </ul>
        )}

        {/* Quizzes Tab Content */}
        {activeTab === 'quizzes' && (
          <ul className="list-none p-0 py-1 m-0 max-h-18.75 overflow-y-auto">
            {(!quizzes || quizzes.length === 0) && (
              <li className="text-center text-slate-400 dark:text-slate-500 py-3 text-xs font-['Sora']">
                No quizzes yet.
              </li>
            )}
            {quizzes && quizzes.map((quiz, i) => (
              <li
                key={quiz.id || quiz._id || i}
                className="group/quiz flex items-center justify-between py-1.5 px-1 border-b border-slate-200 dark:border-slate-700 gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors duration-200"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 shrink-0 font-['Sora'] ${
                    isPublished
                      ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30'
                      : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/30'
                  }`}>
                    Q{i + 1}
                  </span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 truncate font-['Sora']">
                    {quiz.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 max-w-0 overflow-hidden group-hover/quiz:max-w-xs transition-all duration-300 ease-out">
                    <button
                      onClick={() => openEditQuiz(quiz)}
                      title="Edit quiz"
                      className="group p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors duration-150"
                    >
                      <MdEdit className={`text-[12px] text-slate-400 dark:text-slate-500 transition-colors duration-150 ${
                        isPublished
                          ? 'group-hover:text-emerald-500 dark:group-hover:text-emerald-400'
                          : 'group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }`} />
                    </button>
                    <button
                      onClick={() => onDeleteQuiz && onDeleteQuiz(quiz._id || quiz.id, quiz.title)}
                      title="Delete quiz"
                      className="group p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors duration-150"
                    >
                      <MdDelete className="text-[12px] text-slate-400 dark:text-slate-500 transition-colors duration-150 group-hover:text-red-500 dark:group-hover:text-red-400" />
                    </button>
                  </div>
                  <span className={`text-[10px] font-['Sora'] ${isPublished ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {quiz.questionCount || 0} Qs
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="absolute left-0 right-0 bottom-0 flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-['Sora']">
          {createdAt ? `Created ${new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Last updated · 2 days ago'}
        </span>
        <button
          onClick={() => setIsPreviewModalOpen(true)}
          className={`border-none rounded-md px-3 py-1.5 text-[11px] font-semibold cursor-pointer font-['Sora'] tracking-wide transition-all duration-200 ${
          isPublished
            ? 'bg-linear-to-br from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700'
            : 'bg-linear-to-br from-slate-400 to-slate-500 text-white hover:from-slate-500 hover:to-slate-600'
        }`}>
          Preview →
        </button>
      </div>

      {/* Add Lesson Modal */}
      <AddLessonModal
        isOpen={isLessonModalOpen}
        onClose={handleLessonModalClose}
        onSubmit={handleLessonSubmit}
        courseId={_id}
        initialData={editingLesson}
      />

      {/* Add Quiz Modal */}
      <AddQuizModal
        isOpen={isQuizModalOpen}
        onClose={handleQuizModalClose}
        onSubmit={handleQuizSubmit}
        lessonId={selectedLessonForQuiz?._id || selectedLessonForQuiz?.id}
        initialData={editingQuiz}
      />

      {/* Preview Modal */}
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        course={course}
      />
    </div>
  );
};

export default CourseCard;