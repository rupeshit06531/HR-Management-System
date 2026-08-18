from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.response import Response

from apps.accounts.permissions import (
    IsHROrSuperAdmin,
    IsSuperAdmin,
)

from .models import Payroll
from .serializers import PayrollSerializer


class PayrollViewSet(viewsets.ModelViewSet):
    queryset = Payroll.objects.select_related(
        "employee",
        "employee__user",
    ).all()

    serializer_class = PayrollSerializer

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
        "created_at",
    ]

    ordering = [
        "-month",
        "-created_at",
        "-id",
    ]

    def get_permissions(self):
        """
        Read access:
            HR and Super Admin

        Write access:
            Super Admin only
        """

        if self.action in {
            "create",
            "update",
            "partial_update",
            "destroy",
        }:
            permission_classes = [
                IsSuperAdmin,
            ]
        else:
            permission_classes = [
                IsHROrSuperAdmin,
            ]

        return [
            permission()
            for permission in permission_classes
        ]

    def destroy(self, request, *args, **kwargs):
        payroll = self.get_object()

        if (
            payroll.payment_status
            == Payroll.PaymentStatus.PAID
        ):
            return Response(
                {
                    "detail": (
                        "Paid payroll records cannot be "
                        "deleted."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().destroy(
            request,
            *args,
            **kwargs,
        )