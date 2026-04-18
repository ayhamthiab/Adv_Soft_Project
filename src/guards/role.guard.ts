import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export type UserRole = 'admin' | 'moderator' | 'user';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userRole = request.headers['x-user-role'] as UserRole;

    if (!userRole) {
      throw new ForbiddenException(
        'User role not specified in x-user-role header',
      );
    }

    const allowedRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    );
    if (!allowedRoles) {
      return true; // No roles specified, allow access
    }

    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
