"""Application entrypoint used to run the Flask development server."""

from typing import Any


import os

from app import create_app

app: Any = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', '5000')))
