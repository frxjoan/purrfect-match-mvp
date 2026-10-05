"""Regression tests for public and private breeder profile fields."""

from app.extensions import db
from app.models.breeder_profile import BreederProfile
from app.models.cat_listing import CatListing
from app.models.user import User


def create_breeder_with_private_document(app):
    """Create a verified breeder and listing containing private moderation data."""
    with app.app_context():
        user = User(
            email="private-breeder@example.com",
            first_name="Private",
            last_name="Breeder",
            role="breeder",
        )
        user.set_password("StrongPassword123!")
        db.session.add(user)
        db.session.flush()

        profile = BreederProfile(
            user_id=user.id,
            business_name="Private Cattery",
            location="Paris",
            certification_status="verified",
            certification_document_url="https://example.test/private-proof.pdf",
            certification_admin_comment="Internal moderation note",
        )
        db.session.add(profile)
        db.session.flush()

        listing = CatListing(
            breeder_id=profile.id,
            title="Public kitten",
            breed="European",
            age_months=4,
            gender="female",
            price=500,
            location="Paris",
            status="available",
        )
        db.session.add(listing)
        db.session.commit()
        return profile.id, listing.id


def test_public_breeder_profile_hides_certification_document(client, app):
    profile_id, listing_id = create_breeder_with_private_document(app)

    profile_response = client.get(f"/api/v1/breeders/{profile_id}")
    listing_response = client.get(f"/api/v1/listings/{listing_id}")

    assert profile_response.status_code == 200
    assert listing_response.status_code == 200

    public_profile = profile_response.get_json()["data"]["breeder_profile"]
    listing_breeder = listing_response.get_json()["data"]["breeder"]

    for payload in (public_profile, listing_breeder):
        assert "certification_document_url" not in payload
        assert "certification_admin_comment" not in payload


def test_owner_profile_keeps_private_certification_fields(client, app):
    create_breeder_with_private_document(app)
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "private-breeder@example.com",
            "password": "StrongPassword123!",
        },
    )
    token = login_response.get_json()["data"]["token"]

    response = client.get(
        "/api/v1/breeders/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    private_profile = response.get_json()["data"]["breeder_profile"]
    assert private_profile["certification_document_url"].endswith("private-proof.pdf")
    assert private_profile["certification_admin_comment"] == "Internal moderation note"
