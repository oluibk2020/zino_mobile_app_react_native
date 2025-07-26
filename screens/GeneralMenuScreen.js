import { Text, View, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import tw from "twrnc";

const GeneralMenuScreen = () => {
  const navigation = useNavigation();

  // Helper function for menu items
  const MenuItem = ({ title, onPress, colorClass }) => (
    <TouchableOpacity
      style={tw`flex-row items-center justify-between p-4 rounded-lg mb-3 shadow-md ${colorClass}`}
      onPress={onPress}
    >
      <Text style={tw`text-white text-lg font-semibold`}>{title}</Text>
      {/* You can add an icon here if desired, e.g., a right arrow */}
      <Text style={tw`text-white text-lg`}>›</Text>
    </TouchableOpacity>
  );

  // Helper function for section titles
  const SectionTitle = ({ title }) => (
    <Text style={tw`text-purple-700 text-2xl font-bold mb-4 mt-6 px-4`}>
      {title}
    </Text>
  );

  return (
    <ScrollView style={tw`flex-1 bg-gray-100`}>
      <View style={tw`p-6`}>
        {/* Apps Section */}
        <SectionTitle title="Apps" />
        <View style={tw`bg-white rounded-xl shadow-lg p-4 mb-8`}>
          <MenuItem
            title="Play Games"
            onPress={() => navigation.navigate("GamesMainScreen")}
            colorClass="bg-purple-600"
          />
          <MenuItem
            title="Hire Our Developers"
            onPress={() =>
              navigation.navigate("WalletTab", {
                screen: "Services",
              })
            }
            colorClass="bg-yellow-600"
          />
          {/* Add more app menu items here */}
          <MenuItem
            title="Another App (Coming Soon!)"
            onPress={() => console.log("Navigate to Another App")}
            colorClass="bg-purple-500"
          />
        </View>

        {/* Profile Section */}
        <SectionTitle title="Profile" />
        <View style={tw`bg-white rounded-xl shadow-lg p-4 mb-8`}>
          <MenuItem
            title="View Profile"
            onPress={() => navigation.navigate("ProfileMain")}
            colorClass="bg-purple-600"
          />
        </View>

        {/* Account Management Section */}
        <SectionTitle title="Account Management" />
        <View style={tw`bg-white rounded-xl shadow-lg p-4 mb-8`}>
          <MenuItem
            title="Privacy Policy"
            onPress={() => navigation.navigate("PrivacyPolicyMain")}
            colorClass="bg-purple-600"
          />
          <MenuItem
            title="Logout Now"
            onPress={() => navigation.navigate("LogoutMain")}
            colorClass="bg-red-500" // Using red for logout for emphasis
          />
          <MenuItem
            title="Delete Account"
            onPress={() => navigation.navigate("DeleteAccountMain")}
            colorClass="bg-red-600" // Using a darker red for delete
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default GeneralMenuScreen;
