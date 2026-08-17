from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from apps.accounts.models import User
from apps.accounts.permissions import (
    IsAdminOrSuperAdmin,
    IsAuthenticatedUser,
)

from .models import Announcement
from .serializers import AnnouncementSerializer


class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "target_audience",
        "department",
        "is_active",
        "publish_date",
        "expiry_date",
    ]

    search_fields = [
        "title",
        "message",
        "created_by__username",
        "created_by__first_name",
        "created_by__last_name",
    ]

    ordering_fields = [
        "id",
        "publish_date",
        "expiry_date",
        "created_at",
    ]

    ordering = [
        "-publish_date",
        "-created_at",
        "-id",
    ]

    def get_permissions(self):
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
                IsAuthenticatedUser,
            ]

        return [
            permission()
            for permission in permission_classes
        ]

    def get_queryset(self):
        queryset = Announcement.objects.select_related(
            "created_by",
            "department",
        ).all()

        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        if user.role in {
            User.Role.SUPER_ADMIN,
            User.Role.HR,
        }:
            return queryset

        explicit_audience_filter = (
            self.request.query_params.get(
                "target_audience"
            )
        )

        if user.role == User.Role.MANAGER:
            visibility_query = (
                Q(
                    target_audience=(
                        Announcement.TargetAudience.ALL
                    )
                )
                | Q(
                    target_audience=(
                        Announcement.TargetAudience.MANAGERS
                    )
                )
            )

            if explicit_audience_filter:
                return queryset.filter(
                    target_audience=explicit_audience_filter,
                )

            return queryset.filter(
                visibility_query
            )

        if user.role == User.Role.EMPLOYEE:
            try:
                employee = user.employee_profile
            except Exception:
                employee = None

            if explicit_audience_filter:
                return queryset.filter(
                    target_audience=explicit_audience_filter,
                )

            visibility_query = Q(
                target_audience=Announcement.TargetAudience.ALL,
            )

            if employee is not None:
                visibility_query |= Q(
                    target_audience=(
                        Announcement.TargetAudience.DEPARTMENT
                    ),
                    department=employee.department,
                )

            return queryset.filter(
                visibility_query
            )

        return queryset.none()

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
        )