import { useState } from 'react';
import { useInviteAccount } from '@/api/queries/admin';
import { ApiError } from '@/api/client';
import { Field, FieldRow, FormActions, ModalHeader, Select, TextInput } from '@/components/form/Form';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import type { Role, User } from '@/types/domain';
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
  const invite = useInviteAccount();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('employee');
  const [departmentId, setDepartmentId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState('');

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
    invite.mutate(
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        departmentId: departmentId || null,
        managerId: managerId || null,
      },
      {
        onSuccess: (account) => {
          toast(`Invite sent to ${account.user.email}`);
          reset();
          onClose();
        },
        onError: (error) =>
          setServerError(
            error instanceof ApiError ? error.message : 'Could not send the invite. Try again.',
          ),
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} label="Invite a new user" width={520}>
      <ModalHeader
        title="Invite a user"
        subtitle={'We\u2019ll email an Entra ID invitation. They set a password and land on onboarding.'}
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
          busy={invite.isPending}
        />
      </form>
    </Modal>
  );
}
