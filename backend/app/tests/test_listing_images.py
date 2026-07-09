"""Tests for listing image upload persistence."""

from typing import Any

from io import BytesIO

from flask_jwt_extended import create_access_token

from ..extensions import db
from ..models.breeder_profile import BreederProfile
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
