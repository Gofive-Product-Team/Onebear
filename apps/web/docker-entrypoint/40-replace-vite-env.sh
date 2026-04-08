#!/bin/sh
set -eu

WEB_ROOT="/usr/share/nginx/html"

# Replace __VITE_*__ placeholders in built assets with runtime docker env values.
for var_name in $(env | sed -n 's/^\(VITE_[A-Za-z0-9_]*\)=.*/\1/p'); do
	var_value="$(printenv "$var_name" || true)"
	escaped_value="$(printf '%s' "$var_value" | sed -e 's/[\\/&]/\\\\&/g')"

	find "$WEB_ROOT" -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' \) \
		-exec sed -i "s|__${var_name}__|${escaped_value}|g" {} +
done
