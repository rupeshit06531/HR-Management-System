from rest_framework import serializers

from .models import Leave


class LeaveSerializer(serializers.ModelSerializer):

    class Meta:
        model = Leave
        fields = "__all__"

    def validate(self, attrs):

        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                {
                    "end_date": (
                        "End date cannot be before start date."
                    )
                }
            )

        return attrs