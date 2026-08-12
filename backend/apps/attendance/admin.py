from django.contrib import admin

from .models import Attendance


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "employee",
        "date",
        "check_in",
        "check_out",
        "status",
    )

    search_fields = (
        "employee__employee_id",
        "employee__user__first_name",
        "employee__user__last_name",
    )

    list_filter = (
        "status",
        "date",
    )

    ordering = ("-date",)