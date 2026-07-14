"""Basic backend health, registration, and login tests."""

from typing import Any

def test_health_check(client: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    response = client.get('/api/v1/health')

    assert response.status_code == 200
    assert response.get_json() == {
        'success': True,
        'data': {
            'service': 'backend',
            'status': 'ok',
        },
    }


def test_register_and_login(client: Any) -> Any:
    """Validate the expected backend behavior for this scenario."""
    register_response = client.post(
        '/api/v1/auth/register',
        json={
            'email': 'customer@test.com',
            'password': 'password123',
            'first_name': 'Customer',
            'last_name': 'Test',
        },
    )

    assert register_response.status_code == 201
    assert register_response.get_json()['success'] is True
    assert register_response.get_json()['data']['user']['role'] == 'customer'
    assert register_response.get_json()['data']['user']['breeder_certification_status'] is None

    login_response = client.post(
        '/api/v1/auth/login',
        json={
        'email': 'customer@test.com',
        'password': 'password123',
        },
    )

    assert login_response.status_code == 200
    assert login_response.get_json()['data']['token']


def test_register_can_create_breeder_account(client):
    response = client.post(
        '/api/v1/auth/register',
        json={
            'email': 'breeder@test.com',
            'password': 'password123',
            'first_name': 'Breeder',
            'last_name': 'Test',
            'role': 'breeder',
        },
    )

    assert response.status_code == 201
    user = response.get_json()['data']['user']
    assert user['role'] == 'breeder'
    assert user['breeder_certification_status'] == 'unverified'

    login_response = client.post(
        '/api/v1/auth/login',
        json={
            'email': 'breeder@test.com',
            'password': 'password123',
        },
    )

    assert login_response.status_code == 200
    login_user = login_response.get_json()['data']['user']
    assert login_user['role'] == 'breeder'
    assert login_user['breeder_certification_status'] == 'unverified'


def test_register_rejects_public_admin_role(client):
    response = client.post(
        '/api/v1/auth/register',
        json={
            'email': 'admin-register@test.com',
            'password': 'password123',
            'first_name': 'Admin',
            'last_name': 'Test',
            'role': 'admin',
        },
    )

    assert response.status_code == 400
    assert response.get_json()['success'] is False