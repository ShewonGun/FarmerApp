import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiUsers, HiBookOpen, HiCalendar, HiArrowRight, HiPlay } from "react-icons/hi";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const THUMB_GRADIENTS = [
  "from-emerald-50 to-emerald-100",
  "from-teal-50 to-teal-100",
  "from-green-50 to-green-100",
  "from-lime-50 to-lime-100",
  "from-cyan-50 to-cyan-100",
];

function getThumbnailGradient(title = "") {
  return THUMB_GRADIENTS[title.charCodeAt(0) % THUMB_GRADIENTS.length];
}

// ─── CourseCard ───────────────────────────────────────────────────────────────
export default function UserCourseCard({ course }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const gradientClass = getThumbnailGradient(course.title);

  const handleCardClick = () => {
    navigate(`/course/${course._id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        group relative flex flex-col bg-white dark:bg-slate-800 rounded-lg overflow-hidden
        border border-slate-200 dark:border-slate-700
        transition-all duration-200 cursor-pointer
        ${
          hovered
            ? "shadow-lg dark:shadow-xl -translate-y-0.5"
            : "shadow-sm dark:shadow-md"
        }
      `}
    >
      {/* ── Thumbnail ── */}
      <div className="relative h-48 overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-900">
        {course.thumbnailUrl ? (
          <>
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className={`w-full h-full object-cover transition-transform duration-300 ${
                hovered ? "scale-102" : "scale-100"
              }`}
            />
            <div
              className={`absolute inset-0 bg-black/5 transition-opacity duration-200 ${
                hovered ? "opacity-100" : "opacity-0"
              }`}
            />
          </>
        ) : (
          /* Minimal gradient placeholder */
          <div
            className={`w-full h-full bg-linear-to-br ${gradientClass} flex items-center justify-center`}
          >
            <HiBookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
          </div>
        )}

        {/* Lesson count */}
        <div className="absolute top-3 right-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-[11px] font-medium px-2.5 py-1 rounded-md">
          {course.noOfLessons} lessons
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-4">
        {/* Title */}
        <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 mb-2 font-['Sora']">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 mb-4 flex-1 font-['Sora']">
          {course.description}
        </p>

        {/* Stats strip */}
        <div className="flex items-center gap-3 py-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[12px] font-['Sora']">
            <HiUsers className="w-3.5 h-3.5" />
            <span>{formatCount(course.enrollmentCount)}</span>
          </div>
          <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-600" />
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[12px] font-['Sora']">
            <HiCalendar className="w-3.5 h-3.5" />
            <span>{formatDate(course.createdAt)}</span>
          </div>
        </div>

        {/* CTA */}
        <button
          className={`
            w-full flex items-center justify-center gap-2 mt-3
            py-2 px-4 rounded-md text-[13px] font-medium font-['Sora']
            transition-all duration-150
            ${
              hovered
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            }
          `}
        >
          <span>View Course</span>
          {hovered && <HiArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}