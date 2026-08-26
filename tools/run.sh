#!/usr/bin/env bash

set -eu

npm run dev -- --host "${HOST:-0.0.0.0}"
