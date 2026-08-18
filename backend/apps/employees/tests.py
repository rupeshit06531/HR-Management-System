from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.departments.models import Department, Designation

from .models import Employee


class EmployeeAPITestCase(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.department = Department.objects.create(
            name="Engineering",
            description="Engineering department",
        )

        cls.designation = Designation.objects.create(
            name="Software Engineer",
            department=cls.department,
        )

        cls.manager_designation = Designation.objects.create(
            name="Engineering Manager",
            department=cls.department,
        )

        cls.hr_user = User.objects.create_user(
            username="employee_hr",
            email="employee_hr@test.com",
            password="TestPass@123",
            first_name="Employee",
            last_name="HR",
            role=User.Role.HR,
        )

        cls.manager_user = User.objects.create_user(
            username="employee_manager",
            email="employee_manager@test.com",
            password="TestPass@123",
            first_name="Employee",
            last_name="Manager",
            role=User.Role.MANAGER,
        )

        cls.employee_user = User.objects.create_user(
            username="employee_worker",
            email="employee_worker@test.com",
            password="TestPass@123",
            first_name="Test",
            last_name="Employee",
            role=User.Role.EMPLOYEE,
        )

        cls.other_employee_user = User.objects.create_user(
            username="employee_other",
            email="employee_other@test.com",
            password="TestPass@123",
            first_name="Other",
            last_name="Employee",
            role=User.Role.EMPLOYEE,
        )

        cls.manager_employee = Employee.objects.create(
            user=cls.manager_user,
            employee_id="EMP-MGR-001",
            department=cls.department,
            designation=cls.manager_designation,
            joining_date=date(2025, 1, 1),
        )

        cls.employee = Employee.objects.create(
            user=cls.employee_user,
            employee_id="EMP-001",
            department=cls.department,
            designation=cls.designation,
            joining_date=date(2026, 1, 1),
            manager=cls.manager_employee,
        )

        cls.other_employee = Employee.objects.create(
            user=cls.other_employee_user,
            employee_id="EMP-002",
            department=cls.department,
            designation=cls.designation,
            joining_date=date(2026, 2, 1),
        )

    def setUp(self):
        self.url = reverse("employee-list")

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def create_employee_user(
        self,
        username="new_employee",
        email="new_employee@test.com",
        first_name="New",
        last_name="Employee",
    ):
        return User.objects.create_user(
            username=username,
            email=email,
            password="TestPass@123",
            first_name=first_name,
            last_name=last_name,
            role=User.Role.EMPLOYEE,
        )

    def test_unauthenticated_access_is_denied(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_hr_can_list_employees(self):
        self.authenticate(self.hr_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            3,
        )

    def test_hr_can_create_employee(self):
        self.authenticate(self.hr_user)

        new_user = self.create_employee_user(
            username="employee_new",
            email="employee_new@test.com",
        )

        payload = {
            "user": new_user.id,
            "employee_id": " emp-003 ",
            "department": self.department.id,
            "designation": self.designation.id,
            "joining_date": "2026-03-01",
            "employment_type": "FULL_TIME",
            "employment_status": "ACTIVE",
            "manager": self.manager_employee.id,
            "date_of_birth": "1998-01-01",
            "address": "Ranchi",
            "emergency_contact": "9876543210",
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
            Employee.objects.filter(
                employee_id="EMP-003",
                user=new_user,
            ).exists()
        )

    def test_created_employee_id_is_normalized(self):
        self.authenticate(self.hr_user)

        new_user = self.create_employee_user(
            username="employee_normalized",
            email="employee_normalized@test.com",
        )

        payload = {
            "user": new_user.id,
            "employee_id": "  emp-005  ",
            "department": self.department.id,
            "designation": self.designation.id,
            "joining_date": "2026-05-01",
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

        self.assertEqual(
            response.data["employee_id"],
            "EMP-005",
        )

    def test_full_name_is_returned(self):
        self.authenticate(self.hr_user)

        response = self.client.get(
            reverse(
                "employee-detail",
                kwargs={"pk": self.employee.id},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["full_name"],
            "Test Employee",
        )

    def test_manager_can_list_only_self_and_team_members(self):
        self.authenticate(self.manager_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        employee_ids = {
            item["employee_id"]
            for item in response.data["results"]
        }

        self.assertEqual(
            employee_ids,
            {
                "EMP-MGR-001",
                "EMP-001",
            },
        )

    def test_manager_cannot_create_employee(self):
        self.authenticate(self.manager_user)

        new_user = self.create_employee_user(
            username="manager_created",
            email="manager_created@test.com",
        )

        payload = {
            "user": new_user.id,
            "employee_id": "EMP-MGR-003",
            "department": self.department.id,
            "designation": self.designation.id,
            "joining_date": "2026-03-01",
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

    def test_employee_cannot_list_employees(self):
        self.authenticate(self.employee_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_filter_by_department(self):
        self.authenticate(self.hr_user)

        response = self.client.get(
            self.url,
            {"department": self.department.id},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            3,
        )

    def test_search_by_employee_id(self):
        self.authenticate(self.hr_user)

        response = self.client.get(
            self.url,
            {"search": "EMP-001"},
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
            "EMP-001",
        )

    def test_ordering_by_joining_date(self):
        self.authenticate(self.hr_user)

        response = self.client.get(
            self.url,
            {"ordering": "-joining_date"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        results = response.data["results"]

        self.assertEqual(
            results[0]["employee_id"],
            "EMP-002",
        )

    def test_duplicate_employee_id_is_rejected(self):
        self.authenticate(self.hr_user)

        payload = {
            "user": self.other_employee_user.id,
            "employee_id": "emp-001",
            "department": self.department.id,
            "designation": self.designation.id,
            "joining_date": "2026-04-01",
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
            "employee_id",
            response.data,
        )

    def test_duplicate_user_employee_profile_is_rejected(self):
        self.authenticate(self.hr_user)

        payload = {
            "user": self.employee_user.id,
            "employee_id": "EMP-006",
            "department": self.department.id,
            "designation": self.designation.id,
            "joining_date": "2026-06-01",
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
            "user",
            response.data,
        )

    def test_designation_must_belong_to_department(self):
        self.authenticate(self.hr_user)

        other_department = Department.objects.create(
            name="Finance",
            description="Finance department",
        )

        other_designation = Designation.objects.create(
            name="Finance Executive",
            department=other_department,
        )

        new_user = self.create_employee_user(
            username="employee_invalid_department",
            email="employee_invalid_department@test.com",
            first_name="Invalid",
            last_name="Department",
        )

        payload = {
            "user": new_user.id,
            "employee_id": "EMP-004",
            "department": self.department.id,
            "designation": other_designation.id,
            "joining_date": "2026-04-01",
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
            "designation",
            response.data,
        )

    def test_employee_cannot_be_own_manager(self):
        self.authenticate(self.hr_user)

        payload = {
            "user": self.employee_user.id,
            "employee_id": "EMP-001",
            "department": self.department.id,
            "designation": self.designation.id,
            "joining_date": "2026-01-01",
            "manager": self.employee.id,
        }

        response = self.client.put(
            reverse(
                "employee-detail",
                kwargs={"pk": self.employee.id},
            ),
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "manager",
            response.data,
        )

    def test_inactive_manager_is_rejected(self):
        self.authenticate(self.hr_user)

        inactive_user = self.create_employee_user(
            username="inactive_manager",
            email="inactive_manager@test.com",
        )

        inactive_manager = Employee.objects.create(
            user=inactive_user,
            employee_id="EMP-INACTIVE",
            department=self.department,
            designation=self.manager_designation,
            joining_date=date(2024, 1, 1),
            employment_status=Employee.EmploymentStatus.INACTIVE,
        )

        new_user = self.create_employee_user(
            username="employee_inactive_manager",
            email="employee_inactive_manager@test.com",
        )

        payload = {
            "user": new_user.id,
            "employee_id": "EMP-007",
            "department": self.department.id,
            "designation": self.designation.id,
            "joining_date": "2026-07-01",
            "manager": inactive_manager.id,
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
            "manager",
            response.data,
        )

    def test_resigned_manager_is_rejected(self):
        self.authenticate(self.hr_user)

        resigned_user = self.create_employee_user(
            username="resigned_manager",
            email="resigned_manager@test.com",
        )

        resigned_manager = Employee.objects.create(
            user=resigned_user,
            employee_id="EMP-RESIGNED",
            department=self.department,
            designation=self.manager_designation,
            joining_date=date(2024, 1, 1),
            employment_status=Employee.EmploymentStatus.RESIGNED,
        )

        new_user = self.create_employee_user(
            username="employee_resigned_manager",
            email="employee_resigned_manager@test.com",
        )

        payload = {
            "user": new_user.id,
            "employee_id": "EMP-008",
            "department": self.department.id,
            "designation": self.designation.id,
            "joining_date": "2026-07-01",
            "manager": resigned_manager.id,
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
            "manager",
            response.data,
        )

    def test_terminated_manager_is_rejected(self):
        self.authenticate(self.hr_user)

        terminated_user = self.create_employee_user(
            username="terminated_manager",
            email="terminated_manager@test.com",
        )

        terminated_manager = Employee.objects.create(
            user=terminated_user,
            employee_id="EMP-TERMINATED",
            department=self.department,
            designation=self.manager_designation,
            joining_date=date(2024, 1, 1),
            employment_status=Employee.EmploymentStatus.TERMINATED,
        )

        new_user = self.create_employee_user(
            username="employee_terminated_manager",
            email="employee_terminated_manager@test.com",
        )

        payload = {
            "user": new_user.id,
            "employee_id": "EMP-009",
            "department": self.department.id,
            "designation": self.designation.id,
            "joining_date": "2026-07-01",
            "manager": terminated_manager.id,
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
            "manager",
            response.data,
        )

    def test_resigned_employee_cannot_keep_active_reporting_assignment(self):
        self.authenticate(self.hr_user)

        payload = {
            "user": self.employee_user.id,
            "employee_id": "EMP-001",
            "department": self.department.id,
            "designation": self.designation.id,
            "joining_date": "2026-01-01",
            "employment_status": "RESIGNED",
            "manager": self.manager_employee.id,
        }

        response = self.client.put(
            reverse(
                "employee-detail",
                kwargs={"pk": self.employee.id},
            ),
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "manager",
            response.data,
        )

    def test_terminated_employee_cannot_keep_active_reporting_assignment(self):
        self.authenticate(self.hr_user)

        payload = {
            "user": self.employee_user.id,
            "employee_id": "EMP-001",
            "department": self.department.id,
            "designation": self.designation.id,
            "joining_date": "2026-01-01",
            "employment_status": "TERMINATED",
            "manager": self.manager_employee.id,
        }

        response = self.client.put(
            reverse(
                "employee-detail",
                kwargs={"pk": self.employee.id},
            ),
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "manager",
            response.data,
        )

    def test_employee_response_contains_enterprise_profile_fields(self):
        self.authenticate(self.hr_user)

        response = self.client.get(
            reverse(
                "employee-detail",
                kwargs={"pk": self.employee.id},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["full_name"],
            "Test Employee",
        )

        self.assertEqual(
            response.data["user_name"],
            "Test Employee",
        )

        self.assertEqual(
            response.data["user_username"],
            "employee_worker",
        )

        self.assertEqual(
            response.data["user_email"],
            "employee_worker@test.com",
        )

        self.assertEqual(
            response.data["department_name"],
            "Engineering",
        )

        self.assertEqual(
            response.data["designation_name"],
            "Software Engineer",
        )

        self.assertEqual(
            response.data["employment_type_label"],
            "Full Time",
        )

        self.assertEqual(
            response.data["employment_status_label"],
            "Active",
        )

        self.assertEqual(
            response.data["manager_name"],
            "Employee Manager",
        )

        self.assertEqual(
            response.data["manager_employee_id"],
            "EMP-MGR-001",
        )

    def test_employee_without_manager_returns_null_manager_fields(self):
        self.authenticate(self.hr_user)

        response = self.client.get(
            reverse(
                "employee-detail",
                kwargs={"pk": self.other_employee.id},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIsNone(
            response.data["manager_name"],
        )

        self.assertIsNone(
            response.data["manager_employee_id"],
        )