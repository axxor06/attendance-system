import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}`);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your attendance account">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {error && (
          <p className="rounded-xl bg-clay-light px-3.5 py-2.5 text-sm text-clay">{error}</p>
        )}

        <div className="flex items-center justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-ink/60 hover:text-ink">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" isLoading={isLoading} className="mt-1 w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate">
        New student?{' '}
        <Link to="/register" className="font-medium text-ink hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
