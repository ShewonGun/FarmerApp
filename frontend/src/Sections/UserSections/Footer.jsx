import React from 'react';
import { Link } from 'react-router-dom';
import { FaXTwitter, FaLinkedinIn, FaYoutube, FaInstagram } from 'react-icons/fa6';

const footerData = [
  {
    title: 'Platform',
    links: [
      { name: 'Courses', href: '/courses' },
      { name: 'My Courses', href: '/my-courses' },
      { name: 'Loan Plans', href: '/loans' },
    ],
  },
  {
    title: 'Account',
    links: [
      { name: 'Sign Up', href: '/signup' },
      { name: 'Login', href: '/login' },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="flex flex-wrap justify-center md:justify-between overflow-hidden gap-10 md:gap-20 mt-20 py-8 px-6 md:px-16 lg:px-24 border-t border-slate-200 dark:border-slate-800 text-[13px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
      {/* Left — logo + links */}
      <div className="flex flex-wrap items-start gap-10 md:gap-16">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold font-['Sora']">
            <span className="text-white">Agro</span><span className="text-emerald-500">Fund</span>
          </span>
        </div>

        {footerData.map((section, i) => (
          <div key={i}>
            <p className="text-slate-900 dark:text-white font-semibold mb-2 font-['Sora'] text-xs tracking-wide">
              {section.title}
            </p>
            <ul className="space-y-2">
              {section.links.map((link, j) => (
                <li key={j}>
                  <Link
                    to={link.href}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-150 font-['Sora']"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Right — tagline + socials + copyright */}
      <div className="flex flex-col max-md:items-center max-md:text-center gap-2 items-end">
        <div className="max-w-65 text-right">
          <p className="text-sm text-slate-400 dark:text-slate-500 font-['Sora'] leading-relaxed">Empowering every farmer.</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-['Sora'] leading-relaxed">No matter the size of your land.</p>
        </div>
        <div className="flex items-center gap-4 mt-3">
          {[
            { icon: <FaXTwitter className="w-4 h-4" />, href: '#' },
            { icon: <FaLinkedinIn className="w-4 h-4" />, href: '#' },
            { icon: <FaInstagram className="w-4 h-4" />, href: '#' },
            { icon: <FaYoutube className="w-4.5 h-4.5" />, href: '#' },
          ].map((s, i) => (
            <a
              key={i}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-150"
            >
              {s.icon}
            </a>
          ))}
        </div>
        <p className="mt-3 font-['Sora']">
          © {new Date().getFullYear()} AgroFund. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

