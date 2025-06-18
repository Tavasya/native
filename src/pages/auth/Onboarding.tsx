import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { useOnboarding } from '@/hooks/useOnboarding';
import GoogleOAuthButton from '@/components/auth/GoogleOAuthButton';
// import AgreementModals from '@/components/auth/AgreementModals'; // To be implemented in later steps

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user, role: reduxRole } = useAppSelector(state => state.auth);
  const {
    role,
    setRole,
    formData,
    handleChange,
    handleTeacherMetadataChange,
    error,
    loading,
    handleSubmit,
  } = useOnboarding({ initialRole: reduxRole });

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Placeholder submit handler
  const submitOnboarding = async (data: any) => {
    // TODO: Integrate with backend (completeOnboarding thunk)
    alert('Onboarding complete! (stub)');
    // navigate to dashboard
    if (role) navigate(`/${role}/dashboard`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Complete Your Profile</h2>

          {/* Role selection (if not set) */}
          {!role && (
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700">I am a...</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                    role === 'student'
                      ? 'border-[#272A69] bg-[#272A69] text-white'
                      : 'border-gray-200 hover:border-[#272A69]'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                    role === 'teacher'
                      ? 'border-[#272A69] bg-[#272A69] text-white'
                      : 'border-gray-200 hover:border-[#272A69]'
                  }`}
                >
                  Teacher
                </button>
              </div>
            </div>
          )}

          {/* Student Onboarding Form */}
          {role === 'student' && (
            <form
              className="space-y-4"
              onSubmit={e => {
                e.preventDefault();
                handleSubmit(submitOnboarding);
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={formData.phone_number || ''}
                  onChange={e => handleChange('phone_number', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={formData.date_of_birth || ''}
                  onChange={e => handleChange('date_of_birth', e.target.value)}
                  required
                />
              </div>
              {/* TODO: Student Agreement Modal Trigger */}
              <button
                type="submit"
                className="w-full bg-[#272A69] text-white py-2 rounded-lg mt-4"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Complete Onboarding'}
              </button>
              {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
            </form>
          )}

          {/* Teacher Onboarding Form */}
          {role === 'teacher' && (
            <form
              className="space-y-4"
              onSubmit={e => {
                e.preventDefault();
                handleSubmit(submitOnboarding);
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={formData.phone_number || ''}
                  onChange={e => handleChange('phone_number', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700"># of Active Students</label>
                <input
                  type="number"
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={formData.teacherMetadata?.active_student_count || ''}
                  onChange={e => handleTeacherMetadataChange('active_student_count', Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Average Monthly Tuition per Student</label>
                <input
                  type="number"
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={formData.teacherMetadata?.avg_tuition_per_student || ''}
                  onChange={e => handleTeacherMetadataChange('avg_tuition_per_student', Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Referral Source (optional)</label>
                <input
                  type="text"
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={formData.teacherMetadata?.referral_source || ''}
                  onChange={e => handleTeacherMetadataChange('referral_source', e.target.value)}
                />
              </div>
              {/* TODO: Teacher Agreement Modal Trigger */}
              <button
                type="submit"
                className="w-full bg-[#272A69] text-white py-2 rounded-lg mt-4"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Complete Onboarding'}
              </button>
              {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
