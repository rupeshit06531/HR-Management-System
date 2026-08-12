from rest_framework import filters, viewsets

from django_filters.rest_framework import DjangoFilterBackend

from .models import Employee
from .serializers import EmployeeSerializer
from apps.accounts.permissions import IsManagerOrAdmin


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related(
        "user",
        "department",
        "designation",
        "manager",
    ).all()

    serializer_class = EmployeeSerializer

    permission_classes = [
        IsManagerOrAdmin,
    ]

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
    ]

    ordering_fields = [
        "id",
        "employee_id",
        "joining_date",
    ]

    ordering = [
        "employee_id",
    ]