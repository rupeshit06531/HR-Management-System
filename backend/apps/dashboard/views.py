from django.db.models import Count
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.employees.models import Employee


class DashboardView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):
        employee_queryset = Employee.objects.all()

        total_employees = employee_queryset.count()

        active_employees = employee_queryset.filter(
            employment_status=Employee.EmploymentStatus.ACTIVE,
        ).count()

        inactive_employees = employee_queryset.filter(
            employment_status=Employee.EmploymentStatus.INACTIVE,
        ).count()

        resigned_employees = employee_queryset.filter(
            employment_status=Employee.EmploymentStatus.RESIGNED,
        ).count()

        terminated_employees = employee_queryset.filter(
            employment_status=Employee.EmploymentStatus.TERMINATED,
        ).count()

        role_distribution = dict(
            User.objects.values("role")
            .annotate(total=Count("id"))
            .values_list("role", "total")
        )

        return Response(
            {
                "user": {
                    "id": request.user.id,
                    "username": request.user.username,
                    "role": request.user.role,
                },
                "employees": {
                    "total": total_employees,
                    "active": active_employees,
                    "inactive": inactive_employees,
                    "resigned": resigned_employees,
                    "terminated": terminated_employees,
                },
                "users": {
                    "total": User.objects.count(),
                    "roles": role_distribution,
                },
            }
        )