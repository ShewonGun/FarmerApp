import React from 'react';
import { useNavigate } from 'react-router-dom';

const Banner = ({ compact = false }) => {
  const navigate = useNavigate();

  return (
    <div
      className={`w-full bg-slate-50 dark:bg-slate-900 ${
        compact ? "my-0 h-full min-h-0 flex flex-col" : "my-16"
      }`}
    >
      <div
        className={`mx-auto ${compact ? "max-w-full px-0 flex-1 flex flex-col min-h-0 w-full" : "max-w-5xl px-6"}`}
      >
        <div
          className={`rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${
            compact
              ? "flex-1 h-full min-h-75 w-full px-6 py-7 flex flex-col justify-between items-start gap-5"
              : "px-8 py-12 md:py-14 md:px-16 flex flex-col md:flex-row items-center justify-between gap-8"
          }`}
        >
          {/* Text */}
          <div className={`text-left ${compact ? "w-full" : ""}`}>
            <h2 className={`font-semibold leading-tight font-['Sora'] tracking-tight text-slate-900 dark:text-slate-100 ${compact ? "text-2xl" : "text-3xl md:text-4xl"}`}>
              Ready to grow your farm knowledge?
            </h2>
            <p className="mt-2.5 text-sm md:text-base text-slate-600 dark:text-slate-300 font-['Sora']">
              Your next step toward sustainable farming is just one click away.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate('/courses')}
            className="shrink-0 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md transition-colors duration-200 font-['Sora']"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default Banner;
