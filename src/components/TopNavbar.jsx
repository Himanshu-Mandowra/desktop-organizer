import { useState } from "react";
import PanelLeft from "lucide-react/dist/esm/icons/panel-left";
import PanelRight from "lucide-react/dist/esm/icons/panel-right";
import Maximize2 from "lucide-react/dist/esm/icons/maximize-2";
import Download from "lucide-react/dist/esm/icons/download";
import Save from "lucide-react/dist/esm/icons/save";
import User from "lucide-react/dist/esm/icons/user";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import Video from "lucide-react/dist/esm/icons/video";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";

function TopNavbar({
  isLeftOpen,
  setIsLeftOpen,
  isRightOpen,
  setIsRightOpen,
  onEnterFullPreview,
  stageSize,
  scale,
  autoSaveStatus,
  onOpenTemplates,
  onOpenSavedLayouts,
  exportWallpaper,
  exportLiveVideo,
  isLiveWallpaper,
  isExporting,
  user,
  onOpenAuth,
  onLogout,
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <header className="h-14 w-full shrink-0 flex items-center justify-between bg-[#121215] border-b border-[#27272a] px-4 select-none z-40">
      {/* LEFT: SIDEBAR TOGGLE + BRAND + RESOLUTION INFO */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsLeftOpen((v) => !v)}
          title={isLeftOpen ? "Collapse Left Sidebar" : "Expand Left Sidebar"}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
            isLeftOpen
              ? "bg-[#18181b] border-[#3f3f46] text-white"
              : "bg-[#121215] border-[#27272a] text-zinc-400 hover:bg-[#18181b] hover:text-white"
          }`}
        >
          <PanelLeft size={16} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="h-3 w-3 rounded-sm bg-indigo-600" />
          <span className="text-sm font-bold tracking-tight text-white">
            Desktop Canvas
          </span>
        </div>

        <div className="h-4 w-[1px] bg-[#27272a]" />

        <div className="hidden md:flex items-center gap-2 text-xs">
          <span className="rounded-md bg-[#18181b] border border-[#27272a] px-2.5 py-1 font-mono text-zinc-300">
            {stageSize.width} × {stageSize.height}px ({Math.round(scale * 100)}% Fit)
          </span>
          <span className="rounded-md bg-[#18181b] border border-[#27272a] px-2.5 py-1 text-zinc-400">
            {autoSaveStatus || "✓ Auto-saved locally"}
          </span>
        </div>
      </div>

      {/* RIGHT: FULL PREVIEW, TEMPLATES, CLOUD SAVE, EXPORT, SIGN IN, RIGHT SIDEBAR TOGGLE */}
      <div className="flex items-center gap-2">
        <button
          onClick={onEnterFullPreview}
          title="Maximize Preview Screen (Full Viewport Edit Mode)"
          className="flex h-9 items-center gap-1.5 rounded-lg bg-[#18181b] border border-[#27272a] px-3 text-xs font-semibold text-zinc-200 transition hover:bg-[#27272a] hover:text-white"
        >
          <Maximize2 size={14} className="text-emerald-400" />
          <span>Full Preview</span>
        </button>

        <button
          onClick={onOpenTemplates}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-[#18181b] border border-[#27272a] px-3 text-xs font-semibold text-zinc-200 transition hover:bg-[#27272a] hover:text-white"
        >
          <Sparkles size={14} className="text-indigo-400" />
          <span>Templates</span>
        </button>

        <button
          onClick={onOpenSavedLayouts}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-[#18181b] border border-[#27272a] px-3 text-xs font-semibold text-zinc-200 transition hover:bg-[#27272a] hover:text-white"
        >
          <Save size={14} className="text-indigo-400" />
          <span>Save Layout</span>
        </button>

        {/* EXPORT BUTTON */}
        <div className="relative">
          <button
            disabled={isExporting}
            onClick={() => {
              if (isLiveWallpaper) {
                setShowExportMenu((v) => !v);
              } else {
                exportWallpaper();
              }
            }}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            <Download size={14} />
            <span>{isExporting ? "Exporting..." : "Download HD"}</span>
          </button>

          {showExportMenu && isLiveWallpaper && (
            <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-[#27272a] bg-[#121215] p-1.5 text-xs text-white shadow-2xl">
              <button
                onClick={() => {
                  setShowExportMenu(false);
                  exportLiveVideo();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-semibold hover:bg-indigo-600"
              >
                <Video size={14} />
                <div>
                  <div>Export Live Video (.webm)</div>
                  <div className="text-[10px] text-zinc-400">
                    Records 5s loop with boxes
                  </div>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowExportMenu(false);
                  exportWallpaper();
                }}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-semibold hover:bg-[#18181b]"
              >
                <Download size={14} />
                <div>
                  <div>Export Lossless PNG</div>
                  <div className="text-[10px] text-zinc-400">
                    Full native resolution frame
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-[#27272a]" />

        {/* SIGN IN / USER ACCOUNT IN FIXED NAVBAR */}
        {user ? (
          <div className="flex items-center gap-1.5">
            <span className="rounded-lg bg-[#18181b] border border-[#27272a] px-3 py-1.5 text-xs font-semibold text-zinc-200">
              {user.name}
            </span>
            <button
              onClick={onLogout}
              title="Log Out"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-400 transition hover:bg-red-600 hover:border-red-600 hover:text-white"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() =>
              onOpenAuth(
                "Sign up or log in to save layouts to your account and like templates!"
              )
            }
            className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-xs font-bold text-white transition hover:bg-indigo-500"
          >
            <User size={14} />
            <span>Sign In</span>
          </button>
        )}

        <div className="h-4 w-[1px] bg-[#27272a]" />

        <button
          onClick={() => setIsRightOpen((v) => !v)}
          title={isRightOpen ? "Collapse Box Editor" : "Expand Box Editor"}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
            isRightOpen
              ? "bg-[#18181b] border-[#3f3f46] text-white"
              : "bg-[#121215] border-[#27272a] text-zinc-400 hover:bg-[#18181b] hover:text-white"
          }`}
        >
          <PanelRight size={16} />
        </button>
      </div>
    </header>
  );
}

export default TopNavbar;
