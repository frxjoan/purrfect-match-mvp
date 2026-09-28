"""Cloudinary upload helpers for certification documents and listing images."""

from io import BytesIO
from pathlib import PurePath
import re
import struct
from typing import Any
from urllib.parse import unquote, urlsplit
from uuid import uuid4
import zlib

import cloudinary.uploader

import cloudinary.utils
from flask import current_app
ALLOWED_IMAGE_EXTENSIONS: set[str] = {"png", "jpg", "jpeg"}
ALLOWED_DOCUMENT_EXTENSIONS: set[str] = {"pdf", "png", "jpg", "jpeg"}
ALLOWED_IMAGE_MIME_TYPES: dict[str, str] = {
    "image/jpeg": "jpeg",
    "image/png": "png",
}
ALLOWED_DOCUMENT_MIME_TYPES: dict[str, str] = {
    **ALLOWED_IMAGE_MIME_TYPES,
    "application/pdf": "pdf",
}
MAX_CERTIFICATION_DOCUMENT_BYTES: int = 10 * 1024 * 1024
MAX_LISTING_IMAGE_BYTES: int = 10 * 1024 * 1024
MAX_LISTING_IMAGE_PIXELS: int = 25_000_000
MAX_LISTING_IMAGES: int = 8
CERTIFICATION_FOLDER: str = "purrfect-match/certifications"
LISTING_IMAGE_FOLDER: str = "purrfect-match/listings"
_MANAGED_PUBLIC_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,120}$")
_JPEG_START_OF_FRAME_MARKERS = {
    0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
    0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF,
}


def allowed_file(filename: str, allowed_extensions: set[str]) -> bool:
    """Return whether a filename uses one of the allowed extensions."""

    if not filename or "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()
    return extension in allowed_extensions


def _read_limited(
    file: Any,
    max_bytes: int,
    file_label: str,
) -> bytes:
    """Read an upload with a hard byte limit and restore its stream position."""

    stream = getattr(file, "stream", file)
    try:
        stream.seek(0)
        content = stream.read(max_bytes + 1)
        stream.seek(0)
    except (AttributeError, OSError, ValueError) as exc:
        raise ValueError(f"The {file_label} could not be read.") from exc

    if not isinstance(content, bytes) or not content:
        raise ValueError(f"The {file_label} is empty or unreadable.")
    if len(content) > max_bytes:
        raise ValueError(f"The {file_label} must be 10 MB or smaller.")
    return content


def _valid_dimensions(width: int, height: int) -> bool:
    return (
        width > 0
        and height > 0
        and width * height <= MAX_LISTING_IMAGE_PIXELS
    )


def _is_valid_png(content: bytes) -> bool:
    """Validate the PNG container, chunk CRCs and declared dimensions."""

    if not content.startswith(b"\x89PNG\r\n\x1a\n"):
        return False

    offset = 8
    saw_header = False
    while offset + 12 <= len(content):
        chunk_length = struct.unpack(">I", content[offset:offset + 4])[0]
        chunk_type = content[offset + 4:offset + 8]
        chunk_end = offset + 12 + chunk_length
        if chunk_end > len(content):
            return False

        chunk_data = content[offset + 8:offset + 8 + chunk_length]
        expected_crc = struct.unpack(
            ">I",
            content[offset + 8 + chunk_length:chunk_end],
        )[0]
        if zlib.crc32(chunk_type + chunk_data) & 0xFFFFFFFF != expected_crc:
            return False

        if not saw_header:
            if chunk_type != b"IHDR" or chunk_length != 13:
                return False
            width, height = struct.unpack(">II", chunk_data[:8])
            if not _valid_dimensions(width, height):
                return False
            saw_header = True

        if chunk_type == b"IEND":
            return chunk_length == 0 and chunk_end == len(content) and saw_header
        offset = chunk_end

    return False


def _is_valid_jpeg(content: bytes) -> bool:
    """Validate JPEG framing and obtain dimensions from a start-of-frame segment."""

    if (
        len(content) < 4
        or not content.startswith(b"\xff\xd8")
        or not content.endswith(b"\xff\xd9")
    ):
        return False

    offset = 2
    has_dimensions = False
    while offset + 1 < len(content):
        if content[offset] != 0xFF:
            return False
        while offset < len(content) and content[offset] == 0xFF:
            offset += 1
        if offset >= len(content):
            return False

        marker = content[offset]
        offset += 1
        if marker == 0xD9:
            return has_dimensions and offset == len(content)
        if marker in range(0xD0, 0xD8) or marker == 0x01:
            continue
        if offset + 2 > len(content):
            return False

        segment_length = struct.unpack(">H", content[offset:offset + 2])[0]
        if segment_length < 2 or offset + segment_length > len(content):
            return False
        segment = content[offset + 2:offset + segment_length]

        if marker in _JPEG_START_OF_FRAME_MARKERS:
            if len(segment) < 6:
                return False
            height, width = struct.unpack(">HH", segment[1:5])
            if not _valid_dimensions(width, height):
                return False
            has_dimensions = True
        if marker == 0xDA:
            return has_dimensions
        offset += segment_length

    return False


def _detect_image_format(content: bytes) -> str | None:
    if _is_valid_png(content):
        return "png"
    if _is_valid_jpeg(content):
        return "jpeg"
    return None


def _is_valid_pdf(content: bytes) -> bool:
    """Validate the PDF header, version and end-of-file marker."""

    if not re.match(rb"^%PDF-1\.[0-9][\r\n]", content):
        return False
    return b"%%EOF" in content[-1024:]


def validate_listing_image(file: Any) -> tuple[bytes, str]:
    """Validate filename, declared MIME type, bytes and image dimensions."""

    filename = PurePath(getattr(file, "filename", "") or "").name
    if not allowed_file(filename, ALLOWED_IMAGE_EXTENSIONS):
        raise ValueError(
            "Invalid image extension. Allowed types: png, jpg, jpeg."
        )

    extension = filename.rsplit(".", 1)[1].lower()
    extension_format = "jpeg" if extension in {"jpg", "jpeg"} else extension
    mime_type = (getattr(file, "mimetype", "") or "").lower()
    mime_format = ALLOWED_IMAGE_MIME_TYPES.get(mime_type)
    if not mime_format:
        raise ValueError(
            "Invalid image MIME type. Allowed types: image/png, image/jpeg."
        )

    content = _read_limited(
        file,
        MAX_LISTING_IMAGE_BYTES,
        "image",
    )
    detected_format = _detect_image_format(content)

    if not detected_format:
        raise ValueError("Invalid or corrupted image content.")
    if detected_format != extension_format or detected_format != mime_format:
        raise ValueError(
            "The image extension, MIME type and content do not match."
        )

    return content, detected_format


def validate_certification_document(file: Any) -> tuple[bytes, str]:
    """Validate a certification extension, MIME type and binary signature."""

    filename = PurePath(getattr(file, "filename", "") or "").name
    if not allowed_file(filename, ALLOWED_DOCUMENT_EXTENSIONS):
        raise ValueError(
            "Invalid document extension. Allowed types: pdf, png, jpg, jpeg."
        )

    extension = filename.rsplit(".", 1)[1].lower()
    extension_format = "jpeg" if extension in {"jpg", "jpeg"} else extension
    mime_type = (getattr(file, "mimetype", "") or "").lower()
    mime_format = ALLOWED_DOCUMENT_MIME_TYPES.get(mime_type)
    if not mime_format:
        raise ValueError(
            "Invalid document MIME type. Allowed types: application/pdf, "
            "image/png, image/jpeg."
        )

    content = _read_limited(
        file,
        MAX_CERTIFICATION_DOCUMENT_BYTES,
        "certification document",
    )
    detected_format = (
        "pdf"
        if _is_valid_pdf(content)
        else _detect_image_format(content)
    )
    if not detected_format:
        raise ValueError("Invalid or corrupted certification document.")
    if detected_format != extension_format or detected_format != mime_format:
        raise ValueError(
            "The document extension, MIME type and content do not match."
        )

    return content, detected_format


def upload_certification_document(file: Any) -> str:
    """Upload a certification with authenticated, signed Cloudinary delivery."""

    content, detected_format = validate_certification_document(file)
    generated_id = f"certification-{uuid4().hex}"
    expected_public_id = f"{CERTIFICATION_FOLDER}/{generated_id}"

    result = cloudinary.uploader.upload(
        BytesIO(content),
        folder=CERTIFICATION_FOLDER,
        public_id=generated_id,
        resource_type="image",
        type="authenticated",
        overwrite=False,
        unique_filename=False,
        use_filename=False,
        allowed_formats=sorted(ALLOWED_DOCUMENT_EXTENSIONS),
    )

    response_format = result.get("format")
    expected_formats = {
        detected_format,
        "jpg" if detected_format == "jpeg" else detected_format,
    }
    valid_response = (
        result.get("public_id") == expected_public_id
        and result.get("resource_type") == "image"
        and response_format in expected_formats
    )

    signed_url: str | None = None
    if valid_response:
        try:
            signed_url, _options = cloudinary.utils.cloudinary_url(
                expected_public_id,
                format=response_format,
                resource_type="image",
                type="authenticated",
                version=result.get("version"),
                secure=True,
                sign_url=True,
            )
        except Exception:
            current_app.logger.exception(
                "Failed to generate a signed certification URL."
            )

    valid_url = (
        isinstance(signed_url, str)
        and _managed_public_id_from_url(
            signed_url,
            CERTIFICATION_FOLDER,
        ) == expected_public_id
    )
    if not valid_response or not valid_url:
        try:
            cloudinary.uploader.destroy(
                expected_public_id,
                resource_type="image",
                type="authenticated",
                invalidate=True,
            )
        except Exception:
            current_app.logger.exception(
                "Failed to remove an invalid certification upload."
            )
        raise RuntimeError(
            "Cloudinary returned an invalid certification upload response."
        )

    return signed_url


def upload_listing_image(file: Any) -> str:
    """Validate and upload a listing image using a server-generated identifier."""

    content, detected_format = validate_listing_image(file)
    generated_id = f"listing-{uuid4().hex}"
    expected_public_id = f"{LISTING_IMAGE_FOLDER}/{generated_id}"

    result = cloudinary.uploader.upload(
        BytesIO(content),
        folder=LISTING_IMAGE_FOLDER,
        public_id=generated_id,
        resource_type="image",
        type="upload",
        overwrite=False,
        unique_filename=False,
        use_filename=False,
        allowed_formats=sorted(ALLOWED_IMAGE_EXTENSIONS),
        transformation=[{
            "width": 2400,
            "height": 2400,
            "crop": "limit",
            "quality": "auto:good",
        }],
    )

    secure_url = result.get("secure_url")
    response_format = result.get("format")
    valid_url = (
        isinstance(secure_url, str)
        and _listing_public_id_from_url(secure_url) == expected_public_id
    )
    expected_formats = {
        detected_format,
        "jpg" if detected_format == "jpeg" else detected_format,
    }
    if (
        not valid_url
        or result.get("public_id") != expected_public_id
        or result.get("resource_type") != "image"
        or response_format not in expected_formats
    ):
        try:
            cloudinary.uploader.destroy(
                expected_public_id,
                resource_type="image",
                invalidate=True,
            )
        except Exception:
            current_app.logger.exception(
                "Failed to remove an invalid listing image upload."
            )
        raise RuntimeError(
            "Cloudinary returned an invalid image upload response."
        )

    return secure_url


def _managed_public_id_from_url(
    asset_url: str,
    folder: str,
) -> str | None:
    """Extract a safe public ID under an application-managed folder."""

    try:
        parsed = urlsplit(asset_url)
    except (TypeError, ValueError):
        return None
    hostname = (parsed.hostname or "").lower()
    if parsed.scheme != "https" or not (
        hostname == "res.cloudinary.com"
        or hostname.endswith(".cloudinary.com")
    ):
        return None

    path_parts = [
        unquote(part)
        for part in parsed.path.split("/")
        if part
    ]
    folder_parts = folder.split("/")
    for index in range(len(path_parts) - len(folder_parts)):
        if path_parts[index:index + len(folder_parts)] != folder_parts:
            continue
        filename = path_parts[index + len(folder_parts)]
        if index + len(folder_parts) != len(path_parts) - 1:
            return None
        public_name = filename.rsplit(".", 1)[0]
        if not _MANAGED_PUBLIC_ID_PATTERN.fullmatch(public_name):
            return None
        return f"{folder}/{public_name}"
    return None


def _listing_public_id_from_url(image_url: str) -> str | None:
    """Extract only a safe listing public ID from a Cloudinary delivery URL."""

    return _managed_public_id_from_url(image_url, LISTING_IMAGE_FOLDER)


def delete_listing_image(image_url: str) -> bool:
    """Delete a managed listing image without accepting an arbitrary public ID."""

    public_id = _listing_public_id_from_url(image_url)
    if not public_id:
        return False

    result = cloudinary.uploader.destroy(
        public_id,
        resource_type="image",
        invalidate=True,
    )
    if result.get("result") not in {"ok", "not found"}:
        raise RuntimeError("Cloudinary could not delete the listing image.")
    return True
