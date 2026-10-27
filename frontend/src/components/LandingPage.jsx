import { useState, useEffect } from "react";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Grid3X3 from "lucide-react/dist/esm/icons/grid-3x3";
import Layers from "lucide-react/dist/esm/icons/layers";
import Download from "lucide-react/dist/esm/icons/download";

const DEMO_SLIDES = [
  {
    id: "slide-1",
    src: "/samples/demo-1.png",
    title: "Organized Folder Sections",
    caption: "Exact Windows 75×87 folder grid alignment with synced top title bars",
  },
  {
    id: "slide-2",
    src: "/samples/demo-2.jpg",
    title: "Custom Image & Shape Fills",
    caption: "Drop custom artwork inside any section box and export in lossless HD",
  },
  {
    id: "slide-3",
    src: "/samples/demo-3.png",
    title: "Rotated Polygons & Game Docks",
    caption: "Combine rotated triangle frames with custom folder boxes on one desktop",
  },
];

function LandingPage({ onGetStarted }) {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % DEMO_SLIDES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const current = DEMO_SLIDES[activeSlide];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#09090b] text-white flex flex-col select-none">
      {/* TOP BAR */}
      <header className="h-14 w-full shrink-0 flex items-center justify-between border-b border-[#27272a] bg-[#121215] px-6 lg:px-12">
        <div className="hover-float flex items-center gap-2.5 rounded-lg px-2 py-1 cursor-pointer">
          <img
            src="/logo.png"
            alt="Desktop Canvas Logo"
            className="h-9 w-9 object-contain"
          />
          <span className="text-sm font-bold tracking-tight text-white">
            Desktop Canvas
          </span>
        </div>

        <button
          onClick={onGetStarted}
          className="btn-fill-lr flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-bold text-white"
        >
          <span>Get Started Free</span>
          <ArrowRight size={14} />
        </button>
      </header>

      {/* MAIN SINGLE-SCREEN CONTENT */}
      <main className="flex-1 overflow-hidden px-6 lg:px-14 py-6 flex items-center justify-center">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* LEFT: CONCISE COPY + CTA */}
          <div className="lg:col-span-5 space-y-5">
            <div className="hover-float inline-flex items-center gap-2 rounded-md border border-[#27272a] bg-[#121215] px-3 py-1.5 text-[11px] font-semibold text-indigo-400 hover:border-indigo-500/60">
              <img
                src="/logo.png"
                alt="Desktop Canvas Icon"
                className="h-5 w-5 object-contain"
              />
              <span>PC Desktop Wallpaper & Folder Organizer</span>
            </div>

            <h1 className="hover-float rounded-lg text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-white leading-[1.12] cursor-default">
              Design Your Custom Desktop Layout in Seconds.
            </h1>

            <p className="hover-float rounded-lg text-sm text-zinc-400 leading-relaxed max-w-md cursor-default">
              Snap section boxes directly onto your Windows desktop folder grid, customize shapes and images, group layers, and download a pixel-perfect HD wallpaper.
            </p>

            {/* PRIMARY CTA BUTTON WITH LEFT-TO-RIGHT LIGHT-SHADE FILL EFFECT */}
            <div className="pt-1">
              <button
                onClick={onGetStarted}
                className="btn-fill-lr inline-flex items-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-bold text-white"
              >
                <span>Get Started Free</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* COMPACT FEATURE PILLS (SCALE UP + FLOAT ON HOVER) */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 max-w-md">
              <div className="hover-float rounded-lg border border-[#27272a] bg-[#121215] p-2.5 hover:border-emerald-500/60 cursor-default">
                <Grid3X3 size={15} className="text-emerald-400 mb-1" />
                <div className="text-xs font-bold text-white">Exact PC Grid</div>
                <div className="text-[10px] text-zinc-400">75×87 folder snap</div>
              </div>

              <div className="hover-float rounded-lg border border-[#27272a] bg-[#121215] p-2.5 hover:border-indigo-500/60 cursor-default">
                <Layers size={15} className="text-indigo-400 mb-1" />
                <div className="text-xs font-bold text-white">Groups & Layers</div>
                <div className="text-[10px] text-zinc-400">Multi-box & Undo</div>
              </div>

              <div className="hover-float rounded-lg border border-[#27272a] bg-[#121215] p-2.5 hover:border-amber-500/60 cursor-default">
                <Download size={15} className="text-amber-400 mb-1" />
                <div className="text-xs font-bold text-white">Lossless HD</div>
                <div className="text-[10px] text-zinc-400">1:1 screen export</div>
              </div>
            </div>
          </div>

          {/* RIGHT: 2-IMAGE AUTO-PLAY SAMPLE SLIDESHOW (DOTS ONLY, NO ARROWS, FLOATS ON HOVER) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="hover-float w-full rounded-xl border-2 border-[#27272a] bg-[#121215] p-2.5 shadow-2xl hover:border-indigo-500/60">
              {/* Monitor Header Bar */}
              <div className="mb-2 flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2">
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="h-5 w-5 object-contain"
                  />
                  <span className="text-[11px] font-semibold text-zinc-300">
                    {current.title}
                  </span>
                </div>
                <span className="rounded bg-[#18181b] border border-[#27272a] px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                  Sample {activeSlide + 1} / {DEMO_SLIDES.length}
                </span>
              </div>

              {/* 16:9 Sample Screen Frame */}
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-[#27272a] bg-[#09090b]">
                {DEMO_SLIDES.map((slide, index) => (
                  <img
                    key={slide.id}
                    src={slide.src}
                    alt={slide.title}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                      index === activeSlide
                        ? "opacity-100 z-10"
                        : "opacity-0 z-0 pointer-events-none"
                    }`}
                  />
                ))}
              </div>

              {/* Caption + Slide Dots */}
              <div className="mt-2.5 flex items-center justify-between px-2 py-1">
                <span className="text-xs text-zinc-400 truncate">
                  {current.caption}
                </span>

                {/* Slide Dots Only (No Arrows) */}
                <div className="flex items-center gap-2 shrink-0">
                  {DEMO_SLIDES.map((slide, index) => (
                    <button
                      key={slide.id}
                      onClick={() => setActiveSlide(index)}
                      aria-label={`Show sample ${index + 1}`}
                      className={`hover-float h-2.5 rounded-full transition-all ${
                        index === activeSlide
                          ? "w-7 bg-indigo-500"
                          : "w-2.5 bg-[#27272a] hover:bg-zinc-500"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LandingPage;
