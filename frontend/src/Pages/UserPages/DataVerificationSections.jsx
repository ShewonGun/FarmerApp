import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const parseApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();

  const rawText = await response.text();
  const looksLikeHtml = rawText.trim().startsWith("<!DOCTYPE") || rawText.trim().startsWith("<html");
  if (looksLikeHtml) {
    return {
      success: false,
      message: "Could not reach the API correctly. Please check backend server and API URL configuration.",
    };
  }
  return { success: false, message: rawText || "Unexpected server response." };
};

const splitCsv = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toCsv = (value) => (Array.isArray(value) ? value.join(", ") : "");

const cardDigitsOnly = (value) => (value || "").replace(/\D/g, "");

/** 16 chars as four groups: "1234 5678 9012 3456", using • for empty positions */
function formatCardNumberGroups(digits) {
  const d = cardDigitsOnly(digits).slice(0, 16);
  let line = "";
  for (let i = 0; i < 16; i += 1) {
    line += i < d.length ? d[i] : "•";
  }
  return [0, 4, 8, 12].map((start) => line.slice(start, start + 4)).join(" ");
}

/** Visa if PAN starts with 44; Mastercard if starts with 48 (per product rules). */
function detectCardBrand(digits) {
  const d = cardDigitsOnly(digits);
  if (d.startsWith("44")) return "visa";
  if (d.startsWith("48")) return "mastercard";
  return null;
}

function CardBrandMark({ brand, className = "" }) {
  if (brand === "visa") {
    return (
      <span
        className={`inline-flex h-5 min-w-[2.75rem] items-center justify-center rounded bg-[#1A1F71] px-2 text-[9px] font-black tracking-[0.18em] text-white ${className}`}
        aria-hidden
      >
        VISA
      </span>
    );
  }
  if (brand === "mastercard") {
    return (
      <span className={`inline-flex items-center ${className}`} aria-hidden>
        <svg viewBox="0 0 40 24" className="h-5 w-[2.6rem]" xmlns="http://www.w3.org/2000/svg">
          <circle cx="15" cy="12" r="10" fill="#EB001B" />
          <circle cx="25" cy="12" r="10" fill="#F79E1B" fillOpacity="0.95" />
          <path
            d="M20 5.5c2.8 1.7 4.7 4.8 4.7 8.5s-1.9 6.8-4.7 8.5c-2.8-1.7-4.7-4.8-4.7-8.5s1.9-6.8 4.7-8.5z"
            fill="#FF5F00"
          />
        </svg>
      </span>
    );
  }
  return null;
}

function FormStatus({ error }) {
  return (
    <>
      {error && (
        <div className="mb-4 px-3 py-2.5 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm text-red-600 dark:text-red-400 font-['Sora']">
          {error}
        </div>
      )}
    </>
  );
}

function SectionCard({ title, subtitle, loading, error, success, saving, onSubmit, children }) {
  const [toast, setToast] = useState({
    mounted: false,
    visible: false,
    message: "",
  });

  useEffect(() => {
    if (!success) return;

    setToast({ mounted: true, visible: false, message: success });

    const enterTimer = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: true }));
    }, 20);

    const exitTimer = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2600);

    const unmountTimer = setTimeout(() => {
      setToast((prev) => ({ ...prev, mounted: false }));
    }, 3150);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(unmountTimer);
    };
  }, [success]);

  if (loading) {
    return (
      <div className="min-h-[10rem] flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {toast.mounted && (
        <div
          className={`fixed top-20 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-500 ${
            toast.visible
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-0"
          } bg-emerald-50/95 dark:bg-emerald-900/90 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-200`}
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-medium font-['Sora']">{toast.message}</p>
        </div>
      )}
      <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 font-['Sora']">{title}</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-['Sora'] mt-1 mb-4">{subtitle}</p>
      <FormStatus error={error} />
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-md text-sm font-medium font-['Sora'] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed text-white transition-colors duration-150"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
        {label}
      </label>
      <input
        {...props}
        className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none"
      />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
        {label}
      </label>
      <select
        {...props}
        className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none"
      >
        {children}
      </select>
    </div>
  );
}

function Check({ label, checked, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-['Sora']">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-emerald-600" />
      {label}
    </label>
  );
}

function getVerificationStatusLabel(status) {
  if (status == null || status === "" || status === "Pending") return "Pending";
  return status;
}

async function uploadKycImage(file) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Please log in to upload images.");

  const formData = new FormData();
  formData.append("image", file);
  formData.append("folder", "kyc-verification");

  const response = await fetch(`${API_BASE_URL}/upload/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data.message || "Upload failed.");
  if (!data.url) throw new Error("Upload did not return a URL.");
  return data.url;
}

function NicImageDropzone({ label, imageUrl, disabled, uploading, onFileSelected, onInvalidFile }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (fileList) => {
    const file = fileList?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onInvalidFile?.();
      return;
    }
    onFileSelected(file);
  };

  return (
    <div className="md:col-span-2">
      <div className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
        {label}
      </div>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled && !uploading) inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          if (disabled || uploading) return;
          handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
          dragOver
            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20"
            : "border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40"
        } ${disabled || uploading ? "opacity-60 pointer-events-none" : "cursor-pointer"}`}
        onClick={() => {
          if (!disabled && !uploading) inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {imageUrl ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <img
              src={imageUrl}
              alt=""
              className="mx-auto sm:mx-0 max-h-36 rounded-md object-contain border border-slate-200 dark:border-slate-600"
            />
            <div className="flex-1 text-left text-sm text-slate-600 dark:text-slate-400 font-['Sora']">
              <p className="break-all text-xs">{imageUrl}</p>
              {uploading && (
                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-['Sora']">Uploading…</p>
              )}
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={(e) => {
                  e.stopPropagation();
                  onFileSelected(null);
                }}
                className="mt-2 text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:underline"
              >
                Remove and upload a different image
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-['Sora']">
              Drag and drop an image here, or
            </p>
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="mt-2 px-3 py-1.5 rounded-md text-sm font-medium font-['Sora'] border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Choose file
            </button>
            {uploading && (
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-['Sora']">Uploading…</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function useSectionForm({ basePath, initialForm, toRequestBody, fromResponse }) {
  const token = useMemo(() => localStorage.getItem("token"), []);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [exists, setExists] = useState(false);

  // Inline `fromResponse` / `toRequestBody` from parent would change every render and retrigger
  // the load effect, wiping user input. Keep latest callbacks in refs instead.
  const fromResponseRef = useRef(fromResponse);
  fromResponseRef.current = fromResponse;
  const initialFormRef = useRef(initialForm);
  initialFormRef.current = initialForm;
  const toRequestBodyRef = useRef(toRequestBody);
  toRequestBodyRef.current = toRequestBody;

  const loadAbortRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const loadAbort = new AbortController();
    loadAbortRef.current = loadAbort;

    const loadData = async () => {
      if (!token) {
        setLoading(false);
        setError("Please log in to continue.");
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/${basePath}/my`, {
          signal: loadAbort.signal,
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await parseApiResponse(response);

        if (!response.ok) {
          if (response.status === 404) {
            if (cancelled) return;
            setExists(false);
            setForm(initialFormRef.current);
            return;
          }
          throw new Error(data.message || "Unable to load section data.");
        }

        if (cancelled) return;
        setExists(true);
        setForm(fromResponseRef.current(data.data || {}));
      } catch (loadError) {
        if (loadError?.name === "AbortError") return;
        if (!cancelled) setError(loadError.message || "Unable to load section data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
      loadAbort.abort();
      loadAbortRef.current = null;
    };
  }, [basePath, token]);

  const submit = async () => {
    if (!token) {
      setError("Please log in to continue.");
      return false;
    }

    loadAbortRef.current?.abort();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const method = exists ? "PUT" : "POST";
      const response = await fetch(`${API_BASE_URL}/${basePath}${exists ? "/my" : "/"}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(toRequestBodyRef.current(form)),
      });
      const data = await parseApiResponse(response);
      if (!response.ok) throw new Error(data.message || "Unable to save changes.");

      setExists(true);
      if (data?.data) setForm(fromResponseRef.current(data.data));
      setSuccess(data?.message || "Saved successfully.");
      return true;
    } catch (submitError) {
      setError(submitError.message || "Unable to save changes.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { form, setForm, loading, saving, error, success, submit };
}

export function AccountVerificationSection() {
  const initialForm = useMemo(
    () => ({
      governmentNicNumber: "",
      nicImage1Url: "",
      nicImage2Url: "",
      agreedToTerms: false,
      consentToDataPolicy: false,
      verificationStatus: null,
    }),
    []
  );

  const {
    form,
    setForm,
    loading,
    saving,
    error,
    success,
    submit,
  } = useSectionForm({
    basePath: "verification-trust",
    initialForm,
    fromResponse: (data) => ({
      governmentNicNumber: data.governmentNicNumber || "",
      nicImage1Url: data.nicImage1Url || "",
      nicImage2Url: data.nicImage2Url || "",
      agreedToTerms: Boolean(data.agreedToTerms),
      consentToDataPolicy: Boolean(data.consentToDataPolicy),
      verificationStatus: data.verificationStatus ?? null,
    }),
    toRequestBody: (values) => ({
      governmentNicNumber: values.governmentNicNumber.trim(),
      nicImage1Url: values.nicImage1Url.trim(),
      nicImage2Url: values.nicImage2Url.trim(),
      agreedToTerms: Boolean(values.agreedToTerms),
      consentToDataPolicy: Boolean(values.consentToDataPolicy),
    }),
  });

  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [uploadError, setUploadError] = useState("");

  const handleNicFile = async (slot, file) => {
    if (file === null) {
      setUploadError("");
      setForm((prev) => ({ ...prev, [`nicImage${slot}Url`]: "" }));
      return;
    }
    setUploadError("");
    setUploadingSlot(slot);
    try {
      const url = await uploadKycImage(file);
      setForm((prev) => ({ ...prev, [`nicImage${slot}Url`]: url }));
    } catch (uploadErr) {
      setUploadError(uploadErr.message || "Upload failed.");
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await submit();
  };

  return (
    <>
      {uploadError && (
        <div className="mb-4 px-3 py-2.5 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm text-red-600 dark:text-red-400 font-['Sora']">
          {uploadError}
        </div>
      )}
      <SectionCard
        title="Identity Verification"
        subtitle="Manage your KYC details from VerificationTrust."
        loading={loading}
        saving={saving}
        error={error}
        success={success}
        onSubmit={handleSubmit}
      >
        <Input
          label="Government NIC Number"
          value={form.governmentNicNumber}
          onChange={(event) => setForm((prev) => ({ ...prev, governmentNicNumber: event.target.value }))}
          placeholder="Enter NIC number"
        />
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
            Verification Status
          </label>
          <div className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
            {getVerificationStatusLabel(form.verificationStatus)}
          </div>
        </div>
        <NicImageDropzone
          label="NIC Front Image"
          imageUrl={form.nicImage1Url}
          disabled={saving}
          uploading={uploadingSlot === 1}
          onInvalidFile={() => setUploadError("Please choose an image file.")}
          onFileSelected={(file) => handleNicFile(1, file)}
        />
        <NicImageDropzone
          label="NIC Back Image"
          imageUrl={form.nicImage2Url}
          disabled={saving}
          uploading={uploadingSlot === 2}
          onInvalidFile={() => setUploadError("Please choose an image file.")}
          onFileSelected={(file) => handleNicFile(2, file)}
        />
        <div className="md:col-span-2 flex flex-col gap-2">
          <Check
            label="I agree to terms"
            checked={form.agreedToTerms}
            onChange={(event) => setForm((prev) => ({ ...prev, agreedToTerms: event.target.checked }))}
          />
          <Check
            label="I consent to data policy"
            checked={form.consentToDataPolicy}
            onChange={(event) => setForm((prev) => ({ ...prev, consentToDataPolicy: event.target.checked }))}
          />
        </div>
      </SectionCard>
    </>
  );
}

export function PaymentInfoSection() {
  const initialForm = useMemo(
    () => ({
      estimatedIncome: "",
      numberOfDependents: "",
      dependentNames: "",
      existingDebtAmount: "",
      bankName: "",
      cardNumber: "",
      cvvNumber: "",
      expiryMonth: "",
      expiryYear: "",
    }),
    []
  );

  const { form, setForm, loading, saving, error, success, submit } = useSectionForm({
    basePath: "financial",
    initialForm,
    fromResponse: (data) => ({
      estimatedIncome: data.estimatedIncome ?? "",
      numberOfDependents: data.numberOfDependents ?? "",
      dependentNames: toCsv(data.dependentNames),
      existingDebtAmount:
        data.existingDebtAmount != null && data.existingDebtAmount !== ""
          ? String(data.existingDebtAmount)
          : "",
      bankName: data.bankName || "",
      cardNumber: data.cardNumber || "",
      cvvNumber: data.cvvNumber || "",
      expiryMonth: data.expiryMonth || "",
      expiryYear: data.expiryYear || "",
    }),
    toRequestBody: (values) => ({
      estimatedIncome: values.estimatedIncome === "" ? undefined : Number(values.estimatedIncome),
      numberOfDependents: values.numberOfDependents === "" ? undefined : Number(values.numberOfDependents),
      dependentNames: splitCsv(values.dependentNames),
      existingDebtAmount: (() => {
        const n = Number(values.existingDebtAmount);
        return Number.isFinite(n) ? n : 0;
      })(),
      bankName: values.bankName.trim(),
      cardNumber: values.cardNumber.trim(),
      cvvNumber: values.cvvNumber.trim(),
      expiryMonth: values.expiryMonth.trim(),
      expiryYear: values.expiryYear.trim(),
    }),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    await submit();
  };

  const cardBrand = useMemo(() => detectCardBrand(form.cardNumber), [form.cardNumber]);
  const formattedVirtualNumber = useMemo(() => formatCardNumberGroups(form.cardNumber), [form.cardNumber]);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");

  const handlePayNow = () => {
    setOtpCode("");
    setOtpError("");
    setShowOtpModal(true);
  };

  const handleOtpVerify = () => {
    if (!/^\d{4}$/.test(otpCode)) {
      setOtpError("Please enter a valid 4-digit OTP.");
      return;
    }
    setOtpError("");
    setShowOtpModal(false);
  };

  return (
    <SectionCard
      title="Billing Information"
      subtitle="Manage financial details from FinancialInfo."
      loading={loading}
      saving={saving}
      error={error}
      success={success}
      onSubmit={handleSubmit}
    >
      <Input
        label="Estimated Income"
        type="number"
        value={form.estimatedIncome}
        onChange={(event) => setForm((prev) => ({ ...prev, estimatedIncome: event.target.value }))}
        placeholder="0"
      />
      <Input
        label="Number of Dependents"
        type="number"
        value={form.numberOfDependents}
        onChange={(event) => setForm((prev) => ({ ...prev, numberOfDependents: event.target.value }))}
        placeholder="0"
      />
      <div className="md:col-span-2">
        <Input
          label="Dependent Names (comma separated)"
          value={form.dependentNames}
          onChange={(event) => setForm((prev) => ({ ...prev, dependentNames: event.target.value }))}
          placeholder="Name 1, Name 2"
        />
      </div>

      <div className="md:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-[1.75fr_1fr] gap-5 items-start">
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-600/70 bg-white/70 dark:bg-slate-800/50 p-5 md:p-6 space-y-5">
            <div className="pb-3 border-b border-dashed border-slate-200 dark:border-slate-600">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-['Sora']">Card details</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-['Sora'] mt-1">
                Enter your card information below.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 font-['Sora'] mb-1">Card Number</label>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-['Sora'] mb-2">Enter the 16-digit card number on the card</p>
              <div className="relative">
                <input
                  value={form.cardNumber}
                  onChange={(event) => setForm((prev) => ({ ...prev, cardNumber: event.target.value }))}
                  placeholder="2412 7512 3412 3456"
                  autoComplete="cc-number"
                  className="w-full pl-3 pr-[3.25rem] py-2.5 rounded-lg text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none"
                />
                {cardBrand ? (
                  <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                    <CardBrandMark brand={cardBrand} />
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 font-['Sora'] mb-1">CVV Number</label>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-['Sora'] mb-2">Enter the 3 or 4 digit number on the card</p>
              <input
                type="password"
                value={form.cvvNumber}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    cvvNumber: event.target.value.replace(/\D/g, "").slice(0, 4),
                  }))
                }
                placeholder="•••"
                autoComplete="cc-csc"
                inputMode="numeric"
                maxLength={4}
                className="w-full max-w-xs px-3 py-2.5 rounded-lg text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 font-['Sora'] mb-1">Expiry Date</label>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-['Sora'] mb-2">Enter the expiration date of the card</p>
              <div className="flex items-center gap-2">
                <input
                  value={form.expiryMonth}
                  onChange={(event) => setForm((prev) => ({ ...prev, expiryMonth: event.target.value }))}
                  placeholder="09"
                  className="w-24 px-3 py-2.5 rounded-lg text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none"
                />
                <span className="text-slate-500 dark:text-slate-400">/</span>
                <input
                  value={form.expiryYear}
                  onChange={(event) => setForm((prev) => ({ ...prev, expiryYear: event.target.value }))}
                  placeholder="22"
                  className="w-24 px-3 py-2.5 rounded-lg text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none"
                />
              </div>
            </div>

            <div>
              <input
                value={form.bankName}
                onChange={(event) => setForm((prev) => ({ ...prev, bankName: event.target.value }))}
                placeholder="Bank name"
                className="w-full px-3 py-2.5 rounded-lg text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none"
              />
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200/90 dark:border-slate-600/70 bg-slate-100/95 dark:bg-slate-800/95 p-5 md:p-6 flex flex-col gap-4">
            <div className="relative min-h-[13rem] rounded-2xl border border-slate-200 dark:border-slate-600 bg-gradient-to-br from-white to-slate-100 dark:from-slate-700 dark:to-slate-900 p-5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Virtual card</p>
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {form.bankName || "Card holder"}
                  </p>
                  <p className="text-base sm:text-lg font-bold tracking-[0.2em] text-slate-900 dark:text-white font-mono tabular-nums whitespace-normal break-all leading-snug">
                    {formattedVirtualNumber}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Expiry {form.expiryMonth || "MM"}/{form.expiryYear || "YY"}
                  </p>
                </div>
                {cardBrand ? (
                  <div className="shrink-0 self-end pb-0.5">
                    <CardBrandMark brand={cardBrand} />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-auto border-t border-dashed border-slate-300 dark:border-slate-600 pt-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-['Sora'] mb-1">You have to pay</p>
              <div className="flex items-end gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.existingDebtAmount}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, existingDebtAmount: event.target.value }))
                  }
                  className="w-full text-3xl font-bold font-['Sora'] text-slate-900 dark:text-white bg-transparent border-none outline-none focus:ring-0 p-0 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  placeholder="0"
                  aria-label="Existing debt amount"
                />
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">USD</span>
              </div>
              <button
                type="button"
                onClick={handlePayNow}
                className="mt-4 w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold font-['Sora'] transition-colors"
              >
                Pay Now
              </button>
            </div>
          </aside>
        </div>
      </div>
      {showOtpModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close OTP popup"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowOtpModal(false)}
          />
          <div className="relative w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-5">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 font-['Sora']">OTP Verification</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
              Enter the 4-digit OTP to continue payment.
            </p>

            <input
              value={otpCode}
              onChange={(event) => {
                const onlyDigits = event.target.value.replace(/\D/g, "").slice(0, 4);
                setOtpCode(onlyDigits);
                setOtpError("");
              }}
              inputMode="numeric"
              pattern="\d{4}"
              placeholder="0000"
              className="mt-4 w-full px-3 py-2.5 rounded-lg text-center tracking-[0.45em] text-lg font-semibold font-mono text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none"
            />
            {otpError && (
              <p className="mt-2 text-xs text-red-500 dark:text-red-400 font-['Sora']">{otpError}</p>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="px-3 py-2 rounded-md text-sm font-medium font-['Sora'] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOtpVerify}
                className="px-4 py-2 rounded-md text-sm font-medium font-['Sora'] bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Verify OTP
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

export function LocationValidationSection() {
  const initialForm = useMemo(
    () => ({
      country: "",
      regionOrDistrict: "",
      village: "",
      farmSize: "",
      farmSizeUnit: "hectares",
      mainCrops: "",
      secondaryCrops: "",
      yearsOfFarmingExperience: "",
      landOwnershipType: "owned",
    }),
    []
  );

  const { form, setForm, loading, saving, error, success, submit } = useSectionForm({
    basePath: "location-farming",
    initialForm,
    fromResponse: (data) => ({
      country: data.country || "",
      regionOrDistrict: data.regionOrDistrict || "",
      village: data.village || "",
      farmSize: data.farmSize ?? "",
      farmSizeUnit: data.farmSizeUnit || "hectares",
      mainCrops: toCsv(data.mainCrops),
      secondaryCrops: toCsv(data.secondaryCrops),
      yearsOfFarmingExperience: data.yearsOfFarmingExperience ?? "",
      landOwnershipType: data.landOwnershipType || "owned",
    }),
    toRequestBody: (values) => ({
      country: values.country.trim(),
      regionOrDistrict: values.regionOrDistrict.trim(),
      village: values.village.trim(),
      farmSize: values.farmSize === "" ? undefined : Number(values.farmSize),
      farmSizeUnit: values.farmSizeUnit,
      mainCrops: splitCsv(values.mainCrops),
      secondaryCrops: splitCsv(values.secondaryCrops),
      yearsOfFarmingExperience:
        values.yearsOfFarmingExperience === "" ? undefined : Number(values.yearsOfFarmingExperience),
      landOwnershipType: values.landOwnershipType,
    }),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    await submit();
  };

  return (
    <SectionCard
      title="Address Verification"
      subtitle="Manage location and farming details from LocationFarming."
      loading={loading}
      saving={saving}
      error={error}
      success={success}
      onSubmit={handleSubmit}
    >
      <Input
        label="Country"
        value={form.country}
        onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
      />
      <Input
        label="Region or District"
        value={form.regionOrDistrict}
        onChange={(event) => setForm((prev) => ({ ...prev, regionOrDistrict: event.target.value }))}
      />
      <Input
        label="Village"
        value={form.village}
        onChange={(event) => setForm((prev) => ({ ...prev, village: event.target.value }))}
      />
      <Input
        label="Farm Size"
        type="number"
        value={form.farmSize}
        onChange={(event) => setForm((prev) => ({ ...prev, farmSize: event.target.value }))}
      />
      <Select
        label="Farm Size Unit"
        value={form.farmSizeUnit}
        onChange={(event) => setForm((prev) => ({ ...prev, farmSizeUnit: event.target.value }))}
      >
        <option value="hectares">Hectares</option>
        <option value="acres">Acres</option>
      </Select>
      <Select
        label="Land Ownership Type"
        value={form.landOwnershipType}
        onChange={(event) => setForm((prev) => ({ ...prev, landOwnershipType: event.target.value }))}
      >
        <option value="owned">Owned</option>
        <option value="rented">Rented</option>
        <option value="shared">Shared</option>
        <option value="other">Other</option>
      </Select>
      <div className="md:col-span-2">
        <Input
          label="Main Crops (comma separated)"
          value={form.mainCrops}
          onChange={(event) => setForm((prev) => ({ ...prev, mainCrops: event.target.value }))}
        />
      </div>
      <div className="md:col-span-2">
        <Input
          label="Secondary Crops (comma separated)"
          value={form.secondaryCrops}
          onChange={(event) => setForm((prev) => ({ ...prev, secondaryCrops: event.target.value }))}
        />
      </div>
      <Input
        label="Years of Farming Experience"
        type="number"
        value={form.yearsOfFarmingExperience}
        onChange={(event) =>
          setForm((prev) => ({ ...prev, yearsOfFarmingExperience: event.target.value }))
        }
      />
    </SectionCard>
  );
}

export function TrainingEngagementSection() {
  const initialForm = useMemo(
    () => ({
      literacyLevel: "basic",
      preferredLanguage: "english",
      areasOfInterest: "",
    }),
    []
  );

  const { form, setForm, loading, saving, error, success, submit } = useSectionForm({
    basePath: "training-engagement",
    initialForm,
    fromResponse: (data) => ({
      literacyLevel: data.literacyLevel || "basic",
      preferredLanguage: data.preferredLanguage === "local" ? "english" : data.preferredLanguage || "english",
      areasOfInterest: toCsv(data.areasOfInterest),
    }),
    toRequestBody: (values) => ({
      literacyLevel: values.literacyLevel,
      preferredLanguage: values.preferredLanguage,
      areasOfInterest: splitCsv(values.areasOfInterest),
    }),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    await submit();
  };

  return (
    <SectionCard
      title="Training & Participation"
      subtitle="Manage education preferences from TrainingEngagement."
      loading={loading}
      saving={saving}
      error={error}
      success={success}
      onSubmit={handleSubmit}
    >
      <Select
        label="Literacy Level"
        value={form.literacyLevel}
        onChange={(event) => setForm((prev) => ({ ...prev, literacyLevel: event.target.value }))}
      >
        <option value="none">None</option>
        <option value="basic">Basic</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </Select>
      <Select
        label="Preferred Language"
        value={form.preferredLanguage}
        onChange={(event) => setForm((prev) => ({ ...prev, preferredLanguage: event.target.value }))}
      >
        <option value="english">English</option>
        <option value="sinhala">Sinhala</option>
        <option value="tamil">Tamil</option>
        <option value="other">Other</option>
      </Select>
      <div className="md:col-span-2">
        <Input
          label="Areas of Interest (comma separated)"
          value={form.areasOfInterest}
          onChange={(event) => setForm((prev) => ({ ...prev, areasOfInterest: event.target.value }))}
          placeholder="irrigation, crop disease, finance"
        />
      </div>
    </SectionCard>
  );
}
