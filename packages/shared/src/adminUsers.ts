import * as v from 'valibot';

import { AppLocaleSchema, AppRoleSchema } from './schemas';

export const AdminUserSummarySchema = v.object({
  id: v.string(),
  name: v.string(),
  email: v.string(),
  locale: AppLocaleSchema,
  roles: v.array(AppRoleSchema),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const AdminUserListSchema = v.array(AdminUserSummarySchema);

export const AdminUserSummaryPageSchema = v.object({
  users: AdminUserListSchema,
  totalCount: v.number(),
  hasMore: v.boolean(),
  nextCursor: v.optional(v.string()),
});

export type AdminUser = v.InferOutput<typeof AdminUserSummarySchema>;
export type AdminUserSummaryPage = v.InferOutput<typeof AdminUserSummaryPageSchema>;
