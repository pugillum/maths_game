set dotenv-load

install:
    npm install

serve: install
    #!/usr/bin/env bash
    set -euo pipefail
    for port in 3999 8888; do
        pid=$(lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null || true)
        if [ -n "$pid" ]; then
            echo "Port $port is already in use (pid $pid) — killing stale dev server."
            kill $pid
        fi
    done
    npx netlify dev

data:
    #!/usr/bin/env bash
    set -euo pipefail
    if ! response=$(curl -sf -H "x-player-pin: $PLAYER_PIN" http://localhost:8888/.netlify/functions/load-data); then
        echo "Couldn't reach the dev server — is 'just serve' running in another terminal?"
        exit 1
    fi
    echo "$response" | jq .

# Overwrite the blob with a backup, e.g. `just restore https://<site>.netlify.app`
restore url="http://localhost:8888" file="../2026_maths_game_data/player-data.json":
    #!/usr/bin/env bash
    set -euo pipefail
    curl -sf -X POST -H "x-player-pin: $PLAYER_PIN" -H "content-type: application/json" \
        --data @"{{file}}" "{{url}}/.netlify/functions/restore-data" | jq .
