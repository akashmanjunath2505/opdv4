import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const CompleteProfilePage: React.FC = () => {
    const { user, updateProfile } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        qualification: (user?.qualification as 'MBBS' | 'BAMS' | 'BHMS') || 'MBBS',
        can_prescribe_allopathic: (user?.can_prescribe_allopathic as 'yes' | 'limited' | 'no') || 'yes',
        phone: user?.phone || '',
        registration_number: user?.registration_number || '',
        hospital_name: user?.hospital_name || '',
        hospital_address: user?.hospital_address || '',
        hospital_phone: user?.hospital_phone || ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await updateProfile(formData);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Complete Your Profile</h1>
                    <p className="text-slate-600">Just a few details to personalize your notes and PDF output.</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-slate-900 mb-4">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
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
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Qualification *</label>
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
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Can Prescribe Allopathic? *</label>
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
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
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
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number</label>
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

                        <div>
                            <h3 className="text-lg font-medium text-slate-900 mb-4">Hospital/Clinic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Hospital/Clinic Name</label>
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
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Hospital Phone</label>
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
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Hospital Address</label>
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Save & Continue'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
