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


class RolePermission(BasePermission):
    """
    Base permission for role-based access control.

    Keeps role validation centralized so that all HRMS
    APIs use the same authorization rules.
    """

    allowed_roles = set()

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and user.role in self.allowed_roles
        )


class IsAdminOrSuperAdmin(RolePermission):
    """
    Allows access to HR and Super Admin users.
    """

    message = "HR or Super Admin permission is required."

    allowed_roles = {
        User.Role.HR,
        User.Role.SUPER_ADMIN,
    }


class IsManagerOrAdmin(RolePermission):
    """
    Allows access to Manager, HR and Super Admin users.
    """

    message = "Manager, HR or Super Admin permission is required."

    allowed_roles = {
        User.Role.MANAGER,
        User.Role.HR,
        User.Role.SUPER_ADMIN,
    }


class IsAttendanceViewer(RolePermission):
    """
    Allows authenticated active users with an HRMS role
    to read attendance records.

    AttendanceViewSet is responsible for limiting
    Employee users to their own attendance records.
    """

    message = "Attendance access is required."

    allowed_roles = {
        User.Role.EMPLOYEE,
        User.Role.MANAGER,
        User.Role.HR,
        User.Role.SUPER_ADMIN,
    }


class IsLeaveViewer(RolePermission):
    """
    Allows authenticated active users to view leave records.

    LeaveViewSet is responsible for restricting:
        Employee -> own leave records
        Manager  -> team leave records
        HR       -> all leave records
        Super Admin -> all leave records
    """

    message = "Leave access is required."

    allowed_roles = {
        User.Role.EMPLOYEE,
        User.Role.MANAGER,
        User.Role.HR,
        User.Role.SUPER_ADMIN,
    }


class IsLeaveCreator(RolePermission):
    """
    Allows Employee, HR and Super Admin users to create
    leave requests.

    Employee:
        Can create their own leave request.

    HR / Super Admin:
        Can create leave for employees.

    Manager:
        Cannot create leave requests.
    """

    message = (
        "Employee, HR or Super Admin permission "
        "is required to create leave."
    )

    allowed_roles = {
        User.Role.EMPLOYEE,
        User.Role.HR,
        User.Role.SUPER_ADMIN,
    }


class IsDocumentViewer(RolePermission):
    """
    Allows HR, Super Admin and Employee users to view
    employee documents.

    DocumentViewSet is responsible for limiting
    Employee users to their own documents.
    """

    message = "Document access is required."

    allowed_roles = {
        User.Role.EMPLOYEE,
        User.Role.HR,
        User.Role.SUPER_ADMIN,
    }


class IsSuperAdmin(RolePermission):
    """
    Allows access only to Super Admin users.
    """

    message = "Super Admin permission is required."

    allowed_roles = {
        User.Role.SUPER_ADMIN,
    }


# Backward-compatible aliases.
#
# These names are kept so existing app imports continue
# to work without requiring changes across multiple apps.
IsHROrSuperAdmin = IsAdminOrSuperAdmin
IsManagerOrHROrSuperAdmin = IsManagerOrAdmin