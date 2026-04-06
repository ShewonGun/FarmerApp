import { useState } from "react";
import loginHeroImage from "../../assets/Loginimage.jpg";

const AuthSplitLayout = ({ children }) => {
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [heroError, setHeroError] = useState(false);

  return (
    <div
      className="min-h-dvh h-dvh w-full box-border overflow-hidden flex items-center justify-center p-4 sm:p-5 md:p-6 lg:p-8 bg-slate-100 dark:bg-slate-950"
      style={{
        backgroundImage: `
          linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px)
        `,
        backgroundSize: "28px 28px"
      }}
    >
      {/* Fixed height card: no page scroll; columns share exact height */}
      <div
        className="w-full max-w-5xl flex flex-col lg:flex-row min-h-0 overflow-hidden rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-900
        h-[calc(100dvh-2rem)] sm:h-[calc(100dvh-2.5rem)] md:h-[calc(100dvh-3rem)] lg:h-[calc(100dvh-4rem)]"
      >
        {/* Form column — only this side scrolls if content is tall */}
        <div className="w-full lg:w-1/2 flex flex-col min-h-0 min-w-0 max-h-full overflow-y-auto overscroll-contain px-5 sm:px-7 py-5 sm:py-6 lg:py-7">
          <div className="flex-1 flex flex-col justify-center min-h-0 max-w-md w-full mx-auto lg:mx-0">
            {children}
          </div>
        </div>

        {/* Hero column — fills card height, no internal scroll */}
        <div className="hidden lg:flex lg:w-1/2 h-full min-h-0 max-h-full overflow-hidden relative flex-col shrink-0">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-emerald-800/80 to-slate-900"
              aria-hidden
            />
            {!heroError && (
              <img
                src={loginHeroImage}
                alt=""
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  heroLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setHeroLoaded(true)}
                onError={() => setHeroError(true)}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/15 to-transparent pointer-events-none" />
          </div>

          <div className="relative z-10 flex flex-col justify-end flex-1 min-h-0 w-full p-5 xl:p-6 pt-0">
            <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-4 xl:p-5 text-white shadow-xl max-w-lg w-full ml-auto shrink-0">
              <p className="text-xs xl:text-sm leading-relaxed font-['Sora'] text-white/95">
                With AgroFund, I can learn new skills, explore loan options, and grow my farm — all in one
                place. It&apos;s built for farmers like us.
              </p>
              <div className="mt-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-400/30 border border-white/30 flex items-center justify-center text-xs font-bold font-['Sora'] shrink-0">
                  A
                </div>
                <div className="min-w-0">
                  <p className="text-xs xl:text-sm font-semibold font-['Sora'] truncate">Community member</p>
                  <p className="text-[10px] xl:text-xs text-white/70 font-['Sora'] truncate">AgroFund farmer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSplitLayout;
