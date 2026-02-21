import { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const Contact = () => {
  const formRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('sending');

    emailjs
      .sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, { publicKey: PUBLIC_KEY })
      .then(() => {
        setStatus('success');
        formRef.current.reset();
      })
      .catch((err) => { console.error('EmailJS error:', err); setStatus('error'); });
  };

  return (
    <section className="w-full py-20 bg-bg-slate-50 dark:bg-slate-900">
      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-xs font-medium tracking-widest uppercase text-emerald-600 dark:text-emerald-400 font-['Sora']">
            Get in touch
          </span>
          <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white font-['Sora']">
            Contact us
          </h2>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
            Have a question or need support? We're happy to help.
          </p>
        </div>

        {/* Form */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 font-['Sora']">
                Name
              </label>
              <input
                type="text"
                name="user_name"
                required
                placeholder="John Doe"
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 dark:focus:border-emerald-500 transition-all duration-150 font-['Sora']"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 font-['Sora']">
                Email
              </label>
              <input
                type="email"
                name="user_email"
                required
                placeholder="john@example.com"
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 dark:focus:border-emerald-500 transition-all duration-150 font-['Sora']"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 font-['Sora']">
              Message
            </label>
            <textarea
              name="message"
              required
              rows={10}
              placeholder="Write your message here..."
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 dark:focus:border-emerald-500 transition-all duration-150 font-['Sora'] resize-none"
            />
          </div>

          {/* Feedback */}
          {status === 'success' && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-['Sora'] text-center">
              Message sent successfully. We'll be in touch soon!
            </p>
          )}
          {status === 'error' && (
            <p className="text-sm text-red-500 font-['Sora'] text-center">
              Something went wrong. Please try again.
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'sending'}
            className="self-center mt-1 px-10 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-full transition-colors duration-200 font-['Sora']"
          >
            {status === 'sending' ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
