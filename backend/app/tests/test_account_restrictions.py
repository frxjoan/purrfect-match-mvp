"""Tests for account suspension and ban flows."""

from typing import Any

from datetime import datetime, timedelta, timezone

import pytest
from flask_jwt_extended import create_access_token

from ..extensions import db
from ..models.account_restriction import AccountRestriction
from ..models.breeder_profile import BreederProfile
from ..models.cat_listing import CatListing
from ..models.user import User


def create_user(email: Any, role: Any = "customer", status: Any = "active") -> Any:
    """Create and persist a test user."""
    user = User(
        email=email,
        first_name="Test",
        last_name="User",
        role=role,
        status=status,
    )
    user.set_password("password123")
    return user


@pytest.fixture()
def restriction_setup(app: Any) -> Any:
    """Create users and restrictions for moderation tests."""
    with app.app_context():
        admin = create_user("restriction-admin@test.com", role="admin")
        user = create_user("restricted-user@test.com")
        other = create_user("restriction-other@test.com")

        db.session.add_all([admin, user, other])
        db.session.commit()

        return {
            "admin_id": admin.id,
            "user_id": user.id,
            "other_id": other.id,
            "admin_token": create_access_token(identity=str(admin.id)),
            "user_token": create_access_token(identity=str(user.id)),
            "other_token": create_access_token(identity=str(other.id)),
        }


def auth_header(token: Any) -> Any:
    """Build an Authorization header for a JWT token."""
    return {"Authorization": f"Bearer {token}"}


def test_register_rejects_active_email_ban(client: Any, app: Any, restriction_setup: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    with app.app_context():
        restriction = AccountRestriction(
            email="blocked-register@test.com",
            restriction_type="ban",
            reason="Prior ban.",
            admin_id=restriction_setup["admin_id"],
        )
        db.session.add(restriction)
        db.session.commit()

    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "blocked-register@test.com",
            "password": "password123",
            "first_name": "Blocked",
            "last_name": "User",
        },
    )

    assert response.status_code == 403
    assert response.get_json()["success"] is False


def test_register_rejects_active_email_suspension(client: Any, app: Any, restriction_setup: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    with app.app_context():
        restriction = AccountRestriction(
            email="suspended-register@test.com",
            restriction_type="suspension",
            reason="Prior suspension.",
            admin_id=restriction_setup["admin_id"],
            expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        )
        db.session.add(restriction)
        db.session.commit()

    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "suspended-register@test.com",
            "password": "password123",
            "first_name": "Suspended",
            "last_name": "User",
        },
    )

    assert response.status_code == 403
    assert response.get_json()["success"] is False


def test_login_rejects_banned_user(client: Any, app: Any, restriction_setup: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    with app.app_context():
        user = db.session.get(User, restriction_setup["user_id"])
        user.status = "banned"
        user.moderation_reason = "Banned in test."
        db.session.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "restricted-user@test.com",
            "password": "password123",
        },
    )

    assert response.status_code == 403


def test_login_rejects_active_suspension(client: Any, app: Any, restriction_setup: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    with app.app_context():
        user = db.session.get(User, restriction_setup["user_id"])
        user.status = "suspended"
        user.suspended_until = datetime.now(timezone.utc) + timedelta(days=1)
        user.moderation_reason = "Suspended in test."
        db.session.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "restricted-user@test.com",
            "password": "password123",
        },
    )

    assert response.status_code == 403


def test_login_restores_expired_suspension(client: Any, app: Any, restriction_setup: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    with app.app_context():
        user = db.session.get(User, restriction_setup["user_id"])
        user.status = "suspended"
        user.suspended_until = datetime.now(timezone.utc) - timedelta(days=1)
        user.moderation_reason = "Expired suspension."
        db.session.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "restricted-user@test.com",
            "password": "password123",
        },
    )

    assert response.status_code == 200

    with app.app_context():
        user = db.session.get(User, restriction_setup["user_id"])
        assert user.status == "active"
        assert user.suspended_until is None


def test_admin_can_suspend_and_lift_user(client: Any, app: Any, restriction_setup: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    expires_at = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()

    response = client.post(
        f"/api/v1/admin/users/{restriction_setup['user_id']}/restrictions",
        headers=auth_header(restriction_setup["admin_token"]),
        json={
            "restriction_type": "suspension",
            "reason": "Temporary moderation hold.",
            "expires_at": expires_at,
        },
    )

    assert response.status_code == 201
    payload = response.get_json()
    assert payload["success"] is True
    assert payload["data"]["user"]["status"] == "suspended"
    assert payload["data"]["restriction"]["restriction_type"] == "suspension"

    lift_response = client.delete(
        f"/api/v1/admin/users/{restriction_setup['user_id']}/restrictions",
        headers=auth_header(restriction_setup["admin_token"]),
    )

    assert lift_response.status_code == 200
    assert lift_response.get_json()["data"]["user"]["status"] == "active"


def test_admin_restriction_requires_admin(client: Any, restriction_setup: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    response = client.post(
        f"/api/v1/admin/users/{restriction_setup['user_id']}/restrictions",
        headers=auth_header(restriction_setup["other_token"]),
        json={
            "restriction_type": "ban",
            "reason": "Not allowed.",
        },
    )

    assert response.status_code == 403


def test_admin_ban_archives_breeder_active_listings(client: Any, app: Any, restriction_setup: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    with app.app_context():
        breeder_user = create_user("ban-breeder@test.com", role="breeder")
        db.session.add(breeder_user)
        db.session.flush()

        breeder_profile = BreederProfile(
            user_id=breeder_user.id,
            business_name="Ban Test Breeder",
            location="Paris",
            certification_status="verified",
        )
        db.session.add(breeder_profile)
        db.session.flush()

        active_listing = CatListing(
            breeder_id=breeder_profile.id,
            title="Active listing",
            breed="Siberian",
            age_months=4,
            gender="female",
            price=1300,
            location="Paris",
            status="available",
        )
        archived_listing = CatListing(
            breeder_id=breeder_profile.id,
            title="Already archived",
            breed="Siberian",
            age_months=5,
            gender="male",
            price=1100,
            location="Paris",
            status="archived",
        )
        db.session.add_all([active_listing, archived_listing])
        db.session.commit()

        breeder_user_id = breeder_user.id
        active_listing_id = active_listing.id
        archived_listing_id = archived_listing.id

    response = client.post(
        f"/api/v1/admin/users/{breeder_user_id}/restrictions",
        headers=auth_header(restriction_setup["admin_token"]),
        json={
            "restriction_type": "ban",
            "reason": "Confirmed severe report.",
        },
    )

    assert response.status_code == 201
    payload = response.get_json()
    assert payload["data"]["archived_listings_count"] == 1
    assert payload["data"]["user"]["status"] == "banned"

    with app.app_context():
        assert db.session.get(CatListing, active_listing_id).status == "archived"
        assert db.session.get(CatListing, archived_listing_id).status == "archived"


def test_admin_rejects_invalid_restriction_type(client: Any, restriction_setup: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    response = client.post(
        f"/api/v1/admin/users/{restriction_setup['user_id']}/restrictions",
        headers=auth_header(restriction_setup["admin_token"]),
        json={
            "restriction_type": "timeout",
            "reason": "Invalid.",
        },
    )

    assert response.status_code == 400
