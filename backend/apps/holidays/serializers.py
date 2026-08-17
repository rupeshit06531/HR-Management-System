
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

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Holiday name cannot be empty."
            )

        return value

    def validate_description(self, value):
        return value.strip()

    def validate_holiday_type(self, value):
        value = value.strip()

        valid_types = {
            choice[0]
            for choice in Holiday.HolidayType.choices
        }

        if value not in valid_types:
            raise serializers.ValidationError(
                "Invalid holiday type."
            )

        return value

    def validate(self, attrs):
        name = attrs.get(
            "name",
            getattr(self.instance, "name", None),
        )

        date = attrs.get(
            "date",
            getattr(self.instance, "date", None),
        )

        if name is not None:
            attrs["name"] = name.strip()

        if date is not None:
            duplicate_queryset = Holiday.objects.filter(
                name__iexact=name,
                date=date,
            )

            if self.instance:
                duplicate_queryset = duplicate_queryset.exclude(
                    pk=self.instance.pk,
                )

            if duplicate_queryset.exists():
                raise serializers.ValidationError(
                    {
                        "non_field_errors": [
                            (
                                "A holiday with this name "
                                "already exists for this date."
                            )
                        ]
                    }
                )

        return attrs