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