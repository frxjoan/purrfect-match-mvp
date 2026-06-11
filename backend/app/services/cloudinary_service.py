import cloudinary.uploader


ALLOWED_CERTIFICATION_EXTENSIONS = {"pdf", "png", "jpg", "jpeg"}


def allowed_certification_file(filename):
    if not filename or "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()
    return extension in ALLOWED_CERTIFICATION_EXTENSIONS


def upload_certification_document(file):
    if not allowed_certification_file(file.filename):
        raise ValueError("Invalid file type. Allowed types: pdf, png, jpg, jpeg.")

    result = cloudinary.uploader.upload(
        file,
        folder="purrfect-match/certifications",
        resource_type="auto",
    )

    return result["secure_url"]
