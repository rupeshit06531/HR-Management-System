import logging

from django.db import transaction
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .models import Candidate


logger = logging.getLogger(__name__)


def _delete_old_resume(storage, name, candidate_id):
    try:
        storage.delete(name)
    except Exception:
        logger.exception(
            "Failed to remove replaced resume for candidate %s",
            candidate_id,
        )


@receiver(pre_save, sender=Candidate)
def capture_replaced_resume(sender, instance, **kwargs):
    if not instance.pk:
        return

    try:
        old_resume = sender.objects.only("resume").get(pk=instance.pk).resume
    except sender.DoesNotExist:
        return

    if old_resume and old_resume.name != getattr(instance.resume, "name", None):
        instance._replaced_resume = (
            old_resume.storage,
            old_resume.name,
        )


@receiver(post_save, sender=Candidate)
def delete_replaced_resume(sender, instance, **kwargs):
    replaced_resume = getattr(instance, "_replaced_resume", None)
    if not replaced_resume:
        return

    storage, name = replaced_resume
    candidate_id = instance.pk
    transaction.on_commit(
        lambda: _delete_old_resume(storage, name, candidate_id)
    )
    del instance._replaced_resume


@receiver(post_delete, sender=Candidate)
def delete_resume_after_commit(sender, instance, **kwargs):
    if not instance.resume:
        return

    storage = instance.resume.storage
    name = instance.resume.name

    def delete_file():
        try:
            storage.delete(name)
        except Exception:
            logger.exception(
                "Failed to remove resume for deleted candidate %s",
                instance.pk,
            )

    transaction.on_commit(delete_file)
