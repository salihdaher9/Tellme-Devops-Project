FROM python:3.12-alpine

# Install only what we need for smoke testing
RUN apk add --no-cache \
    curl \
    bash

WORKDIR /smoke-tests

COPY smoke.sh .

RUN chmod +x smoke.sh

ENTRYPOINT ["bash", "/smoke-tests/smoke.sh"]
