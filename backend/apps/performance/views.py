from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import (
    IsManagerOrHROrSuperAdmin,
)

from .models import PerformanceReview
from .serializers import PerformanceReviewSerializer


class PerformanceReviewViewSet(viewsets.ModelViewSet):
    serializer_class = PerformanceReviewSerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "employee",
        "review_period",
        "review_date",
    ]

    search_fields = [
        "employee__employee_id",
        "employee__user__username",
        "employee__user__first_name",
        "employee__user__last_name",
        "employee__user__email",
        "review_period",
        "strengths",
        "areas_for_improvement",
        "manager_comments",
    ]

    ordering_fields = [
        "id",
        "review_period",
        "review_date",
        "created_at",
    ]

    ordering = [
        "-review_date",
        "-created_at",
    ]

    permission_classes = [
        IsManagerOrHROrSuperAdmin,
    ]

    def get_queryset(self):
        queryset = (
            PerformanceReview.objects
            .select_related(
                "employee",
                "employee__user",
                "employee__department",
                "employee__designation",
            )
            .all()
        )

        user = self.request.user

        if user.role in {
            User.Role.HR,
            User.Role.SUPER_ADMIN,
        }:
            return queryset

        if user.role == User.Role.MANAGER:
            manager_employee = getattr(
                user,
                "employee_profile",
                None,
            )

            if manager_employee is None:
                return queryset.none()

            return queryset.filter(
                employee__manager=manager_employee,
            )

        return queryset.none()

    def _validate_manager_employee_access(
        self,
        employee,
    ):
        user = self.request.user

        if user.role != User.Role.MANAGER:
            return

        manager_employee = getattr(
            user,
            "employee_profile",
            None,
        )

        if manager_employee is None:
            raise PermissionDenied(
                "Manager employee profile is required.",
            )

        if employee.manager_id != manager_employee.id:
            raise PermissionDenied(
                "Managers can only manage performance "
                "reviews for their team members.",
            )

    def perform_create(self, serializer):
        employee = serializer.validated_data["employee"]

        self._validate_manager_employee_access(
            employee,
        )

        serializer.save()

    def perform_update(self, serializer):
        employee = serializer.validated_data.get(
            "employee",
            serializer.instance.employee,
        )

        self._validate_manager_employee_access(
            employee,
        )

        serializer.save()