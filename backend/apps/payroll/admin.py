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
    )

    search_fields = (
        "employee__employee_id",
        "employee__user__first_name",
        "employee__user__last_name",
    )

    list_filter = (
        "payment_status",
        "month",
    )

    ordering = ("-month",)