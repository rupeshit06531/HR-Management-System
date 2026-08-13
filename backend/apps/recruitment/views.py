from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from apps.accounts.permissions import IsAdminOrSuperAdmin

from .models import Candidate
from .serializers import CandidateSerializer


class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.select_related(
        "department",
    ).all()

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
    ]

    search_fields = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "job_title",
    ]

    ordering_fields = [
        "id",
        "application_date",
        "interview_date",
        "created_at",
    ]

    ordering = [
        "-application_date",
        "-created_at",
    ]