from datetime import date, timedelta


from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.departments.models import Department, Designation
from apps.employees.models import Employee

from .models import Announcement

class AnnouncementAPITestCase(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.department = Department.objects.create(
            name="Announcement Engineering",
            description="Announcement test department",
        )

        cls.designation = Designation.objects.create(
            name="Announcement Engineer",
            department=cls.department,
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

    def test_blank_title_is_rejected(self):
        self.authenticate(self.hr_user)

        payload = {
            "title": "   ",
            "message": "Valid announcement message.",
            "created_by": self.hr_user.id,
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
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "title",
            response.data,
        )

    def test_blank_message_is_rejected(self):
        self.authenticate(self.hr_user)

        payload = {
            "title": "Valid Announcement",
            "message": "   ",
            "created_by": self.hr_user.id,
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
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "message",
            response.data,
        )

    def test_title_and_message_are_trimmed(self):
        self.authenticate(self.hr_user)

        payload = {
            "title": "  Trimmed Announcement  ",
            "message": "  Trimmed announcement message.  ",
            "created_by": self.hr_user.id,
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

        announcement = Announcement.objects.get(
            pk=response.data["id"],
        )

        self.assertEqual(
            announcement.title,
            "Trimmed Announcement",
        )

        self.assertEqual(
            announcement.message,
            "Trimmed announcement message.",
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

    def test_future_announcement_is_not_published(self):
        self.authenticate(self.employee_user)

        announcement = Announcement.objects.create(
            title="Future Announcement",
            message="Future announcement.",
            created_by=self.hr_user,
            target_audience="ALL",
            publish_date=timezone.now() + timedelta(hours=1),
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

        self.assertFalse(
            response.data["is_published"]
        )

    def test_expired_announcement_is_not_published(self):
        self.authenticate(self.employee_user)

        announcement = Announcement.objects.create(
            title="Expired Announcement",
            message="Expired announcement.",
            created_by=self.hr_user,
            target_audience="ALL",
            publish_date=timezone.now() - timedelta(days=2),
            expiry_date=timezone.now() - timedelta(hours=1),
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

        self.assertFalse(
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
        self.authenticate(self.manager_user)

        Announcement.objects.create(
            title="All Employees",
            message="Company-wide announcement.",
            created_by=self.hr_user,
            target_audience="ALL",
            publish_date=timezone.now(),
        )

        Announcement.objects.create(
            title="Managers Only",
            message="Management announcement.",
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
            results[0]["title"],
            "Managers Only",
        )

        self.assertEqual(
            results[0]["target_audience"],
            "MANAGERS",
        )


    def test_employee_cannot_see_manager_announcement(self):
        self.authenticate(self.employee_user)

        Announcement.objects.create(
            title="Managers Only",
            message="Management announcement.",
            created_by=self.hr_user,
            target_audience="MANAGERS",
            publish_date=timezone.now(),
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

    def test_manager_can_see_manager_announcement(self):
        self.authenticate(self.manager_user)

        Announcement.objects.create(
            title="Managers Only",
            message="Management announcement.",
            created_by=self.hr_user,
            target_audience="MANAGERS",
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

    def test_employee_can_see_all_announcement(self):
        self.authenticate(self.employee_user)

        Announcement.objects.create(
            title="All Employees",
            message="Company-wide announcement.",
            created_by=self.hr_user,
            target_audience="ALL",
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

    def test_manager_can_see_all_announcement(self):
        self.authenticate(self.manager_user)

        Announcement.objects.create(
            title="All Employees",
            message="Company-wide announcement.",
            created_by=self.hr_user,
            target_audience="ALL",
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

    def test_employee_cannot_retrieve_manager_announcement_detail(self):
        self.authenticate(self.employee_user)

        announcement = Announcement.objects.create(
            title="Managers Only",
            message="Management announcement.",
            created_by=self.hr_user,
            target_audience="MANAGERS",
            publish_date=timezone.now(),
        )

        response = self.client.get(
            reverse(
                "announcement-detail",
                kwargs={"pk": announcement.id},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_hr_can_update_announcement(self):
        announcement = Announcement.objects.create(
            title="Original HR Announcement",
            message="Original message.",
            created_by=self.hr_user,
            target_audience=Announcement.TargetAudience.ALL,
            publish_date=timezone.now(),
        )

        self.authenticate(self.hr_user)

        response = self.client.patch(
            reverse(
                "announcement-detail",
                kwargs={"pk": announcement.pk},
            ),
            {
                "title": "Updated HR Announcement",
                "message": "Updated message.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        announcement.refresh_from_db()

        self.assertEqual(
            announcement.title,
            "Updated HR Announcement",
        )

        self.assertEqual(
            announcement.message,
            "Updated message.",
        )


    def test_super_admin_can_update_announcement(self):
        announcement = Announcement.objects.create(
            title="Original Admin Announcement",
            message="Original message.",
            created_by=self.super_admin,
            target_audience=Announcement.TargetAudience.ALL,
            publish_date=timezone.now(),
        )

        self.authenticate(self.super_admin)

        response = self.client.patch(
            reverse(
                "announcement-detail",
                kwargs={"pk": announcement.pk},
            ),
            {
                "message": "Updated by super admin.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        announcement.refresh_from_db()

        self.assertEqual(
            announcement.message,
            "Updated by super admin.",
        )


    def test_manager_cannot_update_announcement(self):
        announcement = Announcement.objects.create(
            title="Protected Announcement",
            message="Original message.",
            created_by=self.hr_user,
            target_audience=Announcement.TargetAudience.ALL,
            publish_date=timezone.now(),
        )

        self.authenticate(self.manager_user)

        response = self.client.patch(
            reverse(
                "announcement-detail",
                kwargs={"pk": announcement.pk},
            ),
            {
                "message": "Unauthorized update.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        announcement.refresh_from_db()

        self.assertEqual(
            announcement.message,
            "Original message.",
        )


    def test_employee_cannot_update_announcement(self):
        announcement = Announcement.objects.create(
            title="Employee Protected Announcement",
            message="Original message.",
            created_by=self.hr_user,
            target_audience=Announcement.TargetAudience.ALL,
            publish_date=timezone.now(),
        )

        self.authenticate(self.employee_user)

        response = self.client.patch(
            reverse(
                "announcement-detail",
                kwargs={"pk": announcement.pk},
            ),
            {
                "message": "Unauthorized employee update.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        announcement.refresh_from_db()

        self.assertEqual(
            announcement.message,
            "Original message.",
        )


    def test_hr_can_delete_announcement(self):
        announcement = Announcement.objects.create(
            title="Delete HR Announcement",
            message="Announcement to delete.",
            created_by=self.hr_user,
            target_audience=Announcement.TargetAudience.ALL,
            publish_date=timezone.now(),
        )

        self.authenticate(self.hr_user)

        response = self.client.delete(
            reverse(
                "announcement-detail",
                kwargs={"pk": announcement.pk},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Announcement.objects.filter(
                pk=announcement.pk,
            ).exists()
        )


    def test_super_admin_can_delete_announcement(self):
        announcement = Announcement.objects.create(
            title="Delete Admin Announcement",
            message="Announcement to delete.",
            created_by=self.super_admin,
            target_audience=Announcement.TargetAudience.ALL,
            publish_date=timezone.now(),
        )

        self.authenticate(self.super_admin)

        response = self.client.delete(
            reverse(
                "announcement-detail",
                kwargs={"pk": announcement.pk},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Announcement.objects.filter(
                pk=announcement.pk,
            ).exists()
        )


    def test_manager_cannot_delete_announcement(self):
        announcement = Announcement.objects.create(
            title="Protected Delete Announcement",
            message="Announcement must remain.",
            created_by=self.hr_user,
            target_audience=Announcement.TargetAudience.ALL,
            publish_date=timezone.now(),
        )

        self.authenticate(self.manager_user)

        response = self.client.delete(
            reverse(
                "announcement-detail",
                kwargs={"pk": announcement.pk},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertTrue(
            Announcement.objects.filter(
                pk=announcement.pk,
            ).exists()
        )


    def test_employee_cannot_delete_announcement(self):
        announcement = Announcement.objects.create(
            title="Employee Protected Delete",
            message="Announcement must remain.",
            created_by=self.hr_user,
            target_audience=Announcement.TargetAudience.ALL,
            publish_date=timezone.now(),
        )

        self.authenticate(self.employee_user)

        response = self.client.delete(
            reverse(
                "announcement-detail",
                kwargs={"pk": announcement.pk},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertTrue(
            Announcement.objects.filter(
                pk=announcement.pk,
            ).exists()
        )


    def test_employee_can_see_department_announcement_for_own_department(self):
        from apps.employees.models import Employee

        Employee.objects.create(
            user=self.employee_user,
            employee_id="ANN-EMP-001",
            department=self.department,
            designation=self.designation,
            joining_date=date(2026, 8, 1),
        )

        Announcement.objects.create(
            title="Engineering Only",
            message="Engineering department announcement.",
            created_by=self.hr_user,
            target_audience=Announcement.TargetAudience.DEPARTMENT,
            department=self.department,
            publish_date=timezone.now(),
        )

        self.authenticate(self.employee_user)

        response = self.client.get(self.url)

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
            "Engineering Only",
        )


    def test_employee_cannot_see_department_announcement_for_other_department(self):
        from apps.employees.models import Employee

        other_department = Department.objects.create(
            name="Announcement Finance",
            description="Finance test department",
        )

        Employee.objects.create(
            user=self.employee_user,
            employee_id="ANN-EMP-002",
            department=self.department,
            designation=self.designation,
            joining_date=date(2026, 8, 1),
        )

        Announcement.objects.create(
            title="Finance Only",
            message="Finance department announcement.",
            created_by=self.hr_user,
            target_audience=Announcement.TargetAudience.DEPARTMENT,
            department=other_department,
            publish_date=timezone.now(),
        )

        self.authenticate(self.employee_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        results = response.data["results"]

        self.assertEqual(
            len(results),
            0,
        )


    def test_hr_can_see_department_announcements(self):
        Announcement.objects.create(
            title="HR Visibility Test",
            message="Department announcement.",
            created_by=self.hr_user,
            target_audience=Announcement.TargetAudience.DEPARTMENT,
            department=self.department,
            publish_date=timezone.now(),
        )

        self.authenticate(self.hr_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            1,
        )


    def test_manager_can_see_all_and_manager_announcements(self):
        Announcement.objects.create(
            title="All Employees",
            message="Visible to everyone.",
            created_by=self.hr_user,
            target_audience=Announcement.TargetAudience.ALL,
            publish_date=timezone.now(),
        )

        Announcement.objects.create(
            title="Managers Only",
            message="Visible to managers.",
            created_by=self.hr_user,
            target_audience=Announcement.TargetAudience.MANAGERS,
            publish_date=timezone.now(),
        )

        Announcement.objects.create(
            title="Department Only",
            message="Not visible to managers through department audience.",
            created_by=self.hr_user,
            target_audience=Announcement.TargetAudience.DEPARTMENT,
            department=self.department,
            publish_date=timezone.now(),
        )

        self.authenticate(self.manager_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        titles = {
            result["title"]
            for result in response.data["results"]
        }

        self.assertEqual(
            titles,
            {
                "All Employees",
                "Managers Only",
            },
        )
