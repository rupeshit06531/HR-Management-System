from django.contrib import admin

from .models import Announcement


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "target_audience",
        "department",
        "publish_date",
        "expiry_date",
        "is_active",
        "created_by",
    )

    list_filter = (
        "target_audience",
        "is_active",
        "department",
        "publish_date",
    )

    search_fields = (
        "title",
        "message",
        "created_by__username",
        "created_by__first_name",
        "created_by__last_name",
    )

    ordering = (
        "-publish_date",
        "-created_at",
    )

    autocomplete_fields = (
        "created_by",
        "department",
    )