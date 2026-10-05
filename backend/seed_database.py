"""Reset and seed the local development database."""

from datetime import datetime, timedelta, timezone

from flask_migrate import upgrade
from sqlalchemy import text

from app import create_app
from app.extensions import db
from app.models.account_restriction import AccountRestriction
from app.models.breeder_profile import BreederProfile
from app.models.cat_listing import CatListing
from app.models.conversation import Conversation
from app.models.listing_image import ListingImage
from app.models.listing_report import ListingReport
from app.models.message import Message
from app.models.reviews import Review
from app.models.saved_listing import SavedListing
from app.models.user import User

DEMO_PASSWORD = "Password123!"
TRUNCATE_TABLES = (
    "account_restrictions",
    "listing_reports",
    "saved_listings",
    "messages",
    "conversations",
    "reviews",
    "listing_images",
    "cat_listings",
    "breeder_profiles",
    "users",
)

IMAGE_SETS = [
    [
        "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=1200&q=80",
    ],
    [
        "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=1200&q=80",
    ],
    [
        "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=1200&q=80",
    ],
    [
        "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?auto=format&fit=crop&w=1200&q=80",
    ],
    [
        "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=1200&q=80",
    ],
    [
        "https://images.unsplash.com/photo-1494256997604-768d1f608cac?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&w=1200&q=80",
    ],
    [
        "https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?auto=format&fit=crop&w=1200&q=80",
    ],
    [
        "https://images.unsplash.com/photo-1568152950566-c1bf43f4ab28?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1475518112798-86ae358241eb?auto=format&fit=crop&w=1200&q=80",
    ],
]


def now(days=0, hours=0):
    return datetime.now(timezone.utc) + timedelta(days=days, hours=hours)


def make_user(email, first_name, last_name, role, location, **extra):
    user = User(
        email=email,
        first_name=first_name,
        last_name=last_name,
        role=role,
        location=location,
        **extra,
    )
    user.set_password(DEMO_PASSWORD)
    db.session.add(user)
    return user


def make_profile(user, business_name, location, bio, status="verified"):
    profile = BreederProfile(
        user=user,
        business_name=business_name,
        location=location,
        bio=bio,
        certification_status=status,
        certification_document_url=f"https://example.com/certifications/{business_name.lower().replace(' ', '-')}.pdf",
        certification_admin_comment="Certification approved for demo data." if status == "verified" else None,
        verified_at=now(days=-45) if status == "verified" else None,
    )
    db.session.add(profile)
    return profile


def make_listing(profile, index, title, breed, age, gender, price, location, status, description):
    listing = CatListing(
        breeder=profile,
        title=title,
        breed=breed,
        age_months=age,
        gender=gender,
        price=price,
        location=location,
        description=description,
        status=status,
    )
    db.session.add(listing)
    db.session.flush()

    for image_index, image_url in enumerate(IMAGE_SETS[index]):
        db.session.add(ListingImage(listing=listing, image_url=image_url, is_main=image_index == 0))

    return listing


def reset_database():
    if db.engine.dialect.name == "postgresql":
        statement = "TRUNCATE TABLE " + ", ".join(TRUNCATE_TABLES) + " RESTART IDENTITY CASCADE"
        db.session.execute(text(statement))
    else:
        for model in (AccountRestriction, ListingReport, SavedListing, Message, Conversation, Review, ListingImage, CatListing, BreederProfile, User):
            db.session.query(model).delete()
    db.session.commit()


def seed_database():
    admin = make_user(
        "admin@purrfectmatch.test",
        "Avery",
        "Admin",
        "admin",
        "Paris",
        profile_picture_url="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
    )
    customer = make_user(
        "customer@purrfectmatch.test",
        "Mia",
        "Carter",
        "customer",
        "Lyon",
        phone_number="+33 6 10 20 30 40",
        profile_picture_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    )
    second_customer = make_user(
        "sam.customer@purrfectmatch.test",
        "Sam",
        "Rivera",
        "customer",
        "Nantes",
        phone_number="+33 6 20 30 40 50",
        profile_picture_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    )
    suspended_customer = make_user("suspended.customer@purrfectmatch.test", "Casey", "Stone", "customer", "Lille")
    suspended_customer.status = "suspended"
    suspended_customer.suspended_until = now(days=7)
    suspended_customer.moderation_reason = "Demo suspension for admin testing."

    breeder_user = make_user(
        "breeder@purrfectmatch.test",
        "Nora",
        "Sterling",
        "breeder",
        "Paris",
        phone_number="+33 6 30 40 50 60",
        profile_picture_url="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80",
    )
    second_breeder_user = make_user(
        "luna.breeder@purrfectmatch.test",
        "Luna",
        "Moreau",
        "breeder",
        "Bordeaux",
        phone_number="+33 6 40 50 60 70",
        profile_picture_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    )
    pending_user = make_user(
        "pending.breeder@purrfectmatch.test",
        "Camille",
        "Laurent",
        "breeder",
        "Marseille",
        phone_number="+33 6 50 60 70 80",
    )

    sterling = make_profile(breeder_user, "Sterling Ragdolls", "Paris", "Small family cattery focused on calm, socialized Ragdoll kittens.")
    velvet = make_profile(second_breeder_user, "Velvet Paws Maine Coons", "Bordeaux", "Ethical Maine Coon breeder with health-tested parents and home-raised kittens.")
    make_profile(pending_user, "Future Felines Marseille", "Marseille", "New breeder application waiting for admin review.", status="pending")
    db.session.flush()

    listing_specs = [
        (sterling, 0, "Mochi - blue point Ragdoll kitten", "Ragdoll", 4, "female", 1450, "Paris", "available", "Gentle kitten, litter trained, raised around children and ready for visits."),
        (sterling, 1, "Nimbus - seal bicolor Ragdoll", "Ragdoll", 5, "male", 1320, "Paris", "reserved", "Curious and playful kitten with first vaccinations and vet passport."),
        (sterling, 2, "Pearl - affectionate British Shorthair", "British Shorthair", 8, "female", 980, "Versailles", "available", "Calm young cat, microchipped, ideal for a quiet indoor home."),
        (sterling, 3, "Atlas - retired Ragdoll companion", "Ragdoll", 26, "male", 450, "Paris", "sold", "Adult companion cat, neutered, affectionate and used to apartment life."),
        (velvet, 4, "Willow - silver Maine Coon kitten", "Maine Coon", 3, "female", 1680, "Bordeaux", "available", "Large-boned kitten from health-tested parents, very confident and social."),
        (velvet, 5, "Orion - classic tabby Maine Coon", "Maine Coon", 6, "male", 1550, "Bordeaux", "available", "Playful male kitten with complete vaccination plan and contract."),
        (velvet, 6, "Suki - Siberian kitten", "Siberian", 4, "female", 1280, "Toulouse", "available", "Sweet hypoallergenic line kitten, confident with visitors."),
        (velvet, 7, "Cosmo - archived demo listing", "Maine Coon", 9, "male", 1100, "Bordeaux", "archived", "Archived listing kept only so admin stats can show moderation behavior."),
    ]
    listings = [make_listing(*spec) for spec in listing_specs]

    db.session.add_all([
        SavedListing(user=customer, listing=listings[0], created_at=now(days=-4)),
        SavedListing(user=customer, listing=listings[4], created_at=now(days=-3)),
        SavedListing(user=customer, listing=listings[5], created_at=now(days=-2)),
        SavedListing(user=second_customer, listing=listings[2], created_at=now(days=-1)),
    ])

    conversations = [
        Conversation(customer=customer, breeder=sterling, listing=listings[0], created_at=now(days=-5), updated_at=now(days=-4)),
        Conversation(customer=customer, breeder=velvet, listing=listings[4], created_at=now(days=-3), updated_at=now(days=-2)),
        Conversation(customer=second_customer, breeder=sterling, listing=listings[2], created_at=now(days=-2), updated_at=now(days=-1)),
    ]
    db.session.add_all(conversations)
    db.session.flush()
    db.session.add_all([
        Message(conversation=conversations[0], sender=customer, content="Hi, is Mochi still available for a visit this weekend?", is_read=True, created_at=now(days=-5, hours=1)),
        Message(conversation=conversations[0], sender=breeder_user, content="Yes, Saturday afternoon works. I can send the health booklet before the visit.", is_read=False, created_at=now(days=-4, hours=2)),
        Message(conversation=conversations[1], sender=customer, content="Could you confirm Willow's vaccination dates?", is_read=True, created_at=now(days=-3, hours=2)),
        Message(conversation=conversations[1], sender=second_breeder_user, content="Of course. She had her first vaccine last week and the booster is scheduled.", is_read=False, created_at=now(days=-2, hours=2)),
        Message(conversation=conversations[2], sender=second_customer, content="Pearl looks perfect for my apartment. Is she okay with quiet homes?", is_read=True, created_at=now(days=-2, hours=1)),
        Message(conversation=conversations[2], sender=breeder_user, content="Yes, she is very calm and would fit that environment well.", is_read=False, created_at=now(days=-1, hours=1)),
    ])

    db.session.add_all([
        Review(reviewer=customer, breeder=sterling, rating=5, comment="Very transparent breeder, clear documents and lovely kittens."),
        Review(reviewer=customer, breeder=velvet, rating=4, comment="Helpful answers and clean communication throughout the process."),
        Review(reviewer=second_customer, breeder=sterling, rating=5, comment="Great visit, the cats were social and well cared for."),
        ListingReport(listing=listings[1], reporter=customer, reason="misleading_information", comment="The listing says available in one section but appears reserved.", status="pending"),
        ListingReport(listing=listings[5], reporter=second_customer, reason="other", comment="Demo resolved report for admin history.", status="rejected", admin_comment="Checked during seed review; no action required.", reviewer=admin, reviewed_at=now(days=-1)),
        AccountRestriction(email=suspended_customer.email, user=suspended_customer, restriction_type="suspension", reason="Demo suspension for admin testing.", admin=admin, expires_at=suspended_customer.suspended_until),
    ])

    db.session.commit()
    return {
        "users": User.query.count(),
        "breeders": BreederProfile.query.count(),
        "listings": CatListing.query.count(),
        "listing_images": ListingImage.query.count(),
        "saved_listings": SavedListing.query.count(),
        "conversations": Conversation.query.count(),
        "messages": Message.query.count(),
        "reviews": Review.query.count(),
        "reports": ListingReport.query.count(),
    }


def main():
    app = create_app()
    with app.app_context():
        upgrade()
        reset_database()
        counts = seed_database()

    print("Development database reset and seeded.")
    print(f"Demo password for every demo account: {DEMO_PASSWORD}")
    print("Accounts:")
    for email in (
        "admin@purrfectmatch.test",
        "breeder@purrfectmatch.test",
        "customer@purrfectmatch.test",
        "pending.breeder@purrfectmatch.test",
    ):
        print(f"  {email}")
    print("Counts:")
    for key, value in counts.items():
        print(f"  {key}: {value}")


if __name__ == "__main__":
    main()
