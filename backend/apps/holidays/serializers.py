from rest_framework import serializers

from .models import Holiday


class HolidaySerializer(serializers.ModelSerializer):

    class Meta:
        model = Holiday

        fields = [
            "id",
            "name",
            "date",
            "holiday_type",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        name = attrs.get("name")

        if name and not name.strip():
            raise serializers.ValidationError(
                {
                    "name": "Holiday name cannot be empty."
                }
            )

        return attrs