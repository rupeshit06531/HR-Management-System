import logging

from django.db import transaction
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .models import Attendance


logger = logging.getLogger(__name__)
SELFIE_FIELDS = ("check_in_selfie", "check_out_selfie")


def _delete_file(storage, name, attendance_id):
    try:
        storage.delete(name)
    except Exception:
        logger.exception(
            "Failed to remove attendance selfie for record %s",
            attendance_id,
        )


@receiver(pre_save, sender=Attendance)
def capture_replaced_selfies(sender, instance, **kwargs):
    if not instance.pk:
        return

    old_record = sender.objects.filter(pk=instance.pk).only(*SELFIE_FIELDS).first()
    if old_record is None:
        return

    replaced = []
    for field_name in SELFIE_FIELDS:
        old_file = getattr(old_record, field_name)
        new_file = getattr(instance, field_name)
        if old_file and old_file.name != getattr(new_file, "name", None):
            replaced.append((old_file.storage, old_file.name))

    if replaced:
        instance._replaced_selfie_files = replaced


@receiver(post_save, sender=Attendance)
def delete_replaced_selfies(sender, instance, **kwargs):
    replaced = getattr(instance, "_replaced_selfie_files", None)
    if not replaced:
        return

    for storage, name in replaced:
        transaction.on_commit(
            lambda storage=storage, name=name, attendance_id=instance.pk: _delete_file(
                storage,
                name,
                attendance_id,
            )
        )
    del instance._replaced_selfie_files


@receiver(post_delete, sender=Attendance)
def delete_attendance_selfies(sender, instance, **kwargs):
    for field_name in SELFIE_FIELDS:
        selfie = getattr(instance, field_name)
        if not selfie:
            continue
        storage = selfie.storage
        name = selfie.name
        transaction.on_commit(
            lambda storage=storage, name=name, attendance_id=instance.pk: _delete_file(
                storage,
                name,
                attendance_id,
            )
        )
