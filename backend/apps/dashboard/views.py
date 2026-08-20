from django.db.models import Count, Q
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
        user = request.user

        employee_queryset = Employee.objects.all()

        if user.role == User.Role.MANAGER:
            try:
                manager_employee = user.employee_profile
            except Employee.DoesNotExist:
                employee_queryset = employee_queryset.none()
            else:
                employee_queryset = employee_queryset.filter(
                    manager=manager_employee,
                )

        elif user.role == User.Role.EMPLOYEE:
            try:
                employee_profile = user.employee_profile
            except Employee.DoesNotExist:
                employee_queryset = employee_queryset.none()
            else:
                employee_queryset = employee_queryset.filter(
                    id=employee_profile.id,
                )

        employee_metrics = employee_queryset.aggregate(
            total=Count("id"),
            active=Count(
                "id",
                filter=Q(
                    employment_status=(
                        Employee.EmploymentStatus.ACTIVE
                    ),
                ),
            ),
            inactive=Count(
                "id",
                filter=Q(
                    employment_status=(
                        Employee.EmploymentStatus.INACTIVE
                    ),
                ),
            ),
            resigned=Count(
                "id",
                filter=Q(
                    employment_status=(
                        Employee.EmploymentStatus.RESIGNED
                    ),
                ),
            ),
            terminated=Count(
                "id",
                filter=Q(
                    employment_status=(
                        Employee.EmploymentStatus.TERMINATED
                    ),
                ),
            ),
        )

        dashboard_data = {
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role,
            },
            "employees": employee_metrics,
        }

        if user.role in {
            User.Role.SUPER_ADMIN,
            User.Role.HR,
        }:
            role_distribution = dict(
                User.objects.values("role")
                .annotate(total=Count("id"))
                .values_list("role", "total")
            )

            dashboard_data["users"] = {
                "total": User.objects.count(),
                "roles": role_distribution,
            }

        return Response(dashboard_data)