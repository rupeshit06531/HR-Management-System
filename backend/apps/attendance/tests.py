
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

        cls.admin_user = User.objects.create_user(
            username="attendance_admin",
            email="attendance_admin@test.com",
            password="TestPass@123",
            first_name="Attendance",
            last_name="Admin",
            role=User.Role.SUPER_ADMIN,
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

        cls.second_employee_user = User.objects.create_user(
            username="attendance_employee_two",
            email="attendance_employee_two@test.com",
            password="TestPass@123",
            first_name="Second",
            last_name="Employee",
            role=User.Role.EMPLOYEE,
        )

        cls.manager_employee = Employee.objects.create(
            user=cls.manager_user,
            employee_id="ATT-MGR-001",
            department=cls.department,
            designation=cls.designation,
            joining_date=date(2026, 1, 1),
        )

        cls.employee = Employee.objects.create(
            user=cls.employee_user,
            employee_id="ATT-EMP-001",
            department=cls.department,
            designation=cls.designation,
            joining_date=date(2026, 1, 1),
            manager=cls.manager_employee,
        )

        cls.second_employee = Employee.objects.create(
            user=cls.second_employee_user,
            employee_id="ATT-EMP-002",
            department=cls.department,
            designation=cls.designation,
            joining_date=date(2026, 1, 1),
        )

        

    def setUp(self):
        self.url = reverse("attendance-list")

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def create_attendance(
        self,
        employee=None,
        attendance_date=date(2026, 8, 1),
        status_value="present",
    ):
        return Attendance.objects.create(
            employee=employee or self.employee,
            date=attendance_date,
            check_in="09:00:00",
            check_out="17:00:00",
            status=status_value,
            remarks="Test attendance",
        )

    def test_unauthenticated_access_is_denied(self):
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_super_admin_can_list_attendance(self):
        self.authenticate(self.admin_user)

        self.create_attendance()

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

    def test_manager_can_list_attendance(self):
        self.authenticate(self.manager_user)

        self.create_attendance()

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

    def test_hr_can_list_attendance(self):
        self.authenticate(self.hr_user)

        self.create_attendance()

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

    def test_super_admin_can_create_attendance(self):
        self.authenticate(self.admin_user)

        payload = {
            "employee": self.employee.id,
            "date": "2026-08-04",
            "check_in": "09:00:00",
            "check_out": "17:00:00",
            "status": "present",
            "remarks": "Admin created attendance",
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

    def test_employee_can_list_only_own_attendance(self):
        self.authenticate(self.employee_user)

        self.create_attendance(
            employee=self.employee,
            attendance_date=date(2026, 8, 5),
        )

        self.create_attendance(
            employee=self.second_employee,
            attendance_date=date(2026, 8, 6),
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

        self.assertEqual(
            response.data["results"][0]["employee_id"],
            "ATT-EMP-001",
        )

    def test_employee_cannot_create_attendance(self):
        self.authenticate(self.employee_user)

        payload = {
            "employee": self.employee.id,
            "date": "2026-08-07",
            "check_in": "09:00:00",
            "check_out": "17:00:00",
            "status": "present",
            "remarks": "Employee attempt",
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

        self.assertFalse(
            Attendance.objects.filter(
                employee=self.employee,
                date=date(2026, 8, 7),
            ).exists()
        )

    def test_employee_cannot_update_attendance(self):
        attendance = self.create_attendance(
            attendance_date=date(2026, 8, 8),
        )

        self.authenticate(self.employee_user)

        payload = {
            "employee": self.employee.id,
            "date": "2026-08-08",
            "check_in": "10:00:00",
            "check_out": "18:00:00",
            "status": "late",
            "remarks": "Employee update attempt",
        }

        response = self.client.put(
            reverse(
                "attendance-detail",
                kwargs={"pk": attendance.id},
            ),
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_employee_cannot_delete_attendance(self):
        attendance = self.create_attendance(
            attendance_date=date(2026, 8, 9),
        )

        self.authenticate(self.employee_user)

        response = self.client.delete(
            reverse(
                "attendance-detail",
                kwargs={"pk": attendance.id},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertTrue(
            Attendance.objects.filter(
                id=attendance.id,
            ).exists()
        )

    def test_manager_can_update_attendance(self):
        attendance = self.create_attendance(
            attendance_date=date(2026, 8, 10),
        )

        self.authenticate(self.manager_user)

        payload = {
            "employee": self.employee.id,
            "date": "2026-08-10",
            "check_in": "10:00:00",
            "check_out": "18:00:00",
            "status": "late",
            "remarks": "Updated by manager",
        }

        response = self.client.put(
            reverse(
                "attendance-detail",
                kwargs={"pk": attendance.id},
            ),
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        attendance.refresh_from_db()

        self.assertEqual(
            attendance.status,
            "late",
        )

        self.assertEqual(
            attendance.remarks,
            "Updated by manager",
        )

    def test_hr_can_delete_attendance(self):
        attendance = self.create_attendance(
            attendance_date=date(2026, 8, 11),
        )

        self.authenticate(self.hr_user)

        response = self.client.delete(
            reverse(
                "attendance-detail",
                kwargs={"pk": attendance.id},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Attendance.objects.filter(
                id=attendance.id,
            ).exists()
        )

    def test_checkout_must_be_after_checkin(self):
        self.authenticate(self.manager_user)

        payload = {
            "employee": self.employee.id,
            "date": "2026-08-12",
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

    def test_check_in_requires_check_out(self):
        self.authenticate(self.manager_user)

        payload = {
            "employee": self.employee.id,
            "date": "2026-08-22",
            "check_in": "09:00:00",
            "status": "present",
            "remarks": "Missing check-out",
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

    def test_check_out_requires_check_in(self):
        self.authenticate(self.manager_user)

        payload = {
            "employee": self.employee.id,
            "date": "2026-08-23",
            "check_out": "17:00:00",
            "status": "present",
            "remarks": "Missing check-in",
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
            "check_in",
            response.data,
        )

    def test_duplicate_employee_date_is_rejected(self):
        self.authenticate(self.manager_user)

        self.create_attendance(
            attendance_date=date(2026, 8, 13),
        )

        payload = {
            "employee": self.employee.id,
            "date": "2026-08-13",
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

        self.create_attendance(
            attendance_date=date(2026, 8, 14),
            status_value="present",
        )

        self.create_attendance(
            attendance_date=date(2026, 8, 15),
            status_value="absent",
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

        self.create_attendance(
            attendance_date=date(2026, 8, 16),
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

        self.create_attendance(
            attendance_date=date(2026, 8, 17),
        )

        self.create_attendance(
            attendance_date=date(2026, 8, 18),
            status_value="late",
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
            "2026-08-17",
        )

    def test_manager_cannot_create_attendance_for_employee_outside_team(self):
        self.authenticate(self.manager_user)

        payload = {
            "employee": self.second_employee.id,
            "date": "2026-08-24",
            "check_in": "09:00:00",
            "check_out": "17:00:00",
            "status": "present",
            "remarks": "Unauthorized team attendance",
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
            "employee",
            response.data,
        )

        self.assertFalse(
            Attendance.objects.filter(
                employee=self.second_employee,
                date=date(2026, 8, 24),
            ).exists()
        )

    def test_manager_cannot_update_attendance_for_employee_outside_team(self):
        attendance = self.create_attendance(
            employee=self.second_employee,
            attendance_date=date(2026, 8, 25),
        )

        self.authenticate(self.manager_user)

        payload = {
            "employee": self.second_employee.id,
            "date": "2026-08-25",
            "check_in": "10:00:00",
            "check_out": "18:00:00",
            "status": "late",
            "remarks": "Unauthorized update",
        }

        response = self.client.put(
            reverse(
                "attendance-detail",
                kwargs={"pk": attendance.id},
            ),
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        attendance.refresh_from_db()

        self.assertEqual(
            attendance.status,
            "present",
        )

        self.assertEqual(
            attendance.remarks,
            "Test attendance",
        )

    def test_hr_can_access_attendance_for_all_employees(self):
        self.authenticate(self.hr_user)

        self.create_attendance(
            employee=self.employee,
            attendance_date=date(2026, 8, 26),
        )

        self.create_attendance(
            employee=self.second_employee,
            attendance_date=date(2026, 8, 27),
        )

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            2,
        )

        employee_ids = {
            result["employee_id"]
            for result in response.data["results"]
        }

        self.assertEqual(
            employee_ids,
            {
                "ATT-EMP-001",
                "ATT-EMP-002",
            },
        )

    def test_manager_cannot_view_attendance_for_employee_outside_team(self):
        self.create_attendance(
            employee=self.employee,
            attendance_date=date(2026, 8, 28),
        )

        self.create_attendance(
            employee=self.second_employee,
            attendance_date=date(2026, 8, 29),
        )

        self.authenticate(self.manager_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

        self.assertEqual(
            response.data["results"][0]["employee_id"],
            "ATT-EMP-001",
        )

    def test_manager_cannot_delete_attendance_for_employee_outside_team(self):
        attendance = self.create_attendance(
            employee=self.second_employee,
            attendance_date=date(2026, 8, 30),
        )

        self.authenticate(self.manager_user)

        response = self.client.delete(
            reverse(
                "attendance-detail",
                kwargs={"pk": attendance.id},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self.assertTrue(
            Attendance.objects.filter(
                id=attendance.id,
            ).exists()
        )

    def test_ordering_by_date_is_deterministic(self):
        first = self.create_attendance(
            attendance_date=date(2026, 8, 31),
        )

        second = self.create_attendance(
            employee=self.employee,
            attendance_date=date(2026, 9, 1),
            status_value="late",
        )

        self.authenticate(self.manager_user)

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
            results[0]["id"],
            first.id,
        )

        self.assertEqual(
            results[1]["id"],
            second.id,
        )
