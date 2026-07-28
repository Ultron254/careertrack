import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminAccount } from '@/types/domain';
import { request } from '../client';
import { endpoints } from '../endpoints';
import {
  adminAccountSchema,
  adminAccountsSchema,
  auditEventsSchema,
  deliverySchema,
  type AccountUpdate,
  type InviteInput,
} from '../schemas/admin';

export function useAccounts() {
  return useQuery({
    queryKey: ['admin', 'accounts'],
    queryFn: () => request(adminAccountsSchema, endpoints.admin.accounts()),
  });
}

export function useAuditLog(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'audit'],
    queryFn: () => request(auditEventsSchema, endpoints.admin.audit()),
    enabled,
  });
}

function replaceAccount(accounts: AdminAccount[] | undefined, next: AdminAccount) {
  if (!accounts) return accounts;
  return accounts.map((account) => (account.user.id === next.user.id ? next : account));
}

export function useInviteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteInput) =>
      request(adminAccountSchema, endpoints.admin.invite(), { method: 'POST', body: input }),
    onSuccess: (account) => {
      queryClient.setQueryData<AdminAccount[]>(['admin', 'accounts'], (accounts) =>
        accounts ? [...accounts, account] : accounts,
      );
      void queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
      // Directory and people views read /api/users, which now includes them.
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, update }: { userId: string; update: AccountUpdate }) =>
      request(adminAccountSchema, endpoints.admin.account(userId), {
        method: 'PATCH',
        body: update,
      }),
    onSuccess: (account) => {
      queryClient.setQueryData<AdminAccount[]>(['admin', 'accounts'], (accounts) =>
        replaceAccount(accounts, account),
      );
      void queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useResendInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      request(deliverySchema, endpoints.admin.resendInvite(userId), { method: 'POST' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] }),
  });
}

export function useResetPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      request(deliverySchema, endpoints.admin.resetPassword(userId), { method: 'POST' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] }),
  });
}
