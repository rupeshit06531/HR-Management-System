from datetime import date

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.holidays.models import Holiday


# 2026 follows the Central Government gazetted calendar. 2027 and 2028
# lunar-calendar dates are planning estimates and should be confirmed when
# the official annual circulars are published.
HOLIDAYS = {
    2026: [
        ("Republic Day", "01-26", "NATIONAL"),
        ("Holi", "03-04", "FESTIVAL"),
        ("Ramzan Id (Eid al-Fitr)", "03-21", "FESTIVAL"),
        ("Rama Navami", "03-26", "FESTIVAL"),
        ("Mahavir Jayanti", "03-31", "FESTIVAL"),
        ("Good Friday", "04-03", "FESTIVAL"),
        ("Buddha Purnima", "05-01", "FESTIVAL"),
        ("Bakrid (Eid al-Adha)", "05-28", "FESTIVAL"),
        ("Muharram", "06-26", "FESTIVAL"),
        ("Independence Day", "08-15", "NATIONAL"),
        ("Milad-un-Nabi", "08-26", "FESTIVAL"),
        ("Janmashtami", "09-04", "FESTIVAL"),
        ("Mahatma Gandhi Jayanti", "10-02", "NATIONAL"),
        ("Dussehra", "10-20", "FESTIVAL"),
        ("Diwali (Deepavali)", "11-08", "FESTIVAL"),
        ("Guru Nanak Jayanti", "11-24", "FESTIVAL"),
        ("Christmas", "12-25", "FESTIVAL"),
    ],
    2027: [
        ("Republic Day", "01-26", "NATIONAL"),
        ("Ramzan Id (Eid al-Fitr)", "03-10", "FESTIVAL"),
        ("Holi", "03-22", "FESTIVAL"),
        ("Good Friday", "03-26", "FESTIVAL"),
        ("Rama Navami", "04-15", "FESTIVAL"),
        ("Mahavir Jayanti", "04-19", "FESTIVAL"),
        ("Bakrid (Eid al-Adha)", "05-17", "FESTIVAL"),
        ("Buddha Purnima", "05-20", "FESTIVAL"),
        ("Muharram", "06-16", "FESTIVAL"),
        ("Independence Day", "08-15", "NATIONAL"),
        ("Milad-un-Nabi", "08-15", "FESTIVAL"),
        ("Janmashtami", "08-25", "FESTIVAL"),
        ("Mahatma Gandhi Jayanti", "10-02", "NATIONAL"),
        ("Dussehra", "10-09", "FESTIVAL"),
        ("Diwali (Deepavali)", "10-29", "FESTIVAL"),
        ("Guru Nanak Jayanti", "11-14", "FESTIVAL"),
        ("Christmas", "12-25", "FESTIVAL"),
    ],
    2028: [
        ("Republic Day", "01-26", "NATIONAL"),
        ("Maha Shivaratri", "02-23", "FESTIVAL"),
        ("Ramzan Id (Eid al-Fitr)", "02-27", "FESTIVAL"),
        ("Holi", "03-11", "FESTIVAL"),
        ("Rama Navami", "04-03", "FESTIVAL"),
        ("Mahavir Jayanti", "04-07", "FESTIVAL"),
        ("Good Friday", "04-14", "FESTIVAL"),
        ("Bakrid (Eid al-Adha)", "05-06", "FESTIVAL"),
        ("Buddha Purnima", "05-08", "FESTIVAL"),
        ("Muharram", "06-04", "FESTIVAL"),
        ("Janmashtami", "08-13", "FESTIVAL"),
        ("Independence Day", "08-15", "NATIONAL"),
        ("Mahatma Gandhi Jayanti", "10-02", "NATIONAL"),
        ("Dussehra", "09-27", "FESTIVAL"),
        ("Diwali (Deepavali)", "10-17", "FESTIVAL"),
        ("Guru Nanak Jayanti", "11-02", "FESTIVAL"),
        ("Christmas", "12-25", "FESTIVAL"),
    ],
}


class Command(BaseCommand):
    help = "Add the India-wide holiday planning calendar for 2026–2028."

    @transaction.atomic
    def handle(self, *args, **options):
        created_count = 0
        skipped_count = 0

        for year, holidays in HOLIDAYS.items():
            for name, month_day, holiday_type in holidays:
                month, day = map(int, month_day.split("-"))
                holiday_date = date(year, month, day)
                existing = Holiday.objects.filter(
                    name__iexact=name,
                    date=holiday_date,
                ).first()

                if existing:
                    skipped_count += 1
                    continue

                is_planning_estimate = year > 2026
                Holiday.objects.create(
                    name=name,
                    date=holiday_date,
                    holiday_type=holiday_type,
                    description=(
                        "India-wide Central Government gazetted holiday."
                        if not is_planning_estimate
                        else (
                            "Planning date for India-wide holiday. "
                            "Festival dates are estimates; confirm against "
                            "the official Central Government holiday circular."
                        )
                    ),
                    is_active=True,
                )
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Holiday calendar ready: {created_count} added, "
                f"{skipped_count} already existed."
            )
        )
