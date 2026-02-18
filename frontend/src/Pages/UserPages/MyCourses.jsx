import { useState, useEffect } from "react";
import { useAuth } from "../../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError, showLoading } from "../../utils/toast";
import { HiBookOpen, HiClipboardCheck, HiCheckCircle, HiClock, HiAcademicCap } from "react-icons/hi";
import toast from "react-hot-toast";

export default function MyCourses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingCertId, setDownloadingCertId] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchEnrollments();
    }
  }, [user]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/${user.id}/enrollments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setEnrollments(data.enrollments);
      } else {
        setError(data.message || "Failed to fetch enrollments");
      }
    } catch (err) {
      setError("Failed to connect to server. Please try again later.");
      console.error("Error fetching enrollments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCertificate = async (courseId) => {
    const loadingToast = showLoading("Loading certificate...");
    setDownloadingCertId(courseId);

    try {
      const token = localStorage.getItem("token");
      
      const getResponse = await fetch(
        `http://localhost:5000/api/user/${user.id}/course/${courseId}/certificate`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let certificateData;
      
      if (getResponse.ok) {
        const data = await getResponse.json();
        if (data.success && data.certificate) {
          certificateData = data.certificate;
        }
      }

      if (!certificateData) {
        const generateResponse = await fetch(
          `http://localhost:5000/api/user/${user.id}/course/${courseId}/certificate`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const generateData = await generateResponse.json();

        if (!generateResponse.ok || !generateData.success) {
          throw new Error(generateData.message || "Failed to generate certificate");
        }

        certificateData = generateData.certificate;
      }

      if (certificateData?.certificateUrl) {
        toast.dismiss(loadingToast);
        showSuccess("Certificate opened!");
        window.open(certificateData.certificateUrl, "_blank");
      } else {
        throw new Error("Certificate URL not found");
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      showError(err.message || "Failed to load certificate");
      console.error("Error loading certificate:", err);
    } finally {
      setDownloadingCertId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-['Sora']">
            My Courses
          </h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-['Sora']">
              Loading courses...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-['Sora']">
            My Courses
          </h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
            <p className="text-xs text-red-700 dark:text-red-300 font-['Sora'] mb-3">{error}</p>
            <button
              onClick={fetchEnrollments}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors font-['Sora']"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-['Sora']">
            My Courses
          </h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <HiBookOpen className="w-14 h-14 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2 font-['Sora']">
              No courses yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-['Sora'] mb-4">
              Enroll in courses to see them here
            </p>
            <button
              onClick={() => navigate('/courses')}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors font-['Sora']"
            >
              Browse Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-['Sora'] mb-1">
          My Courses
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-['Sora']">
          {enrollments.length} {enrollments.length === 1 ? 'course' : 'courses'} enrolled
        </p>
      </div>

      <div className="px-6 pb-8">
        <div className="bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-['Sora']">
                    Course Name
                  </th>
                  <th className="px-6 py-3 text-center text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-['Sora']">
                    Lessons
                  </th>
                  <th className="px-6 py-3 text-center text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-['Sora']">
                    Quizzes
                  </th>
                  <th className="px-6 py-3 text-center text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-['Sora']">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-['Sora']">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {enrollments.map((enrollment) => {
                  const isCompleted = !!enrollment.completedAt;
                  return (
                    <tr key={enrollment._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                            <HiBookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                              {enrollment.course?.title || "Untitled Course"}
                            </p>
                            {isCompleted && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-['Sora']">
                                Completed {new Date(enrollment.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 font-['Sora']">
                          {enrollment.completedLessons?.length || 0} / {enrollment.course?.noOfLessons || 0}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 font-['Sora']">
                          {enrollment.completedQuizzes?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-['Sora']">
                            <HiCheckCircle className="w-3 h-3" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-['Sora']">
                            <HiClock className="w-3 h-3" />
                            In Progress
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {isCompleted ? (
                          <button
                            onClick={() => handleViewCertificate(enrollment.course._id)}
                            disabled={downloadingCertId === enrollment.course._id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-[12px] font-medium rounded-md transition-colors disabled:cursor-not-allowed font-['Sora']"
                          >
                            {downloadingCertId === enrollment.course._id ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Loading...
                              </>
                            ) : (
                              <>
                                <HiAcademicCap className="w-3.5 h-3.5" />
                                View Certificate
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/course/${enrollment.course._id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium rounded-md transition-colors font-['Sora']"
                          >
                            Continue
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
            {enrollments.map((enrollment) => {
              const isCompleted = !!enrollment.completedAt;
              return (
                <div key={enrollment._id} className="p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center shrink-0">
                      <HiBookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 font-['Sora'] mb-1">
                        {enrollment.course?.title || "Untitled Course"}
                      </h3>
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-['Sora']">
                          <HiCheckCircle className="w-3 h-3" />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-['Sora']">
                          <HiClock className="w-3 h-3" />
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5">
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-['Sora'] mb-0.5">Lessons</p>
                      <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                        {enrollment.completedLessons?.length || 0} / {enrollment.course?.noOfLessons || 0}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5">
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-['Sora'] mb-0.5">Quizzes</p>
                      <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                        {enrollment.completedQuizzes?.length || 0}
                      </p>
                    </div>
                  </div>

                  {isCompleted ? (
                    <button
                      onClick={() => handleViewCertificate(enrollment.course._id)}
                      disabled={downloadingCertId === enrollment.course._id}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-[13px] font-medium rounded-lg transition-colors disabled:cursor-not-allowed font-['Sora']"
                    >
                      {downloadingCertId === enrollment.course._id ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Loading Certificate...
                        </>
                      ) : (
                        <>
                          <HiAcademicCap className="w-4 h-4" />
                          View Certificate
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/course/${enrollment.course._id}`)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium rounded-lg transition-colors font-['Sora']"
                    >
                      Continue Learning
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}