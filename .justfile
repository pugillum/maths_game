set dotenv-load

install:
    npm install

serve: install
    npx netlify dev

data:
    #!/usr/bin/env bash
    set -euo pipefail
    if ! response=$(curl -sf -H "x-player-pin: $PLAYER_PIN" http://localhost:8888/.netlify/functions/load-data); then
        echo "Couldn't reach the dev server — is 'just serve' running in another terminal?"
        exit 1
    fi
    echo "$response" | jq .
