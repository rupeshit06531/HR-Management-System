from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from apps.accounts.models import User
from apps.accounts.permissions import (
    IsAttendanceViewer,
    IsManagerOrAdmin,
)

from .models import Attendance
from .serializers import AttendanceSerializer


class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "employee",
        "status",
        "date",
    ]

    search_fields = [
        "employee__employee_id",
        "employee__user__username",
        "employee__user__first_name",
        "employee__user__last_name",
    ]

    ordering_fields = [
        "id",
        "date",
        "check_in",
        "check_out",
    ]

    ordering = [
        "-date",
        "-check_in",
    ]

    def get_permissions(self):
        """
        Attendance access rules.

        Read:
            Employee / Manager / HR / Super Admin

        Write:
            Manager / HR / Super Admin

        Employees:
            Can only view their own attendance.

        Managers:
            Can only access attendance belonging to
            employees they manage.

        HR / Super Admin:
            Can access all attendance records.
        """

        if self.action in {
            "create",
            "update",
            "partial_update",
            "destroy",
        }:
            permission_classes = [
                IsManagerOrAdmin,
            ]
        else:
            permission_classes = [
                IsAttendanceViewer,
            ]

        return [
            permission()
            for permission in permission_classes
        ]

    def get_queryset(self):
        """
        Scope attendance records according to
        the authenticated user's role.

        Super Admin / HR:
            Can access all attendance records.

        Manager:
            Can access attendance records for
            employees managed by that manager.

        Employee:
            Can access only their own attendance.

        Unauthenticated / unsupported users:
            No records are returned.
        """

        queryset = Attendance.objects.select_related(
            "employee",
            "employee__user",
            "employee__department",
            "employee__designation",
            "employee__manager",
        ).all()

        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        if user.role in {
            User.Role.SUPER_ADMIN,
            User.Role.HR,
        }:
            return queryset

        if user.role == User.Role.MANAGER:
            try:
                manager_employee = user.employee_profile
            except Exception:
                return queryset.none()

            return queryset.filter(
                employee__manager=manager_employee,
            )

        if user.role == User.Role.EMPLOYEE:
            try:
                employee = user.employee_profile
            except Exception:
                return queryset.none()

            return queryset.filter(
                employee=employee,
            )

        return queryset.none()