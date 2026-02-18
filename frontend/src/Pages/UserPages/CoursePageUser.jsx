import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  HiUsers, 
  HiBookOpen, 
  HiCalendar, 
  HiCheckCircle, 
  HiPlay,
  HiAcademicCap,
  HiDocumentText,
  HiEye
} from "react-icons/hi";
import UserQuizModal from "../../Components/UserComponents/UserQuizModal.jsx";
import CourseContent from "../../Components/UserComponents/CourseContent.jsx";
import { useAuth } from "../../Context/AuthContext";

export default function CoursePageUser() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState({});
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [failedQuizzes, setFailedQuizzes] = useState({});
  const [completingLesson, setCompletingLesson] = useState(null);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [certificate, setCertificate] = useState(null);

  useEffect(() => {
    if (courseId && user) {
      fetchCourseDetails();
      fetchLessons();
      checkEnrollment();
    }
  }, [courseId, user]);

  useEffect(() => {
    if (enrollment?.completedAt && user) {
      checkCertificate();
    }
  }, [enrollment, user]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/course/${courseId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setCourse(data.course);
      } else {
        setError(data.message || "Failed to fetch course details");
      }
    } catch (err) {
      setError("Failed to connect to server");
      console.error("Error fetching course:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/course/${courseId}/lessons`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setLessons(data.lessons);
        // Fetch quizzes for lessons that have them
        data.lessons.forEach(lesson => {
          if (lesson.isQuizAvailable) {
            fetchQuizForLesson(lesson._id);
          }
        });
      }
    } catch (err) {
      console.error("Error fetching lessons:", err);
    }
  };

  const fetchQuizForLesson = async (lessonId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/lessons/${lessonId}/quiz`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await response.json();

      if (data.success && data.quiz) {
        setQuizzes(prev => ({ ...prev, [lessonId]: data.quiz }));
      }
    } catch (err) {
      console.error("Error fetching quiz:", err);
    }
  };

  const checkEnrollment = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/${user.id}/course/${courseId}/check-enrollment`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      const data = await response.json();
      if (data.success && data.enrollment) {
        setEnrollment(data.enrollment);
      }
    } catch (err) {
      console.error("Error checking enrollment:", err);
    }
  };

  const checkCertificate = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/user/${user.id}/course/${courseId}/certificate`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      const data = await response.json();
      if (data.success && data.certificate) {
        setCertificate(data.certificate);
      }
    } catch (err) {
      // Certificate doesn't exist yet, that's okay
      console.log("No certificate found yet");
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setEnrolling(true);
      const response = await fetch(
        `http://localhost:5000/api/${user.id}/course/${courseId}/enroll`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      const data = await response.json();

      if (data.success) {
        setEnrollment(data.enrollment);
      } else {
        alert(data.message || "Failed to enroll");
      }
    } catch (err) {
      alert("Failed to enroll in course");
      console.error("Error enrolling:", err);
    } finally {
      setEnrolling(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const formatCount = (n) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return n;
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return "";
    
    // Extract video ID from various YouTube URL formats
    let videoId = "";
    
    if (url.includes("youtu.be/")) {
      // Format: https://youtu.be/VIDEO_ID
      videoId = url.split("youtu.be/")[1]?.split(/[?&]/)[0];
    } else if (url.includes("youtube.com/watch")) {
      // Format: https://www.youtube.com/watch?v=VIDEO_ID or https://m.youtube.com/watch?v=VIDEO_ID
      const urlParams = new URLSearchParams(url.split("?")[1]);
      videoId = urlParams.get("v");
    } else if (url.includes("youtube.com/embed/")) {
      // Already in embed format
      return url;
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const toggleLesson = (lessonId) => {
    setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
  };

  const isLessonCompleted = (lessonId) => {
    if (!enrollment?.completedLessons) return false;
    return enrollment.completedLessons.some((id) => {
      if (!id) return false;
      try {
        // compare string forms to support ObjectId and string IDs
        return String(id._id ?? id) === String(lessonId);
      } catch (e) {
        return String(id) === String(lessonId);
      }
    });
  };

  const isQuizCompleted = (quizId) => {
    return enrollment?.completedQuizzes?.includes(quizId);
  };

  const startQuiz = async (lessonId) => {
    const quiz = quizzes[lessonId];
    if (!quiz) return;

    setActiveQuiz({ ...quiz, lessonId });
    setQuizQuestions(quiz.questions || []);
    setUserAnswers({});
  };

  const handleAnswerSelect = (questionId, choiceId) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: choiceId
    }));
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;

    setSubmittingQuiz(true);
    try {
      // Format answers for backend
      const answers = Object.entries(userAnswers).map(([questionId, selectedChoiceId]) => ({
        questionId,
        selectedChoiceId
      }));

      // Submit to backend
      const response = await fetch(
        `http://localhost:5000/api/${user.id}/quiz/${activeQuiz._id}/attempt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ answers })
        }
      );

      const data = await response.json();

      if (data.success) {
        // Refresh enrollment to update completed quizzes
        await checkEnrollment();
        // Show results
        const passed = data.progress?.passed || false;
        const percentage = data.progress?.percentage || 0;
        alert(
          `${data.message}\n\nScore: ${percentage}%\nPassing Score: ${activeQuiz.passingScore}%`
        );
        // Record failure locally so user can retake only when failed
        if (passed) {
          setFailedQuizzes(prev => {
            const copy = { ...prev };
            delete copy[activeQuiz._id];
            return copy;
          });
        } else {
          setFailedQuizzes(prev => ({ ...prev, [activeQuiz._id]: true }));
        }

        setActiveQuiz(null);
        setQuizQuestions([]);
        setUserAnswers({});
      } else {
        alert(data.message || "Failed to submit quiz");
      }
    } catch (err) {
      console.error("Error submitting quiz:", err);
      alert("Failed to submit quiz. Please try again.");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const closeQuiz = () => {
    setActiveQuiz(null);
    setQuizQuestions([]);
    setUserAnswers({});
  };

  const markLessonComplete = async (lessonId) => {
    if (!user || !enrollment) return;

    setCompletingLesson(lessonId);
    try {
      const response = await fetch(
        `http://localhost:5000/api/${user.id}/course/${courseId}/lesson/${lessonId}/complete`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        // Refresh enrollment to show updated progress
        await checkEnrollment();
        
        if (data.courseCompleted) {
          alert("🎉 Congratulations! You've completed the entire course! You can now generate your certificate.");
        } else {
          alert("✓ Lesson marked as complete!");
        }
      } else {
        if (data.quizRequired) {
          alert(data.message || "You must pass the quiz before marking this lesson as complete.");
        } else {
          alert(data.message || "Failed to mark lesson as complete");
        }
      }
    } catch (err) {
      console.error("Error marking lesson complete:", err);
      alert("Failed to mark lesson as complete. Please try again.");
    } finally {
      setCompletingLesson(null);
    }
  };

  const generateCertificate = async () => {
    if (!user || !enrollment || !enrollment.completedAt) return;

    setGeneratingCertificate(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/user/${user.id}/course/${courseId}/certificate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("🎉 Certificate generated successfully!");
        // Fetch the newly generated certificate
        await checkCertificate();
      } else {
        alert(data.message || "Failed to generate certificate");
      }
    } catch (err) {
      console.error("Error generating certificate:", err);
      alert("Failed to generate certificate. Please try again.");
    } finally {
      setGeneratingCertificate(false);
    }
  };

  const downloadCertificate = async () => {
    if (!certificate || !user) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/user/${user.id}/course/${courseId}/certificate`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      const data = await response.json();

      if (data.success && data.certificate) {
        // If there's a certificateUrl, open it
        if (data.certificate.certificateUrl) {
          window.open(data.certificate.certificateUrl, '_blank');
        } else {
          // Create a simple certificate text file as fallback
          const certificateText = `
CERTIFICATE OF COMPLETION

This is to certify that
${data.certificate.user.name}

has successfully completed
${data.certificate.course.title}

Certificate Number: ${data.certificate.certificateNumber}
Issue Date: ${new Date(data.certificate.issueDate).toLocaleDateString()}
${data.certificate.averageScore ? `Average Score: ${data.certificate.averageScore}%` : ''}
          `;
          
          const blob = new Blob([certificateText], { type: 'text/plain' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Certificate_${data.certificate.certificateNumber}.txt`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }
    } catch (err) {
      console.error("Error downloading certificate:", err);
      alert("Failed to download certificate. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-['Sora']">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-md">
          <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1.5 font-['Sora']">
            Error loading course
          </h3>
          <p className="text-xs text-red-700 dark:text-red-300 font-['Sora'] mb-3">
            {error || "Course not found"}
          </p>
          <button
            onClick={() => navigate("/courses")}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md transition-colors font-['Sora']"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const THUMB_GRADIENTS = [
    "from-emerald-50 to-emerald-100",
    "from-teal-50 to-teal-100",
    "from-green-50 to-green-100"
  ];
  const gradientClass = THUMB_GRADIENTS[course.title?.charCodeAt(0) % THUMB_GRADIENTS.length];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Hero Section */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Thumbnail */}
            <div className="md:col-span-1">
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full aspect-video object-cover rounded-lg shadow-sm"
                />
              ) : (
                <div className={`w-full aspect-video bg-linear-to-br ${gradientClass} rounded-lg flex items-center justify-center`}>
                  <HiBookOpen className="w-12 h-12 text-emerald-600 dark:text-emerald-500" />
                </div>
              )}
            </div>

            {/* Course Info */}
            <div className="md:col-span-2">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                        course.isPublished
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {course.isPublished ? "Active" : "Draft"}
                    </span>
                    {enrollment && (
                      enrollment.completedAt ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                          <HiCheckCircle className="w-3 h-3" />
                          Completed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                          Enrolled
                        </span>
                      )
                    )}
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 font-['Sora']">
                    {course.title}
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-['Sora'] mb-4">
                    {course.description}
                  </p>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-['Sora']">
                      <HiBookOpen className="w-3.5 h-3.5" />
                      <span>{course.noOfLessons} lessons</span>
                    </div>
                    <div className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-['Sora']">
                      <HiCalendar className="w-3.5 h-3.5" />
                      <span>{formatDate(course.createdAt)}</span>
                    </div>
                  </div>

                  {/* Progress Bar (if enrolled) */}
                  {enrollment && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 font-['Sora']">
                          Your Progress
                        </span>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-['Sora']">
                          {enrollment.progress}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* CTA Button */}
                  {!enrollment ? (
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling || !course.isPublished}
                      className={`px-4 py-2 rounded-md text-sm font-semibold font-['Sora'] transition-all flex items-center gap-2 ${
                        course.isPublished
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md"
                          : "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {enrolling ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Enrolling...</span>
                        </>
                      ) : (
                        <>
                          <HiAcademicCap className="w-4 h-4" />
                          <span>{course.isPublished ? "Enroll Now" : "Not Available"}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    enrollment.completedAt ? (
                      certificate ? (
                        <button
                          onClick={downloadCertificate}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-semibold font-['Sora'] transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                        >
                          <HiEye className="w-4 h-4" />
                          <span>View Certificate</span>
                        </button>
                      ) : (
                        <button
                          onClick={generateCertificate}
                          disabled={generatingCertificate}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-semibold font-['Sora'] transition-all shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generatingCertificate ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <HiDocumentText className="w-4 h-4" />
                              <span>Generate Certificate</span>
                            </>
                          )}
                        </button>
                      )
                    ) : (
                      <button
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-semibold font-['Sora'] transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                      >
                        <HiPlay className="w-4 h-4" />
                        <span>Continue Learning</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <CourseContent
        lessons={lessons}
        quizzes={quizzes}
        enrollment={enrollment}
        expandedLesson={expandedLesson}
        toggleLesson={toggleLesson}
        isLessonCompleted={isLessonCompleted}
        isQuizCompleted={isQuizCompleted}
        startQuiz={startQuiz}
        markLessonComplete={markLessonComplete}
        completingLesson={completingLesson}
        failedQuizzes={failedQuizzes}
        getYouTubeEmbedUrl={getYouTubeEmbedUrl}
      />

      {/* Quiz Modal (extracted to component) */}
      {activeQuiz && (
        <UserQuizModal
          activeQuiz={activeQuiz}
          quizQuestions={quizQuestions}
          userAnswers={userAnswers}
          handleAnswerSelect={handleAnswerSelect}
          submitQuiz={submitQuiz}
          submittingQuiz={submittingQuiz}
          closeQuiz={closeQuiz}
        />
      )}
    </div>
  );
}