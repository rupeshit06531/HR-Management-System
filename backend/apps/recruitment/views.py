from pathlib import Path

from django.http import FileResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound

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

    @action(detail=True, methods=["get"], url_path="download-resume")
    def download_resume(self, request, pk=None):
        candidate = self.get_object()
        if not candidate.resume:
            raise NotFound("No resume is attached to this candidate.")

        try:
            candidate.resume.open("rb")
        except (OSError, ValueError) as error:
            raise NotFound("Resume file is unavailable.") from error

        response = FileResponse(
            candidate.resume,
            as_attachment=True,
            filename=Path(candidate.resume.name).name,
            content_type="application/octet-stream",
        )
        response["Cache-Control"] = "private, no-store"
        response["X-Content-Type-Options"] = "nosniff"
        return response
