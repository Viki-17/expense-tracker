#!/bin/bash
# One-command Android preview: start emulator, seed SMS, build & install APK
#
# Usage: npm run android:preview
#
# Prerequisites:
#   - Android SDK at ~/Library/Android/sdk
#   - An AVD (list with: ~/Library/Android/sdk/emulator/emulator -list-avds)

set -e

Sdk=$(echo ~/Library/Android/sdk)
Emulator="$Sdk/emulator/emulator"
Adb="$Sdk/platform-tools/adb"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

if [ ! -f "$Emulator" ]; then
  echo -e "${RED}❌ Emulator not found at $Emulator${NC}"
  exit 1
fi

if [ ! -f "$Adb" ]; then
  echo -e "${RED}❌ adb not found at $Adb${NC}"
  exit 1
fi

# ── 1. Pick AVD ──────────────────────────────────────────────
AVDS=$("$Emulator" -list-avds 2>/dev/null)
AVD_COUNT=$(echo "$AVDS" | grep -c . || true)

if [ "$AVD_COUNT" -eq 0 ]; then
  echo -e "${RED}❌ No AVDs found. Create one in Android Studio → Device Manager.${NC}"
  exit 1
fi

if [ "$AVD_COUNT" -eq 1 ]; then
  AVD=$(echo "$AVDS" | head -1)
else
  echo -e "${CYAN}Available AVDs:${NC}"
  I=1
  while IFS= read -r line; do
    echo "  $I) $line"
    I=$((I + 1))
  done <<< "$AVDS"
  echo ""
  read -p "Pick an AVD (1-$AVD_COUNT): " CHOICE
  AVD=$(echo "$AVDS" | sed -n "${CHOICE}p")
fi

echo -e "${GREEN}📱 Using AVD: $AVD${NC}"

# ── 2. Start emulator (if not already running) ───────────────
EMU_RUNNING=$("$Adb" devices 2>/dev/null | grep -c "emulator" || true)
if [ "$EMU_RUNNING" -eq 0 ]; then
  echo -e "${YELLOW}⏳ Starting emulator (this may take ~30s)...${NC}"
  "$Emulator" -avd "$AVD" -no-snapshot-load > /dev/null 2>&1 &
  EMU_PID=$!

  echo -n "   Waiting for device to boot"
  for i in $(seq 1 60); do
    BOOTED=$("$Adb" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r\n' || true)
    if [ "$BOOTED" = "1" ]; then
      echo ""
      echo -e "${GREEN}   ✅ Emulator ready${NC}"
      break
    fi
    echo -n "."
    sleep 2
  done
  if [ "$BOOTED" != "1" ]; then
    echo ""
    echo -e "${RED}❌ Emulator failed to boot in 2 minutes.${NC}"
    kill $EMU_PID 2>/dev/null || true
    exit 1
  fi
else
  echo -e "${GREEN}   ✅ Emulator already running${NC}"
fi

# ── 3. Unlock screen ─────────────────────────────────────────
"$Adb" shell input keyevent 82 > /dev/null 2>&1 || true

# ── 4. Seed SMS (optional, skips if no messages needed) ───────
# echo ""
# echo -e "${YELLOW}💬 Seeding SMS inbox...${NC}"
# if [ -f scripts/seed-sms.sh ]; then
#   bash scripts/seed-sms.sh
# else
#   echo "   Skipped (seed-sms.sh not found)"
# fi

# ── 5. Uninstall old version (avoid signature conflicts) ─────
echo ""
echo -e "${YELLOW}📦 Uninstalling previous version...${NC}"
"$Adb" uninstall com.expensetracker.app > /dev/null 2>&1 || true
echo "   ✅ Done"

# ── 6. Build APK ─────────────────────────────────────────────
echo ""
echo -e "${YELLOW}🔨 Building APK...${NC}"
npm run cap:sync > /dev/null 2>&1
(cd android && export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home && ./gradlew clean assembleDebug > /dev/null 2>&1)
echo -e "${GREEN}   ✅ APK built${NC}"

# ── 7. Install ───────────────────────────────────────────────
echo ""
echo -e "${YELLOW}📲 Installing on emulator...${NC}"
"$Adb" install -r android/app/build/outputs/apk/debug/app-debug.apk 2>&1
echo -e "${GREEN}   ✅ Installed${NC}"

# ── 8. Launch ────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}🚀 Launching app...${NC}"
"$Adb" shell am start -n com.expensetracker.app/com.expensetracker.MainActivity > /dev/null 2>&1
echo ""

echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ App running on emulator!${NC}"
echo -e "${GREEN}  Open SMS Import → Grant permission → Scan${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"
