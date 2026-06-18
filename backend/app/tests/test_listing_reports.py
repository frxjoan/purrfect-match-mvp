import pytest
from flask_jwt_extended import create_access_token

from ..extensions import db
from ..models.breeder_profile import BreederProfile
from ..models.cat_listing import CatListing
from ..models.listing_report import ListingReport
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
def report_setup(app):
    with app.app_context():
        reporter = create_user("reporter@test.com")
        owner = create_user("owner-report@test.com", role="breeder")
        other = create_user("other-report@test.com")
        admin = create_user("admin-report@test.com", role="admin")

        db.session.add_all([reporter, owner, other, admin])
        db.session.flush()

        breeder_profile = BreederProfile(
            user_id=owner.id,
            business_name="Reported Breeder",
            location="Paris",
            certification_status="verified",
        )
        db.session.add(breeder_profile)
        db.session.flush()

        listing = CatListing(
            breeder_id=breeder_profile.id,
            title="Reported kitten",
            breed="Maine Coon",
            age_months=4,
            gender="female",
            price=1200,
            location="Paris",
            status="available",
        )
        archived_listing = CatListing(
            breeder_id=breeder_profile.id,
            title="Archived kitten",
            breed="Maine Coon",
            age_months=5,
            gender="male",
            price=1000,
            location="Paris",
            status="archived",
        )
        db.session.add_all([listing, archived_listing])
        db.session.commit()

        return {
            "listing_id": listing.id,
            "archived_listing_id": archived_listing.id,
            "reporter_id": reporter.id,
            "reporter_token": create_access_token(identity=str(reporter.id)),
            "owner_token": create_access_token(identity=str(owner.id)),
            "other_token": create_access_token(identity=str(other.id)),
            "admin_id": admin.id,
            "admin_token": create_access_token(identity=str(admin.id)),
        }


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def create_report(app, reporter_id, listing_id):
    with app.app_context():
        report = ListingReport(
            reporter_id=reporter_id,
            listing_id=listing_id,
            reason="suspected_scam",
            comment="Looks suspicious.",
        )
        db.session.add(report)
        db.session.commit()
        return report.id


def test_create_listing_report_success(client, report_setup):
    response = client.post(
        f"/api/v1/listings/{report_setup['listing_id']}/reports",
        headers=auth_header(report_setup["reporter_token"]),
        json={
            "reason": "misleading_information",
            "comment": "The description does not match the photos.",
        },
    )

    assert response.status_code == 201
    payload = response.get_json()
    assert payload["success"] is True
    assert payload["data"]["report"]["status"] == "pending"
    assert payload["data"]["report"]["reason"] == "misleading_information"


def test_create_listing_report_requires_auth(client, report_setup):
    response = client.post(
        f"/api/v1/listings/{report_setup['listing_id']}/reports",
        json={"reason": "suspected_scam"},
    )

    assert response.status_code == 401


def test_create_listing_report_rejects_invalid_reason(client, report_setup):
    response = client.post(
        f"/api/v1/listings/{report_setup['listing_id']}/reports",
        headers=auth_header(report_setup["reporter_token"]),
        json={"reason": "not_a_reason"},
    )

    assert response.status_code == 400
    assert response.get_json()["success"] is False


def test_create_listing_report_rejects_owner(client, report_setup):
    response = client.post(
        f"/api/v1/listings/{report_setup['listing_id']}/reports",
        headers=auth_header(report_setup["owner_token"]),
        json={"reason": "suspected_scam"},
    )

    assert response.status_code == 403


def test_create_listing_report_rejects_duplicate(client, app, report_setup):
    create_report(
        app,
        report_setup["reporter_id"],
        report_setup["listing_id"],
    )

    response = client.post(
        f"/api/v1/listings/{report_setup['listing_id']}/reports",
        headers=auth_header(report_setup["reporter_token"]),
        json={"reason": "duplicate_listing"},
    )

    assert response.status_code == 409


def test_create_listing_report_rejects_archived_listing(client, report_setup):
    response = client.post(
        f"/api/v1/listings/{report_setup['archived_listing_id']}/reports",
        headers=auth_header(report_setup["reporter_token"]),
        json={"reason": "other"},
    )

    assert response.status_code == 404


def test_admin_list_reports_requires_admin(client, report_setup):
    response = client.get(
        "/api/v1/admin/reports",
        headers=auth_header(report_setup["reporter_token"]),
    )

    assert response.status_code == 403


def test_admin_can_list_and_get_report(client, app, report_setup):
    report_id = create_report(
        app,
        report_setup["reporter_id"],
        report_setup["listing_id"],
    )

    list_response = client.get(
        "/api/v1/admin/reports",
        headers=auth_header(report_setup["admin_token"]),
    )
    assert list_response.status_code == 200
    assert list_response.get_json()["data"]["count"] == 1

    detail_response = client.get(
        f"/api/v1/admin/reports/{report_id}",
        headers=auth_header(report_setup["admin_token"]),
    )
    assert detail_response.status_code == 200
    assert detail_response.get_json()["data"]["report"]["id"] == report_id


def test_admin_can_accept_report(client, app, report_setup):
    report_id = create_report(
        app,
        report_setup["reporter_id"],
        report_setup["listing_id"],
    )

    response = client.patch(
        f"/api/v1/admin/reports/{report_id}",
        headers=auth_header(report_setup["admin_token"]),
        json={
            "decision": "accepted",
            "admin_comment": "Confirmed by moderation.",
        },
    )

    assert response.status_code == 200
    payload = response.get_json()
    report = payload["data"]["report"]
    assert report["status"] == "accepted"
    assert report["reviewed_by"] == report_setup["admin_id"]
    assert report["reviewed_at"] is not None


def test_admin_rejects_invalid_report_decision(client, app, report_setup):
    report_id = create_report(
        app,
        report_setup["reporter_id"],
        report_setup["listing_id"],
    )

    response = client.patch(
        f"/api/v1/admin/reports/{report_id}",
        headers=auth_header(report_setup["admin_token"]),
        json={"decision": "maybe"},
    )

    assert response.status_code == 400
