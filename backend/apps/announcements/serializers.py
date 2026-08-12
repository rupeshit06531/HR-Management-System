from django.utils import timezone
from rest_framework import serializers

from .models import Announcement


class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    department_name = serializers.CharField(
        source="department.name",
        read_only=True,
    )

    is_published = serializers.SerializerMethodField()

    class Meta:
        model = Announcement

        fields = [
            "id",
            "title",
            "message",
            "created_by",
            "created_by_name",
            "target_audience",
            "department",
            "department_name",
            "publish_date",
            "expiry_date",
            "is_active",
            "is_published",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_by_name",
            "department_name",
            "is_published",
            "created_at",
            "updated_at",
        ]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name()

        return None

    def get_is_published(self, obj):
        now = timezone.now()

        if not obj.is_active:
            return False

        if obj.publish_date > now:
            return False

        if obj.expiry_date and obj.expiry_date < now:
            return False

        return True

    def validate(self, attrs):
        target_audience = attrs.get(
            "target_audience"
        )

        department = attrs.get(
            "department"
        )

        publish_date = attrs.get(
            "publish_date"
        )

        expiry_date = attrs.get(
            "expiry_date"
        )

        if (
            target_audience == "DEPARTMENT"
            and department is None
        ):
            raise serializers.ValidationError(
                {
                    "department": (
                        "Department is required when "
                        "target audience is DEPARTMENT."
                    )
                }
            )

        if (
            publish_date
            and expiry_date
            and expiry_date <= publish_date
        ):
            raise serializers.ValidationError(
                {
                    "expiry_date": (
                        "Expiry date must be after publish date."
                    )
                }
            )

        return attrs