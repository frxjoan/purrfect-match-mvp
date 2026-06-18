import pytest
from flask_jwt_extended import create_access_token

from ..extensions import db
from ..models.breeder_profile import BreederProfile
from ..models.reviews import Review
from ..models.user import User


def create_user(email, role="customer"):
    user = User(
        email=email,
        first_name="Test",
        last_name="User",
        role=role,
    )
    user.set_password("password123")
    return user


@pytest.fixture()
def review_setup(app):
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


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def create_review(app, reviewer_id, breeder_id, rating=5, comment="Great breeder."):
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


def test_list_breeder_reviews_is_public(client, app, review_setup):
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


def test_create_review_success(client, review_setup):
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


def test_create_review_requires_auth(client, review_setup):
    response = client.post(
        f"/api/v1/breeders/{review_setup['breeder_id']}/reviews",
        json={"rating": 5},
    )

    assert response.status_code == 401


@pytest.mark.parametrize("rating", [0, 6, 4.5, "bad", True])
def test_create_review_rejects_invalid_rating(client, review_setup, rating):
    response = client.post(
        f"/api/v1/breeders/{review_setup['breeder_id']}/reviews",
        headers=auth_header(review_setup["reviewer_token"]),
        json={"rating": rating},
    )

    assert response.status_code == 400
    assert response.get_json()["success"] is False


def test_create_review_rejects_own_breeder_profile(client, review_setup):
    response = client.post(
        f"/api/v1/breeders/{review_setup['breeder_id']}/reviews",
        headers=auth_header(review_setup["owner_token"]),
        json={"rating": 5},
    )

    assert response.status_code == 403


def test_create_review_rejects_duplicate(client, app, review_setup):
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


def test_update_review_success(client, app, review_setup):
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


def test_update_review_rejects_non_author(client, app, review_setup):
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


def test_delete_review_success(client, app, review_setup):
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


def test_delete_review_rejects_non_author(client, app, review_setup):
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
