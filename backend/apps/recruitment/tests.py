from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.departments.models import Department

from .models import Candidate


class CandidateAPITestCase(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.hr_user = User.objects.create_user(
            username="recruitment_hr",
            email="recruitment_hr@test.com",
            password="TestPass@123",
            first_name="Recruitment",
            last_name="HR",
            role=User.Role.HR,
        )

        cls.super_admin_user = User.objects.create_user(
            username="recruitment_admin",
            email="recruitment_admin@test.com",
            password="TestPass@123",
            first_name="Recruitment",
            last_name="Admin",
            role=User.Role.SUPER_ADMIN,
        )

        cls.manager_user = User.objects.create_user(
            username="recruitment_manager",
            email="recruitment_manager@test.com",
            password="TestPass@123",
            first_name="Recruitment",
            last_name="Manager",
            role=User.Role.MANAGER,
        )

        cls.department = Department.objects.create(
            name="Recruitment IT",
            description="Recruitment test department",
        )

        cls.candidate = Candidate.objects.create(
            first_name="Amit",
            last_name="Kumar",
            email="amit@test.com",
            phone="9876543210",
            job_title="Software Engineer",
            department=cls.department,
            status=Candidate.ApplicationStatus.APPLIED,
        )

    def setUp(self):
        self.url = reverse("recruitment-list")

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_hr_can_list_candidates(self):
        self.authenticate(self.hr_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_hr_can_create_candidate(self):
        self.authenticate(self.hr_user)

        payload = {
            "first_name": "Ravi",
            "last_name": "Kumar",
            "email": "ravi@test.com",
            "phone": "9876543211",
            "job_title": "Backend Developer",
            "department": self.department.id,
            "status": "APPLIED",
            "interview_notes": "",
            "hr_notes": "",
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
            Candidate.objects.filter(
                email="ravi@test.com",
            ).exists()
        )

    def test_super_admin_can_access_recruitment(self):
        self.authenticate(self.super_admin_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_manager_cannot_access_recruitment(self):
        self.authenticate(self.manager_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_unauthenticated_access_is_denied(self):
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_candidate_detail(self):
        self.authenticate(self.hr_user)

        response = self.client.get(
            reverse(
                "recruitment-detail",
                kwargs={"pk": self.candidate.pk},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["email"],
            "amit@test.com",
        )

    def test_candidate_update(self):
        self.authenticate(self.hr_user)

        response = self.client.patch(
            reverse(
                "recruitment-detail",
                kwargs={"pk": self.candidate.pk},
            ),
            {
                "status": "SHORTLISTED",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.candidate.refresh_from_db()

        self.assertEqual(
            self.candidate.status,
            Candidate.ApplicationStatus.SHORTLISTED,
        )

    def test_candidate_delete(self):
        self.authenticate(self.hr_user)

        response = self.client.delete(
            reverse(
                "recruitment-detail",
                kwargs={"pk": self.candidate.pk},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Candidate.objects.filter(
                pk=self.candidate.pk,
            ).exists()
        )

    def test_candidate_search_by_name(self):
        self.authenticate(self.hr_user)

        response = self.client.get(
            self.url,
            {"search": "Amit"},
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
            results[0]["first_name"],
            "Amit",
        )

    def test_candidate_search_by_job_title(self):
        self.authenticate(self.hr_user)

        response = self.client.get(
            self.url,
            {"search": "Software Engineer"},
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
            results[0]["job_title"],
            "Software Engineer",
        )

    def test_candidate_filter_by_status(self):
        self.authenticate(self.hr_user)

        Candidate.objects.create(
            first_name="Neha",
            last_name="Sharma",
            email="neha@test.com",
            phone="9876543212",
            job_title="HR Executive",
            department=self.department,
            status=Candidate.ApplicationStatus.SELECTED,
            offer_date="2026-08-25",
            joining_date="2026-09-01",
        )

        response = self.client.get(
            self.url,
            {"status": "SELECTED"},
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
            "SELECTED",
        )

    def test_candidate_filter_by_department(self):
        self.authenticate(self.hr_user)

        response = self.client.get(
            self.url,
            {"department": self.department.id},
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
            results[0]["department"],
            self.department.id,
        )

    def test_candidate_duplicate_email_allowed(self):
        self.authenticate(self.hr_user)

        payload = {
            "first_name": "Another",
            "last_name": "Candidate",
            "email": "amit@test.com",
            "phone": "9876543213",
            "job_title": "QA Engineer",
            "department": self.department.id,
            "status": "APPLIED",
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

    def test_blank_first_name_is_rejected(self):
        self.authenticate(self.hr_user)

        payload = {
            "first_name": "   ",
            "last_name": "Test",
            "email": "blankfirst@test.com",
            "phone": "9876543214",
            "job_title": "Developer",
            "department": self.department.id,
            "status": "APPLIED",
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
            "first_name",
            response.data,
        )

    def test_blank_last_name_is_allowed(self):
        self.authenticate(self.hr_user)

        payload = {
            "first_name": "Single",
            "last_name": "",
            "email": "single@test.com",
            "phone": "9876543215",
            "job_title": "Developer",
            "department": self.department.id,
            "status": "APPLIED",
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
            response.data["full_name"],
            "Single",
        )

    def test_negative_experience_years_is_rejected(self):
        self.authenticate(self.hr_user)

        payload = {
            "first_name": "Negative",
            "last_name": "Experience",
            "email": "negativeexperience@test.com",
            "phone": "9876543216",
            "job_title": "Developer",
            "department": self.department.id,
            "experience_years": "-1.00",
            "status": "APPLIED",
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
            "experience_years",
            response.data,
        )

    def test_negative_expected_salary_is_rejected(self):
        self.authenticate(self.hr_user)

        payload = {
            "first_name": "Negative",
            "last_name": "Salary",
            "email": "negativesalary@test.com",
            "phone": "9876543217",
            "job_title": "Developer",
            "department": self.department.id,
            "expected_salary": "-50000.00",
            "status": "APPLIED",
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
            "expected_salary",
            response.data,
        )

    def test_selected_status_requires_offer_date(self):
        self.authenticate(self.hr_user)

        payload = {
            "first_name": "Selected",
            "last_name": "Candidate",
            "email": "selectedoffer@test.com",
            "phone": "9876543218",
            "job_title": "Developer",
            "department": self.department.id,
            "status": "SELECTED",
            "joining_date": "2026-09-01",
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
            "offer_date",
            response.data,
        )

    def test_selected_status_requires_joining_date(self):
        self.authenticate(self.hr_user)

        payload = {
            "first_name": "Selected",
            "last_name": "Candidate",
            "email": "selectedjoining@test.com",
            "phone": "9876543219",
            "job_title": "Developer",
            "department": self.department.id,
            "status": "SELECTED",
            "offer_date": "2026-08-25",
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
            "joining_date",
            response.data,
        )

    def test_joining_date_cannot_be_before_offer_date(self):
        self.authenticate(self.hr_user)

        payload = {
            "first_name": "Invalid",
            "last_name": "Dates",
            "email": "invaliddates@test.com",
            "phone": "9876543220",
            "job_title": "Developer",
            "department": self.department.id,
            "status": "SELECTED",
            "offer_date": "2026-08-25",
            "joining_date": "2026-08-20",
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
            "joining_date",
            response.data,
        )

    def test_interview_date_must_be_empty_for_non_interview_status(self):
        self.authenticate(self.hr_user)

        payload = {
            "first_name": "Invalid",
            "last_name": "Interview",
            "email": "invalidinterview@test.com",
            "phone": "9876543221",
            "job_title": "Developer",
            "department": self.department.id,
            "status": "APPLIED",
            "interview_date": "2026-08-25T10:00:00Z",
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
            "interview_date",
            response.data,
        )

    def test_selected_candidate_with_valid_dates_is_created(self):
        self.authenticate(self.hr_user)

        payload = {
            "first_name": "Selected",
            "last_name": "Valid",
            "email": "selectedvalid@test.com",
            "phone": "9876543222",
            "job_title": "Senior Developer",
            "department": self.department.id,
            "status": "SELECTED",
            "offer_date": "2026-08-25",
            "joining_date": "2026-09-01",
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
            response.data["status"],
            "SELECTED",
        )

        self.assertEqual(
            response.data["offer_date"],
            "2026-08-25",
        )

        self.assertEqual(
            response.data["joining_date"],
            "2026-09-01",
        )