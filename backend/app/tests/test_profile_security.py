"""Security tests for editable profile fields and image URLs."""

from typing import Any

from flask_jwt_extended import create_access_token

from ..extensions import db
from ..models.user import User


def create_profile_user(app: Any) -> tuple[int, str]:
    """Create a user and return its id plus bearer token."""
    with app.app_context():
        user = User(
            email="profile-security@test.com",
            first_name="Profile",
            last_name="Security",
            role="customer",
        )
        user.set_password("password123")
        db.session.add(user)
        db.session.commit()
        return user.id, create_access_token(identity=str(user.id))


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_profile_rejects_dangerous_image_url(
    client: Any,
    app: Any,
) -> None:
    user_id, token = create_profile_user(app)

    response = client.patch(
        "/api/v1/users/me",
        headers=auth_header(token),
        json={"profile_picture_url": "javascript:alert(1)"},
    )

    assert response.status_code == 400
    with app.app_context():
        assert db.session.get(User, user_id).profile_picture_url is None


def test_profile_accepts_https_image_url(client: Any, app: Any) -> None:
    _user_id, token = create_profile_user(app)
    image_url = "https://res.cloudinary.com/demo/image/upload/avatar.png"

    response = client.patch(
        "/api/v1/users/me",
        headers=auth_header(token),
        json={"profile_picture_url": image_url},
    )

    assert response.status_code == 200
    assert response.get_json()["data"]["user"]["profile_picture_url"] == image_url


def test_profile_rejects_malformed_field_types(
    client: Any,
    app: Any,
) -> None:
    _user_id, token = create_profile_user(app)

    response = client.patch(
        "/api/v1/users/me",
        headers=auth_header(token),
        json={"first_name": {"html": "<script>alert(1)</script>"}},
    )

    assert response.status_code == 400
