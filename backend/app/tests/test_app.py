def test_health_check(client):
  response = client.get('/api/v1/health')

  assert response.status_code == 200
  assert response.get_json() == {
    'success': True,
    'data': {
      'service': 'backend',
      'status': 'ok',
    },
  }


def test_register_and_login(client):
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

  login_response = client.post(
    '/api/v1/auth/login',
    json={
      'email': 'customer@test.com',
      'password': 'password123',
    },
  )

  assert login_response.status_code == 200
  assert login_response.get_json()['data']['token']
