#!/bin/bash
# =================================================================
# One Bear — Webhook Test Script (Development Only)
#
# Usage:
#   ./scripts/test-webhook.sh line          # LINE text message
#   ./scripts/test-webhook.sh line:image    # LINE image message
#   ./scripts/test-webhook.sh facebook      # Facebook text message
#   ./scripts/test-webhook.sh whatsapp      # WhatsApp text message
#   ./scripts/test-webhook.sh shopee        # Shopee text message
#   ./scripts/test-webhook.sh custom        # Custom payload via stdin
#
# Requires: API running at localhost:5000 in Development mode
# Uses X-Webhook-Dev-Bypass header to skip signature validation
# =================================================================

set -euo pipefail

API_BASE="http://localhost:5000"
COMPANY_ID="dev-company-001"

# Integration IDs (from seed data)
LINE_INTEGRATION="dev-int-line"
FB_INTEGRATION="dev-int-fb"
IG_INTEGRATION="dev-int-ig"
WA_INTEGRATION="dev-int-wa"
SHOPEE_INTEGRATION="dev-int-shopee"

NOW_MS=$(date +%s)000

send_webhook() {
    local platform=$1
    local integration_id=$2
    local payload=$3

    echo "━━━ Sending $platform webhook ━━━"
    echo "$payload" | python3 -m json.tool 2>/dev/null || true
    echo ""

    HTTP_CODE=$(curl -s -w "%{http_code}" -o /tmp/webhook-response.txt \
        -X POST "${API_BASE}/api/v1/webhooks/${platform}/${COMPANY_ID}/${integration_id}" \
        -H "Content-Type: application/json" \
        -H "X-Webhook-Dev-Bypass: true" \
        -d "$payload")

    echo "Response: HTTP $HTTP_CODE"
    cat /tmp/webhook-response.txt 2>/dev/null
    echo ""
    echo ""
}

case "${1:-help}" in

    line)
        send_webhook "line" "$LINE_INTEGRATION" '{
            "events": [{
                "type": "message",
                "replyToken": "dev-reply-token",
                "source": { "userId": "Uf001", "type": "user" },
                "timestamp": '"$NOW_MS"',
                "message": {
                    "id": "msg-test-'"$(date +%s)"'",
                    "type": "text",
                    "text": "สวัสดีครับ ทดสอบ webhook จาก LINE 🎉"
                }
            }]
        }'
        ;;

    line:image)
        send_webhook "line" "$LINE_INTEGRATION" '{
            "events": [{
                "type": "message",
                "replyToken": "dev-reply-token",
                "source": { "userId": "Uf001", "type": "user" },
                "timestamp": '"$NOW_MS"',
                "message": {
                    "id": "img-test-'"$(date +%s)"'",
                    "type": "image"
                }
            }]
        }'
        ;;

    line:follow)
        send_webhook "line" "$LINE_INTEGRATION" '{
            "events": [{
                "type": "follow",
                "source": { "userId": "Uf-new-'"$(date +%s)"'", "type": "user" },
                "timestamp": '"$NOW_MS"'
            }]
        }'
        ;;

    facebook)
        send_webhook "facebook" "$FB_INTEGRATION" '{
            "object": "page",
            "entry": [{
                "messaging": [{
                    "sender": { "id": "fb-001" },
                    "timestamp": '"$NOW_MS"',
                    "message": {
                        "mid": "m-fb-test-'"$(date +%s)"'",
                        "text": "Hi! Testing Facebook webhook 💬"
                    }
                }]
            }]
        }'
        ;;

    instagram)
        send_webhook "instagram" "$IG_INTEGRATION" '{
            "object": "instagram",
            "entry": [{
                "messaging": [{
                    "sender": { "id": "ig-001" },
                    "timestamp": '"$NOW_MS"',
                    "message": {
                        "mid": "m-ig-test-'"$(date +%s)"'",
                        "text": "Hey from Instagram! 📸"
                    }
                }]
            }]
        }'
        ;;

    whatsapp)
        send_webhook "whatsapp" "$WA_INTEGRATION" '{
            "object": "whatsapp_business_account",
            "entry": [{
                "changes": [{
                    "value": {
                        "messaging_product": "whatsapp",
                        "contacts": [{ "profile": { "name": "Anon W." }, "wa_id": "+66812345678" }],
                        "messages": [{
                            "from": "+66812345678",
                            "id": "wamid-test-'"$(date +%s)"'",
                            "timestamp": "'"$(date +%s)"'",
                            "type": "text",
                            "text": { "body": "Testing WhatsApp webhook ✅" }
                        }]
                    }
                }]
            }]
        }'
        ;;

    shopee)
        send_webhook "shopee" "$SHOPEE_INTEGRATION" '{
            "shop_id": 12345,
            "code": 6,
            "data": {
                "conversation_id": "conv-shopee-001",
                "from_id": 99999,
                "to_id": 12345,
                "message_type": "text",
                "content": { "text": "สินค้ายังมีอยู่ไหมคะ? 🛒" },
                "message_id": "sm-test-'"$(date +%s)"'",
                "timestamp": '"$(date +%s)"'
            }
        }'
        ;;

    custom)
        echo "Enter platform (line/facebook/whatsapp/shopee):"
        read -r platform
        echo "Enter integration ID:"
        read -r int_id
        echo "Enter JSON payload (end with Ctrl+D):"
        payload=$(cat)
        send_webhook "$platform" "$int_id" "$payload"
        ;;

    flood)
        echo "Sending 5 messages rapidly to test throttling..."
        for i in $(seq 1 5); do
            send_webhook "line" "$LINE_INTEGRATION" '{
                "events": [{
                    "type": "message",
                    "replyToken": "dev-reply-token",
                    "source": { "userId": "Uf001", "type": "user" },
                    "timestamp": '"$NOW_MS"',
                    "message": {
                        "id": "flood-'"$i"'-'"$(date +%s)"'",
                        "type": "text",
                        "text": "Flood test message #'"$i"'"
                    }
                }]
            }'
        done
        ;;

    *)
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  line            Send LINE text message"
        echo "  line:image      Send LINE image message"
        echo "  line:follow     Send LINE follow event (new customer)"
        echo "  facebook        Send Facebook text message"
        echo "  instagram       Send Instagram text message"
        echo "  whatsapp        Send WhatsApp text message"
        echo "  shopee          Send Shopee text message"
        echo "  custom          Send custom payload (interactive)"
        echo "  flood           Send 5 LINE messages rapidly"
        echo ""
        echo "All commands use X-Webhook-Dev-Bypass (Development only)"
        ;;
esac
