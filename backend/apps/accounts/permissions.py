from rest_framework.permissions import BasePermission

from .models import User


class IsAuthenticatedUser(BasePermission):
    """
    Allows access only to authenticated users.
    """

    message = "Authentication credentials are required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
        )


class IsAdminOrSuperAdmin(BasePermission):
    """
    Allows access to HR and Super Admin users.

    The existing project uses HR as the administrative
    role, so no unsupported ADMIN role is introduced.
    """

    message = "HR or Super Admin permission is required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role
            in {
                User.Role.HR,
                User.Role.SUPER_ADMIN,
            }
        )


class IsManagerOrAdmin(BasePermission):
    """
    Allows access to Manager, HR and Super Admin users.
    """

    message = "Manager, HR or Super Admin permission is required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role
            in {
                User.Role.MANAGER,
                User.Role.HR,
                User.Role.SUPER_ADMIN,
            }
        )


class IsHROrSuperAdmin(BasePermission):
    """
    Allows access to HR and Super Admin users.
    """

    message = "HR or Super Admin permission is required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role
            in {
                User.Role.HR,
                User.Role.SUPER_ADMIN,
            }
        )


class IsManagerOrHROrSuperAdmin(BasePermission):
    """
    Allows access to Manager, HR and Super Admin users.
    """

    message = (
        "Manager, HR or Super Admin permission is required."
    )

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role
            in {
                User.Role.MANAGER,
                User.Role.HR,
                User.Role.SUPER_ADMIN,
            }
        )


class IsSuperAdmin(BasePermission):
    """
    Allows access only to Super Admin users.
    """

    message = "Super Admin permission is required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role
            == User.Role.SUPER_ADMIN
        )