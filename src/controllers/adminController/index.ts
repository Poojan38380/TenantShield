import { changeUserRole } from './changeUserRole.ts';
import { getOrganizationUsers } from './getOrganizationUsers.ts';
import { deleteUser } from './deleteUser.ts';

export const adminController = {
  changeUserRole,
  getOrganizationUsers,
  deleteUser,
};
