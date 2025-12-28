#!/usr/bin/env sh
set -eu

export SEED_DEMO=true
export DEMO_PASSWORD=${DEMO_PASSWORD:-demo123}

docker compose up --build
