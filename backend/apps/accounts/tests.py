from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class AccountsAPITestCase(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.super_admin = User.objects.create_user(
            username="accounts_superadmin",
            email="accounts_superadmin@test.com",
            password="TestPass@123",
            first_name="Super",
            last_name="Admin",
            role=User.Role.SUPER_ADMIN,
        )

        cls.hr_user = User.objects.create_user(
            username="accounts_hr",
            email="accounts_hr@test.com",
            password="TestPass@123",
            first_name="HR",
            last_name="User",
            role=User.Role.HR,
        )

        cls.manager_user = User.objects.create_user(
            username="accounts_manager",
            email="accounts_manager@test.com",
            password="TestPass@123",
            first_name="Manager",
            last_name="User",
            role=User.Role.MANAGER,
        )

        cls.employee_user = User.objects.create_user(
            username="accounts_employee",
            email="accounts_employee@test.com",
            password="TestPass@123",
            first_name="Employee",
            last_name="User",
            role=User.Role.EMPLOYEE,
        )

        cls.inactive_user = User.objects.create_user(
            username="accounts_inactive",
            email="accounts_inactive@test.com",
            password="TestPass@123",
            role=User.Role.EMPLOYEE,
            is_active=False,
        )

        cls.user_url = reverse("user-list")
        cls.login_url = reverse("login")

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_login_success(self):
        response = self.client.post(
            self.login_url,
            {
                "username": "accounts_hr",
                "password": "TestPass@123",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("user", response.data)

        self.assertEqual(
            response.data["user"]["username"],
            "accounts_hr",
        )

    def test_login_requires_username_and_password(self):
        response = self.client.post(
            self.login_url,
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_login_invalid_credentials(self):
        response = self.client.post(
            self.login_url,
            {
                "username": "accounts_hr",
                "password": "WrongPassword@123",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_login_inactive_user(self):
        response = self.client.post(
            self.login_url,
            {
                "username": "accounts_inactive",
                "password": "TestPass@123",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_employee_cannot_access_user_list(self):
        self.authenticate(self.employee_user)

        response = self.client.get(self.user_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_manager_cannot_access_user_list(self):
        self.authenticate(self.manager_user)

        response = self.client.get(self.user_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_hr_can_access_user_list(self):
        self.authenticate(self.hr_user)

        response = self.client.get(self.user_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_super_admin_can_access_user_list(self):
        self.authenticate(self.super_admin)

        response = self.client.get(self.user_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_unauthenticated_user_cannot_access_user_list(self):
        response = self.client.get(self.user_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_duplicate_username_is_rejected(self):
        self.authenticate(self.hr_user)

        response = self.client.post(
            self.user_url,
            {
                "username": "accounts_hr",
                "email": "new_user@test.com",
                "password": "TestPass@123",
                "role": User.Role.EMPLOYEE,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "username",
            response.data,
        )

    def test_duplicate_email_is_rejected(self):
        self.authenticate(self.hr_user)

        response = self.client.post(
            self.user_url,
            {
                "username": "new_unique_username",
                "email": "accounts_hr@test.com",
                "password": "TestPass@123",
                "role": User.Role.EMPLOYEE,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "email",
            response.data,
        )

    def test_hr_cannot_assign_super_admin_role(self):
        self.authenticate(self.hr_user)

        response = self.client.post(
            self.user_url,
            {
                "username": "new_super_admin",
                "email": "new_super_admin@test.com",
                "password": "TestPass@123",
                "role": User.Role.SUPER_ADMIN,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "role",
            response.data,
        )

    def test_super_admin_can_assign_super_admin_role(self):
        self.authenticate(self.super_admin)

        response = self.client.post(
            self.user_url,
            {
                "username": "new_super_admin",
                "email": "new_super_admin@test.com",
                "password": "TestPass@123",
                "role": User.Role.SUPER_ADMIN,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            response.data["role"],
            User.Role.SUPER_ADMIN,
        )

    def test_admin_cannot_deactivate_own_account(self):
        self.authenticate(self.hr_user)

        response = self.client.patch(
            reverse(
                "user-detail",
                kwargs={"pk": self.hr_user.pk},
            ),
            {
                "is_active": False,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "is_active",
            response.data,
        )