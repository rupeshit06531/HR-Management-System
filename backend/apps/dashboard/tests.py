from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User


class DashboardAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="dashboard_admin",
            password="DashboardPass123!",
            role=User.Role.SUPER_ADMIN,
        )

        self.client.force_authenticate(
            user=self.user,
        )

    def test_dashboard_requires_authentication(self):
        self.client.force_authenticate(
            user=None,
        )

        response = self.client.get(
            reverse("dashboard"),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_authenticated_user_can_access_dashboard(self):
        response = self.client.get(
            reverse("dashboard"),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn(
            "user",
            response.data,
        )

        self.assertIn(
            "employees",
            response.data,
        )

        self.assertIn(
            "users",
            response.data,
        )

        self.assertEqual(
            response.data["user"]["username"],
            "dashboard_admin",
        )

    def test_dashboard_employee_metrics_start_at_zero(self):
        response = self.client.get(
            reverse("dashboard"),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["employees"]["total"],
            0,
        )

        self.assertEqual(
            response.data["employees"]["active"],
            0,
        )