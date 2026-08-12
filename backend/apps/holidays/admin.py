from django.contrib import admin

from .models import Holiday


@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "date",
        "description",
    )

    list_filter = (
        "date",
    )

    search_fields = (
        "name",
        "description",
    )

    ordering = (
        "date",
    )