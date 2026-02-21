import React, { useState, useEffect, useRef } from 'react';
import { MdClose, MdAdd, MdDelete } from 'react-icons/md';

const initialQuizForm = {
  title: '',
  passingScore: 70,
};

const createEmptyQuestion = () => ({
  questionText: '',
  choices: [
    { choiceText: '', isCorrect: true },
    { choiceText: '', isCorrect: false },
    { choiceText: '', isCorrect: false },
    { choiceText: '', isCorrect: false },
  ],
});

const AddQuizModal = ({ isOpen, onClose, onSubmit, lessonId, initialData = null, isPublished = true }) => {
  const [quizForm, setQuizForm] = useState(initialQuizForm);
  const [questions, setQuestions] = useState([createEmptyQuestion()]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const titleRef = useRef(null);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Auto-focus title on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => titleRef.current?.focus(), 80);
      if (initialData) {
        setQuizForm({
          title: initialData.title || '',
          passingScore: initialData.passingScore || 70,
        });
        // Load existing questions if available
        if (initialData.questions && initialData.questions.length > 0) {
          setQuestions(initialData.questions.map(q => ({
            questionText: q.questionText || '',
            choices: q.choices && q.choices.length > 0 ? q.choices.map(c => ({
              choiceText: c.choiceText || '',
              isCorrect: c.isCorrect || false,
            })) : [
              { choiceText: '', isCorrect: true },
              { choiceText: '', isCorrect: false },
              { choiceText: '', isCorrect: false },
              { choiceText: '', isCorrect: false },
            ],
          })));
        } else {
          setQuestions([createEmptyQuestion()]);
        }
      } else {
        setQuizForm(initialQuizForm);
        setQuestions([createEmptyQuestion()]);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const validate = () => {
    const errs = {};
    if (!quizForm.title.trim()) errs.title = 'Quiz title is required.';
    if (quizForm.passingScore < 0 || quizForm.passingScore > 100) 
      errs.passingScore = 'Passing score must be between 0 and 100.';
    
    questions.forEach((q, qIdx) => {
      if (!q.questionText.trim()) {
        errs[`question_${qIdx}`] = 'Question text is required.';
      }
      q.choices.forEach((c, cIdx) => {
        if (!c.choiceText.trim()) {
          errs[`question_${qIdx}_choice_${cIdx}`] = 'Choice text is required.';
        }
      });
      const hasCorrect = q.choices.some(c => c.isCorrect);
      if (!hasCorrect) {
        errs[`question_${qIdx}_correct`] = 'Please mark one answer as correct.';
      }
    });

    return errs;
  };

  const handleQuizChange = (e) => {
    const { name, value } = e.target;
    setQuizForm((f) => ({ ...f, [name]: name === 'passingScore' ? Number(value) : value }));
    if (errors[name]) setErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  const handleQuestionChange = (qIdx, value) => {
    const newQuestions = [...questions];
    newQuestions[qIdx].questionText = value;
    setQuestions(newQuestions);
    if (errors[`question_${qIdx}`]) {
      const newErrors = { ...errors };
      delete newErrors[`question_${qIdx}`];
      setErrors(newErrors);
    }
  };

  const handleChoiceChange = (qIdx, cIdx, value) => {
    const newQuestions = [...questions];
    newQuestions[qIdx].choices[cIdx].choiceText = value;
    setQuestions(newQuestions);
    const errorKey = `question_${qIdx}_choice_${cIdx}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const handleCorrectChange = (qIdx, cIdx) => {
    const newQuestions = [...questions];
    newQuestions[qIdx].choices = newQuestions[qIdx].choices.map((c, i) => ({
      ...c,
      isCorrect: i === cIdx,
    }));
    setQuestions(newQuestions);
    const errorKey = `question_${qIdx}_correct`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, createEmptyQuestion()]);
  };

  const removeQuestion = (qIdx) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== qIdx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { 
      setErrors(errs); 
      return; 
    }
    setLoading(true);
    try {
      const payload = {
        ...quizForm,
        lesson: lessonId,
        questions: questions.map((q, qIdx) => ({
          questionText: q.questionText,
          order: qIdx,
          choices: q.choices.map((c, cIdx) => ({
            choiceText: c.choiceText,
            isCorrect: c.isCorrect,
            order: cIdx,
          })),
        })),
      };
      await onSubmit?.(payload);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-lg shadow-2xl shadow-slate-900/20 dark:shadow-slate-950/60 border border-slate-200 dark:border-slate-700/60 overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className={`px-3 py-2 flex items-center justify-between ${
          isPublished 
            ? 'bg-linear-to-br from-emerald-500 to-teal-600' 
            : 'bg-linear-to-br from-slate-400 to-slate-500'
        }`}>
          <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-[15px] leading-tight font-['Sora']">
                  {initialData ? 'Edit Quiz' : 'Add Quiz'}
                </h2>
          </div>
          <button
            onClick={onClose}
            className="group bg-transparent border border-transparent text-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer transition-colors duration-150"
          >
            <MdClose className="text-sm text-white transition-colors duration-150 group-hover:text-red-500 dark:group-hover:text-red-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 overflow-hidden">
          <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">

            {/* Quiz Title */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                Quiz Title <span className="text-red-400">*</span>
              </label>
              <input
                ref={titleRef}
                name="title"
                value={quizForm.title}
                onChange={handleQuizChange}
                placeholder="e.g. Financial Literacy Quiz"
                className={`w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600
                  ${errors.title
                    ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                    : isPublished
                    ? 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/20'
                  }`}
              />
              {errors.title && (
                <p className="mt-1 text-[11px] text-red-500 font-['Sora']">{errors.title}</p>
              )}
            </div>

            {/* Passing Score */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                Passing Score (%) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                name="passingScore"
                value={quizForm.passingScore}
                onChange={handleQuizChange}
                min="0"
                max="100"
                className={`w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none
                  ${errors.passingScore
                    ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                    : isPublished
                    ? 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/20'
                  }`}
              />
              {errors.passingScore && (
                <p className="mt-1 text-[11px] text-red-500 font-['Sora']">{errors.passingScore}</p>
              )}
            </div>

            {/* Questions */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-['Sora']">
                  Questions
                </h3>
                <button
                  type="button"
                  onClick={addQuestion}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md border transition-all duration-150 cursor-pointer ${
                    isPublished
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50'
                      : 'bg-slate-100 dark:bg-slate-700/20 hover:bg-slate-200 dark:hover:bg-slate-700/30 border-slate-300 dark:border-slate-600/50'
                  }`}
                >
                  <MdAdd className={`text-sm ${
                    isPublished
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`} />
                  <span className={`text-[11px] font-medium font-['Sora'] ${
                    isPublished
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>Add Question</span>
                </button>
              </div>

              {questions.map((question, qIdx) => (
                <div key={qIdx} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider font-['Sora']">
                      Question {qIdx + 1} <span className="text-red-400">*</span>
                    </label>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIdx)}
                        title="Remove question"
                        className="group p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700/40 transition-colors duration-150"
                      >
                        <MdDelete className="text-xs text-slate-400 dark:text-slate-500 transition-colors duration-150 group-hover:text-red-500 dark:group-hover:text-red-400" />
                      </button>
                    )}
                  </div>

                  <textarea
                    value={question.questionText}
                    onChange={(e) => handleQuestionChange(qIdx, e.target.value)}
                    placeholder="Enter your question"
                    rows={2}
                    className={`w-full px-3 py-2 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800/60 border transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none
                      ${errors[`question_${qIdx}`]
                        ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                        : isPublished
                        ? 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/20'
                      }`}
                  />
                  {errors[`question_${qIdx}`] && (
                    <p className="text-[10px] text-red-500 font-['Sora']">{errors[`question_${qIdx}`]}</p>
                  )}

                  {/* Choices */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider font-['Sora']">
                      Answer Choices <span className="text-red-400">*</span>
                    </label>
                    {question.choices.map((choice, cIdx) => (
                      <div key={cIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct_${qIdx}`}
                          checked={choice.isCorrect}
                          onChange={() => handleCorrectChange(qIdx, cIdx)}
                          className={`w-4 h-4 focus:ring-2 border-slate-300 dark:border-slate-600 cursor-pointer ${
                            isPublished
                              ? 'text-emerald-600 focus:ring-emerald-500'
                              : 'text-slate-500 focus:ring-slate-400'
                          }`}
                          title="Mark as correct answer"
                        />
                        <input
                          type="text"
                          value={choice.choiceText}
                          onChange={(e) => handleChoiceChange(qIdx, cIdx, e.target.value)}
                          placeholder={`Choice ${cIdx + 1}`}
                          className={`flex-1 px-3 py-1.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800/60 border transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600
                            ${errors[`question_${qIdx}_choice_${cIdx}`]
                              ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                              : isPublished
                              ? 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                              : 'border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/20'
                            }`}
                        />
                      </div>
                    ))}
                    {errors[`question_${qIdx}_correct`] && (
                      <p className="text-[10px] text-red-500 font-['Sora']">{errors[`question_${qIdx}_correct`]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-['Sora']">
              <span className="text-red-400">*</span> Required fields
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md text-[12px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all duration-150 cursor-pointer font-['Sora'] active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-semibold text-white shadow-sm transition-all duration-200 cursor-pointer font-['Sora'] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                  isPublished
                    ? 'bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-200 dark:shadow-emerald-900/30 hover:shadow-md hover:shadow-emerald-200/80 dark:hover:shadow-emerald-900/40'
                    : 'bg-linear-to-r from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600 shadow-slate-200 dark:shadow-slate-900/30 hover:shadow-md hover:shadow-slate-200/80 dark:hover:shadow-slate-900/40'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    {initialData ? 'Saving…' : 'Creating…'}
                  </>
                ) : (
                  <>
                    {initialData ? 'Save Changes' : 'Create Quiz'}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddQuizModal;
