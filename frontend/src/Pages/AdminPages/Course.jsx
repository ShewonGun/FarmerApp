import React, { useState, useEffect } from 'react';
import { MdAdd } from 'react-icons/md';
import CourseCard from '../../Components/AdminComponents/CourseCard';
import AddCourseModal from '../../Components/AdminComponents/AddCourseModal';
import ConfirmBox from '../../Components/SharedComponents/ConfirmBox';
import axios from 'axios';
import { showSuccess, showError } from '../../utils/toast';

const API_BASE_URL = 'http://localhost:5000/api';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const Course = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: '', id: null, title: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch courses
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/courseWithDetails`, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) {
        setCourses(response.data.courses);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      showError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setEditingCourse(null);
    setIsModalOpen(false);
  };

  const handleSubmitCourse = async (data) => {
    try {
      const payload = { ...data };
      if (editingCourse) {
        const res = await axios.put(
          `${API_BASE_URL}/course/${editingCourse._id}`, 
          payload,
          { headers: getAuthHeaders() }
        );
        if (res.data.success) {
          showSuccess('Course updated successfully');
          fetchCourses();
        }
      } else {
        const res = await axios.post(
          `${API_BASE_URL}/addCourse`, 
          payload,
          { headers: getAuthHeaders() }
        );
        if (res.data.success) {
          showSuccess('Course created successfully');
          fetchCourses();
        }
      }
    } catch (err) {
      console.error('Error saving course:', err);
      showError(editingCourse ? 'Failed to update course' : 'Failed to create course');
      throw err;
    }
  };

  const openDeleteConfirm = (type, id, title) => {
    setDeleteConfirm({ isOpen: true, type, id, title });
  };

  const closeDeleteConfirm = () => {
    if (!isDeleting) {
      setDeleteConfirm({ isOpen: false, type: '', id: null, title: '' });
    }
  };

  const handleConfirmDelete = async () => {
    const { type, id } = deleteConfirm;
    setIsDeleting(true);
    
    try {
      if (type === 'course') {
        await axios.delete(`${API_BASE_URL}/course/${id}`, { headers: getAuthHeaders() });
        showSuccess('Course deleted successfully');
      } else if (type === 'lesson') {
        await axios.delete(`${API_BASE_URL}/lessons/${id}`, { headers: getAuthHeaders() });
        showSuccess('Lesson deleted successfully');
      } else if (type === 'quiz') {
        await axios.delete(`${API_BASE_URL}/quiz/${id}`, { headers: getAuthHeaders() });
        showSuccess('Quiz deleted successfully');
      }
      
      fetchCourses();
      setDeleteConfirm({ isOpen: false, type: '', id: null, title: '' });
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      showError(`Failed to delete ${type}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = (courseId, courseTitle) => {
    openDeleteConfirm('course', courseId, courseTitle);
  };

  const handleToggleActive = async (courseId, currentStatus) => {
    try {
      const res = await axios.put(
        `${API_BASE_URL}/course/${courseId}`,
        { isPublished: !currentStatus },
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        showSuccess(`Course ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchCourses();
      }
    } catch (err) {
      console.error('Error toggling course status:', err);
      showError('Failed to update course status');
    }
  };

  const handleAddLesson = async (courseId, lessonData) => {
    try {
      const payload = { ...lessonData };
      const res = await axios.post(
        `${API_BASE_URL}/course/${courseId}/lessons`, 
        payload,
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        showSuccess('Lesson created successfully');
        fetchCourses();
      }
    } catch (err) {
      console.error('Error creating lesson:', err);
      showError('Failed to create lesson');
      throw err;
    }
  };

  const handleEditLesson = async (lessonId, lessonData) => {
    try {
      const res = await axios.put(
        `${API_BASE_URL}/lessons/${lessonId}`, 
        lessonData,
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        showSuccess('Lesson updated successfully');
        fetchCourses();
      }
    } catch (err) {
      console.error('Error updating lesson:', err);
      showError('Failed to update lesson');
      throw err;
    }
  };

  const handleDeleteLesson = (lessonId, lessonTitle) => {
    openDeleteConfirm('lesson', lessonId, lessonTitle);
  };

  const handleAddQuiz = async (lessonId, quizData) => {
    try {
      // Step 1: Create the quiz
      const quizPayload = {
        title: quizData.title,
        passingScore: quizData.passingScore,
      };
      
      const res = await axios.post(
        `${API_BASE_URL}/lessons/${lessonId}/quiz`, 
        quizPayload,
        { headers: getAuthHeaders() }
      );
      
      if (res.data.success) {
        const quizId = res.data.quiz._id;
        
        // Step 2: Add questions to the quiz
        if (quizData.questions && quizData.questions.length > 0) {
          for (const question of quizData.questions) {
            await axios.post(
              `${API_BASE_URL}/quiz/${quizId}/question`,
              {
                questionText: question.questionText,
                choices: question.choices,
                order: question.order,
              },
              { headers: getAuthHeaders() }
            );
          }
        }
        
        showSuccess('Quiz created successfully');
        fetchCourses();
      }
    } catch (err) {
      console.error('Error creating quiz:', err);
      showError('Failed to create quiz');
      throw err;
    }
  };

  const handleEditQuiz = async (quizId, quizData) => {
    try {
      // Step 1: Update the quiz
      const quizPayload = {
        title: quizData.title,
        passingScore: quizData.passingScore,
      };
      
      const res = await axios.put(
        `${API_BASE_URL}/quiz/${quizId}`, 
        quizPayload,
        { headers: getAuthHeaders() }
      );
      
      if (res.data.success) {
        // Step 2: Delete old questions
        const existingQuestions = await axios.get(
          `${API_BASE_URL}/quiz/${quizId}/questions`,
          { headers: getAuthHeaders() }
        );
        
        if (existingQuestions.data.success && existingQuestions.data.questions) {
          for (const question of existingQuestions.data.questions) {
            await axios.delete(
              `${API_BASE_URL}/question/${question._id}`,
              { headers: getAuthHeaders() }
            );
          }
        }
        
        // Step 3: Add new questions
        if (quizData.questions && quizData.questions.length > 0) {
          for (const question of quizData.questions) {
            await axios.post(
              `${API_BASE_URL}/quiz/${quizId}/question`,
              {
                questionText: question.questionText,
                choices: question.choices,
                order: question.order,
              },
              { headers: getAuthHeaders() }
            );
          }
        }
        
        showSuccess('Quiz updated successfully');
        fetchCourses();
      }
    } catch (err) {
      console.error('Error updating quiz:', err);
      showError('Failed to update quiz');
      throw err;
    }
  };

  const handleDeleteQuiz = (quizId, quizTitle) => {
    openDeleteConfirm('quiz', quizId, quizTitle);
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
          {courses.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onAddLesson={handleAddLesson}
              onEditLesson={handleEditLesson}
              onDeleteLesson={handleDeleteLesson}
              onAddQuiz={handleAddQuiz}
              onEditQuiz={handleEditQuiz}
              onDeleteQuiz={handleDeleteQuiz}
            />
          ))}

          {/* Add Course glass card */}
          <button
            onClick={openModal}
            className="flex items-center justify-center w-full h-full min-h-70 bg-white/10 dark:bg-slate-800/30 rounded-lg shadow-sm border border-white/20 dark:border-slate-700/30 backdrop-blur-md hover:shadow-lg hover:bg-white/20 dark:hover:bg-slate-800/40 transition-all duration-200"
            aria-label="Add course"
            title="Add course"
          >
            <MdAdd className="text-5xl text-emerald-600 dark:text-emerald-300" />
          </button>
        </div>
      )}
      <AddCourseModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        onSubmit={handleSubmitCourse}
        initialData={editingCourse}
      />
      
      <ConfirmBox
        isOpen={deleteConfirm.isOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteConfirm.type === 'course' ? 'Course' : deleteConfirm.type === 'lesson' ? 'Lesson' : 'Quiz'}?`}
        message={`Are you sure you want to delete "${deleteConfirm.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Course;