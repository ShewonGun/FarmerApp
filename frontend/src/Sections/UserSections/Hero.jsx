import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HiChevronRight, HiCheckCircle } from 'react-icons/hi';

const specialFeatures = [
  'No credit card',
  '30 days free trial',
  'Setup in 10 minutes',
];

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full relative flex items-start justify-center bg-slate-50 dark:bg-slate-900 pt-20 pb-8">
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">

        <div className="flex justify-center mb-4">
          <div className="group inline-flex items-center gap-2 rounded-full px-1 py-1 pr-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <span className="bg-emerald-600 text-white text-xs px-3 py-0.5 rounded-full font-medium font-['Sora']">
              NEW
            </span>
            <p className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-['Sora']">
              <span>Try 30 days free trial option</span>
              <HiChevronRight size={14} className="group-hover:translate-x-0.5 transition duration-300" />
            </p>
          </div>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl md:text-5xl font-semibold text-slate-900 dark:text-white mb-3 font-['Sora'] leading-tight tracking-tight">
          Grow Your{' '}
          <span className="text-emerald-600 dark:text-emerald-400">
            Farm Knowledge
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mb-4 max-w-2xl mx-auto font-['Sora'] leading-relaxed">
          Access expert-led courses and secure agricultural loans. 
          Your journey to sustainable farming starts here.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <button
            onClick={() => navigate('/courses')}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium rounded-lg transition-all duration-200 font-['Sora'] text-sm"
          >
            Explore Courses
          </button>
          <button
            onClick={() => navigate('/loans')}
            className="w-full sm:w-auto px-6 py-2.5 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-900 dark:text-white font-medium rounded-lg border border-slate-300 dark:border-slate-700 transition-all duration-200 font-['Sora'] text-sm"
          >
            View Loans
          </button>
        </div>

        

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 text-center">
          <div>
            <div className="text-xl font-semibold text-slate-900 dark:text-white mb-0.5 font-['Sora']">
              500+
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
              Learners
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
          <div>
            <div className="text-xl font-semibold text-slate-900 dark:text-white mb-0.5 font-['Sora']">
              50+
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
              Courses
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
          <div>
            <div className="text-xl font-semibold text-slate-900 dark:text-white mb-0.5 font-['Sora']">
              1000+
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
              Certificates
            </div>
          </div>
        </div>

        {/* Special Features */}
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-10 mt-10 mb-1">
          {specialFeatures.map((feature, index) => (
            <p key={index} className="flex items-center gap-1.5">
              <HiCheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-['Sora']">{feature}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;