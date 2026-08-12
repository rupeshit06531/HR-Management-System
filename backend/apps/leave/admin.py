from django.contrib import admin

from .models import Leave


@admin.register(Leave)
class LeaveAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "employee",
        "leave_type",
        "start_date",
        "end_date",
        "status",
        "applied_at",
    )

    search_fields = (
        "employee__employee_id",
        "employee__user__first_name",
        "employee__user__last_name",
    )

    list_filter = (
        "leave_type",
        "status",
        "start_date",
    )

    ordering = ("-applied_at",)