import logging

from django.db import transaction
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .models import Document


logger = logging.getLogger(__name__)


def _delete_old_file(storage, name, document_id):
    try:
        storage.delete(name)
    except Exception:
        logger.exception(
            "Failed to remove replaced file for document %s",
            document_id,
        )


@receiver(pre_save, sender=Document)
def capture_replaced_document_file(sender, instance, **kwargs):
    if not instance.pk:
        return

    try:
        old_file = sender.objects.only("file").get(pk=instance.pk).file
    except sender.DoesNotExist:
        return

    if old_file and old_file.name != getattr(instance.file, "name", None):
        instance._replaced_document_file = (
            old_file.storage,
            old_file.name,
        )


@receiver(post_save, sender=Document)
def delete_replaced_document_file(sender, instance, **kwargs):
    replaced_file = getattr(instance, "_replaced_document_file", None)
    if not replaced_file:
        return

    storage, name = replaced_file
    document_id = instance.pk
    transaction.on_commit(
        lambda: _delete_old_file(storage, name, document_id)
    )
    del instance._replaced_document_file


@receiver(post_delete, sender=Document)
def delete_document_file_after_commit(sender, instance, **kwargs):
    if not instance.file:
        return

    storage = instance.file.storage
    name = instance.file.name

    def delete_file():
        try:
            storage.delete(name)
        except Exception:
            logger.exception(
                "Failed to remove stored file for deleted document %s",
                instance.pk,
            )

    transaction.on_commit(delete_file)
