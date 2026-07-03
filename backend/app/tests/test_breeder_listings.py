from flask_jwt_extended import create_access_token

from ..extensions import db
from ..models.breeder_profile import BreederProfile
from ..models.cat_listing import CatListing
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


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def create_breeder_delete_setup(app):
    with app.app_context():
        owner_user = create_user("owner-delete-listing@test.com", role="breeder")
        other_breeder_user = create_user("other-delete-listing@test.com", role="breeder")
        customer = create_user("customer-delete-own-listing@test.com")
        db.session.add_all([owner_user, other_breeder_user, customer])
        db.session.flush()

        owner_profile = BreederProfile(
            user_id=owner_user.id,
            business_name="Owner Cattery",
            location="Paris",
            certification_status="verified",
        )
        other_profile = BreederProfile(
            user_id=other_breeder_user.id,
            business_name="Other Cattery",
            location="Lyon",
            certification_status="verified",
        )
        db.session.add_all([owner_profile, other_profile])
        db.session.flush()

        listing = CatListing(
            breeder_id=owner_profile.id,
            title="Owner kitten",
            breed="Ragdoll",
            age_months=4,
            gender="female",
            price=1300,
            location="Paris",
            status="available",
        )
        archived_listing = CatListing(
            breeder_id=owner_profile.id,
            title="Already archived kitten",
            breed="Ragdoll",
            age_months=5,
            gender="male",
            price=1100,
            location="Paris",
            status="archived",
        )
        db.session.add_all([listing, archived_listing])
        db.session.commit()

        return {
            "listing_id": listing.id,
            "archived_listing_id": archived_listing.id,
            "owner_token": create_access_token(identity=str(owner_user.id)),
            "other_breeder_token": create_access_token(identity=str(other_breeder_user.id)),
            "customer_token": create_access_token(identity=str(customer.id)),
        }


def test_breeder_can_delete_own_listing(client, app):
    setup = create_breeder_delete_setup(app)

    response = client.delete(
        f"/api/v1/listings/{setup['listing_id']}",
        headers=auth_header(setup["owner_token"]),
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["success"] is True
    assert payload["data"]["listing"]["status"] == "archived"

    public_response = client.get(f"/api/v1/listings/{setup['listing_id']}")
    assert public_response.status_code == 404

    with app.app_context():
        listing = db.session.get(CatListing, setup["listing_id"])
        assert listing.status == "archived"


def test_breeder_cannot_delete_another_breeders_listing(client, app):
    setup = create_breeder_delete_setup(app)

    response = client.delete(
        f"/api/v1/listings/{setup['listing_id']}",
        headers=auth_header(setup["other_breeder_token"]),
    )

    assert response.status_code == 403
    assert response.get_json()["success"] is False


def test_customer_cannot_delete_listing(client, app):
    setup = create_breeder_delete_setup(app)

    response = client.delete(
        f"/api/v1/listings/{setup['listing_id']}",
        headers=auth_header(setup["customer_token"]),
    )

    assert response.status_code == 403
    assert response.get_json()["success"] is False


def test_breeder_delete_archived_listing_returns_404(client, app):
    setup = create_breeder_delete_setup(app)

    response = client.delete(
        f"/api/v1/listings/{setup['archived_listing_id']}",
        headers=auth_header(setup["owner_token"]),
    )

    assert response.status_code == 404
    assert response.get_json()["success"] is False


def test_breeder_delete_missing_listing_returns_404(client, app):
    setup = create_breeder_delete_setup(app)

    response = client.delete(
        "/api/v1/listings/999999",
        headers=auth_header(setup["owner_token"]),
    )

    assert response.status_code == 404
    assert response.get_json()["success"] is False
