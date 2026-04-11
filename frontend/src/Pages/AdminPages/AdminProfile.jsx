import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../Context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const parseApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return { message: text || "Unexpected server response." };
};

const AdminProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const userId = useMemo(() => {
    const id = user?.id || user?._id;
    return id != null && typeof id === "object" && typeof id.toString === "function"
      ? id.toString()
      : String(id || "");
  }, [user]);

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("token");

      if (!userId || !token) {
        setError("Please log in to access this page.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await parseApiResponse(response);

        if (!response.ok) {
          throw new Error(data.message || "Failed to load profile.");
        }

        setProfile(data.user || null);
      } catch (loadError) {
        setError(loadError.message || "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const displayName = profile?.name || user?.name || "Admin User";
  const displayEmail = profile?.email || user?.email || "-";
  const displayRole = profile?.role || user?.role || "admin";
  const displayJoinedAt = formatDate(profile?.createdAt || user?.createdAt);

  const handlePasswordInput = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordError("");
    setPasswordSuccess("");
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("token");
    if (!userId || !token) {
      setPasswordError("Please log in to continue.");
      return;
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    try {
      setSavingPassword(true);
      setPasswordError("");
      setPasswordSuccess("");

      const response = await fetch(`${API_BASE_URL}/user/${userId}/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordForm),
      });

      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password.");
      }

      setPasswordSuccess("Password updated successfully.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (submitError) {
      setPasswordError(submitError.message || "Unable to change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-5 lg:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 md:p-5 shadow-sm">
          <h1 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
            Admin Profile
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
            Basic account information for the current administrator.
          </p>

          {error && (
            <div className="mt-3 rounded-md border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs text-red-700 dark:text-red-300 font-['Sora']">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-6 flex items-center justify-center py-10">
              <div className="inline-block h-9 w-9 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-md border border-slate-200 dark:border-slate-700 p-3 bg-slate-50/80 dark:bg-slate-900/40">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 font-['Sora']">
                    Full Name
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                    {displayName}
                  </p>
                </div>

                <div className="rounded-md border border-slate-200 dark:border-slate-700 p-3 bg-slate-50/80 dark:bg-slate-900/40">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 font-['Sora']">
                    Email
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora'] break-all">
                    {displayEmail}
                  </p>
                </div>

                <div className="rounded-md border border-slate-200 dark:border-slate-700 p-3 bg-slate-50/80 dark:bg-slate-900/40">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 font-['Sora']">
                    Role
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora'] capitalize">
                    {displayRole}
                  </p>
                </div>

                <div className="rounded-md border border-slate-200 dark:border-slate-700 p-3 bg-slate-50/80 dark:bg-slate-900/40">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 font-['Sora']">
                    Joined On
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                    {displayJoinedAt}
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-slate-200 dark:border-slate-700 p-3 bg-slate-50/80 dark:bg-slate-900/40">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                  Reset Password
                </h2>

                {passwordError && (
                  <div className="mt-3 rounded-md border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs text-red-700 dark:text-red-300 font-['Sora']">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="mt-3 rounded-md border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300 font-['Sora']">
                    {passwordSuccess}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordInput}
                    placeholder="Current password"
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-['Sora'] outline-none focus:ring-2 focus:ring-emerald-400/20"
                  />
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInput}
                    placeholder="New password"
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-['Sora'] outline-none focus:ring-2 focus:ring-emerald-400/20"
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInput}
                    placeholder="Confirm password"
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-['Sora'] outline-none focus:ring-2 focus:ring-emerald-400/20"
                  />

                  <div className="md:col-span-3">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="inline-flex items-center justify-center rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2 text-xs font-semibold text-white font-['Sora'] transition-colors"
                    >
                      {savingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;