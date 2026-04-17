import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../guards/role.guard';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);