from django.contrib import admin

from .models import Department, Designation


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "is_active",
        "created_at",
        "updated_at",
    )

    search_fields = (
        "name",
        "description",
    )

    list_filter = (
        "is_active",
    )


@admin.register(Designation)
class DesignationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "department",
        "is_active",
        "created_at",
        "updated_at",
    )

    search_fields = (
        "name",
        "department__name",
    )

    list_filter = (
        "is_active",
        "department",
    )