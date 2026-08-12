from rest_framework import filters, viewsets

from django_filters.rest_framework import DjangoFilterBackend

from .models import Announcement
from .serializers import AnnouncementSerializer


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.select_related(
        "created_by",
        "department",
    ).all()

    serializer_class = AnnouncementSerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "target_audience",
        "department",
        "is_active",
        "publish_date",
        "expiry_date",
    ]

    search_fields = [
        "title",
        "message",
        "created_by__username",
        "created_by__first_name",
        "created_by__last_name",
    ]

    ordering_fields = [
        "id",
        "publish_date",
        "expiry_date",
        "created_at",
    ]

    ordering = [
        "-publish_date",
        "-created_at",
    ]