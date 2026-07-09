"""Health check route used to verify backend availability."""

from typing import Any


from flask import Blueprint, jsonify

health_bp: Blueprint = Blueprint("health", __name__, url_prefix="/api/v1/health")


@health_bp.get("")
def health_check() -> Any:
    """Return backend health status for monitoring."""

    return jsonify({
        "success": True,
        "data": {
            "service": "backend",
            "status": "ok",
        },
    }), 200
