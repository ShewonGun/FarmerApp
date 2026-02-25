import React from 'react';
import { useNavigate } from 'react-router-dom';

const Banner = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full my-16 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-linear-to-br from-emerald-500 to-emerald-700 rounded-2xl px-8 py-12 md:py-14 md:px-16 text-white">
          {/* Text */}
          <div className="text-left">
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight bg-linear-to-r from-white to-emerald-200 text-transparent bg-clip-text font-['Sora']">
              Ready to grow your farm<br className="hidden md:block" /> knowledge?
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
