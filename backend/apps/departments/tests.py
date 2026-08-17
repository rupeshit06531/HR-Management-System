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
            status.HTTP_403_FORBIDDEN,
        )

        self.assertFalse(
            Department.objects.filter(
                name="Finance",
            ).exists()
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
            "name": "Engineering Manager",
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
                name="Engineering Manager",
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

    def test_employee_cannot_create_department(self):
        self.client.force_authenticate(
            user=self.employee_user,
        )

        payload = {
            "name": "Unauthorized Department",
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

    def test_employee_cannot_create_designation(self):
        self.client.force_authenticate(
            user=self.employee_user,
        )

        payload = {
            "name": "Unauthorized Designation",
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

    def test_manager_cannot_update_department(self):
        self.client.force_authenticate(
            user=self.manager_user,
        )

        response = self.client.patch(
            f"/api/departments/{self.department.id}/",
            {
                "description": "Unauthorized update",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_manager_cannot_delete_department(self):
        self.client.force_authenticate(
            user=self.manager_user,
        )

        response = self.client.delete(
            f"/api/departments/{self.department.id}/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertTrue(
            Department.objects.filter(
                id=self.department.id,
            ).exists()
        )

    def test_manager_cannot_update_designation(self):
        self.client.force_authenticate(
            user=self.manager_user,
        )

        response = self.client.patch(
            f"/api/designations/{self.designation.id}/",
            {
                "name": "Unauthorized Update",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_manager_cannot_delete_designation(self):
        self.client.force_authenticate(
            user=self.manager_user,
        )

        response = self.client.delete(
            f"/api/designations/{self.designation.id}/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertTrue(
            Designation.objects.filter(
                id=self.designation.id,
            ).exists()
        )

    def test_employee_cannot_retrieve_department_detail(self):
        self.client.force_authenticate(
            user=self.employee_user,
        )

        response = self.client.get(
            f"/api/departments/{self.department.id}/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_employee_cannot_retrieve_designation_detail(self):
        self.client.force_authenticate(
            user=self.employee_user,
        )

        response = self.client.get(
            f"/api/designations/{self.designation.id}/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )