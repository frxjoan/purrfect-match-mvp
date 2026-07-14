"""Tests for admin dashboard statistics."""

from typing import Any

from flask_jwt_extended import create_access_token

from ..extensions import db
from ..models.breeder_profile import BreederProfile
from ..models.cat_listing import CatListing
from ..models.listing_report import ListingReport
from ..models.user import User


def create_user(email: Any, role: Any = "customer") -> Any:
    """Create and persist a test user."""
    user = User(
        email=email,
        first_name="Test",
        last_name="User",
        role=role,
    )
    user.set_password("password123")
    return user


def auth_header(token: Any) -> Any:
    """Build an Authorization header for a JWT token."""
    return {"Authorization": f"Bearer {token}"}


def test_admin_stats_requires_admin(client: Any, app: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    with app.app_context():
        user = create_user("stats-user@test.com")
        db.session.add(user)
        db.session.commit()
        token = create_access_token(identity=str(user.id))

    response = client.get("/api/v1/admin/stats", headers=auth_header(token))

    assert response.status_code == 403
    assert response.get_json()["success"] is False


def test_admin_stats_returns_dashboard_counts(client: Any, app: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    with app.app_context():
        admin = create_user("stats-admin@test.com", role="admin")
        customer = create_user("stats-customer@test.com")
        breeder_user = create_user("stats-breeder@test.com", role="breeder")
        db.session.add_all([admin, customer, breeder_user])
        db.session.flush()

        breeder = BreederProfile(
            user_id=breeder_user.id,
            business_name="Stats Cattery",
            location="Paris",
            certification_status="pending",
        )
        db.session.add(breeder)
        db.session.flush()

        listing = CatListing(
            breeder_id=breeder.id,
            title="Stats kitten",
            breed="Ragdoll",
            age_months=3,
            gender="female",
            price=1200,
            location="Paris",
            status="available",
        )
        db.session.add(listing)
        db.session.flush()

        report = ListingReport(
            listing_id=listing.id,
            reporter_id=customer.id,
            reason="other",
            status="pending",
        )
        db.session.add(report)
        db.session.commit()
        token = create_access_token(identity=str(admin.id))

    response = client.get("/api/v1/admin/stats", headers=auth_header(token))

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["success"] is True
    stats = payload["data"]["stats"]
    assert stats["total_users"] == 3
    assert stats["total_admins"] == 1
    assert stats["total_customers"] == 1
    assert stats["total_breeders"] == 1
    assert stats["total_listings"] == 1
    assert stats["active_listings"] == 1
    assert stats["pending_certifications"] == 1
    assert stats["pending_reports"] == 1
