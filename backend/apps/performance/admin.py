from django.contrib import admin

from .models import PerformanceReview


@admin.register(PerformanceReview)
class PerformanceReviewAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "employee",
        "review_period",
        "review_date",
    )

    search_fields = (
        "employee__employee_id",
        "employee__user__first_name",
        "employee__user__last_name",
        "review_period",
    )

    list_filter = (
        "review_date",
    )

    ordering = ("-review_date",)