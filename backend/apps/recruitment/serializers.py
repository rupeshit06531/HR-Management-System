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
        first_name = attrs.get("first_name")
        last_name = attrs.get("last_name")

        if first_name and not first_name.strip():
            raise serializers.ValidationError(
                {"first_name": "First name cannot be empty."}
            )

        if last_name and not last_name.strip():
            raise serializers.ValidationError(
                {"last_name": "Last name cannot be empty."}
            )

        return attrs