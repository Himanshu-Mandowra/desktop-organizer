import { useState } from "react";
import X from "lucide-react/dist/esm/icons/x";
import User from "lucide-react/dist/esm/icons/user";

function AuthModal({ isOpen, onClose, promptMessage, onAuthSuccess, authApi }) {
  const [mode, setMode] = useState("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response =
        mode === "signup"
          ? await authApi.signup({ name, email, password })
          : await authApi.login({ email, password });

      localStorage.setItem("dc_token", response.token);
      localStorage.setItem("dc_user", JSON.stringify(response.user));
      onAuthSuccess(response.user);
      onClose();
    } catch (err) {
      setError(err.message || "Authentication failed. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#27272a] bg-[#121215] p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#27272a]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#18181b] border border-[#27272a] text-indigo-400">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {mode === "signup" ? "Create Free Account" : "Welcome Back"}
              </h2>
              <p className="text-[11px] text-zinc-400">
                Save layouts to cloud & favorite templates
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg bg-[#18181b] border border-[#27272a] p-2 text-zinc-400 hover:bg-[#27272a] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {promptMessage && (
          <div className="mt-4 rounded-lg border border-[#27272a] bg-[#18181b] p-3 text-xs text-zinc-200">
            {promptMessage}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-500 bg-[#18181b] p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full rounded-lg border border-[#27272a] bg-[#18181b] px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs text-zinc-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-[#27272a] bg-[#18181b] px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-400">
              Password (min 6 chars)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-[#27272a] bg-[#18181b] px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : mode === "signup"
              ? "Sign Up & Continue"
              : "Log In"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-zinc-400">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="font-semibold text-indigo-400 hover:underline"
              >
                Log In
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="font-semibold text-indigo-400 hover:underline"
              >
                Sign Up Free
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
