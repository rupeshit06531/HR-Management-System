import django_filters
from django.utils import timezone
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import (
    IsAdminOrSuperAdmin,
    IsAuthenticatedUser,
)

from .models import Announcement, Notification
from .serializers import (
    AnnouncementSerializer,
    NotificationSerializer,
)


class AnnouncementFilter(django_filters.FilterSet):
    is_published = django_filters.BooleanFilter(
        method="filter_published",
    )

    class Meta:
        model = Announcement
        fields = [
            "target_audience",
            "department",
            "is_active",
            "publish_date",
            "expiry_date",
        ]

    def filter_published(self, queryset, name, value):
        if value is None:
            return queryset

        now = timezone.now()
        published = Q(
            is_active=True,
            publish_date__lte=now,
        ) & (
            Q(expiry_date__isnull=True)
            | Q(expiry_date__gte=now)
        )

        if value:
            return queryset.filter(published)

        return queryset.exclude(published)


class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = AnnouncementFilter

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

            return queryset.filter(
                visibility_query
            )

        if user.role == User.Role.EMPLOYEE:
            visibility_query = Q(
                target_audience=Announcement.TargetAudience.ALL,
            )

            try:
                employee = user.employee_profile
            except Exception:
                employee = None

            if employee is not None and employee.department_id:
                visibility_query |= Q(
                    target_audience=(
                        Announcement.TargetAudience.DEPARTMENT
                    ),
                    department_id=employee.department_id,
                )

            return queryset.filter(
                visibility_query
            )

        return queryset.none()

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
        )


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "is_read",
        "notification_type",
    ]

    search_fields = [
        "title",
        "message",
    ]

    ordering_fields = [
        "id",
        "created_at",
        "updated_at",
    ]

    ordering = [
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
        queryset = Notification.objects.select_related(
            "recipient",
        ).all()

        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        if user.role in {
            User.Role.SUPER_ADMIN,
            User.Role.HR,
        }:
            return queryset

        return queryset.filter(
            recipient=user,
        )

    def perform_create(self, serializer):
        serializer.save()

    @action(
        detail=True,
        methods=["post"],
        url_path="mark-read",
    )
    def mark_read(self, request, pk=None):
        notification = self.get_object()

        if not notification.is_read:
            notification.is_read = True
            notification.save(
                update_fields=[
                    "is_read",
                    "updated_at",
                ],
            )

        return Response(
            self.get_serializer(notification).data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="mark-unread",
    )
    def mark_unread(self, request, pk=None):
        notification = self.get_object()

        if notification.is_read:
            notification.is_read = False
            notification.save(
                update_fields=[
                    "is_read",
                    "updated_at",
                ],
            )

        return Response(
            self.get_serializer(notification).data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="mark-all-read",
    )
    def mark_all_read(self, request):
        updated_count = (
            self.get_queryset()
            .filter(is_read=False)
            .update(is_read=True)
        )

        return Response(
            {
                "detail": "All notifications marked as read.",
                "updated_count": updated_count,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="unread-count",
    )
    def unread_count(self, request):
        count = (
            self.get_queryset()
            .filter(is_read=False)
            .count()
        )

        return Response(
            {
                "count": count,
            },
            status=status.HTTP_200_OK,
        )
