import { useState } from 'react';

const faqs = [
  {
    question: 'What is AgroFund?',
    answer:
      'AgroFund is a platform that empowers farmers with expert-led courses, AI-powered learning content, agricultural loan plans, and certificates — all in one place.',
  },
  {
    question: 'Do I need an account to access courses?',
    answer:
      'You need to create a free account to enroll in courses, track your progress, and earn certificates. Browsing course listings is available to everyone.',
  },
  {
    question: 'How do the agricultural loan plans work?',
    answer:
      'AgroFund connects farmers with flexible loan plans tailored for equipment, seeds, irrigation, and more. You can browse available plans and submit a request directly from the platform.',
  },
  {
    question: 'Are the certificates recognized?',
    answer:
      'Yes. Certificates issued after completing a course are verifiable and can be shared on professional profiles or submitted to financial institutions as proof of agricultural knowledge.',
  },
  {
    question: 'Is AgroFund free to use?',
    answer:
      'Core features including course browsing and loan plan exploration are free. Some premium courses may require enrollment under a specific plan.',
  },
  {
    question: 'How do I contact support?',
    answer:
      'You can use the Contact section on this page to send us a message. We typically respond within 1–2 business days.',
  },
];

const FaqItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 last:border-none">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left bg-transparent border-none cursor-pointer group"
      >
        <span className="text-sm font-medium text-slate-900 dark:text-white font-['Sora'] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-150">
          {question}
        </span>
        <span
          className={`shrink-0 w-5 h-5 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-45' : 'rotate-0'
          }`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-40 pb-4' : 'max-h-0'
        }`}
      >
        <p className="text-sm text-slate-500 dark:text-slate-400 font-['Sora'] leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
};

const Faq = () => {
  return (
    <section className="w-full py-20 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-xs font-medium tracking-widest uppercase text-emerald-600 dark:text-emerald-400 font-['Sora']">
            FAQ
          </span>
          <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white font-['Sora']">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
            Everything you need to know about AgroFund.
          </p>
        </div>

        {/* Items */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6">
          {faqs.map((faq, i) => (
            <FaqItem key={i} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Faq;
