"""Cloudinary upload helpers for certification documents and listing images."""

from typing import Any


import cloudinary.uploader

ALLOWED_IMAGE_EXTENSIONS: set[str] = {"png", "jpg", "jpeg"}
ALLOWED_DOCUMENT_EXTENSIONS: set[str] = {"pdf", "png", "jpg", "jpeg"}


def allowed_file(filename: str, allowed_extensions: set[str]) -> bool:
    """Return whether a filename uses one of the allowed extensions."""

    if not filename or "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()
    return extension in allowed_extensions


def upload_certification_document(file: Any) -> str:
    """Upload a breeder certification document to Cloudinary and return its secure URL."""
    if not allowed_file(file.filename, ALLOWED_DOCUMENT_EXTENSIONS):
        raise ValueError(
            "Invalid file type. Allowed types: pdf, png, jpg, jpeg."
        )

    result = cloudinary.uploader.upload(
        file,
        folder="purrfect-match/certifications",
        resource_type="auto",
    )

    return result["secure_url"]


def upload_listing_image(file: Any) -> str:
    """Upload a listing image to Cloudinary and return its secure URL."""
    if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
        raise ValueError(
            "Invalid image type. Allowed types: png, jpg, jpeg."
        )

    result = cloudinary.uploader.upload(
        file,
        folder="purrfect-match/listings",
        resource_type="image",
    )

    return result["secure_url"]
