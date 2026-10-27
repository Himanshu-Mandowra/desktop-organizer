import { useState, useEffect, useCallback } from "react";
import X from "lucide-react/dist/esm/icons/x";
import Save from "lucide-react/dist/esm/icons/save";
import Folder from "lucide-react/dist/esm/icons/folder";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { LAYOUTS_ARE_LOCAL } from "../services/api";

function SavedLayoutsModal({
  isOpen,
  onClose,
  layoutApi,
  currentLayoutPayload,
  onLoadLayout,
}) {
  const [layouts, setLayouts] = useState([]);
  const [layoutName, setLayoutName] = useState("My Desktop Setup");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchLayouts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await layoutApi.getAll();
      setLayouts(data.layouts || []);
    } catch (err) {
      setMessage(err.message || "Could not load saved layouts.");
    } finally {
      setLoading(false);
    }
  }, [layoutApi]);

  useEffect(() => {
    if (isOpen) {
      setMessage("");
      fetchLayouts();
    }
  }, [isOpen, fetchLayouts]);

  if (!isOpen) return null;

  const handleSaveCurrent = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage("");
      await layoutApi.save({
        ...currentLayoutPayload,
        name: layoutName || "My Desktop Setup",
      });
      setMessage("Layout saved to your account!");
      fetchLayouts();
    } catch (err) {
      setMessage(err.message || "Failed to save layout.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await layoutApi.remove(id);
      setLayouts((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      setMessage(err.message || "Failed to delete layout.");
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/85 p-4">
      <div className="flex max-h-[82vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#27272a] bg-[#121215] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#27272a] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Folder size={18} className="text-indigo-400" />
            <h2 className="text-base font-bold">
              {LAYOUTS_ARE_LOCAL
                ? "Saved Layouts (This Browser)"
                : "Saved Cloud Layouts"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-[#18181b] border border-[#27272a] p-2 text-zinc-400 hover:bg-[#27272a] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* SAVE CURRENT FORM */}
          <form
            onSubmit={handleSaveCurrent}
            className="flex items-center gap-2 rounded-xl border border-[#27272a] bg-[#18181b] p-3"
          >
            <input
              type="text"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder="Layout Name..."
              className="flex-1 rounded-lg border border-[#27272a] bg-[#121215] px-3 py-2 text-xs text-white outline-none"
            />
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? "Saving..." : "Save Current"}
            </button>
          </form>

          {message && (
            <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-2.5 text-xs text-indigo-300">
              {message}
            </div>
          )}

          {/* SAVED LIST */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Your Saved Layouts
            </h3>

            {loading ? (
              <p className="text-xs text-zinc-500">Loading layouts...</p>
            ) : layouts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#27272a] p-6 text-center text-xs text-zinc-500">
                No saved cloud layouts yet. Save your current layout above!
              </p>
            ) : (
              layouts.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between rounded-xl border border-[#27272a] bg-[#18181b] p-3.5"
                >
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      {item.sections?.length || 0} sections •{" "}
                      {item.stageSize?.width}×{item.stageSize?.height} •{" "}
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onLoadLayout(item);
                        onClose();
                      }}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="rounded-lg bg-[#121215] border border-[#27272a] p-2 text-red-400 hover:bg-red-600 hover:border-red-600 hover:text-white"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SavedLayoutsModal;
