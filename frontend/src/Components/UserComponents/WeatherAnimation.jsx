/**
 * WeatherAnimation
 * Pure SVG + CSS animated weather icons — no extra dependencies.
 * Maps an OpenWeatherMap description string to the correct animation.
 */

const styles = `
@keyframes wa-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes wa-pulse-glow { 0%,100% { opacity:.8; r:22; } 50% { opacity:1; r:25; } }
@keyframes wa-cloud-drift { 0%,100% { transform:translateX(0); } 50% { transform:translateX(4px); } }
@keyframes wa-cloud-bob { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-3px); } }
@keyframes wa-rain-fall { 0% { transform:translateY(-8px); opacity:0; } 30% { opacity:1; } 100% { transform:translateY(24px); opacity:0; } }
@keyframes wa-snow-fall { 0% { transform:translateY(-6px) rotate(0deg); opacity:0; } 30% { opacity:.9; } 100% { transform:translateY(22px) rotate(180deg); opacity:0; } }
@keyframes wa-lightning { 0%,90%,100% { opacity:0; } 92%,96% { opacity:1; } 94% { opacity:.3; } }
@keyframes wa-fog-drift { 0%,100% { opacity:.55; transform:translateX(0); } 50% { opacity:.8; transform:translateX(3px); } }
@keyframes wa-moon-glow { 0%,100% { opacity:.25; } 50% { opacity:.5; } }
@keyframes wa-star-twinkle { 0%,100% { opacity:.45; transform:scale(.8); } 50% { opacity:1; transform:scale(1.3); } }
.wa-sun-rays { transform-origin:50px 50px; animation:wa-spin 12s linear infinite; }
.wa-sun-core { transform-origin:50px 50px; animation:wa-pulse-glow 3s ease-in-out infinite; }
.wa-cloud-main { animation:wa-cloud-drift 4s ease-in-out infinite; }
.wa-cloud-back { animation:wa-cloud-bob 5s ease-in-out infinite; }
.wa-rain-1 { animation:wa-rain-fall 1.2s ease-in infinite 0s; }
.wa-rain-2 { animation:wa-rain-fall 1.2s ease-in infinite .2s; }
.wa-rain-3 { animation:wa-rain-fall 1.2s ease-in infinite .4s; }
.wa-rain-4 { animation:wa-rain-fall 1.2s ease-in infinite .6s; }
.wa-rain-5 { animation:wa-rain-fall 1.2s ease-in infinite .8s; }
.wa-rain-6 { animation:wa-rain-fall 1.2s ease-in infinite 1.0s; }
.wa-snow-1 { animation:wa-snow-fall 2s ease-in infinite 0s; }
.wa-snow-2 { animation:wa-snow-fall 2s ease-in infinite .35s; }
.wa-snow-3 { animation:wa-snow-fall 2s ease-in infinite .7s; }
.wa-snow-4 { animation:wa-snow-fall 2s ease-in infinite 1.05s; }
.wa-snow-5 { animation:wa-snow-fall 2s ease-in infinite 1.4s; }
.wa-lightning { animation:wa-lightning 3s ease-in-out infinite; }
.wa-fog-1 { animation:wa-fog-drift 3s ease-in-out infinite 0s; }
.wa-fog-2 { animation:wa-fog-drift 3s ease-in-out infinite .5s; }
.wa-fog-3 { animation:wa-fog-drift 3s ease-in-out infinite 1s; }
.wa-moon-glow { animation:wa-moon-glow 3s ease-in-out infinite; }
.wa-star-1 { transform-origin:20px 26px; animation:wa-star-twinkle 2.5s ease-in-out infinite 0s; }
.wa-star-2 { transform-origin:76px 20px; animation:wa-star-twinkle 2.5s ease-in-out infinite .8s; }
.wa-star-3 { transform-origin:82px 62px; animation:wa-star-twinkle 2.5s ease-in-out infinite 1.6s; }
`;

/* ── individual animation components ─────────────────────────── */

const Sunny = () => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <g className="wa-sun-rays">
      {[0,45,90,135,180,225,270,315].map((a) => (
        <line
          key={a}
          x1="50" y1="12" x2="50" y2="6"
          stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round"
          transform={`rotate(${a} 50 50)`}
        />
      ))}
    </g>
    <circle cx="50" cy="50" r="20" fill="#FDE68A" opacity="0.35" className="wa-sun-core" />
    <circle cx="50" cy="50" r="17" fill="#FBBF24" />
    <circle cx="50" cy="50" r="14" fill="#FCD34D" />
  </svg>
);

const PartlyCloudy = () => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <g className="wa-sun-rays" style={{ transformOrigin: "38px 40px" }}>
      {[0,45,90,135,180,225,270,315].map((a) => (
        <line
          key={a}
          x1="38" y1="22" x2="38" y2="16"
          stroke="#FBBF24" strokeWidth="3" strokeLinecap="round"
          transform={`rotate(${a} 38 40)`}
        />
      ))}
    </g>
    <circle cx="38" cy="40" r="14" fill="#FBBF24" />
    <circle cx="38" cy="40" r="11" fill="#FCD34D" />
    <g className="wa-cloud-main">
      <circle cx="45" cy="62" r="12" fill="white" />
      <circle cx="58" cy="58" r="14" fill="white" />
      <circle cx="70" cy="62" r="10" fill="white" />
      <rect x="45" y="62" width="35" height="12" fill="white" rx="2" />
    </g>
  </svg>
);

const Cloudy = () => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <g className="wa-cloud-back" style={{ opacity: 0.55 }}>
      <circle cx="35" cy="52" r="11" fill="#94A3B8" />
      <circle cx="47" cy="48" r="13" fill="#94A3B8" />
      <circle cx="58" cy="52" r="9" fill="#94A3B8" />
      <rect x="35" y="52" width="32" height="10" fill="#94A3B8" rx="2" />
    </g>
    <g className="wa-cloud-main">
      <circle cx="40" cy="60" r="13" fill="#CBD5E1" />
      <circle cx="54" cy="55" r="16" fill="#CBD5E1" />
      <circle cx="68" cy="60" r="12" fill="#CBD5E1" />
      <rect x="40" y="60" width="40" height="13" fill="#CBD5E1" rx="2" />
    </g>
  </svg>
);

const Rainy = () => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <g className="wa-cloud-main">
      <circle cx="38" cy="44" r="13" fill="#94A3B8" />
      <circle cx="52" cy="39" r="16" fill="#94A3B8" />
      <circle cx="66" cy="44" r="11" fill="#94A3B8" />
      <rect x="38" y="44" width="39" height="12" fill="#94A3B8" rx="2" />
    </g>
    <line x1="38" y1="66" x2="36" y2="74" stroke="#60A5FA" strokeWidth="2.2" strokeLinecap="round" className="wa-rain-1" />
    <line x1="48" y1="66" x2="46" y2="74" stroke="#60A5FA" strokeWidth="2.2" strokeLinecap="round" className="wa-rain-2" />
    <line x1="58" y1="66" x2="56" y2="74" stroke="#60A5FA" strokeWidth="2.2" strokeLinecap="round" className="wa-rain-3" />
    <line x1="68" y1="66" x2="66" y2="74" stroke="#60A5FA" strokeWidth="2.2" strokeLinecap="round" className="wa-rain-4" />
    <line x1="43" y1="76" x2="41" y2="84" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" className="wa-rain-5" />
    <line x1="63" y1="76" x2="61" y2="84" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" className="wa-rain-6" />
  </svg>
);

const Thunderstorm = () => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <g className="wa-cloud-main">
      <circle cx="36" cy="43" r="13" fill="#64748B" />
      <circle cx="50" cy="38" r="16" fill="#64748B" />
      <circle cx="64" cy="43" r="12" fill="#64748B" />
      <rect x="36" y="43" width="40" height="12" fill="#64748B" rx="2" />
    </g>
    <line x1="36" y1="64" x2="34" y2="72" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" className="wa-rain-1" />
    <line x1="68" y1="64" x2="66" y2="72" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" className="wa-rain-4" />
    <polygon
      points="54,56 48,70 53,70 47,84 60,66 54,66 60,56"
      fill="#FDE047"
      className="wa-lightning"
    />
  </svg>
);

const Snowy = () => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <g className="wa-cloud-main">
      <circle cx="38" cy="44" r="13" fill="#CBD5E1" />
      <circle cx="52" cy="39" r="16" fill="#CBD5E1" />
      <circle cx="66" cy="44" r="11" fill="#CBD5E1" />
      <rect x="38" y="44" width="39" height="12" fill="#CBD5E1" rx="2" />
    </g>
    {[
      { x: 38, cls: "wa-snow-1" },
      { x: 48, cls: "wa-snow-2" },
      { x: 58, cls: "wa-snow-3" },
      { x: 68, cls: "wa-snow-4" },
      { x: 43, cls: "wa-snow-5" },
    ].map(({ x, cls }) => (
      <g key={x} className={cls} style={{ transformOrigin: `${x}px 68px` }}>
        <line x1={x} y1="64" x2={x} y2="72" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
        <line x1={x - 4} y1="68" x2={x + 4} y2="68" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
        <line x1={x - 3} y1="65" x2={x + 3} y2="71" stroke="#BAE6FD" strokeWidth="1.5" strokeLinecap="round" />
        <line x1={x + 3} y1="65" x2={x - 3} y2="71" stroke="#BAE6FD" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    ))}
  </svg>
);

const Moon = () => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
      <mask id="wa-moon-crescent">
        <rect width="100" height="100" fill="white" />
        <circle cx="62" cy="36" r="22" fill="black" />
      </mask>
    </defs>
    {/* Crescent moon body */}
    <circle cx="46" cy="52" r="21" fill="#FDE68A" mask="url(#wa-moon-crescent)" />
    {/* Stars */}
    <circle cx="20" cy="26" r="2.2" fill="#FDE68A" className="wa-star-1" />
    <circle cx="76" cy="20" r="1.8" fill="#FDE68A" className="wa-star-2" />
    <circle cx="82" cy="62" r="1.6" fill="#FDE68A" className="wa-star-3" />
    <circle cx="24" cy="74" r="1.2" fill="#FDE68A" className="wa-star-1" />
    <circle cx="84" cy="38" r="1.2" fill="#FDE68A" className="wa-star-2" />
  </svg>
);

const Foggy = () => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    {[
      { y: 38, w: 60, x: 20, cls: "wa-fog-1" },
      { y: 50, w: 50, x: 25, cls: "wa-fog-2" },
      { y: 62, w: 55, x: 22, cls: "wa-fog-3" },
      { y: 74, w: 45, x: 27, cls: "wa-fog-1" },
    ].map(({ y, w, x, cls }) => (
      <line
        key={y}
        x1={x} y1={y} x2={x + w} y2={y}
        stroke="#94A3B8" strokeWidth="5" strokeLinecap="round"
        className={cls}
      />
    ))}
  </svg>
);

/* ── condition resolver ───────────────────────────────────────── */

const getAnimation = (description = "", isNight = false) => {
  const d = description.toLowerCase();
  if (d.includes("thunderstorm")) return Thunderstorm;
  if (d.includes("drizzle") || d.includes("shower") || d.includes("rain")) return Rainy;
  if (d.includes("snow") || d.includes("sleet") || d.includes("hail") || d.includes("ice")) return Snowy;
  if (d.includes("fog") || d.includes("mist") || d.includes("haze") || d.includes("smoke") || d.includes("dust") || d.includes("sand")) return Foggy;
  if (d.includes("overcast") || d.includes("broken clouds") || d.includes("scattered clouds")) return Cloudy;
  if (d.includes("few clouds") || d.includes("partly") || d.includes("cloud")) return isNight ? Moon : PartlyCloudy;
  // "clear sky" or default — show moon at night, sun during day
  return isNight ? Moon : Sunny;
};

/* ── public component ─────────────────────────────────────────── */

const WeatherAnimation = ({ description = "", icon = "", size = 80 }) => {
  // OpenWeatherMap icon codes end with 'n' for night (e.g. "01n", "02n")
  const isNight = icon.endsWith("n");
  const AnimComponent = getAnimation(description, isNight);
  return (
    <>
      <style>{styles}</style>
      <div style={{ width: size, height: size, flexShrink: 0 }}>
        <AnimComponent />
      </div>
    </>
  );
};

export default WeatherAnimation;
