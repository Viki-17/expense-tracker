#!/bin/bash
# Seed Android emulator with dummy transaction SMS messages for testing
#
# Usage:
#   npm run seed-sms
#
# Uses 'adb emu sms send' to send SMS through the emulator's virtual modem.
# Messages appear in both the Messages app and are queryable via content://sms/inbox.
#
# To add your own messages, edit the MESSAGES array below.
# Each entry is: "SENDER|BODY|DELAY_SECS"
#   SENDER     - phone number / sender ID (e.g. "HDFC Bank")
#   BODY       - the SMS text
#   DELAY_SECS - delay in seconds after the previous SMS (min 1 sec)
#                Emulator needs a brief delay between messages or some get dropped.
#
# WARNING: Only use on an emulator or test device.

set -e

SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"

ADB=$(which adb 2>/dev/null || true)
if [ -z "$ADB" ] && [ -f "$SDK/platform-tools/adb" ]; then
  ADB="$SDK/platform-tools/adb"
fi
if [ -z "$ADB" ]; then
  echo "❌ adb not found. Install Android SDK platform-tools."
  exit 1
fi

DEVICE_COUNT=$($ADB devices 2>/dev/null | grep -v "List of" | grep -c "device" || true)
if [ "$DEVICE_COUNT" -eq 0 ]; then
  echo "❌ No Android device/emulator connected."
  exit 1
fi

echo "📱 Connected device. Seeding SMS via emulator modem..."
echo "   (sending with 1.5s delay between messages to avoid drops)"
echo ""

# ──────────────────────────────────────────────────────────────
# ADD YOUR OWN MESSAGES HERE
# Format: "SENDER|BODY"  (one per line, no DELAY needed - script adds delay)
# ──────────────────────────────────────────────────────────────
MESSAGES=(

  # === Food & Dining ===
  "HDFC Bank|Rs.500.00 debited from a/c **1234 at SWIGGY on 15-Jul-26. Avl Bal: Rs.45,000"
  "ICICI Bank|INR 850.00 spent on Zomato at 8:42 PM on 12-Jul-26. Avl Bal: Rs.32,150"
  "SBI|Rs.350 debited from a/c **5678 at DOMINOS PIZZA on 14-Jul-26"

  # === Shopping ===
  "HDFC Bank|Rs.1,299.00 debited from a/c **1234 at AMAZON on 11-Jul-26. Avl Bal: Rs.28,500"
  "Axis Bank|INR 2,499.00 paid via Card **9012 at FLIPKART on 09-Jul-26. Ref: 9876543210"
  "ICICI Bank|Rs.749 spent on Myntra at 3:15 PM on 07-Jul-26. Avl Bal: Rs.14,350"
  "SBI|INR 1,850 debited from a/c **8765 at DMART on 06-Jul-26"

  # === Transport ===
  "HDFC Bank|Rs.220.00 paid via UPI to UBER on 13-Jul-26. Ref No: UPI1234567"
  "Axis Bank|INR 180.50 spent on Ola at 10:30 AM on 10-Jul-26. Avl Bal: Rs.19,200"
  "SBI|Rs.2,500 debited from a/c **3456 at INDIAN OIL PETROL on 05-Jul-26"

  # === Groceries ===
  "ICICI Bank|Rs.1,150 debited from a/c **5678 at BIG BASKET on 08-Jul-26. Avl Bal: Rs.11,800"
  "HDFC Bank|INR 420.00 paid via UPI to BLINKIT on 04-Jul-26. Ref: UPI8765432"
  "Axis Bank|Rs.980 spent at RELIANCE FRESH on 03-Jul-26. Avl Bal: Rs.8,900"

  # === Entertainment ===
  "HDFC Bank|Rs.649.00 debited from a/c **1234 at NETFLIX on 02-Jul-26. Auto-debit. Avl Bal: Rs.22,300"
  "SBI|INR 299.00 paid via UPI to BOOKMYSHOW on 01-Jul-26. Ref: 12345678"
  "ICICI Bank|Rs.129 spent on YOUTUBE PREMIUM on 28-Jun-26. Avl Bal: Rs.5,200"

  # === Bills & Utilities ===
  "HDFC Bank|Rs.1,850.00 debited for electricity bill on 26-Jun-26. Ref: BILL98765"
  "Axis Bank|INR 499.00 paid to JIO RECHARGE on 25-Jun-26. Avl Bal: Rs.15,300"
  "SBI|Rs.3,500 debited via NACH mandate for EMI payment on 20-Jun-26. Loan A/c **9012"

  # === Income / Credits ===
  "ICICI Bank|Rs.50,000.00 credited to a/c **5678 on 01-Jul-26. UPI Ref: SALARY-JUN26"
  "HDFC Bank|INR 15,000.00 credited to a/c **1234 on 05-Jul-26. UPI Ref: FREELANCE"
  "SBI|Rs.2,500 credited to a/c **8765 on 28-Jun-26. UPI received from RAHUL SHARMA"

  # === UPI Payments ===
  "PhonePe|Rs.450.00 paid via UPI to MOON MART on 15-Jul-26. UPI Ref: UPI/P2M/520087032006/DK SNACKS"
  "GPay|INR 200.00 paid to CHAI POINT at 9:15 AM on 10-Jul-26. UPI Ref: 640023505610"
  "Paytm|Rs.1,200 sent to KIRANA STORE via UPI on 06-Jul-26. Ref: T2407061205"

  # === ATM Withdrawal ===
  "HDFC Bank|Rs.5,000.00 withdrawn from ATM at MG Road Bangalore on 08-Jul-26. Avl Bal: Rs.25,000"

  # === Card / POS Swipe ===
  "SBI|Card **4567 used for Rs.3,200 at LIFESTYLE STORES on 04-Jul-26. POS txn. Avl Bal: Rs.16,500"

)

COUNT=0
TOTAL=${#MESSAGES[@]}

for entry in "${MESSAGES[@]}"; do
  IFS='|' read -r SENDER BODY <<< "$entry"

  $ADB emu sms send "$SENDER" "$BODY"

  COUNT=$((COUNT + 1))
  echo "  ✅ [$COUNT/$TOTAL] $SENDER"

  # Brief pause so the emulator doesn't drop messages
  if [ "$COUNT" -lt "$TOTAL" ]; then
    sleep 1.5
  fi
done

echo ""
echo "🎉 Done! $COUNT SMS messages sent."
echo "   Check the Messages app — they should appear there now."
echo ""
echo "Open Expense Tracker → SMS Import → Grant Permission → Scan SMS"
