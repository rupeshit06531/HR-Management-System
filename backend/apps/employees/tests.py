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

    def test_unauthenticated_access_is_denied(self):
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

        new_user = User.objects.create_user(
            username="employee_new",
            email="employee_new@test.com",
            password="TestPass@123",
            first_name="New",
            last_name="Employee",
            role=User.Role.EMPLOYEE,
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

        new_user = User.objects.create_user(
            username="manager_created",
            email="manager_created@test.com",
            password="TestPass@123",
            first_name="Manager",
            last_name="Created",
            role=User.Role.EMPLOYEE,
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

        new_user = User.objects.create_user(
            username="employee_invalid_department",
            email="employee_invalid_department@test.com",
            password="TestPass@123",
            first_name="Invalid",
            last_name="Department",
            role=User.Role.EMPLOYEE,
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