FROM python:3.12-alpine

RUN apk add --no-cache \
    curl \
    bash

WORKDIR /e2e-tests

COPY e2e.sh .

RUN chmod +x e2e.sh

ENTRYPOINT ["bash", "/e2e-tests/e2e.sh"]
