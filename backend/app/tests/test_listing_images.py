"""Tests for listing image upload persistence."""

from typing import Any

from base64 import b64decode
from io import BytesIO

import pytest
from werkzeug.datastructures import FileStorage

from flask_jwt_extended import create_access_token

from ..extensions import db
from ..models.breeder_profile import BreederProfile
from ..models.cat_listing import CatListing
from ..models.listing_image import ListingImage
from ..models.user import User


def create_verified_breeder() -> Any:
    """Create a verified breeder user for tests."""
    user = User(
        email="listing-image-breeder@test.com",
        first_name="Image",
        last_name="Breeder",
        role="breeder",
    )
    user.set_password("password123")
    db.session.add(user)
    db.session.flush()

    breeder = BreederProfile(
        user_id=user.id,
        business_name="Image Cattery",
        location="Paris",
        certification_status="verified",
    )
    db.session.add(breeder)
    db.session.commit()

    return user


def auth_header(token: Any) -> Any:
    """Build an Authorization header for a JWT token."""
    return {"Authorization": f"Bearer {token}"}


def test_create_listing_with_image_persists_listing_image(client: Any, app: Any, monkeypatch: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    monkeypatch.setattr(
        "app.routes.listings.upload_listing_image",
        lambda image: "https://cdn.example.test/listing-cat.png",
    )

    with app.app_context():
        user = create_verified_breeder()
        token = create_access_token(identity=str(user.id))

    response = client.post(
        "/api/v1/listings",
        headers=auth_header(token),
        data={
            "title": "Backend image kitten",
            "breed": "Siberian",
            "age_months": "4",
            "gender": "female",
            "price": "1500",
            "location": "Paris",
            "description": "Created from multipart form data.",
            "images": (BytesIO(b"fake image bytes"), "cat.png"),
        },
        content_type="multipart/form-data",
    )

    assert response.status_code == 201
    payload = response.get_json()
    assert payload["success"] is True
    listing_id = payload["data"]["id"]
    assert payload["data"]["images"][0]["image_url"] == "https://cdn.example.test/listing-cat.png"

    with app.app_context():
        image = ListingImage.query.filter_by(listing_id=listing_id).one()
        assert image.image_url == "https://cdn.example.test/listing-cat.png"
        assert image.is_main is True


VALID_PNG = b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwC"
    "AAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


def listing_payload(images: Any) -> dict[str, Any]:
    """Build valid multipart listing data with caller-provided images."""

    return {
        "title": "Secure image kitten",
        "breed": "Siberian",
        "age_months": "4",
        "gender": "female",
        "price": "1500",
        "location": "Paris",
        "description": "Cloudinary security test.",
        "images": images,
    }


def test_upload_listing_image_rejects_spoofed_image(monkeypatch: Any) -> None:
    """A filename and client MIME type cannot disguise non-image bytes."""
    from ..services.cloudinary_service import upload_listing_image

    upload_called = False

    def fake_upload(*args: Any, **kwargs: Any) -> Any:
        nonlocal upload_called
        upload_called = True

    monkeypatch.setattr("cloudinary.uploader.upload", fake_upload)
    image = FileStorage(
        stream=BytesIO(b"<script>alert(1)</script>"),
        filename="cat.png",
        content_type="image/png",
    )

    with pytest.raises(ValueError, match="corrupted image content"):
        upload_listing_image(image)

    assert upload_called is False


def test_upload_listing_image_rejects_mime_mismatch() -> None:
    """The extension, declared MIME type and decoded format must agree."""
    from ..services.cloudinary_service import upload_listing_image

    image = FileStorage(
        stream=BytesIO(VALID_PNG),
        filename="cat.jpg",
        content_type="image/jpeg",
    )

    with pytest.raises(ValueError, match="do not match"):
        upload_listing_image(image)


def test_upload_listing_image_uses_safe_cloudinary_options(
    monkeypatch: Any,
) -> None:
    """Uploads use bounded transformations and a generated public ID."""
    from ..services.cloudinary_service import upload_listing_image

    captured: dict[str, Any] = {}

    def fake_upload(file: Any, **options: Any) -> dict[str, Any]:
        captured["content"] = file.read()
        captured["options"] = options
        full_public_id = f"{options['folder']}/{options['public_id']}"
        return {
            "secure_url": (
                "https://res.cloudinary.com/demo/image/upload/v1/"
                f"{full_public_id}.png"
            ),
            "public_id": full_public_id,
            "resource_type": "image",
            "format": "png",
        }

    monkeypatch.setattr("cloudinary.uploader.upload", fake_upload)
    image = FileStorage(
        stream=BytesIO(VALID_PNG),
        filename="../../cat.png",
        content_type="image/png",
    )

    secure_url = upload_listing_image(image)

    options = captured["options"]
    assert secure_url.startswith("https://res.cloudinary.com/")
    assert captured["content"] == VALID_PNG
    assert options["public_id"].startswith("listing-")
    assert options["use_filename"] is False
    assert options["overwrite"] is False
    assert options["resource_type"] == "image"
    assert options["transformation"][0]["crop"] == "limit"
    assert options["transformation"][0]["width"] == 2400


def test_create_listing_rejects_too_many_images(
    client: Any,
    app: Any,
    monkeypatch: Any,
) -> None:
    """The API rejects oversized batches before calling Cloudinary."""
    upload_called = False

    def fake_upload(image: Any) -> str:
        nonlocal upload_called
        upload_called = True
        return "https://res.cloudinary.com/demo/image/upload/v1/image.png"

    monkeypatch.setattr(
        "app.routes.listings.upload_listing_image",
        fake_upload,
    )
    with app.app_context():
        user = create_verified_breeder()
        token = create_access_token(identity=str(user.id))

    images = [
        (BytesIO(b"fake image"), f"cat-{index}.png")
        for index in range(9)
    ]
    response = client.post(
        "/api/v1/listings",
        headers=auth_header(token),
        data=listing_payload(images),
        content_type="multipart/form-data",
    )

    assert response.status_code == 400
    assert "maximum of 8 images" in response.get_json()["error"]["message"]
    assert upload_called is False


def test_create_listing_cleans_up_after_partial_upload(
    client: Any,
    app: Any,
    monkeypatch: Any,
) -> None:
    """An invalid later image removes earlier cloud uploads and rolls back."""
    uploaded_url = (
        "https://res.cloudinary.com/demo/image/upload/v1/"
        "purrfect-match/listings/listing-abc.png"
    )
    upload_count = 0
    deleted_urls: list[str] = []

    def fake_upload(image: Any) -> str:
        nonlocal upload_count
        upload_count += 1
        if upload_count == 2:
            raise ValueError("Invalid or corrupted image content.")
        return uploaded_url

    monkeypatch.setattr(
        "app.routes.listings.upload_listing_image",
        fake_upload,
    )
    monkeypatch.setattr(
        "app.routes.listings.delete_listing_image",
        deleted_urls.append,
    )
    with app.app_context():
        user = create_verified_breeder()
        token = create_access_token(identity=str(user.id))

    response = client.post(
        "/api/v1/listings",
        headers=auth_header(token),
        data=listing_payload([
            (BytesIO(b"first"), "first.png"),
            (BytesIO(b"second"), "second.png"),
        ]),
        content_type="multipart/form-data",
    )

    assert response.status_code == 400
    assert deleted_urls == [uploaded_url]
    with app.app_context():
        assert CatListing.query.count() == 0
        assert ListingImage.query.count() == 0


def test_delete_listing_image_accepts_only_managed_cloudinary_urls(
    monkeypatch: Any,
) -> None:
    """Deletion cannot be redirected to an arbitrary host or public ID."""
    from ..services.cloudinary_service import delete_listing_image

    calls: list[tuple[str, dict[str, Any]]] = []

    def fake_destroy(public_id: str, **options: Any) -> dict[str, str]:
        calls.append((public_id, options))
        return {"result": "ok"}

    monkeypatch.setattr("cloudinary.uploader.destroy", fake_destroy)

    assert delete_listing_image(
        "https://res.cloudinary.com/demo/image/upload/v1/"
        "purrfect-match/listings/listing-abc.png"
    ) is True
    assert delete_listing_image(
        "https://attacker.test/purrfect-match/listings/listing-abc.png"
    ) is False
    assert calls == [(
        "purrfect-match/listings/listing-abc",
        {"resource_type": "image", "invalidate": True},
    )]


def test_upload_certification_rejects_spoofed_pdf(monkeypatch: Any) -> None:
    """HTML renamed as PDF never reaches Cloudinary."""
    from ..services.cloudinary_service import upload_certification_document

    upload_called = False

    def fake_upload(*args: Any, **kwargs: Any) -> None:
        nonlocal upload_called
        upload_called = True

    monkeypatch.setattr("cloudinary.uploader.upload", fake_upload)
    document = FileStorage(
        stream=BytesIO(b"<script>alert(1)</script>"),
        filename="certificate.pdf",
        content_type="application/pdf",
    )

    with pytest.raises(ValueError, match="corrupted certification document"):
        upload_certification_document(document)

    assert upload_called is False


def test_upload_certification_uses_authenticated_signed_delivery(
    app: Any,
    monkeypatch: Any,
) -> None:
    """Certification documents are private by default and use signed URLs."""
    from ..services.cloudinary_service import upload_certification_document

    captured: dict[str, Any] = {}

    def fake_upload(file: Any, **options: Any) -> dict[str, Any]:
        captured["content"] = file.read()
        captured["upload_options"] = options
        public_id = f"{options['folder']}/{options['public_id']}"
        return {
            "public_id": public_id,
            "resource_type": "image",
            "format": "pdf",
            "version": 1,
        }

    def fake_cloudinary_url(
        public_id: str,
        **options: Any,
    ) -> tuple[str, dict[str, Any]]:
        captured["url_options"] = options
        return (
            "https://res.cloudinary.com/demo/image/authenticated/"
            f"s--signed--/v1/{public_id}.pdf",
            options,
        )

    monkeypatch.setattr("cloudinary.uploader.upload", fake_upload)
    monkeypatch.setattr("cloudinary.utils.cloudinary_url", fake_cloudinary_url)
    document_bytes = b"%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF"
    document = FileStorage(
        stream=BytesIO(document_bytes),
        filename="certificate.pdf",
        content_type="application/pdf",
    )

    with app.app_context():
        signed_url = upload_certification_document(document)

    assert captured["content"] == document_bytes
    assert captured["upload_options"]["type"] == "authenticated"
    assert captured["upload_options"]["overwrite"] is False
    assert captured["upload_options"]["use_filename"] is False
    assert captured["url_options"]["type"] == "authenticated"
    assert captured["url_options"]["sign_url"] is True
    assert signed_url.startswith("https://res.cloudinary.com/")
