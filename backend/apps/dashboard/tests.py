from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.departments.models import Department, Designation
from apps.employees.models import Employee


class DashboardAPITestCase(APITestCase):
    def setUp(self):
        self.department = Department.objects.create(
            name="Engineering",
        )

        self.designation = Designation.objects.create(
            name="Software Engineer",
            department=self.department,
        )

        self.manager = User.objects.create_user(
            username="dashboard_manager",
            password="DashboardPass123!",
            role=User.Role.MANAGER,
        )

        self.manager_employee = Employee.objects.create(
            user=self.manager,
            employee_id="EMP-DASH-MGR",
            department=self.department,
            designation=self.designation,
            joining_date=date(2026, 1, 1),
            employment_type=Employee.EmploymentType.FULL_TIME,
            employment_status=Employee.EmploymentStatus.ACTIVE,
        )

        self.employee = User.objects.create_user(
            username="dashboard_employee",
            password="DashboardPass123!",
            role=User.Role.EMPLOYEE,
        )

        self.employee_profile = Employee.objects.create(
            user=self.employee,
            employee_id="EMP-DASH-001",
            department=self.department,
            designation=self.designation,
            joining_date=date(2026, 2, 1),
            employment_type=Employee.EmploymentType.FULL_TIME,
            employment_status=Employee.EmploymentStatus.ACTIVE,
            manager=self.manager_employee,
        )

        self.hr = User.objects.create_user(
            username="dashboard_hr",
            password="DashboardPass123!",
            role=User.Role.HR,
        )

        self.hr_employee = Employee.objects.create(
            user=self.hr,
            employee_id="EMP-DASH-HR",
            department=self.department,
            designation=self.designation,
            joining_date=date(2026, 1, 15),
            employment_type=Employee.EmploymentType.FULL_TIME,
            employment_status=Employee.EmploymentStatus.ACTIVE,
        )

        self.admin = User.objects.create_user(
            username="dashboard_admin",
            password="DashboardPass123!",
            role=User.Role.SUPER_ADMIN,
        )

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_dashboard_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(
            reverse("dashboard"),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_authenticated_user_can_access_dashboard(self):
        self.authenticate(self.admin)

        response = self.client.get(
            reverse("dashboard"),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn(
            "user",
            response.data,
        )

        self.assertIn(
            "employees",
            response.data,
        )

        self.assertIn(
            "users",
            response.data,
        )

        self.assertEqual(
            response.data["user"]["username"],
            "dashboard_admin",
        )

    def test_dashboard_employee_metrics_are_accurate(self):
        self.authenticate(self.admin)

        Employee.objects.create(
            user=User.objects.create_user(
                username="inactive_dashboard_employee",
                password="DashboardPass123!",
                role=User.Role.EMPLOYEE,
            ),
            employee_id="EMP-DASH-002",
            department=self.department,
            designation=self.designation,
            joining_date=date(2026, 3, 1),
            employment_type=Employee.EmploymentType.FULL_TIME,
            employment_status=Employee.EmploymentStatus.INACTIVE,
        )

        Employee.objects.create(
            user=User.objects.create_user(
                username="resigned_dashboard_employee",
                password="DashboardPass123!",
                role=User.Role.EMPLOYEE,
            ),
            employee_id="EMP-DASH-003",
            department=self.department,
            designation=self.designation,
            joining_date=date(2026, 3, 15),
            employment_type=Employee.EmploymentType.FULL_TIME,
            employment_status=Employee.EmploymentStatus.RESIGNED,
        )

        Employee.objects.create(
            user=User.objects.create_user(
                username="terminated_dashboard_employee",
                password="DashboardPass123!",
                role=User.Role.EMPLOYEE,
            ),
            employee_id="EMP-DASH-004",
            department=self.department,
            designation=self.designation,
            joining_date=date(2026, 4, 1),
            employment_type=Employee.EmploymentType.FULL_TIME,
            employment_status=Employee.EmploymentStatus.TERMINATED,
        )

        response = self.client.get(
            reverse("dashboard"),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["employees"]["total"],
            6,
        )

        self.assertEqual(
            response.data["employees"]["active"],
            3,
        )

        self.assertEqual(
            response.data["employees"]["inactive"],
            1,
        )

        self.assertEqual(
            response.data["employees"]["resigned"],
            1,
        )

        self.assertEqual(
            response.data["employees"]["terminated"],
            1,
        )

    def test_super_admin_can_access_global_dashboard(self):
        self.authenticate(self.admin)

        response = self.client.get(
            reverse("dashboard"),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["employees"]["total"],
            3,
        )

    def test_hr_can_access_global_dashboard(self):
        self.authenticate(self.hr)

        response = self.client.get(
            reverse("dashboard"),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["employees"]["total"],
            3,
        )

    def test_manager_only_sees_reporting_team(self):
        self.authenticate(self.manager)

        response = self.client.get(
            reverse("dashboard"),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["employees"]["total"],
            1,
        )

        self.assertEqual(
            response.data["employees"]["active"],
            1,
        )

    def test_employee_only_sees_own_record(self):
        self.authenticate(self.employee)

        response = self.client.get(
            reverse("dashboard"),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["employees"]["total"],
            1,
        )

        self.assertEqual(
            response.data["employees"]["active"],
            1,
        )