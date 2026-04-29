import { Prisma } from '@prisma/client';

const hasNameConstraintTarget = (target: unknown) => {
  if (Array.isArray(target)) {
    return target.includes('name');
  }

  if (typeof target === 'string') {
    return target.includes('name');
  }

  return false;
};

export const isDisplayNameConflictError = (error: unknown): boolean => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }

  if (hasNameConstraintTarget(error.meta?.target)) {
    return true;
  }

  return error.message.includes('(`name`)');
};
