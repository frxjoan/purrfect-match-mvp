"""Tests for breeder review endpoints."""

from typing import Any

import pytest
from flask_jwt_extended import create_access_token

from ..extensions import db
from ..models.breeder_profile import BreederProfile
from ..models.reviews import Review
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


@pytest.fixture()
def review_setup(app: Any) -> Any:
    """Create users and breeder data for review tests."""
    with app.app_context():
        reviewer = create_user("reviewer@test.com")
        owner = create_user("owner@test.com", role="breeder")
        other_user = create_user("other@test.com")

        db.session.add_all([reviewer, owner, other_user])
        db.session.flush()

        breeder_profile = BreederProfile(
            user_id=owner.id,
            business_name="Purrfect Breeder",
            location="Paris",
            certification_status="verified",
        )

        db.session.add(breeder_profile)
        db.session.commit()

        reviewer_token = create_access_token(identity=str(reviewer.id))
        owner_token = create_access_token(identity=str(owner.id))
        other_token = create_access_token(identity=str(other_user.id))

        return {
            "breeder_id": breeder_profile.id,
            "reviewer_id": reviewer.id,
            "reviewer_token": reviewer_token,
            "owner_token": owner_token,
            "other_token": other_token,
        }


def auth_header(token: Any) -> Any:
    """Build an Authorization header for a JWT token."""
    return {"Authorization": f"Bearer {token}"}


def create_review(app: Any, reviewer_id: Any, breeder_id: Any, rating: Any = 5, comment: Any = "Great breeder.") -> Any:
    """Create and persist a test review."""
    with app.app_context():
        review = Review(
            reviewer_id=reviewer_id,
            breeder_id=breeder_id,
            rating=rating,
            comment=comment,
        )
        db.session.add(review)
        db.session.commit()
        return review.id


def test_list_breeder_reviews_is_public(client: Any, app: Any, review_setup: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    create_review(
        app,
        review_setup["reviewer_id"],
        review_setup["breeder_id"],
    )

    response = client.get(f"/api/v1/breeders/{review_setup['breeder_id']}/reviews")

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["success"] is True
    assert payload["data"]["count"] == 1
    assert payload["data"]["reviews"][0]["rating"] == 5


def test_create_review_success(client: Any, review_setup: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    response = client.post(
        f"/api/v1/breeders/{review_setup['breeder_id']}/reviews",
        headers=auth_header(review_setup["reviewer_token"]),
        json={"rating": 4, "comment": "Very helpful."},
    )

    assert response.status_code == 201
    payload = response.get_json()
    assert payload["success"] is True
    assert payload["data"]["review"]["rating"] == 4
    assert payload["data"]["review"]["comment"] == "Very helpful."


def test_create_review_requires_auth(client: Any, review_setup: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    response = client.post(
        f"/api/v1/breeders/{review_setup['breeder_id']}/reviews",
        json={"rating": 5},
    )

    assert response.status_code == 401


@pytest.mark.parametrize("rating", [0, 6, 4.5, "bad", True])
def test_create_review_rejects_invalid_rating(client: Any, review_setup: Any, rating: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    response = client.post(
        f"/api/v1/breeders/{review_setup['breeder_id']}/reviews",
        headers=auth_header(review_setup["reviewer_token"]),
        json={"rating": rating},
    )

    assert response.status_code == 400
    assert response.get_json()["success"] is False


def test_create_review_rejects_own_breeder_profile(client: Any, review_setup: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    response = client.post(
        f"/api/v1/breeders/{review_setup['breeder_id']}/reviews",
        headers=auth_header(review_setup["owner_token"]),
        json={"rating": 5},
    )

    assert response.status_code == 403


def test_create_review_rejects_duplicate(client: Any, app: Any, review_setup: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    create_review(
        app,
        review_setup["reviewer_id"],
        review_setup["breeder_id"],
    )

    response = client.post(
        f"/api/v1/breeders/{review_setup['breeder_id']}/reviews",
        headers=auth_header(review_setup["reviewer_token"]),
        json={"rating": 4},
    )

    assert response.status_code == 409


def test_update_review_success(client: Any, app: Any, review_setup: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    review_id = create_review(
        app,
        review_setup["reviewer_id"],
        review_setup["breeder_id"],
    )

    response = client.patch(
        f"/api/v1/reviews/{review_id}",
        headers=auth_header(review_setup["reviewer_token"]),
        json={"rating": 3, "comment": "Updated."},
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["data"]["review"]["rating"] == 3
    assert payload["data"]["review"]["comment"] == "Updated."


def test_update_review_rejects_non_author(client: Any, app: Any, review_setup: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    review_id = create_review(
        app,
        review_setup["reviewer_id"],
        review_setup["breeder_id"],
    )

    response = client.patch(
        f"/api/v1/reviews/{review_id}",
        headers=auth_header(review_setup["other_token"]),
        json={"rating": 3},
    )

    assert response.status_code == 403


def test_delete_review_success(client: Any, app: Any, review_setup: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    review_id = create_review(
        app,
        review_setup["reviewer_id"],
        review_setup["breeder_id"],
    )

    response = client.delete(
        f"/api/v1/reviews/{review_id}",
        headers=auth_header(review_setup["reviewer_token"]),
    )

    assert response.status_code == 200

    with app.app_context():
        assert db.session.get(Review, review_id) is None


def test_delete_review_rejects_non_author(client: Any, app: Any, review_setup: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    review_id = create_review(
        app,
        review_setup["reviewer_id"],
        review_setup["breeder_id"],
    )

    response = client.delete(
        f"/api/v1/reviews/{review_id}",
        headers=auth_header(review_setup["other_token"]),
    )

    assert response.status_code == 403
