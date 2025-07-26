import React from "react";
import { View, ScrollView, Text } from "react-native";
import tw from "twrnc";

const PrivacyPolicyScreen = () => {
  return (
    <ScrollView contentContainerStyle={tw`p-6 bg-white`}>
      <Text style={tw`text-2xl font-bold text-gray-800 mb-4`}>
        Privacy Policy
      </Text>

      <Text style={tw`text-sm text-gray-600 mb-4`}>
        Last updated: May 5, 2025
      </Text>

      <Text style={tw`text-base text-gray-700 mb-3`}>
        CharisIntelligence ("we", "our", or "us") operates the Coding School
        mobile application. This Privacy Policy explains how we collect, use,
        and protect your personal information.
      </Text>

      <Text style={tw`text-lg font-semibold text-gray-800 mb-2`}>
        1. Information We Collect
      </Text>
      <Text style={tw`text-base text-gray-700 mb-3`}>
        We collect personal information including your location, device
        information, and biometric data (such as fingerprint authentication). We
        also collect contact information when you register or interact with the
        app.
      </Text>

      <Text style={tw`text-lg font-semibold text-gray-800 mb-2`}>
        2. How We Use Your Data
      </Text>
      <Text style={tw`text-base text-gray-700 mb-3`}>
        - <Text style={tw`font-semibold`}>Location:</Text> Used to personalize
        currency displayed (e.g., USD or Naira) based on your country.
      </Text>
      <Text style={tw`text-base text-gray-700 mb-3`}>
        - <Text style={tw`font-semibold`}>Notifications:</Text> Used to send
        important school updates, events, and scholarship opportunities.
      </Text>
      <Text style={tw`text-base text-gray-700 mb-3`}>
        - <Text style={tw`font-semibold`}>Biometric (Fingerprint):</Text> Used
        for secure login and protecting access to your personal data within the
        app.
      </Text>

      <Text style={tw`text-lg font-semibold text-gray-800 mb-2`}>
        3. Account Deletion
      </Text>
      <Text style={tw`text-base text-gray-700 mb-3`}>
        You can delete your account at any time from within the app. This will
        permanently erase your account and all associated data from our servers.
      </Text>

      <Text style={tw`text-lg font-semibold text-gray-800 mb-2`}>
        4. Data Security
      </Text>
      <Text style={tw`text-base text-gray-700 mb-3`}>
        We use appropriate technical and organizational measures to protect your
        data, including encryption and biometric authentication.
      </Text>

      <Text style={tw`text-lg font-semibold text-gray-800 mb-2`}>
        5. Contact Us
      </Text>
      <Text style={tw`text-base text-gray-700 mb-6`}>
        If you have any questions about this Privacy Policy, please contact us
        at <Text style={tw`text-blue-600`}>hello@charisintelligence.com.ng</Text>.
      </Text>
    </ScrollView>
  );
};

export default PrivacyPolicyScreen;
