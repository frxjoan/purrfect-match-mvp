import pytest


@pytest.mark.parametrize(
  ('path', 'resource'),
  [
    ('/api/v1/auth', 'auth'),
    ('/api/v1/users', 'users'),
    ('/api/v1/breeders', 'breeders'),
    ('/api/v1/listings', 'listings'),
    ('/api/v1/conversations', 'conversations'),
    ('/api/v1/admin', 'admin'),
  ],
)
def test_placeholder_resources_are_registered(client, path, resource):
  response = client.get(path)

  assert response.status_code == 200
  assert response.get_json()['resource'] == resource


def test_health_check(client):
  response = client.get('/api/v1/health')

  assert response.status_code == 200
  assert response.get_json() == {'service': 'backend', 'status': 'ok'}


def test_auth_placeholder_post_routes(client):
  login_response = client.post('/api/v1/auth/login')
  register_response = client.post('/api/v1/auth/register')

  assert login_response.status_code == 200
  assert register_response.status_code == 200
