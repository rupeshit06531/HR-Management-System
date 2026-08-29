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

        employee_profile = None

        if user.role == User.Role.MANAGER:
            try:
                employee_profile = user.employee_profile
            except Employee.DoesNotExist:
                employee_queryset = employee_queryset.none()
            else:
                employee_queryset = employee_queryset.filter(
                    manager=employee_profile,
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

        if employee_profile is not None:
            dashboard_data["employee"] = {
                "id": employee_profile.id,
                "employee_id": employee_profile.employee_id,
                "full_name": employee_profile.user.get_full_name(),
                "first_name": employee_profile.user.first_name,
                "last_name": employee_profile.user.last_name,
                "email": employee_profile.user.email,
                "department": (
                    employee_profile.department.name
                    if employee_profile.department
                    else None
                ),
                "designation": (
                    employee_profile.designation.name
                    if employee_profile.designation
                    else None
                ),
                "joining_date": (
                    employee_profile.joining_date.isoformat()
                    if employee_profile.joining_date
                    else None
                ),
                "employment_type": (
                    employee_profile.get_employment_type_display()
                ),
                "employment_status": (
                    employee_profile.get_employment_status_display()
                ),
                "manager": (
                    employee_profile.manager.user.get_full_name()
                    if employee_profile.manager
                    else None
                ),
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