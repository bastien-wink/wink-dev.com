#!/usr/bin/env bash
# Régénère index.html + cv-print.html depuis data/cv.json, puis le PDF.
set -euo pipefail
cd "$(dirname "$0")/.."

node build/build.mjs

if command -v weasyprint >/dev/null 2>&1; then
  WEASY=weasyprint
elif [ -x "$HOME/.venvs/weasyprint/bin/weasyprint" ]; then
  WEASY="$HOME/.venvs/weasyprint/bin/weasyprint"
else
  echo "weasyprint introuvable. Installation :"
  echo "  python3 -m venv ~/.venvs/weasyprint && ~/.venvs/weasyprint/bin/pip install weasyprint"
  exit 1
fi

"$WEASY" cv-print.html CV_Bastien_Thomas.pdf
echo "CV_Bastien_Thomas.pdf régénéré."
