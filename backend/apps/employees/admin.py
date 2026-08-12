from django.contrib import admin

from .models import Employee


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "employee_id",
        "user",
        "department",
        "designation",
        "joining_date",
    )

    search_fields = (
        "employee_id",
        "user__first_name",
        "user__last_name",
        "user__email",
    )

    list_filter = (
        "department",
        "designation",
    )