from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.departments.models import Department

from .models import Candidate
from django.db import IntegrityError


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

        cls.employee_user = User.objects.create_user(
            username="recruitment_employee",
            email="recruitment_employee@test.com",
            password="TestPass@123",
            first_name="Recruitment",
            last_name="Employee",
            role=User.Role.EMPLOYEE,
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

    def test_super_admin_can_create_update_and_delete_candidate(self):
        self.authenticate(self.super_admin_user)

        create_response = self.client.post(
            self.url,
            {
                "first_name": "Super",
                "last_name": "Admin",
                "email": "superadmin_candidate@test.com",
                "phone": "9876543255",
                "job_title": "Engineering Manager",
                "department": self.department.id,
                "status": "APPLIED",
            },
            format="json",
        )

        self.assertEqual(
            create_response.status_code,
            status.HTTP_201_CREATED,
        )

        candidate_id = create_response.data["id"]

        update_response = self.client.patch(
            reverse(
                "recruitment-detail",
                kwargs={"pk": candidate_id},
            ),
            {
                "status": "SHORTLISTED",
            },
            format="json",
        )

        self.assertEqual(
            update_response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            update_response.data["status"],
            "SHORTLISTED",
        )

        delete_response = self.client.delete(
            reverse(
                "recruitment-detail",
                kwargs={"pk": candidate_id},
            )
        )

        self.assertEqual(
            delete_response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Candidate.objects.filter(
                pk=candidate_id,
            ).exists()
        )

    def test_manager_cannot_access_recruitment(self):
        self.authenticate(self.manager_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_employee_cannot_access_recruitment(self):
        self.authenticate(self.employee_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_manager_cannot_create_candidate(self):
        self.authenticate(self.manager_user)

        response = self.client.post(
            self.url,
            {
                "first_name": "Manager",
                "last_name": "Candidate",
                "email": "manager_candidate@test.com",
                "phone": "9876543233",
                "job_title": "Software Engineer",
                "department": self.department.id,
                "status": "APPLIED",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertFalse(
            Candidate.objects.filter(
                email="manager_candidate@test.com",
            ).exists()
        )

    def test_manager_cannot_update_candidate(self):
        self.authenticate(self.manager_user)

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
            status.HTTP_403_FORBIDDEN,
        )

        self.candidate.refresh_from_db()

        self.assertEqual(
            self.candidate.status,
            Candidate.ApplicationStatus.APPLIED,
        )

    def test_manager_cannot_delete_candidate(self):
        self.authenticate(self.manager_user)

        response = self.client.delete(
            reverse(
                "recruitment-detail",
                kwargs={"pk": self.candidate.pk},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertTrue(
            Candidate.objects.filter(
                pk=self.candidate.pk,
            ).exists()
        )

    def test_unauthenticated_access_is_denied(self):
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_unauthenticated_user_cannot_create_candidate(self):
        response = self.client.post(
            self.url,
            {
                "first_name": "Unauthenticated",
                "last_name": "Candidate",
                "email": "unauthenticated@test.com",
                "phone": "9876543244",
                "job_title": "Software Engineer",
                "department": self.department.id,
                "status": "APPLIED",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

        self.assertFalse(
            Candidate.objects.filter(
                email="unauthenticated@test.com",
            ).exists()
        )

    def test_unauthenticated_user_cannot_update_candidate(self):
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
            status.HTTP_401_UNAUTHORIZED,
        )

        self.candidate.refresh_from_db()

        self.assertEqual(
            self.candidate.status,
            Candidate.ApplicationStatus.APPLIED,
        )

    def test_unauthenticated_user_cannot_delete_candidate(self):
        response = self.client.delete(
            reverse(
                "recruitment-detail",
                kwargs={"pk": self.candidate.pk},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

        self.assertTrue(
            Candidate.objects.filter(
                pk=self.candidate.pk,
            ).exists()
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

    def test_hr_can_update_candidate_details(self):
        self.authenticate(self.hr_user)

        response = self.client.patch(
            reverse(
                "recruitment-detail",
                kwargs={"pk": self.candidate.pk},
            ),
            {
                "job_title": "Senior Software Engineer",
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
            self.candidate.job_title,
            "Senior Software Engineer",
        )

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

    def test_interview_candidate_with_valid_date_is_created(self):
        self.authenticate(self.hr_user)

        payload = {
            "first_name": "Interview",
            "last_name": "Candidate",
            "email": "interview_candidate@test.com",
            "phone": "9876543266",
            "job_title": "Backend Developer",
            "department": self.department.id,
            "status": "INTERVIEW",
            "interview_date": "2026-08-28T10:30:00Z",
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
            "INTERVIEW",
        )

        self.assertIsNotNone(
            response.data["interview_date"],
        )

    def test_candidate_can_be_updated_to_interview_with_date(self):
        self.authenticate(self.hr_user)

        response = self.client.patch(
            reverse(
                "recruitment-detail",
                kwargs={"pk": self.candidate.pk},
            ),
            {
                "status": "INTERVIEW",
                "interview_date": "2026-08-29T11:00:00Z",
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
            Candidate.ApplicationStatus.INTERVIEW,
        )

        self.assertIsNotNone(
            self.candidate.interview_date,
        )

    def test_candidate_update_to_selected_requires_offer_date(self):
        self.authenticate(self.hr_user)

        response = self.client.patch(
            reverse(
                "recruitment-detail",
                kwargs={"pk": self.candidate.pk},
            ),
            {
                "status": "SELECTED",
                "joining_date": "2026-09-01",
            },
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

        self.candidate.refresh_from_db()

        self.assertEqual(
            self.candidate.status,
            Candidate.ApplicationStatus.APPLIED,
        )

    def test_candidate_update_to_selected_requires_joining_date(self):
        self.authenticate(self.hr_user)

        response = self.client.patch(
            reverse(
                "recruitment-detail",
                kwargs={"pk": self.candidate.pk},
            ),
            {
                "status": "SELECTED",
                "offer_date": "2026-08-25",
            },
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

        self.candidate.refresh_from_db()

        self.assertEqual(
            self.candidate.status,
            Candidate.ApplicationStatus.APPLIED,
        )

    def test_selected_candidate_cannot_change_to_applied_with_dates(self):
        selected_candidate = Candidate.objects.create(
            first_name="Selected",
            last_name="Existing",
            email="selected_existing@test.com",
            phone="9876543277",
            job_title="Senior Developer",
            department=self.department,
            status=Candidate.ApplicationStatus.SELECTED,
            offer_date=date(2026, 8, 25),
            joining_date=date(2026, 9, 1),
        )

        self.authenticate(self.hr_user)

        response = self.client.patch(
            reverse(
                "recruitment-detail",
                kwargs={"pk": selected_candidate.pk},
            ),
            {
                "status": "APPLIED",
            },
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

        selected_candidate.refresh_from_db()

        self.assertEqual(
            selected_candidate.status,
            Candidate.ApplicationStatus.SELECTED,
        )

        self.assertEqual(
            selected_candidate.offer_date,
            date(2026, 8, 25),
        )

        self.assertEqual(
            selected_candidate.joining_date,
            date(2026, 9, 1),
        )

    def test_selected_candidate_can_change_to_applied_after_clearing_dates(self):
        selected_candidate = Candidate.objects.create(
            first_name="Selected",
            last_name="ClearDates",
            email="selected_clear_dates@test.com",
            phone="9876543288",
            job_title="Senior Developer",
            department=self.department,
            status=Candidate.ApplicationStatus.SELECTED,
            offer_date=date(2026, 8, 25),
            joining_date=date(2026, 9, 1),
        )

        self.authenticate(self.hr_user)

        response = self.client.patch(
            reverse(
                "recruitment-detail",
                kwargs={"pk": selected_candidate.pk},
            ),
            {
                "status": "APPLIED",
                "offer_date": None,
                "joining_date": None,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        selected_candidate.refresh_from_db()

        self.assertEqual(
            selected_candidate.status,
            Candidate.ApplicationStatus.APPLIED,
        )

        self.assertIsNone(
            selected_candidate.offer_date,
        )

        self.assertIsNone(
            selected_candidate.joining_date,
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

    def test_candidate_search_by_email(self):
        self.authenticate(self.hr_user)

        response = self.client.get(
            self.url,
            {"search": "amit@test.com"},
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
            results[0]["email"],
            "amit@test.com",
        )

    def test_candidate_search_by_phone(self):
        self.authenticate(self.hr_user)

        response = self.client.get(
            self.url,
            {"search": "9876543210"},
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
            results[0]["phone"],
            "9876543210",
        )

    def test_candidate_search_by_department_name(self):
        self.authenticate(self.hr_user)

        response = self.client.get(
            self.url,
            {"search": "Recruitment IT"},
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

    def test_candidate_ordering_by_first_name(self):
        Candidate.objects.create(
            first_name="Zoya",
            last_name="Sharma",
            email="zoya@test.com",
            phone="9876543299",
            job_title="QA Engineer",
            department=self.department,
            status=Candidate.ApplicationStatus.APPLIED,
        )

        self.authenticate(self.hr_user)

        response = self.client.get(
            self.url,
            {"ordering": "first_name"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        results = response.data["results"]

        self.assertEqual(
            results[0]["first_name"],
            "Amit",
        )

        self.assertEqual(
            results[1]["first_name"],
            "Zoya",
        )

    def test_candidate_serializer_returns_expected_fields(self):
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

        expected_fields = {
            "id",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "phone",
            "job_title",
            "department",
            "department_name",
            "resume",
            "application_date",
            "interview_date",
            "status",
            "interview_notes",
            "hr_notes",
            "experience_years",
            "expected_salary",
            "offer_date",
            "joining_date",
            "created_at",
            "updated_at",
        }

        self.assertEqual(
            set(response.data.keys()),
            expected_fields,
        )

        self.assertEqual(
            response.data["full_name"],
            "Amit Kumar",
        )

        self.assertEqual(
            response.data["department_name"],
            "Recruitment IT",
        )

    def test_email_is_normalized_on_create(self):
        self.authenticate(self.hr_user)

        response = self.client.post(
            self.url,
            {
                "first_name": "Email",
                "last_name": "Normalized",
                "email": "  NEWCANDIDATE@TEST.COM  ",
                "phone": "9876543201",
                "job_title": "Developer",
                "department": self.department.id,
                "status": "APPLIED",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            response.data["email"],
            "newcandidate@test.com",
        )

    def test_name_and_job_title_are_trimmed_on_create(self):
        self.authenticate(self.hr_user)

        response = self.client.post(
            self.url,
            {
                "first_name": "  Rahul  ",
                "last_name": "  Kumar  ",
                "email": "rahul_trim@test.com",
                "phone": " 9876543202 ",
                "job_title": "  Backend Developer  ",
                "department": self.department.id,
                "status": "APPLIED",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            response.data["first_name"],
            "Rahul",
        )

        self.assertEqual(
            response.data["last_name"],
            "Kumar",
        )

        self.assertEqual(
            response.data["phone"],
            "9876543202",
        )

        self.assertEqual(
            response.data["job_title"],
            "Backend Developer",
        )

    def test_database_rejects_negative_experience_years(self):
        with self.assertRaises(IntegrityError):
            Candidate.objects.create(
                first_name="Invalid",
                last_name="Experience",
                email="db_negative_experience@test.com",
                phone="9876543301",
                job_title="Developer",
                department=self.department,
                experience_years=-1,
                status=Candidate.ApplicationStatus.APPLIED,
            )

    def test_database_rejects_negative_expected_salary(self):
        with self.assertRaises(IntegrityError):
            Candidate.objects.create(
                first_name="Invalid",
                last_name="Salary",
                email="db_negative_salary@test.com",
                phone="9876543302",
                job_title="Developer",
                department=self.department,
                expected_salary=-50000,
                status=Candidate.ApplicationStatus.APPLIED,
            )

    def test_database_rejects_selected_candidate_without_offer_date(self):
        with self.assertRaises(IntegrityError):
            Candidate.objects.create(
                first_name="Invalid",
                last_name="Selected",
                email="db_selected_offer@test.com",
                phone="9876543303",
                job_title="Developer",
                department=self.department,
                status=Candidate.ApplicationStatus.SELECTED,
                joining_date=date(2026, 9, 1),
            )

    def test_database_rejects_selected_candidate_without_joining_date(self):
        with self.assertRaises(IntegrityError):
            Candidate.objects.create(
                first_name="Invalid",
                last_name="Selected",
                email="db_selected_joining@test.com",
                phone="9876543304",
                job_title="Developer",
                department=self.department,
                status=Candidate.ApplicationStatus.SELECTED,
                offer_date=date(2026, 8, 25),
            )

    def test_database_rejects_interview_candidate_without_interview_date(self):
        with self.assertRaises(IntegrityError):
            Candidate.objects.create(
                first_name="Invalid",
                last_name="Interview",
                email="db_interview_date@test.com",
                phone="9876543305",
                job_title="Developer",
                department=self.department,
                status=Candidate.ApplicationStatus.INTERVIEW,
            )

    def test_database_rejects_joining_date_before_offer_date(self):
        with self.assertRaises(IntegrityError):
            Candidate.objects.create(
                first_name="Invalid",
                last_name="Dates",
                email="db_invalid_dates@test.com",
                phone="9876543306",
                job_title="Developer",
                department=self.department,
                status=Candidate.ApplicationStatus.SELECTED,
                offer_date=date(2026, 8, 25),
                joining_date=date(2026, 8, 20),
            )

    def test_manager_cannot_list_candidates(self):
        self.authenticate(self.manager_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_employee_cannot_list_candidates(self):
        self.authenticate(self.employee_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_manager_cannot_create_candidate(self):
        self.authenticate(self.manager_user)

        response = self.client.post(
            self.url,
            {
                "first_name": "Manager",
                "last_name": "Candidate",
                "email": "manager_candidate@test.com",
                "phone": "9876543401",
                "job_title": "Software Engineer",
                "department": self.department.id,
                "status": Candidate.ApplicationStatus.APPLIED,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_employee_cannot_create_candidate(self):
        self.authenticate(self.employee_user)

        response = self.client.post(
            self.url,
            {
                "first_name": "Employee",
                "last_name": "Candidate",
                "email": "employee_candidate@test.com",
                "phone": "9876543402",
                "job_title": "Software Engineer",
                "department": self.department.id,
                "status": Candidate.ApplicationStatus.APPLIED,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_candidate_filter_by_job_title(self):
        Candidate.objects.create(
            first_name="Zoya",
            last_name="Sharma",
            email="zoya_job@test.com",
            phone="9876543501",
            job_title="QA Engineer",
            department=self.department,
            status=Candidate.ApplicationStatus.APPLIED,
        )

        self.authenticate(self.hr_user)

        response = self.client.get(
            self.url,
            {"job_title": "QA Engineer"},
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
            "QA Engineer",
        )

    def test_candidate_ordering_by_department_name(self):
        second_department = Department.objects.create(
            name="Finance",
            description="Finance test department",
        )

        Candidate.objects.create(
            first_name="Ravi",
            last_name="Kumar",
            email="ravi_department@test.com",
            phone="9876543502",
            job_title="Accountant",
            department=second_department,
            status=Candidate.ApplicationStatus.APPLIED,
        )

        self.authenticate(self.hr_user)

        response = self.client.get(
            self.url,
            {"ordering": "department__name"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        results = response.data["results"]

        self.assertEqual(
            results[0]["department_name"],
            "Finance",
        )

        self.assertEqual(
            results[1]["department_name"],
            "Recruitment IT",
        )