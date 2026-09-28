'''Security tests for authentication tokens, passwords, and login inputs.'''

from typing import Any

from ..extensions import db
from ..models.user import User


def register_user(client: Any, email: str = 'security@test.com') -> None:
    response = client.post(
        '/api/v1/auth/register',
        json={
            'email': email,
            'password': 'password123',
            'first_name': 'Security',
            'last_name': 'Test',
        },
    )
    assert response.status_code == 201


def login_user(client: Any, email: str = 'security@test.com') -> Any:
    return client.post(
        '/api/v1/auth/login',
        json={'email': email, 'password': 'password123'},
    )


def test_login_returns_access_token_and_httponly_refresh_cookie(
    client: Any,
    app: Any,
) -> None:
    register_user(client)

    response = login_user(client)

    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['access_token']
    assert data['token'] == data['access_token']
    assert data['refresh_csrf_token']
    assert response.headers['Cache-Control'] == 'no-store'

    refresh_cookie_name = app.config['JWT_REFRESH_COOKIE_NAME']
    refresh_cookie_headers = [
        value
        for value in response.headers.getlist('Set-Cookie')
        if value.startswith(f'{refresh_cookie_name}=')
    ]
    assert len(refresh_cookie_headers) == 1
    assert 'HttpOnly' in refresh_cookie_headers[0]


def test_refresh_requires_csrf_and_rotates_tokens(client: Any, app: Any) -> None:
    register_user(client)
    login_response = login_user(client)
    original_access = login_response.get_json()['data']['access_token']
    csrf_token = login_response.get_json()['data']['refresh_csrf_token']

    refresh_cookie_name = app.config['JWT_REFRESH_COOKIE_NAME']
    refresh_path = app.config['JWT_REFRESH_COOKIE_PATH']
    original_refresh = client.get_cookie(refresh_cookie_name, path=refresh_path)
    assert original_refresh is not None

    csrf_response = client.get('/api/v1/auth/refresh/csrf')
    assert csrf_response.status_code == 200
    assert (
        csrf_response.get_json()['data']['refresh_csrf_token'] == csrf_token
    )

    missing_csrf_response = client.post('/api/v1/auth/refresh')
    assert missing_csrf_response.status_code == 401

    refresh_response = client.post(
        '/api/v1/auth/refresh',
        headers={app.config['JWT_REFRESH_CSRF_HEADER_NAME']: csrf_token},
    )

    assert refresh_response.status_code == 200
    refreshed_access = refresh_response.get_json()['data']['access_token']
    rotated_csrf = refresh_response.get_json()['data']['refresh_csrf_token']
    assert rotated_csrf != csrf_token
    assert refreshed_access != original_access

    rotated_refresh = client.get_cookie(refresh_cookie_name, path=refresh_path)
    assert rotated_refresh is not None
    assert rotated_refresh.value != original_refresh.value


def test_logout_clears_refresh_cookie(client: Any, app: Any) -> None:
    register_user(client)
    login_response = login_user(client)
    csrf_token = login_response.get_json()['data']['refresh_csrf_token']

    refresh_cookie_name = app.config['JWT_REFRESH_COOKIE_NAME']
    refresh_path = app.config['JWT_REFRESH_COOKIE_PATH']
    assert client.get_cookie(refresh_cookie_name, path=refresh_path) is not None

    missing_csrf_response = client.post('/api/v1/auth/logout')
    assert missing_csrf_response.status_code == 401

    response = client.post(
        '/api/v1/auth/logout',
        headers={
            app.config['JWT_REFRESH_CSRF_HEADER_NAME']: csrf_token,
        },
    )

    assert response.status_code == 200
    assert client.get_cookie(refresh_cookie_name, path=refresh_path) is None


def test_password_is_hashed_and_never_serialized(
    client: Any,
    app: Any,
) -> None:
    register_user(client)

    with app.app_context():
        user = User.query.filter_by(email='security@test.com').one()
        assert user.password_hash != 'password123'
        assert user.check_password('password123')
        assert user.password_hash.startswith('scrypt:32768:8:1$')
        serialized_user = user.to_dict()

    assert 'password' not in serialized_user
    assert 'password_hash' not in serialized_user


def test_sql_injection_payload_cannot_bypass_login(client: Any) -> None:
    register_user(client)

    response = client.post(
        '/api/v1/auth/login',
        json={
            'email': "security@test.com' OR 1=1 --",
            'password': 'password123',
        },
    )

    assert response.status_code == 401
    assert response.get_json()['error']['code'] == 'INVALID_CREDENTIALS'


def test_registration_cannot_create_admin(client: Any, app: Any) -> None:
    response = client.post(
        '/api/v1/auth/register',
        json={
            'email': 'attacker@test.com',
            'password': 'password123',
            'first_name': 'Not',
            'last_name': 'Admin',
            'role': 'admin',
        },
    )

    assert response.status_code == 400
    with app.app_context():
        assert db.session.query(User).filter_by(email='attacker@test.com').first() is None


def test_auth_rejects_non_object_and_non_string_inputs(client: Any) -> None:
    register_response = client.post(
        '/api/v1/auth/register',
        json={
            'email': ['not', 'an', 'email'],
            'password': 'password123',
            'first_name': 'Security',
            'last_name': 'Test',
        },
    )
    login_response = client.post(
        '/api/v1/auth/login',
        json={'email': {'unexpected': 'object'}, 'password': 'password123'},
    )

    assert register_response.status_code == 400
    assert login_response.status_code == 400


def test_auth_rejects_oversized_password(client: Any) -> None:
    response = client.post(
        '/api/v1/auth/login',
        json={'email': 'security@test.com', 'password': 'x' * 129},
    )
    assert response.status_code == 400
