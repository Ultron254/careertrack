import { useState } from 'react';
import { router } from '@/Lib/router';
import {
  Field,
  FieldRow,
  FormActions,
  ModalHeader,
  Select,
  TextInput,
} from '@/Components/form/Form';
import { Modal } from '@/Components/ui/Modal';
import { useToast } from '@/Components/ui/Toast';
import type { Role, User } from '@/Types/domain';
import { roleLabels, roleOrder, validateInvite } from './accountModel';

export function InviteModal({
  open,
  onClose,
  departments,
  managers,
}: {
  open: boolean;
  onClose: () => void;
  departments: { id: string; name: string }[];
  managers: User[];
}) {
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('employee');
  const [departmentId, setDepartmentId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState('');
  const [sending, setSending] = useState(false);

  const errors = validateInvite(name, email);
  const canSubmit = !errors.name && !errors.email;

  const reset = () => {
    setName('');
    setEmail('');
    setRole('employee');
    setDepartmentId('');
    setManagerId('');
    setTouched(false);
    setServerError('');
  };

  const submit = () => {
    if (!canSubmit) {
      setTouched(true);
      return;
    }
    setServerError('');
    setSending(true);
    const normalizedEmail = email.trim().toLowerCase();
    router.post(
      '/admin/accounts/invite',
      {
        name: name.trim(),
        email: normalizedEmail,
        role,
        departmentId: departmentId || null,
        managerId: managerId || null,
      },
      {
        onSuccess: () => {
          toast(`Invite sent to ${normalizedEmail}`);
          reset();
          onClose();
        },
        onError: (errors) =>
          setServerError(
            errors.email ?? Object.values(errors)[0] ?? 'Could not send the invite. Try again.',
          ),
        onFinish: () => setSending(false),
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} label="Invite a new user" width={520}>
      <ModalHeader
        title="Invite a user"
        subtitle={
          'We\u2019ll email an Entra ID invitation. They set a password and land on onboarding.'
        }
        onClose={onClose}
      />
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Field label="Full name" error={touched ? errors.name : ''}>
          <TextInput
            invalid={touched && Boolean(errors.name)}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Aisha Mohamed"
          />
        </Field>

        <Field label="Work email" error={touched ? errors.email : serverError}>
          <TextInput
            type="email"
            invalid={Boolean((touched && errors.email) || serverError)}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setServerError('');
            }}
            placeholder="name@oxygene.africa"
          />
        </Field>

        <FieldRow>
          <Field label="Role">
            <Select value={role} onChange={(event) => setRole(event.target.value as Role)}>
              {roleOrder.map((value) => (
                <option key={value} value={value}>
                  {roleLabels[value]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Department">
            <Select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
              <option value="">Unassigned</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </Field>
        </FieldRow>

        <Field label="Line manager">
          <Select value={managerId} onChange={(event) => setManagerId(event.target.value)}>
            <option value="">None</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name} &middot; {manager.jobTitle}
              </option>
            ))}
          </Select>
        </Field>

        <FormActions
          submitLabel="Send invite"
          onCancel={onClose}
          disabled={touched && !canSubmit}
          busy={sending}
        />
      </form>
    </Modal>
  );
}
