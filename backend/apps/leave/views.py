from django.db import transaction
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, serializers, viewsets

from apps.accounts.models import User
from apps.accounts.permissions import (
    IsAdminOrSuperAdmin,
    IsLeaveCreator,
    IsLeaveViewer,
)
from apps.announcements.models import Notification
from apps.employees.models import Employee

from .models import Leave
from .serializers import LeaveSerializer


class LeaveViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveSerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "leave_type",
        "status",
        "employee",
        "start_date",
        "end_date",
    ]

    search_fields = [
        "employee__employee_id",
        "employee__user__username",
        "employee__user__first_name",
        "employee__user__last_name",
        "reason",
    ]

    ordering_fields = [
        "id",
        "start_date",
        "end_date",
        "applied_at",
    ]

    ordering = [
        "-applied_at",
        "-id",
    ]

    def get_permissions(self):
        """
        Leave access rules.

        Read:
            Employee / Manager / HR / Super Admin

        Create:
            Employee / HR / Super Admin

        Update / Delete:
            HR / Super Admin
        """

        if self.action == "create":
            permission_classes = [
                IsLeaveCreator,
            ]

        elif self.action in {
            "update",
            "partial_update",
            "destroy",
        }:
            permission_classes = [
                IsAdminOrSuperAdmin,
            ]

        else:
            permission_classes = [
                IsLeaveViewer,
            ]

        return [
            permission()
            for permission in permission_classes
        ]

    def get_queryset(self):
        """
        Scope leave records according to the
        authenticated user's HRMS role.

        Super Admin / HR:
            Can view all leave records.

        Manager:
            Can view leave records for their team
            and their own leave records.

        Employee:
            Can view only their own leave records.

        Unauthenticated / unsupported users:
            No records are returned.
        """

        queryset = Leave.objects.select_related(
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
            return queryset.distinct()

        if user.role == User.Role.MANAGER:
            try:
                manager_employee = user.employee_profile
            except Employee.DoesNotExist:
                return queryset.none()

            return queryset.filter(
                Q(employee__manager=manager_employee)
                | Q(employee__user=user)
            ).distinct()

        if user.role == User.Role.EMPLOYEE:
            try:
                employee = user.employee_profile
            except Employee.DoesNotExist:
                return queryset.none()

            return queryset.filter(
                employee=employee,
            ).distinct()

        return queryset.none()

    def _create_leave_application_notifications(self, leave):
        """
        Notify HR and Super Admin users when a new leave
        application is successfully created.
        """

        recipient_ids = User.objects.filter(
            role__in=[
                User.Role.HR,
                User.Role.SUPER_ADMIN,
            ],
            is_active=True,
        ).values_list(
            "id",
            flat=True,
        )

        employee_name = (
            leave.employee.user.get_full_name().strip()
            or leave.employee.user.username
        )

        leave_type = leave.get_leave_type_display()

        Notification.objects.bulk_create(
            [
                Notification(
                    recipient_id=recipient_id,
                    title="New Leave Application",
                    message=(
                        f"{employee_name} submitted a "
                        f"{leave_type} request from "
                        f"{leave.start_date:%d %b %Y} to "
                        f"{leave.end_date:%d %b %Y}."
                    ),
                    notification_type=(
                        Notification.NotificationType.LEAVE
                    ),
                    action_url=f"/leave?leave={leave.id}",
                )
                for recipient_id in recipient_ids
            ]
        )

    @transaction.atomic
    def perform_create(self, serializer):
        """
        Automatically assign the logged-in employee
        when an Employee creates a leave request.

        HR / Super Admin can provide an employee
        explicitly when creating a leave record.

        A notification is generated for active HR and
        Super Admin users after successful creation.
        """

        user = self.request.user

        if user.role == User.Role.EMPLOYEE:
            try:
                employee = user.employee_profile
            except Employee.DoesNotExist:
                raise serializers.ValidationError(
                    {
                        "employee": (
                            "Employee profile does not exist."
                        )
                    }
                )

            leave = serializer.save(
                employee=employee,
            )
        else:
            leave = serializer.save()

        self._create_leave_application_notifications(
            leave,
        )