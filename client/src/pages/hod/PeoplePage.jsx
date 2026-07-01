import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Users, KeyRound, Trash2, Search } from 'lucide-react';
import { userApi } from '../../api/users.js';
import { classApi, departmentApi } from '../../api/academics.js';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import Badge from '../../components/common/Badge.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SkeletonTable } from '../../components/common/Skeleton.jsx';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';

const emptyForm = {
  name: '', email: '', role: 'student', registerNumber: '', employeeId: '', department: '', classId: '',
};

export default function PeoplePage() {
  const [roleTab, setRoleTab] = useState('student');
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    const { data } = await userApi.list({ role: roleTab, search: debouncedSearch || undefined, limit: 50 });
    setUsers(data.data.users);
    setIsLoading(false);
  }, [roleTab, debouncedSearch]);

  useEffect(() => {
    Promise.all([classApi.list(), departmentApi.list()]).then(([classRes, deptRes]) => {
      setClasses(classRes.data.data.classes);
      setDepartments(deptRes.data.data.departments);
    });
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  function openCreate() {
    setForm({ ...emptyForm, role: roleTab });
    setError('');
    setModalOpen(true);
  }

async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      const payload = { ...form };
      if (payload.role === 'student') delete payload.department;
      if (payload.role !== 'student') delete payload.classId;

      await userApi.create(payload);
      toast.success(`${form.role === 'student' ? 'Student' : 'Faculty'} account created. Credentials emailed.`);
      setModalOpen(false);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create account');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await userApi.remove(deleteTarget._id);
      toast.success('Account deleted');
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete account');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleResetPassword() {
    setIsResetting(true);
    try {
      const { data } = await userApi.resetPassword(resetTarget._id);
      setResetResult(data.data.temporaryPassword);
      toast.success('Password reset and emailed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset password');
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Faculty & Students</h1>
          <p className="mt-1 text-sm text-slate">Create and manage accounts</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>New {roleTab}</Button>
      </div>

      <div className="flex items-center gap-2 border-b border-ink/8">
        {['student', 'faculty'].map((r) => (
          <button
            key={r}
            onClick={() => setRoleTab(r)}
            className={`border-b-2 px-1 pb-3 text-sm font-medium capitalize transition-colors ${
              roleTab === r ? 'border-ink text-ink' : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            {r}s
          </button>
        ))}
      </div>

      <div className="relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${roleTab}s...`}
          className="w-full rounded-xl border border-ink/15 bg-white py-2 pl-9 pr-3 text-sm focus:border-ink/40 focus:outline-none"
        />
      </div>

      {isLoading ? (
        <SkeletonTable cols={4} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title={`No ${roleTab}s yet`}
          message={`Create your first ${roleTab} account.`}
          action={<Button icon={Plus} onClick={openCreate}>New {roleTab}</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/8 bg-ink/3 text-left text-xs font-semibold uppercase tracking-wide text-slate">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">{roleTab === 'student' ? 'Register No.' : 'Employee ID'}</th>
                <th className="px-5 py-3">{roleTab === 'student' ? 'Class' : 'Department'}</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-ink">{u.name}</p>
                    <p className="text-xs text-slate">{u.email}</p>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate">
                    {roleTab === 'student' ? u.registerNumber : u.employeeId}
                  </td>
                  <td className="px-5 py-3.5 text-ink/80">
                    {roleTab === 'student' ? u.class?.name : u.department?.name}
                  </td>
                  <td className="px-5 py-3.5">
                    {u.isActive ? <Badge variant="present">Active</Badge> : <Badge variant="absent">Inactive</Badge>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => { setResetTarget(u); setResetResult(null); }}
                        className="rounded-lg p-2 text-ink/50 hover:bg-amber-light/40 hover:text-amber"
                        title="Reset password"
                      >
                        <KeyRound size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="rounded-lg p-2 text-ink/50 hover:bg-clay-light hover:text-clay"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`New ${form.role}`}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Full name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email address"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {form.role === 'student' ? (
            <>
              <Input
                label="Register number"
                value={form.registerNumber}
                onChange={(e) => setForm({ ...form, registerNumber: e.target.value })}
              />
              <Select
                label="Class"
                required
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
              >
                <option value="">Select class</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Select>
            </>
          ) : (
            <>
              <Input
                label="Employee ID"
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              />
              <Select
                label="Department"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              >
                <option value="">Select department</option>
                {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </Select>
            </>
          )}
          <p className="text-xs text-slate">
            A temporary password will be generated and emailed automatically.
          </p>
          {error && <p className="rounded-xl bg-clay-light px-3.5 py-2.5 text-sm text-clay">{error}</p>}
          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSaving}>Create account</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!resetTarget} onClose={() => setResetTarget(null)} title="Reset password">
        {resetResult ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate">New temporary password (also emailed to the user):</p>
            <p className="rounded-xl bg-ink/5 px-4 py-3 text-center font-mono text-base font-semibold text-ink">
              {resetResult}
            </p>
            <Button onClick={() => setResetTarget(null)} className="mt-1">Done</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate">
              Reset the password for <span className="font-medium text-ink">{resetTarget?.name}</span>? A new temporary password will be generated and emailed to them.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setResetTarget(null)}>Cancel</Button>
              <Button variant="amber" onClick={handleResetPassword} isLoading={isResetting}>Reset password</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete account"
        message={`Delete ${deleteTarget?.name}'s account? This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
