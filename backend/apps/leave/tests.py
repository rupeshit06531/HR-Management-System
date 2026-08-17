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

        cls.admin_user = User.objects.create_user(
            username="leave_admin",
            email="leave_admin@test.com",
            password="TestPass@123",
            first_name="Leave",
            last_name="Admin",
            role=User.Role.SUPER_ADMIN,
        )

        cls.employee_user = User.objects.create_user(
            username="leave_employee",
            email="leave_employee@test.com",
            password="TestPass@123",
            first_name="Leave",
            last_name="Employee",
            role=User.Role.EMPLOYEE,
        )

        cls.other_employee_user = User.objects.create_user(
            username="leave_other_employee",
            email="leave_other_employee@test.com",
            password="TestPass@123",
            first_name="Other",
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

        cls.other_employee = Employee.objects.create(
            user=cls.other_employee_user,
            employee_id="LEAVE-EMP-002",
            department=cls.department,
            designation=cls.designation,
            joining_date=date(2026, 1, 3),
        )

    def setUp(self):
        self.url = reverse("leave-list")

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def create_leave(
        self,
        employee,
        start_date="2026-08-01",
        end_date="2026-08-02",
        status_value="pending",
        reason="Test leave",
    ):
        return Leave.objects.create(
            employee=employee,
            leave_type="casual",
            start_date=date.fromisoformat(start_date),
            end_date=date.fromisoformat(end_date),
            reason=reason,
            status=status_value,
        )

    def test_unauthenticated_access_is_denied(self):
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_manager_can_list_leaves(self):
        self.authenticate(self.manager_user)

        self.create_leave(
            self.employee,
            start_date="2026-08-01",
            end_date="2026-08-02",
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

    def test_hr_can_list_all_leaves(self):
        self.authenticate(self.hr_user)

        self.create_leave(
            self.employee,
            start_date="2026-08-01",
            end_date="2026-08-02",
        )

        self.create_leave(
            self.other_employee,
            start_date="2026-08-05",
            end_date="2026-08-06",
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

    def test_super_admin_can_list_all_leaves(self):
        self.authenticate(self.admin_user)

        self.create_leave(
            self.employee,
            start_date="2026-08-01",
            end_date="2026-08-02",
        )

        self.create_leave(
            self.other_employee,
            start_date="2026-08-05",
            end_date="2026-08-06",
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

    def test_employee_can_list_own_leaves(self):
        self.authenticate(self.employee_user)

        self.create_leave(
            self.employee,
            start_date="2026-08-01",
            end_date="2026-08-02",
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
            response.data["results"][0]["employee"],
            self.employee.id,
        )

    def test_employee_cannot_view_other_employee_leave(self):
        self.authenticate(self.employee_user)

        self.create_leave(
            self.other_employee,
            start_date="2026-08-05",
            end_date="2026-08-06",
        )

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            0,
        )

    def test_manager_can_view_team_leave(self):
        self.authenticate(self.manager_user)

        self.create_leave(
            self.employee,
            start_date="2026-08-01",
            end_date="2026-08-02",
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
            response.data["results"][0]["employee"],
            self.employee.id,
        )

    def test_manager_cannot_view_unrelated_employee_leave(self):
        self.authenticate(self.manager_user)

        self.create_leave(
            self.other_employee,
            start_date="2026-08-05",
            end_date="2026-08-06",
        )

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            0,
        )

    def test_employee_can_create_own_leave(self):
        self.authenticate(self.employee_user)

        payload = {
            "leave_type": "casual",
            "start_date": "2026-09-01",
            "end_date": "2026-09-03",
            "reason": "Family function",
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

    def test_employee_cannot_create_leave_for_another_employee(self):
        self.authenticate(self.employee_user)

        payload = {
            "employee": self.other_employee.id,
            "leave_type": "casual",
            "start_date": "2026-09-10",
            "end_date": "2026-09-12",
            "reason": "Permission test",
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

        created_leave = Leave.objects.get(
            start_date=date(2026, 9, 10),
        )

        self.assertEqual(
            created_leave.employee,
            self.employee,
        )

    def test_hr_can_create_leave(self):
        self.authenticate(self.hr_user)

        payload = {
            "employee": self.employee.id,
            "leave_type": "casual",
            "start_date": "2026-09-15",
            "end_date": "2026-09-17",
            "reason": "Family function",
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
                start_date=date(2026, 9, 15),
            ).exists()
        )

    def test_super_admin_can_create_leave(self):
        self.authenticate(self.admin_user)

        payload = {
            "employee": self.employee.id,
            "leave_type": "sick",
            "start_date": "2026-09-20",
            "end_date": "2026-09-21",
            "reason": "Medical leave",
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

    def test_manager_cannot_create_leave(self):
        self.authenticate(self.manager_user)

        payload = {
            "employee": self.employee.id,
            "leave_type": "casual",
            "start_date": "2026-09-25",
            "end_date": "2026-09-26",
            "reason": "Manager permission test",
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

    def test_hr_can_update_leave(self):
        self.authenticate(self.hr_user)

        leave = self.create_leave(
            self.employee,
            start_date="2026-10-01",
            end_date="2026-10-02",
            reason="Original reason",
        )

        response = self.client.patch(
            reverse(
                "leave-detail",
                kwargs={"pk": leave.id},
            ),
            {
                "reason": "Updated HR reason",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        leave.refresh_from_db()

        self.assertEqual(
            leave.reason,
            "Updated HR reason",
        )

    def test_super_admin_can_update_leave(self):
        self.authenticate(self.admin_user)

        leave = self.create_leave(
            self.employee,
            start_date="2026-10-05",
            end_date="2026-10-06",
        )

        response = self.client.patch(
            reverse(
                "leave-detail",
                kwargs={"pk": leave.id},
            ),
            {
                "reason": "Updated by admin",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        leave.refresh_from_db()

        self.assertEqual(
            leave.reason,
            "Updated by admin",
        )

    def test_manager_cannot_update_leave(self):
        self.authenticate(self.manager_user)

        leave = self.create_leave(
            self.employee,
            start_date="2026-10-10",
            end_date="2026-10-11",
        )

        response = self.client.patch(
            reverse(
                "leave-detail",
                kwargs={"pk": leave.id},
            ),
            {
                "reason": "Manager update attempt",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_employee_cannot_update_leave(self):
        self.authenticate(self.employee_user)

        leave = self.create_leave(
            self.employee,
            start_date="2026-10-15",
            end_date="2026-10-16",
        )

        response = self.client.patch(
            reverse(
                "leave-detail",
                kwargs={"pk": leave.id},
            ),
            {
                "reason": "Employee update attempt",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_hr_can_delete_leave(self):
        self.authenticate(self.hr_user)

        leave = self.create_leave(
            self.employee,
            start_date="2026-10-20",
            end_date="2026-10-21",
        )

        response = self.client.delete(
            reverse(
                "leave-detail",
                kwargs={"pk": leave.id},
            ),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Leave.objects.filter(
                pk=leave.id,
            ).exists()
        )

    def test_manager_cannot_delete_leave(self):
        self.authenticate(self.manager_user)

        leave = self.create_leave(
            self.employee,
            start_date="2026-10-25",
            end_date="2026-10-26",
        )

        response = self.client.delete(
            reverse(
                "leave-detail",
                kwargs={"pk": leave.id},
            ),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_employee_cannot_delete_leave(self):
        self.authenticate(self.employee_user)

        leave = self.create_leave(
            self.employee,
            start_date="2026-10-28",
            end_date="2026-10-29",
        )

        response = self.client.delete(
            reverse(
                "leave-detail",
                kwargs={"pk": leave.id,
            }),
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

        self.create_leave(
            self.employee,
            start_date="2026-11-01",
            end_date="2026-11-05",
            reason="Existing leave",
        )

        payload = {
            "employee": self.employee.id,
            "leave_type": "sick",
            "start_date": "2026-11-04",
            "end_date": "2026-11-07",
            "reason": "Overlapping leave test",
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

        self.create_leave(
            self.employee,
            start_date="2026-11-10",
            end_date="2026-11-11",
            status_value="pending",
            reason="Pending leave",
        )

        self.create_leave(
            self.employee,
            start_date="2026-11-15",
            end_date="2026-11-16",
            status_value="approved",
            reason="Approved leave",
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

        self.create_leave(
            self.employee,
            start_date="2026-12-01",
            end_date="2026-12-02",
            reason="Medical appointment",
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

    def test_database_rejects_invalid_leave_date_range(self):
        from django.db import IntegrityError

        with self.assertRaises(IntegrityError):
            Leave.objects.create(
                employee=self.employee,
                leave_type="casual",
                start_date=date(2026, 12, 20),
                end_date=date(2026, 12, 15),
                reason="Database constraint test",
                status="pending",
            )