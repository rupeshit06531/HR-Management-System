from rest_framework import viewsets

from .models import Department, Designation
from .serializers import DepartmentSerializer, DesignationSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


class DesignationViewSet(viewsets.ModelViewSet):
    queryset = Designation.objects.select_related(
        "department",
    ).all()
    serializer_class = DesignationSerializer