from django.db.models import Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import (
    IsAdminOrSuperAdmin,
    IsManagerOrAdmin,
)

from .models import Employee
from .serializers import EmployeeSerializer


class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "department",
        "designation",
        "employment_type",
        "employment_status",
    ]

    search_fields = [
        "employee_id",
        "user__username",
        "user__first_name",
        "user__last_name",
        "user__email",
        "department__name",
        "designation__name",
    ]

    ordering_fields = [
        "id",
        "employee_id",
        "joining_date",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "employee_id",
    ]

    def get_permissions(self):
        """
        Read access:
            HR / Super Admin / Manager

        Write access:
            HR / Super Admin only

        Managers must not create, modify or delete
        employee master records.
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
        Scope employee visibility according to the
        authenticated user's HRMS role.

        select_related() keeps employee list/detail
        responses efficient when serializer accesses
        user, department, designation and manager data.
        """

        queryset = (
            Employee.objects.select_related(
                "user",
                "department",
                "designation",
                "manager",
                "manager__user",
            )
            .all()
        )

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
            except Employee.DoesNotExist:
                return queryset.none()

            return queryset.filter(
                manager=manager_employee
            ) | queryset.filter(
                user=user
            )

        return queryset.none()

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """Return employee totals within the caller's visibility scope."""
        queryset = self.get_queryset()

        totals = queryset.aggregate(
            total=Count("id"),
            active=Count(
                "id",
                filter=Q(
                    employment_status=Employee.EmploymentStatus.ACTIVE,
                ),
            ),
            inactive=Count(
                "id",
                filter=Q(
                    employment_status=Employee.EmploymentStatus.INACTIVE,
                ),
            ),
            resigned=Count(
                "id",
                filter=Q(
                    employment_status=Employee.EmploymentStatus.RESIGNED,
                ),
            ),
            terminated=Count(
                "id",
                filter=Q(
                    employment_status=Employee.EmploymentStatus.TERMINATED,
                ),
            ),
        )

        return Response(totals)
