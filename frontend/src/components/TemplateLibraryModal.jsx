import { useState } from "react";
import X from "lucide-react/dist/esm/icons/x";
import Heart from "lucide-react/dist/esm/icons/heart";
import Upload from "lucide-react/dist/esm/icons/upload";
import Video from "lucide-react/dist/esm/icons/video";
import Check from "lucide-react/dist/esm/icons/check";

const MAX_BYTES = 20 * 1024 * 1024; // 20MB

function TemplateLibraryModal({
  isOpen,
  onClose,
  templates,
  activeWallpaper,
  onSelectTemplate,
  onToggleLike,
  onUploadTemplateToLibrary,
  onLocalWallpaperFile,
  user,
  onRequireAuth,
}) {
  const [filter, setFilter] = useState("all");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Anime");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const likedSet = new Set(user?.likedTemplates || []);

  const filteredTemplates = templates.filter((tpl) => {
    if (filter === "static") return tpl.type !== "live";
    if (filter === "live") return tpl.type === "live";
    if (filter === "liked") return likedSet.has(String(tpl._id));
    return true;
  });

  const handleFilePick = (e) => {
    setErrorMsg("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_BYTES) {
      setErrorMsg("File exceeds the 20MB maximum limit for live/static wallpapers.");
      return;
    }

    setSelectedFile(file);
    if (!uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handlePublishTemplate = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedFile) {
      setErrorMsg("Please choose an image or live wallpaper video (up to 20MB).");
      return;
    }

    if (!user) {
      onRequireAuth("Please sign up or log in first to publish templates to the cloud library.");
      return;
    }

    try {
      setIsUploading(true);
      await onUploadTemplateToLibrary({
        file: selectedFile,
        title: uploadTitle || selectedFile.name,
        category: uploadCategory || "Custom",
      });
      setSelectedFile(null);
      setUploadTitle("");
    } catch (err) {
      setErrorMsg(err.message || "Failed to upload template.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUseLocalImmediately = () => {
    if (!selectedFile) return;
    onLocalWallpaperFile(selectedFile, uploadTitle || selectedFile.name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#27272a] bg-[#121215] text-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[#27272a] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Desktop Canvas Logo"
              className="h-9 w-9 object-contain"
            />
            <div>
              <h2 className="text-base font-bold">Wallpaper & Live Template Library</h2>
              <p className="text-xs text-zinc-400">
                Includes "Boa Hancock" (Default) & "Toji Fushiguro" + Live Wallpapers up to 20MB
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg bg-[#18181b] border border-[#27272a] p-2 text-zinc-400 transition hover:bg-[#27272a] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* FILTER TABS */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27272a] bg-[#09090b] px-6 py-3">
          <div className="flex items-center gap-2">
            {[
              { id: "all", label: "All Templates" },
              { id: "static", label: "Static HD" },
              { id: "live", label: "Live Wallpapers" },
              { id: "liked", label: "Liked ♥" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  filter === tab.id
                    ? "bg-indigo-600 text-white"
                    : "bg-[#18181b] border border-[#27272a] text-zinc-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-zinc-400">
            Max Upload Size: <strong className="text-white">20 MB</strong>
          </span>
        </div>

        {/* CONTENT BODY */}
        <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto p-6 lg:grid-cols-3">
          {/* TEMPLATE CARDS GRID */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
            {filteredTemplates.map((tpl) => {
              const isCurrent =
                activeWallpaper?.url === tpl.url ||
                activeWallpaper?.templateId === String(tpl._id);
              const isLiked = likedSet.has(String(tpl._id));

              return (
                <div
                  key={tpl._id}
                  className={`group relative overflow-hidden rounded-xl border transition ${
                    isCurrent
                      ? "border-indigo-500"
                      : "border-[#27272a] hover:border-zinc-500"
                  } bg-[#18181b]`}
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-[#09090b]">
                    {tpl.type === "live" &&
                    (tpl.url?.endsWith(".mp4") ||
                      tpl.url?.endsWith(".webm") ||
                      tpl.mimeType?.startsWith("video/")) ? (
                      <video
                        src={tpl.url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img
                        src={tpl.url}
                        alt={tpl.title}
                        className="h-full w-full object-cover"
                      />
                    )}

                    {/* BADGES */}
                    <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
                      {tpl.isDefault && (
                        <span className="rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                          Default
                        </span>
                      )}
                      {tpl.type === "live" && (
                        <span className="flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                          <Video size={11} /> Live
                        </span>
                      )}
                    </div>

                    {/* LIKE BUTTON */}
                    <button
                      onClick={() => onToggleLike(tpl)}
                      title="Like Template"
                      className={`absolute right-2.5 top-2.5 flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                        isLiked
                          ? "bg-pink-600 border-pink-500 text-white"
                          : "bg-[#121215] border-[#27272a] text-zinc-200 hover:bg-[#18181b]"
                      }`}
                    >
                      <Heart
                        size={12}
                        className={isLiked ? "fill-current" : ""}
                      />
                      <span>{tpl.likesCount || 0}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {tpl.title}
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        {tpl.category || "Wallpaper"}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        onSelectTemplate(tpl);
                        onClose();
                      }}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        isCurrent
                          ? "bg-emerald-600 text-white"
                          : "bg-indigo-600 text-white hover:bg-indigo-500"
                      }`}
                    >
                      {isCurrent && <Check size={13} />}
                      {isCurrent ? "Active" : "Apply"}
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredTemplates.length === 0 && (
              <div className="col-span-2 rounded-xl border border-dashed border-[#27272a] p-8 text-center text-sm text-zinc-400">
                No templates found in this category yet.
              </div>
            )}
          </div>

          {/* UPLOAD STATIC OR LIVE WALLPAPER (<= 20MB) */}
          <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-4 space-y-4 h-fit">
            <div>
              <h3 className="text-sm font-bold text-white">
                Add Static or Live Wallpaper
              </h3>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                Supports MP4, WebM, GIF Live Wallpapers & HD Images up to 20MB.
              </p>
            </div>

            {errorMsg && (
              <div className="rounded-lg border border-red-500 bg-[#121215] p-2.5 text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#3f3f46] bg-[#121215] p-4 text-center transition hover:border-indigo-500">
              <Upload size={18} className="text-indigo-400" />
              <span className="text-xs text-zinc-300">
                {selectedFile
                  ? `${selectedFile.name} (${(
                      selectedFile.size /
                      (1024 * 1024)
                    ).toFixed(2)} MB)`
                  : "Choose Image or Video (Max 20MB)"}
              </span>
              <input
                type="file"
                accept="image/*,video/mp4,video/webm"
                className="hidden"
                onChange={handleFilePick}
              />
            </label>

            <div>
              <label className="mb-1 block text-[11px] text-zinc-400">
                Template Title
              </label>
              <input
                type="text"
                placeholder="e.g. Toji Live Wallpaper"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full rounded-lg border border-[#27272a] bg-[#121215] px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-zinc-400">
                Category
              </label>
              <input
                type="text"
                placeholder="One Piece / JJK / Anime"
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full rounded-lg border border-[#27272a] bg-[#121215] px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={!selectedFile}
                onClick={handleUseLocalImmediately}
                className="w-full rounded-lg bg-[#121215] border border-[#27272a] py-2.5 text-xs font-bold text-white transition hover:bg-[#27272a] disabled:opacity-40"
              >
                Use Immediately on Canvas (No Login)
              </button>

              <button
                type="button"
                disabled={!selectedFile || isUploading}
                onClick={handlePublishTemplate}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-500 disabled:opacity-40"
              >
                {isUploading
                  ? "Uploading to Cloud Library..."
                  : "Save to Template Library"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplateLibraryModal;
