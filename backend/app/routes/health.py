from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__, url_prefix="/api/v1/health")


@health_bp.get("")
def health_check():
    return jsonify({
        "success": True,
        "data": {
            "service": "backend",
            "status": "ok",
        },
    }), 200
