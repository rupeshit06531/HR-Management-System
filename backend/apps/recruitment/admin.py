from django.contrib import admin

from .models import Candidate


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = (
        "first_name",
        "last_name",
        "job_title",
        "department",
        "email",
        "phone",
        "status",
        "application_date",
        "interview_date",
    )

    list_filter = (
        "status",
        "department",
        "application_date",
        "interview_date",
    )

    search_fields = (
        "first_name",
        "last_name",
        "email",
        "phone",
        "job_title",
    )

    ordering = (
        "-application_date",
        "-created_at",
    )

    autocomplete_fields = (
        "department",
    )