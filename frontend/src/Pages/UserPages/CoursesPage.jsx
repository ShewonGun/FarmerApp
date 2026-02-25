import { useState, useEffect } from "react";
import UserCourseCard from "../../Components/UserComponents/UserCourseCard";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // removed filter UI: always show all courses

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("http://localhost:5000/api/courseWithDetails");
      const data = await response.json();

      if (data.success) {
        setCourses(data.courses);
      } else {
        setError(data.message || "Failed to fetch courses");
      }
    } catch (err) {
      setError("Failed to connect to server. Please try again later.");
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  // show only published (active) courses to users
  const filteredCourses = courses.filter((course) => course.isPublished);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Page Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-end justify-between">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight font-['Sora']">
            Available Courses
          </h1>
          <span className="text-sm text-gray-400 dark:text-slate-500 font-medium font-['Sora']">
            {loading ? "..." : `${filteredCourses.length} courses`}
          </span>
        </div>

      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-['Sora']">Loading courses...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center justify-center py-20">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1 font-['Sora']">Error loading courses</h3>
                <p className="text-sm text-red-700 dark:text-red-300 font-['Sora']">{error}</p>
                <button
                  onClick={fetchCourses}
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
      {!loading && !error && filteredCourses.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2 font-['Sora']">No courses found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
              {filter !== "All" ? `No ${filter.toLowerCase()} courses available.` : "No courses available at the moment."}
            </p>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {!loading && !error && filteredCourses.length > 0 && (
        <div className="px-6 pb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCourses.map((course) => (
            <UserCourseCard key={course._id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}