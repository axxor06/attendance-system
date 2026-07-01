import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import Button from '../../components/common/Button.jsx';
import { authApi } from '../../api/auth.js';
import { classApi } from '../../api/academics.js';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({
    name: '', email: '', password: '', registerNumber: '', classId: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    classApi.publicOptions().then(({ data }) => setClasses(data.data.classes));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authApi.register(form);
      toast.success('Account created. Check your email for a verification code.');
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your student account" subtitle="You'll verify your email with a one-time code next">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Full name"
          name="name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          label="Email address"
          type="email"
          name="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label="Register number"
          name="registerNumber"
          placeholder="e.g. 23CSE045"
          value={form.registerNumber}
          onChange={(e) => setForm({ ...form, registerNumber: e.target.value })}
        />
        <Select
          label="Class"
          name="classId"
          required
          value={form.classId}
          onChange={(e) => setForm({ ...form, classId: e.target.value })}
        >
          <option value="">Select your class</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </Select>
        <Input
          label="Password"
          type="password"
          name="password"
          hint="At least 8 characters"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {error && (
          <p className="rounded-xl bg-clay-light px-3.5 py-2.5 text-sm text-clay">{error}</p>
        )}

        <Button type="submit" isLoading={isLoading} className="mt-1 w-full">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-ink hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
