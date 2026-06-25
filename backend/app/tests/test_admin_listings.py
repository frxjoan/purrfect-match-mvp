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


def create_listing_setup(app):
    with app.app_context():
        admin = create_user("admin-delete-listing@test.com", role="admin")
        customer = create_user("customer-delete-listing@test.com")
        breeder_user = create_user("breeder-delete-listing@test.com", role="breeder")
        db.session.add_all([admin, customer, breeder_user])
        db.session.flush()

        breeder = BreederProfile(
            user_id=breeder_user.id,
            business_name="Delete Listing Cattery",
            location="Paris",
            certification_status="verified",
        )
        db.session.add(breeder)
        db.session.flush()

        listing = CatListing(
            breeder_id=breeder.id,
            title="Fraudulent listing",
            breed="Ragdoll",
            age_months=3,
            gender="female",
            price=1200,
            location="Paris",
            status="available",
        )
        db.session.add(listing)
        db.session.commit()

        return {
            "listing_id": listing.id,
            "admin_token": create_access_token(identity=str(admin.id)),
            "customer_token": create_access_token(identity=str(customer.id)),
        }


def test_admin_can_archive_listing_with_delete(client, app):
    setup = create_listing_setup(app)

    response = client.delete(
        f"/api/v1/admin/listings/{setup['listing_id']}",
        headers=auth_header(setup["admin_token"]),
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


def test_admin_delete_listing_requires_admin(client, app):
    setup = create_listing_setup(app)

    response = client.delete(
        f"/api/v1/admin/listings/{setup['listing_id']}",
        headers=auth_header(setup["customer_token"]),
    )

    assert response.status_code == 403
    assert response.get_json()["success"] is False


def test_admin_delete_listing_returns_404_for_missing_listing(client, app):
    setup = create_listing_setup(app)

    response = client.delete(
        "/api/v1/admin/listings/999999",
        headers=auth_header(setup["admin_token"]),
    )

    assert response.status_code == 404
    assert response.get_json()["success"] is False
