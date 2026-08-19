from django.contrib import admin

from .models import Holiday


@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "date",
        "holiday_type",
        "is_active",
        "created_at",
        "updated_at",
    )

    list_filter = (
        "holiday_type",
        "is_active",
        "date",
    )

    search_fields = (
        "name",
        "description",
    )

    ordering = (
        "date",
        "name",
    )

    list_per_page = 25