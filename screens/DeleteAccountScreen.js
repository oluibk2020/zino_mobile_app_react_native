import React from "react";
import { View, Text, Alert, TouchableOpacity } from "react-native";
import tw from "twrnc";
import  {useContext} from "react";
import StoreContext from "../context/storeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { set } from "lodash";

const DeleteAccountScreen = () => {

  const { setNewUser, invalidateLogin } = useContext(StoreContext);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => {
            console.log("Deleting account and data from server...");
            // TODO: Add real deletion API call here
            invalidateLogin("Account will be scheduled for deletion. Logging you out...");
            //reset async storage for new user
            AsyncStorage.removeItem("newUser");
            setNewUser(true);
            //reset notifications
            AsyncStorage.removeItem("notifications");
          },
          style: "destructive",
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={tw`flex-1 justify-center items-center bg-white px-6`}>
      <Text style={tw`text-xl font-bold text-red-600 mb-4`}>Danger Zone</Text>

      <TouchableOpacity
        onPress={handleDeleteAccount}
        style={tw`bg-red-500 rounded-2xl px-6 py-3 shadow-md`}
      >
        <Text style={tw`text-white text-base font-semibold`}>
          Delete My Account
        </Text>
      </TouchableOpacity>

      <Text style={tw`text-gray-500 text-center mt-4 text-sm`}>
        This action will permanently delete your account and all associated
        data.
      </Text>
    </View>
  );
};

export default DeleteAccountScreen;
