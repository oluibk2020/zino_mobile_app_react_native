import { useState, createContext, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

import isTokenExpired from "../utilities/isTokenExpired";
// --- Google Auth Youtube ---
import { GoogleSignin } from "@react-native-google-signin/google-signin";

// --- Biometric Auth Imports ---
import * as LocalAuthentication from "expo-local-authentication";
// --- End Biometric Auth Imports ---

import Constants from "expo-constants";
//context
const StoreContext = createContext();

//provider
export const StoreProvider = ({ children }) => {
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  const [amount, setAmount] = useState("");
  const [isAuth, setIsAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState([]);
  const [course, setCourse] = useState({});
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [newUser, setNewUser] = useState(true);
  const [token, setToken] = useState(null);
  const [globalNotificationData, setGlobalNotificationData] = useState(null);

  const [wallet, setWallet] = useState("ngn");
  const [paymentLink, setPaymentLink] = useState("");
  const [cryptoPayload, setCryptoPayload] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transaction, setTransaction] = useState({});
  const [userProfile, setUserProfile] = useState({});
  const [walletBalance, setWalletBalance] = useState("");
  const [globalCurrency, setGlobalCurrency] = useState("");
  const [services, setServices] = useState([]);

  const [userCountry, setUserCountry] = useState(null); // State for user's country

  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const navigation = useNavigation();

  const [bioLoading, setBioLoading] = useState(false); // <-- Add Biometric loading state

  // Keys for storage
  const BIOMETRIC_ENABLED_KEY = "biometricEnabled";
  const USER_TOKEN_KEY = "userToken"; // Key for storing the app token

  // --- Biometric State ---
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  // --- End Biometric State ---

  // --- Common Function to Handle Successful Login ---
  const handleLoginSuccess = useCallback(
    async (receivedToken) => {
      try {
        // 1. Store Token (Using AsyncStorage as per your current code)
        await AsyncStorage.setItem(USER_TOKEN_KEY, receivedToken);
        console.log("Token stored successfully.");

        // 2. Update Context
        setToken(receivedToken);
        setIsAuth(true); // This should trigger the navigation useEffect

        // 3. Show Success Toast
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Login successful!",
        });

        // 4. Reset password
        setPassword("");

        // 5. Check and Prompt for Enabling Biometrics
        if (isBiometricAvailable) {
          const alreadyEnabled = await AsyncStorage.getItem(
            BIOMETRIC_ENABLED_KEY
          );
          if (alreadyEnabled !== "true") {
            Alert.alert(
              "Enable Biometric Login?",
              "Use Fingerprint/Face ID for faster logins next time?",
              [
                { text: "Not Now", style: "cancel" }, // No extra action needed, navigation happens anyway
                {
                  text: "Enable",
                  onPress: async () => {
                    try {
                      const authResult =
                        await LocalAuthentication.authenticateAsync({
                          promptMessage: "Confirm to enable Biometrics",
                        });
                      if (authResult.success) {
                        await AsyncStorage.setItem(
                          BIOMETRIC_ENABLED_KEY,
                          "true"
                        );
                        setIsBiometricEnabled(true);
                        Toast.show({
                          type: "info",
                          text1: "Biometric Login Enabled",
                        });
                      } else {
                        Alert.alert(
                          "Could not enable Biometrics",
                          "Authentication failed."
                        );
                      }
                    } catch (error) {
                      console.error("Error enabling biometrics:", error);
                      Alert.alert("Error", "Could not enable Biometric login.");
                    }
                  },
                },
              ]
            );
          }
        }
        // Navigation is handled by the isAuth useEffect
      } catch (error) {
        console.error("Error in handleLoginSuccess:", error);
        Toast.show({
          type: "error",
          text1: "Login Handling Error",
          text2: "Could not finalize login.",
        });
        // Attempt cleanup
        setIsAuth(false);
        setToken(null);
        await AsyncStorage.removeItem(USER_TOKEN_KEY);
      } finally {
        // Reset loading states regardless of login method
        setIsLoading(false);
        setBioLoading(false);
      }
    },
    [
      isBiometricAvailable,
      setIsAuth,
      setToken,
      resetEmailAndPassword,
      navigation,
    ]
  ); // Dependencies for useCallback

  //get token
  useEffect(() => {
    console.log(
      "running useEffect in store context",
      isBiometricEnabled,
      isBiometricAvailable
    );
    const checkLoginStatus = async () => {
      //check if user is a new user
      const value = await AsyncStorage.getItem("newUser");
      console.log("checking user status: ", value, typeof value);

      if (value == undefined || value == null || value == "true") {
        console.log("object is undefined or null or true");
        setNewUser(true);
        //set async storage to true
        await AsyncStorage.setItem("newUser", "true");
      } else {
        setNewUser(false);
        await AsyncStorage.setItem("newUser", "false");
      }

      //get token from async storage
      const userToken = await AsyncStorage.getItem("userToken");

      if (
        !userToken &&
        (value == undefined || value == null || value == "true")
      ) {
        // new user
        return;
      }

      //check if token is expired
      if (!userToken || isTokenExpired(userToken)) {
        //invalidate login
        invalidateLogin("Your session has expired. Please login again.");
        return;
      } else {
        // set user token in context
        setToken(userToken);
      }
    };

    // Check login status when the component mounts
    checkLoginStatus();
  }, [token]);

  //functions
  function resetEmailAndPassword() {
    //clear screen
    setEmail("");
    setPassword("");
  }

  async function invalidateLogin(message) {
    //send toast
    Toast.show({
      type: "error", // 'success' | 'error' | 'info'
      text1: "Error", // title
      text2: message
        ? message
        : "Your session has expired. Please login again.", //msg body
      position: "top", // 'top' | 'bottom'
    });
    setIsAuth(false);
    const [result1, result2] = await Promise.all([
      AsyncStorage.removeItem("userToken"),
      GoogleSignin.signOut(), //sign out google
    ]);

    //reset biometric
    if (isBiometricAvailable && isBiometricEnabled) {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "false");
      setIsBiometricEnabled(false);
    }

    setIsLoading(false);
  }

  async function getAllCourses() {
    if (!isAuth) {
      return;
    }
    try {
      const response = await fetch(`${API_URL}/courses`, {
        method: "GET", //PUT
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, //your token
        },
      });

      const data = await response.json();

      if (response.status === 200) {
        // console.log(data);
        setCourses(data.data);
        return data.data;
      }

      if (response.status === 401 || response.status === 407) {
        invalidateLogin(data.message);
        return false;
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function getOneCourse(id) {
    try {
      if (!isAuth) {
        return;
      }

      const response = await fetch(`${API_URL}/courses/${id}`, {
        method: "GET", //PUT
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, //your token
        },
      });

      const data = await response.json();

      if (response.status === 200) {
        setCourse(data.data);
        return data.data;
      }

      if (response.status === 401 || response.status === 407) {
        invalidateLogin(data.message);
        return;
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function getAllEnrolledCourses() {
    try {
      if (!isAuth) {
        return;
      }

      const response = await fetch(`${API_URL}/courses/enrolled`, {
        method: "GET", //PUT
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, //your token
        },
      });

      const data = await response.json();

      if (response.status === 200) {
        setEnrolledCourses(data.data);
        return;
      }

      if (response.status === 401 || response.status === 407) {
        invalidateLogin(data.message);
        return;
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function getOneEnrolledCourse(courseId) {
    try {
      if (!isAuth) {
        return;
      }

      const response = await fetch(`${API_URL}/courses/enrolled/${courseId}`, {
        method: "GET", //PUT
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, //your token
        },
      });

      const data = await response.json();

      if (response.status === 200) {
        setCourse(data.data);
        return data.data;
      }

      if (response.status === 401 || response.status === 407) {
        invalidateLogin(data.message);
        return;
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchBalance(currency) {
    try {
      if (!isAuth) {
        return;
      }

      //set global currency
      setGlobalCurrency(currency);

      const response = await fetch(`${API_URL}/wallet/${currency}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setWalletBalance(data.wallet.balance);

      if (response.status === 401 || response.status === 400) {
        invalidateLogin(data.message);
        return;
      }
    } catch (error) {
      //send toast
      Toast.show({
        type: "error", // 'success' | 'error' | 'info'
        text1: "Error", // title
        text2:
          "Network error: We are unable to get this wallet balance at the moment. Reload page", //msg body
        position: "top", // 'top' | 'bottom'
      });
      console.log(error);
    }
  }

  async function fetchProfile() {
    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.status === 200) {
        return setUserProfile(data.data);
      }

      if (response.status === 401 || response.status === 407) {
        invalidateLogin(data.message);
        return;
      }
    } catch (error) {
      console.log(error);
      //send toast
      Toast.show({
        type: "error", // 'success' | 'error' | 'info'
        text1: "Error", // title
        text2:
          "Network error: We are unable to get your profile at the moment. Reload page", //msg body
        position: "top", // 'top' | 'bottom'
      });
    }
  }

  const fetchTransactions = useCallback(
    async (currency) => {
      try {
        if (!isAuth) return;
        const response = await fetch(`${API_URL}/transaction/all/${currency}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.status === 200) {
          setTransactions(data.data);
        }

        if (response.status === 401 || response.status === 407) {
          invalidateLogin(data.message);
          return;
        }
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2:
            "Network error: We are unable to get your transactions at the moment. Reload page",
          position: "top",
        });
        console.log(error);
      }
    },
    [isAuth, token, setTransactions, invalidateLogin]
  );

  //get a Transaction
  async function fetchOneTransaction(transRef) {
    try {
      if (!isAuth) {
        return;
      }
      const response = await fetch(`${API_URL}/transaction/${transRef}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 407) {
        invalidateLogin(data.message);
        return;
      }

      if (response.status === 200) {
        setTransaction(data.transaction);
      }
    } catch (error) {
      //send toast
      Toast.show({
        type: "error", // 'success' | 'error' | 'info'
        text1: "Error", // title
        text2:
          "Network error: We are unable to get this transaction at the moment. Reload page", //msg body
        position: "top", // 'top' | 'bottom'
      });
    }
  }

  async function createPaymentInvoice(transactionId) {
    try {
      if (!isAuth) {
        return;
      }

      const response = await fetch(
        `${API_URL}/wallet/pay/transaction/${transactionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      // console.log(data);

      if (response.ok) {
        if (data.paymentMethod === "flutterwave" && globalCurrency === "ngn") {
          const paymentLink = data.response.data.link;
          setPaymentLink(paymentLink);
          return;
        } else if (
          data.paymentMethod === "basqet" &&
          globalCurrency === "usd"
        ) {
          Toast.show({
            type: "success",
            text1: "Opening payment page...",
            text2: "Please wait while we redirect you.",
            visibilityTime: 3000, // Show toast for 3 seconds
          });
          const payload = data;
          setCryptoPayload(payload);
          return;
        }
      }

      if (response.status === 401 || response.status === 407) {
        invalidateLogin(data.message);
        return;
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function getAllServices() {
    try {
      if (!isAuth) {
        return;
      }

      const response = await fetch(`${API_URL}/services`, {
        method: "GET", //PUT
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, //your token
        },
      });

      const data = await response.json();

      if (response.status === 200) {
        return setServices(data.data);
      }

      if (response.status === 401 || response.status === 407) {
        invalidateLogin(data.message);
        return;
      }
    } catch (error) {
      console.log(error);
    }
  }

  const fundWallet = async () => {
    if (!isAuth) {
      return;
    }
    // if (parseInt(amount) < 1000) {
    //   Alert.alert("Error", "Please deposit an amount greater than 1000");
    //   return;
    // }

    console.log(globalCurrency);

    if (!globalCurrency) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/wallet/fund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseInt(amount),
          currency: globalCurrency,
        }),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 407) {
        setIsLoading(false);
        invalidateLogin(data.message);
        return;
      }

      if (response.status === 200) {
        Toast.show({
          type: "success", // success | error | info
          text1: "Success", // title
          text2: "Invoice created successfully", //msg body
          position: "top", // 'top' | 'bottom'
        });
        await createPaymentInvoice(data.transaction.id);
      } else {
        Alert.alert("Error", data.msg || "Error funding your balance");
      }

      //reset amount
      setAmount("");
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Network error: try again");
    }

    setIsLoading(false);
  };

  async function registerCourse(courseId) {
    try {
      //create transaction on server
      const response = await fetch(`${API_URL}/courses/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: parseInt(courseId),
          currency: userCountry.toLowerCase(),
        }),
      });

      const data = await response.json();

      //if successful, then call payment link
      if (response.status === 201) {
        //toast message
        Toast.show({
          type: "success", // success | error | info
          text1: "Success",
          text2: "You have enrolled for this course successfully",
          position: "top",
        });

        //navigate to my enrolled courses tab list section
        navigation.navigate("MyCoursesTab", {
          screen: "EnrolledCourseList",
        });
      } else if (response.status === 400) {
        //toast message for those who are already enrolled
        Toast.show({
          type: "error", // success | error | info
          text1: "Error",
          text2: data.msg || data.message,
          position: "top",
        });
        //navigate to my enrolled courses tab list section
        navigation.navigate("MyCoursesTab", {
          screen: "EnrolledCourseList",
        });
      } else if (
        response.status === 401 &&
        (data.msg || data.message) ===
          "Invalid or expired session. Please log in again."
      ) {
        //toast message for those with non enough funds
        Toast.show({
          type: "error", // success | error | info
          text1: "Error",
          text2: data.msg || data.message,
          position: "top",
        });

        invalidateLogin(data.msg || data.message);
      } else if (response.status === 401) {
        //toast message for those with non enough funds
        Toast.show({
          type: "error", // success | error | info
          text1: "Error",
          text2: data.msg || data.message,
          position: "top",
        });
        //navigate to wallet main in wallet tab
        navigation.navigate("WalletTab", {
          screen: "FundWallet",
        });
      }

      setIsLoading(false);
    } catch (error) {
      //toast message
      Toast.show({
        type: "error", // success | error | info
        text1: "Error",
        text2: "Network error: try again",
        position: "top",
      });
      console.log(error);
    }
  }

  // --- Function to format price based on country ---
  const formatPrice = (price) => {
    const numericPrice = Number(price);
    if (isNaN(numericPrice)) {
      return "Invalid Price"; // Handle cases where price is not a number
    }

    if (numericPrice === 0) {
      return "Free";
    }

    if (userCountry === "ngn") {
      // Format for Nigeria (NGN)
      return `₦${numericPrice.toLocaleString("en-NG")}`; // Using locale for better formatting
    } else {
      return `$${numericPrice.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
  };

  const contextObj = {
    isAuth,
    setIsAuth,
    email,
    setEmail,
    password,
    setPassword,
    setIsLoading,
    isLoading,
    error,
    setError,
    resetEmailAndPassword,
    courses,
    getAllCourses,
    newUser,
    setNewUser,
    getAllCourses,
    getOneCourse,
    enrolledCourses,
    getAllEnrolledCourses,
    getOneEnrolledCourse,
    course,
    token,
    setToken,
    walletBalance,
    fetchBalance,
    wallet,
    setWallet,
    userProfile,
    fetchProfile,
    fetchTransactions,
    transactions,
    fetchOneTransaction,
    transaction,
    createPaymentInvoice,
    paymentLink,
    setPaymentLink,
    cryptoPayload,
    setCryptoPayload,
    services,
    getAllServices,
    amount,
    setAmount,
    fundWallet,
    invalidateLogin,
    registerCourse,
    bioLoading,
    setBioLoading,
    BIOMETRIC_ENABLED_KEY,
    isBiometricAvailable,
    setIsBiometricAvailable,
    isBiometricEnabled,
    setIsBiometricEnabled,
    USER_TOKEN_KEY,
    handleLoginSuccess,
    setGlobalCurrency,
    globalCurrency,
    userCountry,
    setUserCountry,
    formatPrice,
    globalNotificationData,
    setGlobalNotificationData,
    projectId,
  };

  return (
    <StoreContext.Provider value={contextObj}>{children}</StoreContext.Provider>
  );
};

export default StoreContext;
