import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout.jsx';
import Input from '../../components/common/Input.jsx';
import OtpInput from '../../components/auth/OtpInput.jsx';
import Button from '../../components/common/Button.jsx';
import { authApi } from '../../api/auth.js';

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authApi.resetPassword({ email, otp, newPassword });
      toast.success('Password reset. Please sign in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter the code and choose a new password">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {!location.state?.email && (
          <Input
            label="Email address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-ink/80">Reset code</label>
          <OtpInput value={otp} onChange={setOtp} />
        </div>

        <Input
          label="New password"
          type="password"
          required
          minLength={8}
          hint="At least 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        {error && (
          <p className="rounded-xl bg-clay-light px-3.5 py-2.5 text-sm text-clay">{error}</p>
        )}

        <Button type="submit" isLoading={isLoading} disabled={otp.length !== 6} className="w-full">
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}
