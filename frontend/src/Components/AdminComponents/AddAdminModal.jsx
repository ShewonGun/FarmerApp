import { useEffect, useRef, useState } from 'react';
import { MdClose, MdAdminPanelSettings } from 'react-icons/md';

const defaultForm = {
	name: '',
	email: '',
	password: '',
};

const AddAdminModal = ({ isOpen, onClose, onSubmit, isSubmitting = false }) => {
	const [formData, setFormData] = useState(defaultForm);
	const [errors, setErrors] = useState({});
	const nameRef = useRef(null);

	useEffect(() => {
		if (isOpen) {
			setTimeout(() => nameRef.current?.focus(), 80);
			setFormData(defaultForm);
			setErrors({});
		}
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;

		const handleEscape = (event) => {
			if (event.key === 'Escape' && !isSubmitting) {
				onClose();
			}
		};

		document.addEventListener('keydown', handleEscape);
		document.body.style.overflow = 'hidden';

		return () => {
			document.removeEventListener('keydown', handleEscape);
			document.body.style.overflow = 'unset';
		};
	}, [isOpen, isSubmitting, onClose]);

	if (!isOpen) return null;

	const validate = () => {
		const nextErrors = {};

		if (!formData.name.trim()) {
			nextErrors.name = 'Name is required';
		}

		if (!formData.email.trim()) {
			nextErrors.email = 'Email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			nextErrors.email = 'Enter a valid email';
		}

		if (!formData.password) {
			nextErrors.password = 'Password is required';
		} else if (formData.password.length < 6) {
			nextErrors.password = 'Password must be at least 6 characters';
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleChange = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: '' }));
		}
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!validate()) return;

		await onSubmit({
			name: formData.name.trim(),
			email: formData.email.trim(),
			password: formData.password,
		});
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
			<div
				className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
				onClick={!isSubmitting ? onClose : undefined}
			/>

			<div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-lg shadow-2xl shadow-slate-900/20 dark:shadow-slate-950/60 border border-slate-200 dark:border-slate-700/60 overflow-hidden animate-scale-in">
				<div className="px-3 py-2 flex items-center justify-between bg-linear-to-br from-emerald-500 to-teal-600">
					<div className="flex items-center gap-2">
						<h2 className="text-white font-bold text-[15px] leading-tight font-['Sora']">Add New Admin</h2>
					</div>

					<button
						type="button"
						onClick={onClose}
						disabled={isSubmitting}
						className="group bg-transparent border border-transparent text-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer transition-colors duration-150 disabled:opacity-50"
					>
						<MdClose className="text-sm text-white transition-colors duration-150 group-hover:text-red-500 dark:group-hover:text-red-400" />
					</button>
				</div>

				<form onSubmit={handleSubmit} noValidate>
					<div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
					<div>
						<label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
							Full Name <span className="text-red-400">*</span>
						</label>
						<input
							ref={nameRef}
							type="text"
							value={formData.name}
							onChange={(event) => handleChange('name', event.target.value)}
							placeholder="Enter admin name"
							className={`w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 ${
								errors.name
									? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
									: 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
							}`}
						/>
						{errors.name && <p className="mt-1 text-[11px] text-rose-500 font-['Sora']">{errors.name}</p>}
					</div>

					<div>
						<label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
							Email <span className="text-red-400">*</span>
						</label>
						<input
							type="email"
							value={formData.email}
							onChange={(event) => handleChange('email', event.target.value)}
							placeholder="admin@email.com"
							className={`w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 ${
								errors.email
									? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
									: 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
							}`}
						/>
						{errors.email && <p className="mt-1 text-[11px] text-rose-500 font-['Sora']">{errors.email}</p>}
					</div>

					<div>
						<label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
							Password <span className="text-red-400">*</span>
						</label>
						<input
							type="password"
							value={formData.password}
							onChange={(event) => handleChange('password', event.target.value)}
							placeholder="Minimum 6 characters"
							className={`w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 ${
								errors.password
									? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
									: 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
							}`}
						/>
						{errors.password && <p className="mt-1 text-[11px] text-rose-500 font-['Sora']">{errors.password}</p>}
					</div>
					</div>

					<div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800">
						<p className="text-[10px] text-slate-400 dark:text-slate-500 font-['Sora']">
							<span className="text-red-400">*</span> Required fields
						</p>
						<div className="flex gap-2">
						<button
							type="button"
							onClick={onClose}
							disabled={isSubmitting}
							className="px-4 py-2 rounded-md text-[12px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all duration-150 cursor-pointer font-['Sora'] active:scale-95 disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-semibold text-white shadow-sm transition-all duration-200 cursor-pointer font-['Sora'] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-200 dark:shadow-emerald-900/30 hover:shadow-md hover:shadow-emerald-200/80 dark:hover:shadow-emerald-900/40"
						>
							{isSubmitting ? (
								<>
									<svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
									</svg>
									Creating...
								</>
							) : (
								<>
									Create Admin
									<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
										<path d="M5 12h14M12 5l7 7-7 7" />
									</svg>
								</>
							)}
						</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AddAdminModal;
