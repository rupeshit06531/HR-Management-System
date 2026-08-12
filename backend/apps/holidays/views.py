from rest_framework import filters, viewsets

from django_filters.rest_framework import DjangoFilterBackend

from .models import Holiday
from .serializers import HolidaySerializer


class HolidayViewSet(viewsets.ModelViewSet):

    queryset = Holiday.objects.all().order_by("date")

    serializer_class = HolidaySerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "holiday_type",
        "date",
        "is_active",
    ]

    search_fields = [
        "name",
        "description",
    ]

    ordering_fields = [
        "id",
        "date",
        "name",
        "created_at",
    ]