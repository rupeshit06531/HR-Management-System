from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from apps.accounts.permissions import IsAdminOrSuperAdmin

from .models import Candidate
from .serializers import CandidateSerializer


class CandidateViewSet(viewsets.ModelViewSet):
    serializer_class = CandidateSerializer

    permission_classes = [
        IsAdminOrSuperAdmin,
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "department",
        "status",
        "application_date",
        "interview_date",
        "job_title",
    ]

    search_fields = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "job_title",
        "department__name",
    ]

    ordering_fields = [
        "id",
        "first_name",
        "last_name",
        "email",
        "job_title",
        "department__name",
        "application_date",
        "interview_date",
        "status",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "-application_date",
        "-created_at",
        "-id",
    ]

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Candidate.objects.none()

        return (
            Candidate.objects
            .select_related(
                "department",
            )
            .all()
        )