from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.departments.models import Department, Designation
from apps.employees.models import Employee

from .models import Leave


class LeaveAPITestCase(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.department = Department.objects.create(
            name="Leave Test Department",
            description="Department for leave API tests",
        )

        cls.designation = Designation.objects.create(
            name="Leave Test Designation",
            department=cls.department,
        )

        cls.manager_user = User.objects.create_user(
            username="leave_manager",
            email="leave_manager@test.com",
            password="TestPass@123",
            first_name="Leave",
            last_name="Manager",
            role=User.Role.MANAGER,
        )

        cls.hr_user = User.objects.create_user(
            username="leave_hr",
            email="leave_hr@test.com",
            password="TestPass@123",
            first_name="Leave",
            last_name="HR",
            role=User.Role.HR,
        )

        cls.employee_user = User.objects.create_user(
            username="leave_employee",
            email="leave_employee@test.com",
            password="TestPass@123",
            first_name="Leave",
            last_name="Employee",
            role=User.Role.EMPLOYEE,
        )

        cls.manager_employee = Employee.objects.create(
            user=cls.manager_user,
            employee_id="LEAVE-MGR-001",
            department=cls.department,
            designation=cls.designation,
            joining_date=date(2026, 1, 1),
        )

        cls.employee = Employee.objects.create(
            user=cls.employee_user,
            employee_id="LEAVE-EMP-001",
            department=cls.department,
            designation=cls.designation,
            joining_date=date(2026, 1, 2),
            manager=cls.manager_employee,
        )

    def setUp(self):
        self.url = reverse("leave-list")

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_unauthenticated_access_is_denied(self):
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_manager_can_list_leaves(self):
        self.authenticate(self.manager_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_hr_can_create_leave(self):
        self.authenticate(self.hr_user)

        payload = {
            "employee": self.employee.id,
            "leave_type": "casual",
            "start_date": "2026-09-01",
            "end_date": "2026-09-03",
            "reason": "Family function",
            "status": "pending",
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            Leave.objects.filter(
                employee=self.employee,
                start_date=date(2026, 9, 1),
                end_date=date(2026, 9, 3),
            ).exists()
        )

    def test_manager_cannot_create_leave(self):
        self.authenticate(self.manager_user)

        payload = {
            "employee": self.employee.id,
            "leave_type": "casual",
            "start_date": "2026-09-10",
            "end_date": "2026-09-12",
            "reason": "Manager permission test",
            "status": "pending",
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_end_date_cannot_be_before_start_date(self):
        self.authenticate(self.hr_user)

        payload = {
            "employee": self.employee.id,
            "leave_type": "sick",
            "start_date": "2026-09-20",
            "end_date": "2026-09-15",
            "reason": "Invalid date test",
            "status": "pending",
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "end_date",
            response.data,
        )

    def test_overlapping_leave_is_rejected(self):
        self.authenticate(self.hr_user)

        Leave.objects.create(
            employee=self.employee,
            leave_type="casual",
            start_date=date(2026, 10, 1),
            end_date=date(2026, 10, 5),
            reason="Existing leave",
            status="pending",
        )

        payload = {
            "employee": self.employee.id,
            "leave_type": "sick",
            "start_date": "2026-10-04",
            "end_date": "2026-10-07",
            "reason": "Overlapping leave test",
            "status": "pending",
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_leave_filtering_by_status(self):
        self.authenticate(self.manager_user)

        Leave.objects.create(
            employee=self.employee,
            leave_type="casual",
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 2),
            reason="Pending leave",
            status="pending",
        )

        Leave.objects.create(
            employee=self.employee,
            leave_type="sick",
            start_date=date(2026, 11, 10),
            end_date=date(2026, 11, 11),
            reason="Approved leave",
            status="approved",
        )

        response = self.client.get(
            self.url,
            {"status": "approved"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        results = response.data["results"]

        self.assertEqual(
            len(results),
            1,
        )

        self.assertEqual(
            results[0]["status"],
            "approved",
        )

    def test_leave_search_by_reason(self):
        self.authenticate(self.manager_user)

        Leave.objects.create(
            employee=self.employee,
            leave_type="casual",
            start_date=date(2026, 12, 1),
            end_date=date(2026, 12, 2),
            reason="Medical appointment",
            status="pending",
        )

        response = self.client.get(
            self.url,
            {"search": "Medical"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        results = response.data["results"]

        self.assertEqual(
            len(results),
            1,
        )

        self.assertEqual(
            results[0]["reason"],
            "Medical appointment",
        )