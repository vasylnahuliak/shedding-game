import type { HTTPError } from 'ky';

export const readHttpErrorBody = async <T>(error: HTTPError): Promise<T | null> => {
  try {
    return (await error.response.clone().json()) as T;
  } catch {
    return null;
  }
};
