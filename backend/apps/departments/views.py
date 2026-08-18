from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from apps.accounts.permissions import (
    IsAdminOrSuperAdmin,
    IsManagerOrAdmin,
)

from .models import Department, Designation
from .serializers import DepartmentSerializer, DesignationSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "is_active",
    ]

    search_fields = [
        "name",
        "description",
    ]

    ordering_fields = [
        "id",
        "name",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "name",
    ]

    def get_queryset(self):
        return Department.objects.all()

    def get_permissions(self):
        """
        Read access:
            HR / Super Admin / Manager

        Write access:
            HR / Super Admin only

        Managers can view department records but cannot
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


class DesignationViewSet(viewsets.ModelViewSet):
    serializer_class = DesignationSerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "department",
        "is_active",
    ]

    search_fields = [
        "name",
        "department__name",
    ]

    ordering_fields = [
        "id",
        "name",
        "created_at",
        "updated_at",
        "department__name",
    ]

    ordering = [
        "name",
    ]

    def get_queryset(self):
        return Designation.objects.select_related(
            "department",
        ).all()

    def get_permissions(self):
        """
        Read access:
            HR / Super Admin / Manager

        Write access:
            HR / Super Admin only

        Managers can view designation records but cannot
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