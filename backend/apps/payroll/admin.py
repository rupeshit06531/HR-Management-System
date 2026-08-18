
from django.contrib import admin

from .models import Payroll


@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "employee",
        "month",
        "basic_salary",
        "allowances",
        "deductions",
        "net_salary",
        "payment_status",
        "paid_at",
        "created_at",
        "updated_at",
    )

    search_fields = (
        "employee__employee_id",
        "employee__user__username",
        "employee__user__first_name",
        "employee__user__last_name",
        "employee__user__email",
    )

    list_filter = (
        "payment_status",
        "month",
        "paid_at",
    )

    ordering = (
        "-month",
        "-created_at",
        "-id",
    )

    list_select_related = (
        "employee",
        "employee__user",
    )

    readonly_fields = (
        "net_salary",
        "created_at",
        "updated_at",
    )

    date_hierarchy = "month"

    list_per_page = 50
