FROM ubuntu:22.04

# 1) Install system deps
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv python3-dev \
    wget \
    gnupg \
    ca-certificates \
    libnss3 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libgbm1 \
    libx11-xcb1 \
    libxshmfence1 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libxrandr2 \
    libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2) Install Python deps
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# 3) Install Playwright + Chromium
RUN pip3 install playwright==1.56.0
RUN playwright install chromium

# 4) Copy backend
COPY . .

# Create directories for outputs
RUN mkdir -p screenshots reports

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
