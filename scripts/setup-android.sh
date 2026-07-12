#!/bin/bash
# =============================================================================
# Android Setup Script for Expense Tracker
# Run this ONCE to create the Android project with Capacitor.
# Requires: Android Studio + Android SDK + Java JDK 17
# =============================================================================

set -e

echo "🏗️  Setting up Android project for Expense Tracker..."

# Step 1: Build the web app
echo "📦 Building web app..."
npm run build

# Step 2: Add Android platform (only if not already added)
if [ ! -d "android/app" ]; then
    echo "🤖 Adding Android platform..."
    npx cap add android
else
    echo "🤖 Android platform already exists, syncing..."
fi

# Step 3: Sync web assets + plugins to Android project
echo "🔄 Syncing Capacitor..."
npx cap sync

# Step 4: Copy our custom plugin files (they're already in place, just verify)
echo "🔌 Verifying custom plugin..."
if [ -f "android/app/src/main/java/com/expensetracker/plugins/SmsReaderPlugin.java" ]; then
    echo "   ✅ SmsReaderPlugin.java found"
else
    echo "   ⚠️  SmsReaderPlugin.java not found in expected location"
    echo "   Copy it manually to: android/app/src/main/java/com/expensetracker/plugins/"
fi

# Step 5: Remind about AndroidManifest permissions
echo ""
echo "📋 MANUAL STEPS REQUIRED:"
echo "   1. Open android/app/src/main/AndroidManifest.xml"
echo "   2. Add this inside <manifest> tag:"
echo "      <uses-permission android:name=\"android.permission.READ_SMS\" />"
echo ""
echo "   3. To run on device:"
echo "      npx cap run android"
echo "      OR open in Android Studio: npx cap open android"
echo ""
echo "✅ Setup complete!"
