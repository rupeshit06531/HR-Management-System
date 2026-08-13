from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.departments.models import Department

from .models import Announcement


class AnnouncementAPITestCase(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.department = Department.objects.create(
            name="Announcement Engineering",
            description="Announcement test department",
        )

        cls.super_admin = User.objects.create_user(
            username="announcement_admin",
            email="announcement_admin@test.com",
            password="TestPass@123",
            first_name="Announcement",
            last_name="Admin",
            role=User.Role.SUPER_ADMIN,
        )

        cls.hr_user = User.objects.create_user(
            username="announcement_hr",
            email="announcement_hr@test.com",
            password="TestPass@123",
            first_name="Announcement",
            last_name="HR",
            role=User.Role.HR,
        )

        cls.manager_user = User.objects.create_user(
            username="announcement_manager",
            email="announcement_manager@test.com",
            password="TestPass@123",
            first_name="Announcement",
            last_name="Manager",
            role=User.Role.MANAGER,
        )

        cls.employee_user = User.objects.create_user(
            username="announcement_employee",
            email="announcement_employee@test.com",
            password="TestPass@123",
            first_name="Announcement",
            last_name="Employee",
            role=User.Role.EMPLOYEE,
        )

    def setUp(self):
        self.url = reverse("announcement-list")

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_unauthenticated_access_is_denied(self):
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_employee_can_list_announcements(self):
        self.authenticate(self.employee_user)

        Announcement.objects.create(
            title="Company Holiday",
            message="Office will remain closed.",
            created_by=self.hr_user,
            publish_date=timezone.now(),
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

    def test_manager_can_list_announcements(self):
        self.authenticate(self.manager_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_hr_can_create_announcement(self):
        self.authenticate(self.hr_user)

        publish_date = timezone.now()

        payload = {
            "title": "HR Announcement",
            "message": "Important HR announcement.",
            "created_by": self.hr_user.id,
            "target_audience": "ALL",
            "publish_date": publish_date.isoformat(),
            "is_active": True,
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
            Announcement.objects.filter(
                title="HR Announcement",
            ).exists()
        )

    def test_super_admin_can_create_announcement(self):
        self.authenticate(self.super_admin)

        payload = {
            "title": "Admin Announcement",
            "message": "System announcement.",
            "created_by": self.super_admin.id,
            "target_audience": "ALL",
            "publish_date": timezone.now().isoformat(),
            "is_active": True,
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

    def test_manager_cannot_create_announcement(self):
        self.authenticate(self.manager_user)

        payload = {
            "title": "Manager Announcement",
            "message": "Manager should not create announcements.",
            "created_by": self.manager_user.id,
            "target_audience": "ALL",
            "publish_date": timezone.now().isoformat(),
            "is_active": True,
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

    def test_employee_cannot_create_announcement(self):
        self.authenticate(self.employee_user)

        payload = {
            "title": "Employee Announcement",
            "message": "Employee should not create announcements.",
            "created_by": self.employee_user.id,
            "target_audience": "ALL",
            "publish_date": timezone.now().isoformat(),
            "is_active": True,
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

    def test_department_audience_requires_department(self):
        self.authenticate(self.hr_user)

        payload = {
            "title": "Department Announcement",
            "message": "Department specific announcement.",
            "created_by": self.hr_user.id,
            "target_audience": "DEPARTMENT",
            "publish_date": timezone.now().isoformat(),
            "is_active": True,
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
            "department",
            response.data,
        )

    def test_department_audience_accepts_department(self):
        self.authenticate(self.hr_user)

        payload = {
            "title": "Engineering Announcement",
            "message": "Announcement for Engineering.",
            "created_by": self.hr_user.id,
            "target_audience": "DEPARTMENT",
            "department": self.department.id,
            "publish_date": timezone.now().isoformat(),
            "is_active": True,
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

    def test_expiry_date_must_be_after_publish_date(self):
        self.authenticate(self.hr_user)

        publish_date = timezone.now()
        expiry_date = publish_date - timedelta(days=1)

        payload = {
            "title": "Invalid Announcement",
            "message": "Invalid announcement dates.",
            "created_by": self.hr_user.id,
            "target_audience": "ALL",
            "publish_date": publish_date.isoformat(),
            "expiry_date": expiry_date.isoformat(),
            "is_active": True,
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
            "expiry_date",
            response.data,
        )

    def test_is_published_is_true_for_active_current_announcement(self):
        self.authenticate(self.employee_user)

        announcement = Announcement.objects.create(
            title="Published Announcement",
            message="Currently published.",
            created_by=self.hr_user,
            target_audience="ALL",
            publish_date=timezone.now() - timedelta(hours=1),
            expiry_date=timezone.now() + timedelta(hours=1),
            is_active=True,
        )

        response = self.client.get(
            reverse(
                "announcement-detail",
                kwargs={"pk": announcement.id},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            response.data["is_published"]
        )

    def test_inactive_announcement_is_not_published(self):
        self.authenticate(self.employee_user)

        announcement = Announcement.objects.create(
            title="Inactive Announcement",
            message="Inactive announcement.",
            created_by=self.hr_user,
            target_audience="ALL",
            publish_date=timezone.now() - timedelta(hours=1),
            is_active=False,
        )

        response = self.client.get(
            reverse(
                "announcement-detail",
                kwargs={"pk": announcement.id},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertFalse(
            response.data["is_published"]
        )

    def test_search_by_title(self):
        self.authenticate(self.employee_user)

        Announcement.objects.create(
            title="Annual Meeting",
            message="Company annual meeting.",
            created_by=self.hr_user,
            target_audience="ALL",
            publish_date=timezone.now(),
        )

        response = self.client.get(
            self.url,
            {"search": "Annual Meeting"},
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
            results[0]["title"],
            "Annual Meeting",
        )

    def test_filter_by_target_audience(self):
        self.authenticate(self.employee_user)

        Announcement.objects.create(
            title="All Employees",
            message="For everyone.",
            created_by=self.hr_user,
            target_audience="ALL",
            publish_date=timezone.now(),
        )

        Announcement.objects.create(
            title="Managers Only",
            message="For managers.",
            created_by=self.hr_user,
            target_audience="MANAGERS",
            publish_date=timezone.now(),
        )

        response = self.client.get(
            self.url,
            {"target_audience": "MANAGERS"},
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
            results[0]["target_audience"],
            "MANAGERS",
        )