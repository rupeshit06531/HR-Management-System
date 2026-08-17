from rest_framework import serializers

from .models import Candidate


class CandidateSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    department_name = serializers.CharField(
        source="department.name",
        read_only=True,
    )

    class Meta:
        model = Candidate

        fields = [
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
        ]

        read_only_fields = [
            "id",
            "full_name",
            "department_name",
            "application_date",
            "created_at",
            "updated_at",
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def validate(self, attrs):
        first_name = attrs.get(
            "first_name",
            getattr(self.instance, "first_name", None),
        )

        last_name = attrs.get(
            "last_name",
            getattr(self.instance, "last_name", ""),
        )

        email = attrs.get(
            "email",
            getattr(self.instance, "email", None),
        )

        phone = attrs.get(
            "phone",
            getattr(self.instance, "phone", None),
        )

        job_title = attrs.get(
            "job_title",
            getattr(self.instance, "job_title", None),
        )

        status_value = attrs.get(
            "status",
            getattr(
                self.instance,
                "status",
                Candidate.ApplicationStatus.APPLIED,
            ),
        )

        interview_date = attrs.get(
            "interview_date",
            getattr(self.instance, "interview_date", None),
        )

        offer_date = attrs.get(
            "offer_date",
            getattr(self.instance, "offer_date", None),
        )

        joining_date = attrs.get(
            "joining_date",
            getattr(self.instance, "joining_date", None),
        )

        experience_years = attrs.get(
            "experience_years",
            getattr(
                self.instance,
                "experience_years",
                0,
            ),
        )

        expected_salary = attrs.get(
            "expected_salary",
            getattr(
                self.instance,
                "expected_salary",
                None,
            ),
        )

        if first_name is not None:
            normalized_first_name = first_name.strip()

            if not normalized_first_name:
                raise serializers.ValidationError(
                    {
                        "first_name": (
                            "First name cannot be empty."
                        )
                    }
                )

            attrs["first_name"] = normalized_first_name

        if last_name is not None:
            attrs["last_name"] = last_name.strip()

        if email is not None:
            normalized_email = email.strip().lower()

            if not normalized_email:
                raise serializers.ValidationError(
                    {
                        "email": "Email cannot be empty."
                    }
                )

            attrs["email"] = normalized_email

        if phone is not None:
            normalized_phone = phone.strip()

            if not normalized_phone:
                raise serializers.ValidationError(
                    {
                        "phone": "Phone cannot be empty."
                    }
                )

            attrs["phone"] = normalized_phone

        if job_title is not None:
            normalized_job_title = job_title.strip()

            if not normalized_job_title:
                raise serializers.ValidationError(
                    {
                        "job_title": (
                            "Job title cannot be empty."
                        )
                    }
                )

            attrs["job_title"] = normalized_job_title

        if (
            experience_years is not None
            and experience_years < 0
        ):
            raise serializers.ValidationError(
                {
                    "experience_years": (
                        "Experience years cannot be negative."
                    )
                }
            )

        if (
            expected_salary is not None
            and expected_salary < 0
        ):
            raise serializers.ValidationError(
                {
                    "expected_salary": (
                        "Expected salary cannot be negative."
                    )
                }
            )

        if (
            status_value
            == Candidate.ApplicationStatus.INTERVIEW
            and interview_date is None
        ):
            raise serializers.ValidationError(
                {
                    "interview_date": (
                        "Interview date is required when "
                        "application status is Interview."
                    )
                }
            )

        if (
            status_value
            != Candidate.ApplicationStatus.INTERVIEW
            and interview_date is not None
        ):
            raise serializers.ValidationError(
                {
                    "interview_date": (
                        "Interview date must be empty unless "
                        "application status is Interview."
                    )
                }
            )

        if (
            status_value
            == Candidate.ApplicationStatus.SELECTED
            and offer_date is None
        ):
            raise serializers.ValidationError(
                {
                    "offer_date": (
                        "Offer date is required when "
                        "application status is Selected."
                    )
                }
            )

        if (
            status_value
            == Candidate.ApplicationStatus.SELECTED
            and joining_date is None
        ):
            raise serializers.ValidationError(
                {
                    "joining_date": (
                        "Joining date is required when "
                        "application status is Selected."
                    )
                }
            )

        if (
            status_value
            != Candidate.ApplicationStatus.SELECTED
            and offer_date is not None
        ):
            raise serializers.ValidationError(
                {
                    "offer_date": (
                        "Offer date must be empty unless "
                        "application status is Selected."
                    )
                }
            )

        if (
            status_value
            != Candidate.ApplicationStatus.SELECTED
            and joining_date is not None
        ):
            raise serializers.ValidationError(
                {
                    "joining_date": (
                        "Joining date must be empty unless "
                        "application status is Selected."
                    )
                }
            )

        if (
            offer_date is not None
            and joining_date is not None
            and joining_date < offer_date
        ):
            raise serializers.ValidationError(
                {
                    "joining_date": (
                        "Joining date cannot be earlier "
                        "than offer date."
                    )
                }
            )

        return attrs