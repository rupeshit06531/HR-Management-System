from rest_framework import filters, viewsets

from django_filters.rest_framework import DjangoFilterBackend

from .models import Payroll
from .serializers import PayrollSerializer
from apps.accounts.permissions import IsAdminOrSuperAdmin


class PayrollViewSet(viewsets.ModelViewSet):
    queryset = Payroll.objects.select_related(
        "employee",
        "employee__user",
    ).all()

    serializer_class = PayrollSerializer

    permission_classes = [
        IsAdminOrSuperAdmin,
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "employee",
        "payment_status",
        "month",
        "paid_at",
    ]

    search_fields = [
        "employee__employee_id",
        "employee__user__username",
        "employee__user__first_name",
        "employee__user__last_name",
        "employee__user__email",
    ]

    ordering_fields = [
        "id",
        "month",
        "basic_salary",
        "allowances",
        "deductions",
        "net_salary",
        "paid_at",
    ]

    ordering = [
        "-month",
        "-created_at",
    ]
