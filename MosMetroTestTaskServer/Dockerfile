FROM python:3.12.4-slim

WORKDIR /app

RUN apt-get update && apt-get install -y libpq-dev

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "-m", "main"]