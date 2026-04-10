import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../Context/AuthContext";
import { MdPhotoCamera } from "react-icons/md";
import { API_BASE_URL } from "../../utils/api";

const formatDate = (dateValue) => {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

const parseApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const rawText = await response.text();
  const looksLikeHtml = rawText.trim().startsWith("<!DOCTYPE") || rawText.trim().startsWith("<html");

  if (looksLikeHtml) {
    return {
      success: false,
      message: "Could not reach the API correctly. Please check backend server and API URL configuration."
    };
  }

  return {
    success: false,
    message: rawText || "Unexpected server response."
  };
};

const uploadProfileImage = async (file, token) => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("folder", "users/profile-images");

  const response = await fetch(`${API_BASE_URL}/upload/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  const data = await parseApiResponse(response);

  if (!response.ok) {
    throw new Error(data.message || "Failed to upload image.");
  }
  if (!data.url) {
    throw new Error("Upload did not return an image URL.");
  }
  return data.url;
};

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: "", email: "" });
  const [serverUser, setServerUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [dragOverImageDropzone, setDragOverImageDropzone] = useState(false);
  const fileInputRef = useRef(null);
  const [avatarBroken, setAvatarBroken] = useState(false);

  const userId = user?.id || user?._id;
  const userIdStr =
    userId != null && typeof userId === "object" && typeof userId.toString === "function"
      ? userId.toString()
      : String(userId || "");

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("token");
      if (!userIdStr || !token) {
        setLoading(false);
        setError("Please log in to access your profile.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/user/${userIdStr}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await parseApiResponse(response);

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch profile");
        }

        const profile = data.user || {};
        setServerUser(profile);
        setForm({
          name: profile.name || "",
          email: profile.email || ""
        });
      } catch (fetchError) {
        setError(fetchError.message || "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userIdStr]);

  useEffect(() => {
    setAvatarBroken(false);
  }, [serverUser?.picture]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
    setSuccess("");
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Please enter a valid email.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const token = localStorage.getItem("token");
    if (!userIdStr || !token) {
      setError("Please log in to continue.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim()
      };

      const response = await fetch(`${API_BASE_URL}/user/${userIdStr}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile.");
      }

      const updated = data.user;
      setServerUser(updated);
      updateUser({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        picture: updated.picture || user?.picture || ''
      });
      setSuccess("Profile updated successfully.");
    } catch (saveError) {
      setError(saveError.message || "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  };

  const openPasswordModal = () => {
    setPasswordError("");
    setPasswordSuccess("");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    if (changingPassword) return;
    setShowPasswordModal(false);
  };

  const handlePasswordInput = (event) => {
    const { name, value } = event.target;
    setPasswordForm((previous) => ({ ...previous, [name]: value }));
    setPasswordError("");
    setPasswordSuccess("");
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("token");
    if (!userIdStr || !token) {
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

    setChangingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/user/${userIdStr}/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(passwordForm)
      });
      const data = await parseApiResponse(response);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(data.message || "Current password is incorrect.");
        }
        if (response.status === 400) {
          throw new Error(data.message || "Please check the entered passwords and try again.");
        }
        throw new Error(data.message || "Failed to change password.");
      }

      setPasswordSuccess("Password changed successfully.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setServerUser((prev) => (prev ? { ...prev, hasPassword: true } : prev));
      setTimeout(() => {
        setShowPasswordModal(false);
      }, 900);
    } catch (submitError) {
      setPasswordError(submitError.message || "Unable to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const openImageModal = () => {
    setImageError("");
    setDragOverImageDropzone(false);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    if (uploadingImage) return;
    setShowImageModal(false);
    setDragOverImageDropzone(false);
  };

  const handleProfileImageFile = async (file) => {
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      setImageError("Please choose an image file.");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token || !userIdStr) {
      setImageError("Please log in to continue.");
      return;
    }

    setUploadingImage(true);
    setImageError("");
    setSuccess("");

    try {
      const uploadedUrl = await uploadProfileImage(file, token);
      const response = await fetch(`${API_BASE_URL}/user/${userIdStr}/profile-image`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ picture: uploadedUrl })
      });
      const data = await parseApiResponse(response);
      if (!response.ok) {
        throw new Error(data.message || "Failed to save profile image.");
      }

      const updated = data.user;
      setServerUser((prev) => ({ ...(prev || {}), ...updated }));
      updateUser({
        id: updated.id || user?.id,
        name: updated.name || user?.name,
        email: updated.email || user?.email,
        role: updated.role || user?.role,
        picture: updated.picture || ""
      });
      setSuccess("Profile image updated successfully.");
      setShowImageModal(false);
    } catch (uploadError) {
      setImageError(uploadError.message || "Unable to upload profile image.");
    } finally {
      setUploadingImage(false);
      setDragOverImageDropzone(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <section className="w-full max-w-2xl mx-auto py-6 md:py-10 px-2">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-5 border-b border-slate-200 dark:border-slate-700/60 bg-gradient-to-r from-emerald-500 to-teal-600">
          <h1 className="text-white text-xl md:text-2xl font-bold font-['Sora']">My Profile</h1>
        </div>

        <div className="p-4 md:p-6">
          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm text-red-600 dark:text-red-400 font-['Sora']">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 px-3 py-2.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-sm text-emerald-700 dark:text-emerald-300 font-['Sora']">
              {success}
            </div>
          )}

          <div className="flex flex-col items-center md:flex-row md:items-center gap-4 mb-6 pb-2 border-b border-slate-200/80 dark:border-slate-700/60">
            <button
              type="button"
              onClick={openImageModal}
              className="group relative w-20 h-20 rounded-full border-2 border-emerald-200 dark:border-emerald-700 shadow-sm overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
              aria-label="Update profile image"
            >
              {serverUser?.picture && !avatarBroken ? (
                <img
                  src={serverUser.picture}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={() => setAvatarBroken(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white font-['Sora'] bg-gradient-to-br from-emerald-500 to-emerald-400">
                  {(form.name || user?.name || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-150 flex items-center justify-center">
                <span className="w-9 h-9 rounded-full bg-white/95 text-emerald-600 flex items-center justify-center shadow">
                  <MdPhotoCamera size={19} />
                </span>
              </div>
            </button>
            <div className="text-center md:text-left">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-['Sora']">
                {form.name || user?.name || 'User'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-['Sora'] mt-0.5 break-all">
                {form.email || user?.email}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                Full Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                Role
              </label>
              <input
                disabled
                value={serverUser?.role || "-"}
                className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                Joined On
              </label>
              <input
                disabled
                value={formatDate(serverUser?.createdAt)}
                className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="md:col-span-2 flex flex-col sm:flex-row sm:justify-end gap-2 mt-2">
              {serverUser?.hasPassword && (
                <button
                  type="button"
                  onClick={openPasswordModal}
                  className="inline-flex items-center justify-center min-w-36 px-5 py-2.5 rounded-md text-sm font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors duration-150 font-['Sora']"
                >
                  Change Password
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center min-w-36 px-5 py-2.5 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed font-['Sora']"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-3">
          <div className="absolute inset-0 bg-black/45" onClick={closePasswordModal} />
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-lg p-4 md:p-5">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 font-['Sora']">
              Change Password
            </h2>

            {passwordError && (
              <div className="mt-3 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm text-red-600 dark:text-red-400 font-['Sora']">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mt-3 px-3 py-2 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-sm text-emerald-700 dark:text-emerald-300 font-['Sora']">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordInput}
                  className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordInput}
                  className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordInput}
                  className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={changingPassword}
                  className="inline-flex items-center justify-center min-w-28 px-4 py-2.5 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 font-['Sora'] disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex items-center justify-center min-w-36 px-4 py-2.5 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-colors duration-150 font-['Sora'] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {changingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-3">
          <div className="absolute inset-0 bg-black/45" onClick={closeImageModal} />
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-lg p-4 md:p-5">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 font-['Sora']">
              Update Profile Image
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-['Sora']">
              Drag and drop an image, or choose a file from your device.
            </p>

            {imageError && (
              <div className="mt-3 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm text-red-600 dark:text-red-400 font-['Sora']">
                {imageError}
              </div>
            )}

            <div
              role="button"
              tabIndex={0}
              onClick={() => !uploadingImage && fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if ((event.key === "Enter" || event.key === " ") && !uploadingImage) {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!uploadingImage) setDragOverImageDropzone(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!uploadingImage) setDragOverImageDropzone(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDragOverImageDropzone(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDragOverImageDropzone(false);
                if (uploadingImage) return;
                handleProfileImageFile(event.dataTransfer.files?.[0]);
              }}
              className={`mt-4 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
                dragOverImageDropzone
                  ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-900/20"
                  : "border-slate-300 dark:border-slate-600 bg-slate-50/60 dark:bg-slate-800/40"
              } ${uploadingImage ? "opacity-70 pointer-events-none" : "cursor-pointer"}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingImage}
                onChange={(event) => {
                  handleProfileImageFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />

              <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                <MdPhotoCamera size={20} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-['Sora']">
                Drag and drop your profile image here
              </p>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (!uploadingImage) fileInputRef.current?.click();
                }}
                disabled={uploadingImage}
                className="mt-3 inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium font-['Sora'] border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-70"
              >
                Choose File
              </button>
              {uploadingImage && (
                <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-300 font-['Sora']">Uploading image...</p>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={closeImageModal}
                disabled={uploadingImage}
                className="inline-flex items-center justify-center min-w-28 px-4 py-2.5 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 font-['Sora'] disabled:opacity-60"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProfilePage;
