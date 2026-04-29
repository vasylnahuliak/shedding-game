import { AuthServiceError } from '@/services/AuthService';

export const getAuthServiceErrorMessage = (error: unknown, fallback: string) =>
  error instanceof AuthServiceError ? error.message : fallback;
