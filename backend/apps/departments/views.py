from rest_framework import viewsets

from apps.accounts.permissions import (
    IsAdminOrSuperAdmin,
    IsManagerOrAdmin,
)

from .models import Department, Designation
from .serializers import DepartmentSerializer, DesignationSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

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
    queryset = Designation.objects.select_related(
        "department",
    ).all()

    serializer_class = DesignationSerializer

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