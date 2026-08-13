from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from apps.accounts.permissions import (
    IsManagerOrHROrSuperAdmin,
)

from .models import PerformanceReview
from .serializers import PerformanceReviewSerializer


class PerformanceReviewViewSet(viewsets.ModelViewSet):
    queryset = PerformanceReview.objects.select_related(
        "employee",
        "employee__user",
    ).all()

    serializer_class = PerformanceReviewSerializer

    permission_classes = [
        IsManagerOrHROrSuperAdmin,
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "employee",
        "review_period",
        "review_date",
    ]

    search_fields = [
        "employee__employee_id",
        "employee__user__username",
        "employee__user__first_name",
        "employee__user__last_name",
        "employee__user__email",
        "review_period",
        "strengths",
        "areas_for_improvement",
        "manager_comments",
    ]

    ordering_fields = [
        "id",
        "review_period",
        "review_date",
        "created_at",
    ]

    ordering = [
        "-review_date",
        "-created_at",
    ]