FROM python:3.10-slim

WORKDIR /app
COPY . .

RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn

ENV PORT=10000

CMD exec gunicorn --bind 0.0.0.0:$PORT server:app
