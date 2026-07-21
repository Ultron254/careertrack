import { useQuery } from '@tanstack/react-query';
import { request } from '../client';
import { endpoints } from '../endpoints';
import { departmentsSchema } from '../schemas/department';
import { directorySchema } from '../schemas/people';
import { userSchema, usersSchema } from '../schemas/user';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => request(usersSchema, endpoints.users.list()),
    staleTime: 5 * 60_000,
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => request(userSchema, endpoints.users.get(userId)),
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => request(departmentsSchema, endpoints.departments.list()),
    staleTime: 5 * 60_000,
  });
}

export function useDirectory() {
  return useQuery({
    queryKey: ['directory'],
    queryFn: () => request(directorySchema, endpoints.directory()),
  });
}
