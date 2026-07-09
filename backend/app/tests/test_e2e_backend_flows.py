"""End-to-end backend flow tests for core MVP behavior."""

from typing import Any

from io import BytesIO

from ..extensions import db
from ..models.cat_listing import CatListing
from ..models.user import User


def auth_header(token: Any) -> Any:
    """Build an Authorization header for a JWT token."""
    return {"Authorization": f"Bearer {token}"}


def register(client: Any, email: Any, first_name: Any = "Test") -> Any:
    """Register a test user through the API."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "password123",
            "first_name": first_name,
            "last_name": "E2E",
            "location": "Paris",
        },
    )
    assert response.status_code == 201
    return response.get_json()["data"]["user"]


def login(client: Any, email: Any) -> Any:
    """Log in a test user through the API."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": "password123",
        },
    )
    assert response.status_code == 200
    return response.get_json()["data"]["token"]


def make_admin(app: Any, email: Any) -> Any:
    """Promote a test user to admin role."""
    with app.app_context():
        admin = User.query.filter_by(email=email).one()
        admin.role = "admin"
        db.session.commit()
        return admin.id


def test_buyer_breeder_moderation_e2e_flow(client: Any, app: Any, monkeypatch: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    monkeypatch.setattr(
        "app.routes.breeders.upload_certification_document",
        lambda file: "https://example.test/certification.png",
    )
    monkeypatch.setattr(
        "app.routes.listings.upload_listing_image",
        lambda file: "https://example.test/listing.png",
    )

    assert client.get("/api/v1/health").status_code == 200

    customer = register(client, "e2e-customer@test.com", "Customer")
    breeder_user = register(client, "e2e-breeder@test.com", "Breeder")
    admin_user = register(client, "e2e-admin@test.com", "Admin")
    other_user = register(client, "e2e-other@test.com", "Other")

    customer_token = login(client, "e2e-customer@test.com")
    breeder_token = login(client, "e2e-breeder@test.com")
    admin_id = make_admin(app, "e2e-admin@test.com")
    admin_token = login(client, "e2e-admin@test.com")
    other_token = login(client, "e2e-other@test.com")

    apply_response = client.post(
        "/api/v1/breeders/apply",
        headers=auth_header(breeder_token),
        data={
            "business_name": "E2E Cattery",
            "location": "Paris",
            "bio": "E2E verified breeder.",
            "certification_document": (
                BytesIO(b"fake-certification"),
                "certification.png",
            ),
        },
        content_type="multipart/form-data",
    )
    assert apply_response.status_code == 201
    breeder_id = apply_response.get_json()["data"]["breeder_profile"]["id"]

    approve_response = client.post(
        f"/api/v1/admin/certifications/{breeder_id}/approve",
        headers=auth_header(admin_token),
        json={"comment": "Approved in E2E."},
    )
    assert approve_response.status_code == 200

    listing_response = client.post(
        "/api/v1/listings",
        headers=auth_header(breeder_token),
        data={
            "title": "E2E kitten",
            "breed": "Ragdoll",
            "age_months": "4",
            "gender": "female",
            "price": "1200",
            "location": "Paris",
            "description": "Created in backend E2E.",
            "images": (BytesIO(b"fake-image"), "cat.png"),
        },
        content_type="multipart/form-data",
    )
    assert listing_response.status_code == 201
    listing_id = listing_response.get_json()["data"]["id"]

    listing_filter_response = client.get("/api/v1/listings?breed=Ragdoll&location=Paris")
    assert listing_filter_response.status_code == 200
    assert listing_filter_response.get_json()["data"]["count"] == 1

    conversation_response = client.post(
        "/api/v1/conversations",
        headers=auth_header(customer_token),
        json={"listing_id": listing_id},
    )
    assert conversation_response.status_code == 201
    conversation_id = conversation_response.get_json()["data"]["conversation"]["id"]

    customer_message_response = client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers=auth_header(customer_token),
        json={"content": "Is this kitten still available?"},
    )
    assert customer_message_response.status_code == 201
    customer_message_id = customer_message_response.get_json()["data"]["message"]["id"]

    breeder_message_response = client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers=auth_header(breeder_token),
        json={"content": "Yes, she is available."},
    )
    assert breeder_message_response.status_code == 201

    read_response = client.patch(
        f"/api/v1/messages/{customer_message_id}/read",
        headers=auth_header(breeder_token),
    )
    assert read_response.status_code == 200

    unauthorized_messages_response = client.get(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers=auth_header(other_token),
    )
    assert unauthorized_messages_response.status_code == 403

    review_response = client.post(
        f"/api/v1/breeders/{breeder_id}/reviews",
        headers=auth_header(customer_token),
        json={"rating": 5, "comment": "Great communication."},
    )
    assert review_response.status_code == 201
    review_id = review_response.get_json()["data"]["review"]["id"]

    update_review_response = client.patch(
        f"/api/v1/reviews/{review_id}",
        headers=auth_header(customer_token),
        json={"rating": 4, "comment": "Updated after E2E."},
    )
    assert update_review_response.status_code == 200

    report_response = client.post(
        f"/api/v1/listings/{listing_id}/reports",
        headers=auth_header(customer_token),
        json={
            "reason": "misleading_information",
            "comment": "Smoke moderation report.",
        },
    )
    assert report_response.status_code == 201
    report_id = report_response.get_json()["data"]["report"]["id"]

    accept_report_response = client.patch(
        f"/api/v1/admin/reports/{report_id}",
        headers=auth_header(admin_token),
        json={
            "decision": "accepted",
            "admin_comment": "Accepted in E2E.",
        },
    )
    assert accept_report_response.status_code == 200
    assert accept_report_response.get_json()["data"]["report"]["reviewed_by"] == admin_id

    ban_response = client.post(
        f"/api/v1/admin/users/{breeder_user['id']}/restrictions",
        headers=auth_header(admin_token),
        json={
            "restriction_type": "ban",
            "reason": "E2E moderation ban.",
        },
    )
    assert ban_response.status_code == 201
    assert ban_response.get_json()["data"]["archived_listings_count"] == 1

    banned_login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "e2e-breeder@test.com",
            "password": "password123",
        },
    )
    assert banned_login_response.status_code == 403

    with app.app_context():
        listing = db.session.get(CatListing, listing_id)
        assert listing.status == "archived"


def test_e2e_register_rejects_restricted_email(client: Any, app: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    admin = register(client, "e2e-restrict-admin@test.com", "Admin")
    blocked = register(client, "e2e-blocked@test.com", "Blocked")
    make_admin(app, "e2e-restrict-admin@test.com")
    admin_token = login(client, "e2e-restrict-admin@test.com")

    restriction_response = client.post(
        f"/api/v1/admin/users/{blocked['id']}/restrictions",
        headers=auth_header(admin_token),
        json={
            "restriction_type": "ban",
            "reason": "E2E ban for registration check.",
        },
    )
    assert restriction_response.status_code == 201

    duplicate_login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "e2e-blocked@test.com",
            "password": "password123",
        },
    )
    assert duplicate_login_response.status_code == 403

    with app.app_context():
        user = db.session.get(User, blocked["id"])
        db.session.delete(user)
        db.session.commit()

    blocked_register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "e2e-blocked@test.com",
            "password": "password123",
            "first_name": "Blocked",
            "last_name": "Again",
        },
    )
    assert blocked_register_response.status_code == 403
