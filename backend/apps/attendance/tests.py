from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.departments.models import Department, Designation
from apps.employees.models import Employee

from .models import Attendance


class AttendanceAPITestCase(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.department = Department.objects.create(
            name="Attendance Engineering",
            description="Attendance test department",
        )

        cls.designation = Designation.objects.create(
            name="Attendance Manager",
            department=cls.department,
        )

        cls.manager_user = User.objects.create_user(
            username="attendance_manager",
            email="attendance_manager@test.com",
            password="TestPass@123",
            first_name="Attendance",
            last_name="Manager",
            role=User.Role.MANAGER,
        )

        cls.hr_user = User.objects.create_user(
            username="attendance_hr",
            email="attendance_hr@test.com",
            password="TestPass@123",
            first_name="Attendance",
            last_name="HR",
            role=User.Role.HR,
        )

        cls.employee_user = User.objects.create_user(
            username="attendance_employee",
            email="attendance_employee@test.com",
            password="TestPass@123",
            first_name="Attendance",
            last_name="Employee",
            role=User.Role.EMPLOYEE,
        )

        cls.employee = Employee.objects.create(
            user=cls.employee_user,
            employee_id="ATT-EMP-001",
            department=cls.department,
            designation=cls.designation,
            joining_date=date(2026, 1, 1),
        )

    def setUp(self):
        self.url = reverse("attendance-list")

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_unauthenticated_access_is_denied(self):
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_manager_can_list_attendance(self):
        self.authenticate(self.manager_user)

        Attendance.objects.create(
            employee=self.employee,
            date=date(2026, 8, 1),
            check_in="09:00:00",
            check_out="17:00:00",
            status="present",
            remarks="Regular day",
        )

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

    def test_manager_can_create_attendance(self):
        self.authenticate(self.manager_user)

        payload = {
            "employee": self.employee.id,
            "date": "2026-08-02",
            "check_in": "09:05:00",
            "check_out": "17:10:00",
            "status": "late",
            "remarks": "Traffic delay",
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
            Attendance.objects.filter(
                employee=self.employee,
                date=date(2026, 8, 2),
                status="late",
            ).exists()
        )

    def test_hr_can_create_attendance(self):
        self.authenticate(self.hr_user)

        payload = {
            "employee": self.employee.id,
            "date": "2026-08-03",
            "check_in": "09:00:00",
            "check_out": "17:00:00",
            "status": "present",
            "remarks": "Regular attendance",
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

    def test_employee_cannot_access_attendance(self):
        self.authenticate(self.employee_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_checkout_must_be_after_checkin(self):
        self.authenticate(self.manager_user)

        payload = {
            "employee": self.employee.id,
            "date": "2026-08-04",
            "check_in": "17:00:00",
            "check_out": "09:00:00",
            "status": "present",
            "remarks": "Invalid timing",
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
            "check_out",
            response.data,
        )

    def test_duplicate_employee_date_is_rejected(self):
        self.authenticate(self.manager_user)

        Attendance.objects.create(
            employee=self.employee,
            date=date(2026, 8, 5),
            check_in="09:00:00",
            check_out="17:00:00",
            status="present",
        )

        payload = {
            "employee": self.employee.id,
            "date": "2026-08-05",
            "check_in": "10:00:00",
            "check_out": "18:00:00",
            "status": "late",
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

    def test_filter_by_status(self):
        self.authenticate(self.manager_user)

        Attendance.objects.create(
            employee=self.employee,
            date=date(2026, 8, 6),
            status="present",
        )

        Attendance.objects.create(
            employee=self.employee,
            date=date(2026, 8, 7),
            status="absent",
        )

        response = self.client.get(
            self.url,
            {"status": "absent"},
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
            "absent",
        )

    def test_search_by_employee_id(self):
        self.authenticate(self.manager_user)

        Attendance.objects.create(
            employee=self.employee,
            date=date(2026, 8, 8),
            status="present",
        )

        response = self.client.get(
            self.url,
            {"search": "ATT-EMP-001"},
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
            results[0]["employee_id"],
            "ATT-EMP-001",
        )

    def test_ordering_by_date(self):
        self.authenticate(self.manager_user)

        Attendance.objects.create(
            employee=self.employee,
            date=date(2026, 8, 9),
            status="present",
        )

        Attendance.objects.create(
            employee=self.employee,
            date=date(2026, 8, 10),
            status="late",
        )

        response = self.client.get(
            self.url,
            {"ordering": "date"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        results = response.data["results"]

        self.assertEqual(
            results[0]["date"],
            "2026-08-09",
        )