FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production
ENV PORT=5000

WORKDIR /app

RUN groupadd --system app && useradd --system --gid app --create-home app

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=app:app backend/ ./
COPY --chown=app:app scripts/deployment/start_backend.sh /usr/local/bin/start-backend
RUN chmod 0755 /usr/local/bin/start-backend

USER app
EXPOSE 5000
CMD ["/usr/local/bin/start-backend"]
