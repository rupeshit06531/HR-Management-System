from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from apps.accounts.permissions import (
    IsAdminOrSuperAdmin,
    IsManagerOrAdmin,
)

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
    ]

    def get_permissions(self):
        """
        Read access:
            HR / Super Admin / Manager

        Write access:
            HR / Super Admin only

        Managers can review leave records but cannot
        create, modify, or delete them.
        """

        if self.action in {
            "create",
            "update",
            "partial_update",
            "destroy",
        }:
            permission_classes = [
                IsAdminOrSuperAdmin,
            ]
        else:
            permission_classes = [
                IsManagerOrAdmin,
            ]

        return [
            permission()
            for permission in permission_classes
        ]

    def get_queryset(self):
        """
        Return optimized leave records.

        Only authenticated HRMS users with the required
        role can access this queryset.
        """

        queryset = Leave.objects.select_related(
            "employee",
            "employee__user",
        ).all()

        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        if user.role in {
            user.Role.SUPER_ADMIN,
            user.Role.HR,
            user.Role.MANAGER,
        }:
            return queryset

        return queryset.none()