import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { RegisterData } from '../services/authService';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

interface RegisterPageProps {
    onSwitchToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
    const { register } = useAuth();
    const [formData, setFormData] = useState<RegisterData>({
        email: '',
        password: '',
        name: '',
        qualification: 'MBBS',
        can_prescribe_allopathic: 'yes',
        phone: '',
        registration_number: '',
        hospital_name: '',
        hospital_address: '',
        hospital_phone: ''
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);

        try {
            await register(formData);
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Logo/Branding */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">OPD Platform</h1>
                    <p className="text-slate-600">Create Your Account</p>
                </div>

                {/* Register Card */}
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-semibold text-slate-900 mb-6">Sign Up</h2>

                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                await authService.loginWithGoogle();
                            } catch (err: any) {
                                toast.error(err.message || 'Google signup failed');
                            }
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 font-medium py-2 px-4 rounded-md transition-colors mb-6"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continue with Google
                    </button>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information */}
                        <div>
                            <h3 className="text-lg font-medium text-slate-900 mb-4">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-900"
                                        placeholder="Dr. John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-900"
                                        placeholder="doctor@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Qualification *
                                    </label>
                                    <select
                                        name="qualification"
                                        value={formData.qualification}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-900"
                                    >
                                        <option value="MBBS">MBBS</option>
                                        <option value="BAMS">BAMS</option>
                                        <option value="BHMS">BHMS</option>
                                        <option value="BDS">BDS</option>
                                        <option value="MD">MD</option>
                                        <option value="MS">MS</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Can Prescribe Allopathic? *
                                    </label>
                                    <select
                                        name="can_prescribe_allopathic"
                                        value={formData.can_prescribe_allopathic}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-900"
                                    >
                                        <option value="yes">Yes</option>
                                        <option value="limited">Limited</option>
                                        <option value="no">No</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-900"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Registration Number
                                    </label>
                                    <input
                                        type="text"
                                        name="registration_number"
                                        value={formData.registration_number}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-900"
                                        placeholder="MCI/State Reg. No."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Hospital/Clinic Information */}
                        <div>
                            <h3 className="text-lg font-medium text-slate-900 mb-4">Hospital/Clinic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Hospital/Clinic Name
                                    </label>
                                    <input
                                        type="text"
                                        name="hospital_name"
                                        value={formData.hospital_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-900"
                                        placeholder="City Hospital"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Hospital Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="hospital_phone"
                                        value={formData.hospital_phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-900"
                                        placeholder="+91 22 1234 5678"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Hospital Address
                                    </label>
                                    <input
                                        type="text"
                                        name="hospital_address"
                                        value={formData.hospital_address}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-900"
                                        placeholder="123 Main Street, Mumbai, India"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <h3 className="text-lg font-medium text-slate-900 mb-4">Security</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-900"
                                        placeholder="••••••••"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Min 8 characters, 1 uppercase, 1 number</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Confirm Password *
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-900"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-600">
                            Already have an account?{' '}
                            <button
                                onClick={onSwitchToLogin}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Sign in
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-slate-500 mt-6">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
};
