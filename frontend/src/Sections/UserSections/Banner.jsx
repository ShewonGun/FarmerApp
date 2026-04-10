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
          className={`bg-linear-to-br from-emerald-500 to-emerald-700 rounded-2xl text-white ${
            compact
              ? "flex-1 h-full min-h-[300px] w-full px-8 py-10 flex flex-col justify-between items-start gap-6"
              : "px-8 py-12 md:py-14 md:px-16 flex flex-col md:flex-row items-center justify-between gap-8"
          }`}
        >
          {/* Text */}
          <div className={`text-left ${compact ? "w-full" : ""}`}>
            <h2 className={`font-semibold leading-tight bg-linear-to-r from-white to-emerald-200 text-transparent bg-clip-text font-['Sora'] tracking-tight ${compact ? "text-4xl" : "text-3xl md:text-4xl"}`}>
              Ready to grow your farm knowledge?
            </h2>
            <p className="mt-3 text-sm md:text-base bg-linear-to-r from-white to-emerald-100 text-transparent bg-clip-text font-['Sora']">
              Your next step toward sustainable farming is just one click away.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate('/courses')}
            className="shrink-0 px-10 py-3 bg-white hover:bg-slate-100 text-slate-800 text-sm font-medium rounded-full transition-colors duration-200 font-['Sora']"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default Banner;
