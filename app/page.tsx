'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef, forwardRef } from 'react';

// --- NEW KIBRAN BLUE COLOR CONSTANTS ---
const KIBRAN_COLOR = '#003A70'; // Deeper Blue (Primary)
const KIBRAN_COLOR_HOVER = '#002C55'; // Darker for hover effect
const KIBRAN_COLOR_LIGHT = '#1A6AA5'; // Slightly darker light blue for contrast

// Utility function to merge Tailwind classes
const clsx = (...classes) => classes.filter(Boolean).join(' ');

// The backgrounds images and the overlay colors
const DARK_MODE_BACKGROUND_IMAGE = '/background2.jpg'; 
const LIGHT_MODE_BACKGROUND_IMAGE = '/background1.jpg';
const LIGHT_OVERLAY = 'rgba(255, 255, 255, 0.8)'; 
const DARK_OVERLAY = 'rgba(0, 0, 0, 0.4)';

// Assigning password criteria check function
const checkPasswordCriteria = (password) => ({
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
});

// Icon defination (reused icons)
const Icons = {
    UserIcon: (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
    MailIcon: (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>),
    // --- UPDATED LockIcon with strokeWidth=1.5 for a thinner look ---
    LockIcon: (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>),
    SunIcon: (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2m-4-8H4m16 0h-2M6.34 6.34l1.41 1.41m12.71 12.71-1.41-1.41M6.34 17.66l1.41-1.41m12.71-12.71-1.41 1.41"/></svg>),
    MoonIcon: (props) => (<svg {...props} xmlns="http://w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>),
    CheckIcon: (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>),
    AlertIcon: (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>),
    EyeIcon: (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>),
    // --- UPDATED KeyIcon with strokeWidth=1.5 and simplified path ---
    KeyIcon: (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m10 16-1-1 4-4 1 1 4 4-4 4zM16 8l-2 2M10 12l-2 2M14 6l-2 2M6 18l-2 2"/></svg>),

    EyeOffIcon: (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a1.86 1.86 0 0 1-.3-1"/><path d="M22 12s-3 7-10 7a9.78 9.78 0 0 1-2.92-.52"/><line x1="2" y1="2" x2="22" y2="22"/></svg>),
    PillBottleIcon: (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 20h4M12 20V4M10 4h4a3 3 0 0 1 3 3v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V7a3 3 0 0 1 3-3z"/><circle cx="10" cy="9" r="0.5" fill="currentColor" stroke="none"/><circle cx="14" cy="12" r="0.5" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="0.5" fill="currentColor" stroke="none"/><rect x="9" y="3" width="6" height="2" rx="0.5" ry="0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    DeliveryTruckIcon: (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 3h15v14H1z"/><path d="M15 17h5l4-5V3H15z"/><circle cx="5.5" cy="19.5" r="2.5"/><circle cx="18.5" cy="19.5" r="2.5"/><polyline points="7 7 11 7 11 11 7 11"/></svg>),
};

// custom Alert Components
const CustomAlert = ({ message, type, onClose }) => {
    if (!message) return null;

    const baseClasses = "fixed bottom-4 left-1/2 transform -translate-x-1/2 p-4 rounded-xl shadow-2xl z-[100] transition-all duration-500 max-w-sm w-11/12 flex items-center space-x-3";
    let typeClasses = "";
    let IconComponent = Icons.AlertIcon;

    if (type === 'success') {
        typeClasses = "bg-green-600 text-white border border-green-700";
        IconComponent = Icons.CheckIcon;
    } else if (type === 'error') {
        typeClasses = "bg-red-600 text-white border border-red-700";
        IconComponent = Icons.AlertIcon;
    }

    return (
        <div className={clsx(baseClasses, typeClasses)} role="alert" aria-live="assertive">
            <IconComponent className="w-6 h-6 flex-shrink-0"/>
            <span className="font-medium text-sm flex-grow">{message}</span>
            <button 
                onClick={onClose} 
                className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close notification"
            >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
    );
};

// --- Form Input Component (Reused for Password Fields) ---
const FormInput = React.memo(forwardRef(({ 
    name, type = 'text', label, icon: Icon, isRequired, error, isDarkMode, 
    value, onChange, onKeyDown, onBlur 
}, ref) => {
    const isPasswordField = type === 'password' || name.toLowerCase().includes('password');
    const [showPassword, setShowPassword] = useState(false);

    const inputType = isPasswordField ? (showPassword ? 'text' : 'password') : type;

    const labelClasses = clsx(
        "block text-base font-medium transition-colors duration-500 mb-1",
        isDarkMode ? 'text-blue-300' : 'text-slate-900' 
    );

    const iconClasses = clsx(
        "absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-500",
        error ? 'text-red-500' : (isDarkMode ? 'text-blue-400' : 'text-slate-700')
    );

    const inputClasses = clsx(
        "w-full pl-12 py-3.5 border rounded-xl shadow-lg outline-none transition-all duration-300 font-semibold text-sm appearance-none",
        isPasswordField ? 'pr-12' : 'pr-4',
        error ? 'border-red-500 ring-2 ring-red-500/50' : 'hover:border-[#1A6AA5]', // Use KIBRAN_COLOR_LIGHT for light hover
        isDarkMode 
            ? 'bg-slate-700 text-slate-100 border-slate-600 focus:border-[#1A6AA5] focus:ring-2 focus:ring-[#1A6AA5]/50' // Use KIBRAN_COLOR_LIGHT for focus
            : 'bg-white/70 text-black border-gray-300 focus:border-[#003A70] focus:ring-2 focus:ring-[#003A70]/50 placeholder:text-slate-700/70' // Use KIBRAN_COLOR for focus
    );

    return (
        <div className="mb-6">
            <label htmlFor={name} className={labelClasses}>
                {label} {isRequired && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <Icon className={iconClasses} style={!isDarkMode ? { color: KIBRAN_COLOR } : {}} />

                
                <input
                    id={name}
                    name={name}
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    onBlur={onBlur} 
                    ref={ref}
                    required={isRequired}
                    className={inputClasses}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${name}-error` : undefined}
                />

                {isPasswordField && (
                    <button 
                        type="button" 
                        onClick={() => setShowPassword(prev => !prev)}
                        className={clsx(
                            "absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors duration-200",
                            isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-[#003A70]' // Use KIBRAN_COLOR for hover
                        )}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <Icons.EyeOffIcon className="w-5 h-5" /> : <Icons.EyeIcon className="w-5 h-5" />}
                    </button>
                )}
            </div>
            {error && (
                <p id={`${name}-error`} className="mt-1 text-xs text-red-500 font-medium flex items-center ml-1" role="alert">
                    <Icons.AlertIcon className="w-4 h-4 mr-1"/>
                    {error}
                </p>
            )}
        </div>
    );
}));


// --- Pharmacy Hero/Branding Component (Reused for Deep Blue Theme) ---
const PharmacyHero = ({ isDarkMode }) => {
    const logoShadowClass = isDarkMode ? 'hover:shadow-blue-500/80' : 'hover:shadow-blue-800/60';

    return (
        <div className={clsx(`hidden lg:flex flex-col justify-center items-center pb-12 px-12 lg:w-6/12 min-h-screen relative 
            transition-all duration-700 ease-in-out overflow-hidden bg-transparent`,
            isDarkMode ? 'text-white' : 'text-slate-900')} 
        >
            <div className={clsx("absolute inset-0 z-0 transition-opacity duration-700", isDarkMode ? 'opacity-30' : 'opacity-10')}>
                {/* Changed background accents to blue */}
                <div className={clsx("absolute w-96 h-96 rounded-full blur-3xl transition-all duration-1000 animate-pulse-slow top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2", isDarkMode ? 'bg-blue-400/20' : 'bg-blue-300/50')}></div>
                <div className={clsx("absolute w-64 h-32 rounded-full transform rotate-45 blur-3xl transition-all duration-1000 animate-pulse-fast bottom-1/4 right-1/4 translate-x-1/2 -translate-y-1/2", isDarkMode ? 'bg-blue-400/20' : 'bg-blue-200/50')}></div>
            </div>

            <div className="relative z-10 max-w-xl text-center">
                <div className={clsx(`mx-auto mb-16 w-80 h-80 rounded-full overflow-hidden border-4 
                            shadow-2xl transition-all duration-500 group cursor-pointer`, logoShadowClass,
                            isDarkMode ? 'border-blue-400/50' : 'border-white/50')}>
                    
                    <img 
                        src="./kibran-logo.jpg"
                        alt="Kibran Pharmaceutical Wholesale Logo" 
                        className="w-full h-full object-cover animate-fadeInDown transition-all duration-500 ease-out group-hover:scale-105"
                        // Placeholder uses KIBRAN_COLOR for consistency
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/320x320/${KIBRAN_COLOR.substring(1)}/d1d5db?text=KIBRAN+LOGO`; }}
                    />
                </div>
                
                <p className="text-2xl leading-relaxed font-light opacity-90 mb-12  inline-block">
                    Secure your account with a strong, new password. Regular password changes help maintain system integrity and data safety.
                </p>
                
                 <div className="flex justify-center items-center space-x-12 animate-fadeInUp delay-500">
                    <Icons.PillBottleIcon 
                        // BUG FIX: Wrapped class names in a single string for clsx
                        className={clsx('w-16 h-16 stroke-1.5 transform hover:scale-110 transition-transform duration-500', 
                            isDarkMode ? 'text-blue-300' : 'text-blue-600')} 
                        style={{ color: isDarkMode ? KIBRAN_COLOR_LIGHT : KIBRAN_COLOR, filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2))' }}
                    />
                    
                    <Icons.DeliveryTruckIcon 
                        // BUG FIX: Wrapped class names in a single string for clsx
                        className={clsx('w-16 h-16 stroke-1.5 animate-pulse-fast transition-transform duration-500', 
                            isDarkMode ? 'text-blue-300' : 'text-blue-600')} 
                        style={{ color: isDarkMode ? KIBRAN_COLOR_LIGHT : KIBRAN_COLOR, filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2))' }}
                    />
                </div>
            </div>
        </div>
    );
};


// --- Form Section (Right Column) (Updated for Email) ---
const FormSection = ({
    isDarkMode, formData, formErrors, handleChange, handleBlur, handleKeyDown,
    handleSubmit, emailRef, currentPasswordRef, newPasswordRef, confirmNewPasswordRef, submitButtonRef
}) => {
    const primaryTextGradient = 'bg-gradient-to-r from-[#003A70] to-blue-900'; // KIBRAN_COLOR to dark blue
    const darkTextGradient = 'bg-gradient-to-r from-blue-400 to-[#1A6AA5]'; // Light blue to KIBRAN_COLOR_LIGHT
    const buttonGradient = 'from-[#003A70] to-blue-800'; // KIBRAN_COLOR to dark blue
    const buttonHover = 'hover:from-[#1A6AA5] hover:to-[#003A70]'; // KIBRAN_COLOR_LIGHT to KIBRAN_COLOR

return (
        <div className={clsx(`w-full lg:w-6/12 p-6 sm:p-12 md:p-16 lg:p-20 flex flex-col justify-center min-h-screen relative 
            transition-colors duration-700 overflow-hidden animate-slideInRight bg-transparent`)}
        >
            <div className={clsx("relative z-10 max-w-md mx-auto w-full p-0 sm:p-0 rounded-2xl transition-all duration-700",
                                isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                
                <div className="transition-colors duration-700"> 
                    
                    <h1 className={clsx(`text-4xl sm:text-5xl font-extrabold mb-2 transition-colors duration-500 
                        bg-clip-text text-transparent`, isDarkMode ? darkTextGradient : primaryTextGradient)}
                        style={{ // Custom gradient for light mode
                            backgroundImage: isDarkMode ? undefined : `linear-gradient(to right, ${KIBRAN_COLOR}, ${KIBRAN_COLOR_HOVER})` 
                        }}
                    >
                        Change Password
                    </h1>
                    <p className="mb-10 text-lg text-slate-600 dark:text-slate-400 transition-colors duration-500">
                        Verify your account and update your password securely.
                    </p>

                    <form onSubmit={handleSubmit} noValidate>
                        {/* NEW: Email Address Field */}
                        <FormInput 
                            name="email" type="email" label="Email Address" icon={Icons.MailIcon} isRequired={true} 
                            error={formErrors.email} isDarkMode={isDarkMode}
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            ref={emailRef}
                            onKeyDown={(e) => handleKeyDown(e, currentPasswordRef)}
                        />

                        <FormInput 
                            name="currentPassword" type="password" label="Current Password" icon={Icons.LockIcon} isRequired={true} 
                            error={formErrors.currentPassword} isDarkMode={isDarkMode}
                            value={formData.currentPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            ref={currentPasswordRef}
                            onKeyDown={(e) => handleKeyDown(e, newPasswordRef)}
                        />
                        <FormInput 
                            name="newPassword" type="password" label="New Password" icon={Icons.LockIcon} isRequired={true} 
                            error={formErrors.newPassword} isDarkMode={isDarkMode}
                            value={formData.newPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            ref={newPasswordRef}
                            onKeyDown={(e) => handleKeyDown(e, confirmNewPasswordRef)}
                        />
                        <FormInput 
                            name="confirmNewPassword" type="password" label="Confirm New Password" icon={Icons.LockIcon} isRequired={true} 
                            error={formErrors.confirmNewPassword} isDarkMode={isDarkMode}
                            value={formData.confirmNewPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            ref={confirmNewPasswordRef}
                            onKeyDown={(e) => handleKeyDown(e, submitButtonRef)}
                        />

                        {/* Submit Button */}
                        <button 
                            type="submit"
                            ref={submitButtonRef}
                            className={`w-full py-4 mt-4 rounded-xl font-bold text-lg shadow-2xl uppercase tracking-wider
                                transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.98]
                                bg-gradient-to-r ${buttonGradient} text-white 
                                ${buttonHover}
                                focus:outline-none focus:ring-4 focus:ring-blue-500/60
                            `}
                            style={{ // Custom gradient for submit button
                                backgroundImage: `linear-gradient(to right, ${KIBRAN_COLOR}, ${KIBRAN_COLOR_HOVER})`,
                            }}
                        >
                            Update Password
                        </button>
                    </form>

                    <p className="mt-8 text-center text-xs text-slate-600 dark:text-slate-400 transition-colors duration-500">
                        <a href='../Dashboard' className={clsx(`font-semibold transition-colors duration-300 hover:underline`,
                            isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-700 hover:text-blue-800')}
                            style={!isDarkMode ? { color: KIBRAN_COLOR } : {}}
                            >
                            Back to Dashboard
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- Main Application Component (Container) ---
const ChangePasswordPage = () => { 
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [formData, setFormData] = useState({
        email: '', currentPassword: '', newPassword: '', confirmNewPassword: '',
    });
    const [formErrors, setFormErrors] = useState({});
    const [message, setMessage] = useState({ text: '', type: '' });

    // Refs for focus management
    const emailRef = useRef(null); // NEW REF
    const currentPasswordRef = useRef(null);
    const newPasswordRef = useRef(null);
    const confirmNewPasswordRef = useRef(null);
    const submitButtonRef = useRef(null);

    const toggleTheme = () => setIsDarkMode(prev => !prev);
    
    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message.text]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []); 

    const handleBlur = useCallback((e) => {
        const { name, value } = e.target;
        
        // Clear error for the current field as the user leaves it
        setFormErrors(prev => ({ ...prev, [name]: '' }));
        
        // Validation logic for specific fields on blur
        if (name === 'email') { // ADDED EMAIL VALIDATION ON BLUR
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (value.length > 0 && !emailRegex.test(value)) {
                setFormErrors(prev => ({ ...prev, email: 'Please enter a valid email address.' }));
            }
        } else if (name === 'confirmNewPassword') {
            if (value.length > 0 && formData.newPassword !== value) {
                setFormErrors(prev => ({ ...prev, confirmNewPassword: 'New passwords do not match.' }));
            }
        } else if (name === 'newPassword') {
            if (value.length > 0) {
                // Prevent new password from being the same as the current one
                if (value === formData.currentPassword && formData.currentPassword.length > 0) {
                     setFormErrors(prev => ({ ...prev, newPassword: 'New password cannot be the same as the current password.' }));
                     return;
                }

                // Re-evaluate password validation criteria
                const criteriaMet = Object.values(checkPasswordCriteria(value)).every(v => v);
                if (!criteriaMet) {
                    setFormErrors(prev => ({ ...prev, newPassword: 'Password must meet all security criteria.' }));
                }
            }
        }
    }, [formData.currentPassword, formData.newPassword]); 

    
    const handleKeyDown = useCallback((e, nextRef) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (nextRef && nextRef.current) {
                nextRef.current.focus();
            } else if (submitButtonRef.current) {
                submitButtonRef.current.focus();
            }
        }
    }, []); 

    // Modularized Validation Logic
    const validate = useCallback(() => {
        let errors = {};
        let isValid = true;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        // NEW: Email Validation
        if (!formData.email) {
            errors.email = 'Email address is required.'; 
            isValid = false;
        } else if (!emailRegex.test(formData.email)) {
            errors.email = 'Please enter a valid email address.'; 
            isValid = false;
        }


        // Current Password Validation (Basic presence check for this client-side mockup)
        if (!formData.currentPassword) {
            errors.currentPassword = 'Current Password is required.'; isValid = false;
        }

        // New Password Validation
        if (!formData.newPassword) {
            errors.newPassword = 'New Password is required.'; isValid = false;
        } else {
            // Check for security criteria
            const criteriaMet = Object.values(checkPasswordCriteria(formData.newPassword)).every(v => v);
            if (!criteriaMet) {
                errors.newPassword = 'Password must meet all security criteria (Min 8 Chars, Uppercase, Lowercase, Number, Special Char).'; 
                isValid = false;
            }
            // Prevent same password
            if (formData.newPassword === formData.currentPassword) {
                errors.newPassword = 'New password cannot be the same as the current password.';
                isValid = false;
            }
        }
        
        // Confirm New Password Validation
        if (!formData.confirmNewPassword) {
            errors.confirmNewPassword = 'Confirmation is required.'; isValid = false;
        } else if (formData.newPassword !== formData.confirmNewPassword) {
            errors.confirmNewPassword = 'New passwords do not match.'; isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    }, [formData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' }); 
        
        if (validate()) {
            console.log('Kibran Change Password Validated:', { 
                email: formData.email,
                newPassword: formData.newPassword, 
            });
            setMessage({ text: 'Password updated successfully! You can now log in with your new credentials.', type: 'success' }); 

            // Simulate form reset
            setFormData({
                email: '', currentPassword: '', newPassword: '', confirmNewPassword: ''
            });
            setFormErrors({});
            if(emailRef.current) { emailRef.current.focus(); } // Focus on email after success
        } else {
            setMessage({ text: 'Please review and correct the errors in the form.', type: 'error' });
        }
    };
    
    return (
        <div className={clsx("min-h-screen flex flex-col lg:flex-row font-[Poppins,sans-serif] transition-colors duration-700 relative z-0",
            isDarkMode ? 'bg-slate-900' : 'bg-white')}
            style={{ 
                backgroundImage: `url(${isDarkMode ? DARK_MODE_BACKGROUND_IMAGE : LIGHT_MODE_BACKGROUND_IMAGE})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundBlendMode: 'multiply', 
                backgroundColor: isDarkMode ? DARK_OVERLAY : LIGHT_OVERLAY 
            }}
        > 
            <div className="absolute inset-0 z-10"></div> 
            
            <button
                onClick={toggleTheme}
                className={clsx(`fixed top-4 right-4 p-3 rounded-full shadow-lg transition-all duration-500 z-50
                    hover:scale-105 active:scale-95`,
                    isDarkMode
                        ? 'bg-slate-700 text-blue-400 hover:bg-slate-600'
                        : 'bg-white text-blue-700 hover:bg-slate-200'
                )}
                style={{ color: isDarkMode ? KIBRAN_COLOR_LIGHT : KIBRAN_COLOR }}
                aria-label="Toggle dark and light mode"
            >
                {isDarkMode ? <Icons.SunIcon className="w-6 h-6"/> : <Icons.MoonIcon className="w-6 h-6"/>}
            </button>
            
            <div className="flex flex-col lg:flex-row w-full relative z-20">
                <PharmacyHero isDarkMode={isDarkMode} />
                
                <FormSection 
                    isDarkMode={isDarkMode}
                    formData={formData}
                    formErrors={formErrors}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    handleKeyDown={handleKeyDown}
                    handleSubmit={handleSubmit}
                    emailRef={emailRef} 
                    currentPasswordRef={currentPasswordRef}
                    newPasswordRef={newPasswordRef}
                    confirmNewPasswordRef={confirmNewPasswordRef}
                    submitButtonRef={submitButtonRef}
                />
            </div>

            <CustomAlert message={message.text} type={message.type} onClose={() => setMessage({ text: '', type: '' })} />
        </div>
    );
};

export default ChangePasswordPage;