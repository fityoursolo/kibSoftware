// LoginPage.jsx (or App.jsx)
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';

import PharmacyHero from '../components/layout/PharmacyHero';
import LoginFormSection from '../components/layout/LoginFormSection';
import { 
    clsx, 
    Icons, 
    CustomAlert, 
    DARK_MODE_BACKGROUND_IMAGE, 
    LIGHT_MODE_BACKGROUND_IMAGE, 
    DARK_OVERLAY, 
    LIGHT_OVERLAY,
    KIBRAN_COLOR
} from '../components/common/utilities';

const LoginPage = () => { 
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '', password: '',
    });
    const [formErrors, setFormErrors] = useState({});
    const [message, setMessage] = useState({ text: '', type: '' });

    // Refs for focus management
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const submitButtonRef = useRef(null);

    const toggleTheme = () => setIsDarkMode(prev => !prev);
    
    // Auto-hide alert message
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
        
        setFormErrors(prev => ({ ...prev, [name]: '' }));
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (name === 'email') {
            if (value.length > 0 && !emailRegex.test(value)) {
                setFormErrors(prev => ({ ...prev, email: 'Please enter a valid email address.' }));
            }
        } else if (name === 'password') {
            if (value.length > 0 && value.length < 8) {
                setFormErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters long.' }));
            }
        }
        
    }, []); 

    
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

    // Login Validation Logic
    const validate = useCallback(() => {
        let errors = {};
        let isValid = true;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!formData.email) {
            errors.email = 'Email address is required.'; 
            isValid = false;
        } else if (!emailRegex.test(formData.email)) {
            errors.email = 'Please enter a valid email address.'; 
            isValid = false;
        }

        if (!formData.password) {
            errors.password = 'Password is required.';
            isValid = false;
        } else if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters long.';
            isValid = false;
        }
        
        setFormErrors(errors);
        return isValid;
    }, [formData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' }); 
        
        if (validate()) {
            setIsLoading(true); 

            // Simulate API call
            console.log('Kibran Login Data Validated. Simulating API call...');

            setTimeout(() => {
                setIsLoading(false); 
                const loginSuccess = true; 

                if (loginSuccess) {
                    setMessage({ text: 'Login successful! Redirecting to dashboard...', type: 'success' });

                    setFormData({ email: '', password: '' });
                    setFormErrors({});
                    if(emailRef.current) { emailRef.current.focus(); } 
                } else {
                    setMessage({ text: 'Login failed. Check your email and password.', type: 'error' });
                }

            }, 1500); 

        } else {
            setMessage({ text: 'Please correct the errors in the form and try again.', type: 'error' });
        }
    };
    
    return (
        <div className={clsx('min-h-screen flex flex-col lg:flex-row font-sans antialiased transition-colors duration-700 relative z-0',
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
                style={!isDarkMode ? { color: KIBRAN_COLOR } : {}}
                aria-label="Toggle dark and light mode"
            >
                {isDarkMode ? <Icons.SunIcon className="w-6 h-6"/> : <Icons.MoonIcon className="w-6 h-6"/>}
            </button>
            
            <div className="flex flex-col lg:flex-row w-full relative z-20">
                <PharmacyHero isDarkMode={isDarkMode} />
                
                <LoginFormSection 
                    isDarkMode={isDarkMode}
                    formData={formData}
                    formErrors={formErrors}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    handleKeyDown={handleKeyDown}
                    handleSubmit={handleSubmit}
                    emailRef={emailRef}
                    passwordRef={passwordRef}
                    submitButtonRef={submitButtonRef}
                    isLoading={isLoading}
                />
            </div>

            <CustomAlert message={message.text} type={message.type} onClose={() => setMessage({ text: '', type: '' })} />
        </div>
    );
};

export default LoginPage;