
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User

from .models import Department, Designation


class DepartmentAPITestCase(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.admin_user = User.objects.create_user(
            username="department_admin",
            email="department_admin@test.com",
            password="TestPass@123",
            first_name="Department",
            last_name="Admin",
            role=User.Role.SUPER_ADMIN,
        )

        cls.hr_user = User.objects.create_user(
            username="department_hr",
            email="department_hr@test.com",
            password="TestPass@123",
            first_name="Department",
            last_name="HR",
            role=User.Role.HR,
        )

        cls.manager_user = User.objects.create_user(
            username="department_manager",
            email="department_manager@test.com",
            password="TestPass@123",
            first_name="Department",
            last_name="Manager",
            role=User.Role.MANAGER,
        )

        cls.employee_user = User.objects.create_user(
            username="department_employee",
            email="department_employee@test.com",
            password="TestPass@123",
            first_name="Department",
            last_name="Employee",
            role=User.Role.EMPLOYEE,
        )

        cls.department = Department.objects.create(
            name="Engineering",
            description="Engineering department",
        )

        cls.designation = Designation.objects.create(
            name="Software Engineer",
            department=cls.department,
        )

    def setUp(self):
        self.client.force_authenticate(
            user=self.admin_user,
        )

    def test_list_departments(self):
        response = self.client.get(
            "/api/departments/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_create_department(self):
        payload = {
            "name": "Human Resources",
            "description": "HR department",
            "is_active": True,
        }

        response = self.client.post(
            "/api/departments/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            Department.objects.filter(
                name="Human Resources",
            ).exists()
        )

    def test_department_detail(self):
        response = self.client.get(
            f"/api/departments/{self.department.id}/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["name"],
            "Engineering",
        )

    def test_create_designation(self):
        payload = {
            "name": "Senior Software Engineer",
            "department": self.department.id,
            "is_active": True,
        }

        response = self.client.post(
            "/api/designations/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            Designation.objects.filter(
                name="Senior Software Engineer",
                department=self.department,
            ).exists()
        )

    def test_list_designations(self):
        response = self.client.get(
            "/api/designations/",
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
            results[0]["name"],
            "Software Engineer",
        )

        self.assertEqual(
            results[0]["department_name"],
            "Engineering",
        )

    def test_designation_detail(self):
        response = self.client.get(
            f"/api/designations/{self.designation.id}/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["department"],
            self.department.id,
        )

        self.assertEqual(
            response.data["department_name"],
            "Engineering",
        )

    def test_duplicate_department_name_is_rejected(self):
        payload = {
            "name": "Engineering",
            "description": "Duplicate department",
            "is_active": True,
        }

        response = self.client.post(
            "/api/departments/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "name",
            response.data,
        )

    def test_duplicate_department_name_is_rejected_case_insensitive(self):
        payload = {
            "name": " engineering ",
            "description": "Duplicate department",
            "is_active": True,
        }

        response = self.client.post(
            "/api/departments/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "name",
            response.data,
        )

    def test_blank_department_name_is_rejected(self):
        payload = {
            "name": "   ",
            "description": "Invalid department",
            "is_active": True,
        }

        response = self.client.post(
            "/api/departments/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "name",
            response.data,
        )

    def test_department_name_is_trimmed(self):
        payload = {
            "name": "  Finance  ",
            "description": "Finance department",
            "is_active": True,
        }

        response = self.client.post(
            "/api/departments/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            Department.objects.filter(
                name="Finance",
            ).exists()
        )

    def test_duplicate_designation_name_is_rejected(self):
        payload = {
            "name": "Software Engineer",
            "department": self.department.id,
            "is_active": True,
        }

        response = self.client.post(
            "/api/designations/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "name",
            response.data,
        )

    def test_duplicate_designation_name_is_rejected_case_insensitive(self):
        payload = {
            "name": " software engineer ",
            "department": self.department.id,
            "is_active": True,
        }

        response = self.client.post(
            "/api/designations/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "name",
            response.data,
        )

    def test_blank_designation_name_is_rejected(self):
        payload = {
            "name": "   ",
            "department": self.department.id,
            "is_active": True,
        }

        response = self.client.post(
            "/api/designations/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "name",
            response.data,
        )

    def test_designation_name_is_trimmed(self):
        payload = {
            "name": "  Senior Manager  ",
            "department": self.department.id,
            "is_active": True,
        }

        response = self.client.post(
            "/api/designations/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            Designation.objects.filter(
                name="Senior Manager",
                department=self.department,
            ).exists()
        )

    def test_hr_can_list_departments(self):
        self.client.force_authenticate(
            user=self.hr_user,
        )

        response = self.client.get(
            "/api/departments/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_hr_can_create_department(self):
        self.client.force_authenticate(
            user=self.hr_user,
        )

        payload = {
            "name": "Finance",
            "description": "Finance department",
            "is_active": True,
        }

        response = self.client.post(
            "/api/departments/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_manager_can_list_departments(self):
        self.client.force_authenticate(
            user=self.manager_user,
        )

        response = self.client.get(
            "/api/departments/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_manager_cannot_create_department(self):
        self.client.force_authenticate(
            user=self.manager_user,
        )

        payload = {
            "name": "Manager Created Department",
            "description": "Should not be created",
            "is_active": True,
        }

        response = self.client.post(
            "/api/departments/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertFalse(
            Department.objects.filter(
                name="Manager Created Department",
            ).exists()
        )

    def test_employee_cannot_list_departments(self):
        self.client.force_authenticate(
            user=self.employee_user,
        )

        response = self.client.get(
            "/api/departments/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_manager_can_list_designations(self):
        self.client.force_authenticate(
            user=self.manager_user,
        )

        response = self.client.get(
            "/api/designations/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_manager_cannot_create_designation(self):
        self.client.force_authenticate(
            user=self.manager_user,
        )

        payload = {
            "name": "Manager Created Designation",
            "department": self.department.id,
            "is_active": True,
        }

        response = self.client.post(
            "/api/designations/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertFalse(
            Designation.objects.filter(
                name="Manager Created Designation",
            ).exists()
        )

    def test_employee_cannot_list_designations(self):
        self.client.force_authenticate(
            user=self.employee_user,
        )

        response = self.client.get(
            "/api/designations/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_unauthenticated_user_cannot_list_departments(self):
        self.client.force_authenticate(
            user=None,
        )

        response = self.client.get(
            "/api/departments/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_unauthenticated_user_cannot_list_designations(self):
        self.client.force_authenticate(
            user=None,
        )

        response = self.client.get(
            "/api/designations/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_department_filter_by_active_status(self):
        Department.objects.create(
            name="Inactive Department",
            description="Inactive department",
            is_active=False,
        )

        response = self.client.get(
            "/api/departments/",
            {"is_active": "false"},
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
            results[0]["name"],
            "Inactive Department",
        )

    def test_department_search_by_name(self):
        Department.objects.create(
            name="Human Resources",
            description="HR department",
        )

        response = self.client.get(
            "/api/departments/",
            {"search": "Human"},
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
            results[0]["name"],
            "Human Resources",
        )

    def test_department_search_by_description(self):
        Department.objects.create(
            name="Finance",
            description="Corporate finance department",
        )

        response = self.client.get(
            "/api/departments/",
            {"search": "Corporate"},
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
            results[0]["name"],
            "Finance",
        )

    def test_department_ordering_by_name(self):
        Department.objects.create(
            name="Accounting",
            description="Accounting department",
        )

        Department.objects.create(
            name="Zoology",
            description="Zoology department",
        )

        response = self.client.get(
            "/api/departments/",
            {"ordering": "name"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        results = response.data["results"]

        names = [
            item["name"]
            for item in results
        ]

        self.assertEqual(
            names,
            [
                "Accounting",
                "Engineering",
                "Zoology",
            ],
        )

    def test_designation_filter_by_department(self):
        other_department = Department.objects.create(
            name="Finance",
            description="Finance department",
        )

        Designation.objects.create(
            name="Finance Manager",
            department=other_department,
        )

        response = self.client.get(
            "/api/designations/",
            {"department": other_department.id},
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
            results[0]["name"],
            "Finance Manager",
        )

    def test_designation_search_by_name(self):
        Designation.objects.create(
            name="Senior Engineer",
            department=self.department,
        )

        response = self.client.get(
            "/api/designations/",
            {"search": "Senior"},
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
            results[0]["name"],
            "Senior Engineer",
        )