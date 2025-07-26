// ChatScreen.js
import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView, // Using ScrollView for simplicity; consider FlatList for performance
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
  StyleSheet, // Keep StyleSheet for potential use with markdown library styles
  Alert
} from "react-native";
import tw from "twrnc";
import StoreContext from "../context/storeContext";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
// Import the Markdown component
import Markdown from "react-native-markdown-display";
import { WebView } from "react-native-webview";

import Toast from "react-native-toast-message";

// Assuming API_URL is correctly set in your environment
const API_URL = process.env.EXPO_PUBLIC_API_URL;

const ChatScreen = () => {
  const {
    token,
    isLoading: globalLoading,
    setIsLoading: setGlobalLoading,
  } = useContext(StoreContext);
  const navigation = useNavigation();

  const [messages, setMessages] = useState([]); // { id: string, text: string, sender: 'user' | 'ai', isError?: boolean, createdAt: string }
  const [inputText, setInputText] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [currentConversationTitle, setCurrentConversationTitle] =
    useState("New Chat");
  const [conversationsList, setConversationsList] = useState([]);
  const [isConversationListVisible, setIsConversationListVisible] =
    useState(false);
  const [loadingConvoMessages, setLoadingConvoMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false); // Component-specific loading for sending

  // New state for WebView
  const [isWebViewOpen, setIsWebViewOpen] = useState(false);
  const [chatWebLink, setChatWebLink] = useState(null);

  const scrollViewRef = useRef();

  function reportConversationHandler() {
    console.log("Report Conversation Handler", conversationId, currentConversationTitle);
    //send toast
    Toast.show({
      type: "info", // 'success' | 'error' | 'info'
      text1: "Conversation Reported", // title
      text2: `Conversation : ${currentConversationTitle} with ID: ${conversationId}`, //msg body
    })
  }

  // --- Fetch Conversation List ---
  useFocusEffect(
    useCallback(() => {
      const fetchConversations = async () => {
        if (!token) return;
        console.log("Fetching conversations list...");

        try {
          const response = await fetch(`${API_URL}/chat/conversations`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error(
              "Failed to fetch conversations:",
              response.status,
              errorData
            );
            // Optionally show a toast or alert
            setConversationsList([]); // Ensure it's an empty array on failure
            return;
          }

          const data = await response.json();
          //   console.log("Conversations fetched:", data.length);
          setConversationsList(data);
        } catch (error) {
          console.error("Error fetching conversations:", error);
          // Optionally show a toast or alert
          setConversationsList([]); // Ensure it's an empty array on error
        }
      };

      fetchConversations();
    }, [token]) // Rerun if token changes
  );

  //reset chat link on unmount
  useFocusEffect(
    useCallback(() => {
      return () => {
        // This runs when the screen is unfocused (user navigates away)
        console.log("ChatScreen unfocused, resetting chatWebLink.");
        setChatWebLink(null);
        //navigate to Chat main area
        navigation.replace("ChatMain");
      };
    }, [])
  );

  //chat link
  useEffect(() => {
    if (chatWebLink) {
      // Simplified check: if chatWebLink exists
      setIsWebViewOpen(true);
      Toast.show({
        type: "success",
        text1: "Opening chat page...",
        text2: "Please wait while we redirect you.",
        visibilityTime: 3000, // Show toast for 3 seconds
      });
    } else {
      setIsWebViewOpen(false); // Ensure WebView closes if link becomes empty
    }
  }, [chatWebLink]);

  const startChatHandler = () => {
    // No need for async if just setting state
    console.log("startChatHandler called, setting web link...");
    setChatWebLink("https://tawk.to/chat/67c9e9b474875e1908b57bbf/1ilmbhqof");
    // The useEffect above will automatically set isWebViewOpen to true
    // If you want it to be immediate without relying on useEffect's timing for THIS specific action:
    // setIsWebViewOpen(true); // You can also set it directly here
  };

  // Function to close the WebView
  const closeWebView = () => {
    console.log("Closing WebView...");
    setChatWebLink(null); // This will trigger the useEffect to set isWebViewOpen to false
  };

  // --- Fetch Messages for a Specific Conversation ---
  // Placeholder function: YOU NEED TO IMPLEMENT THE BACKEND FOR THIS
  const fetchMessagesForConversation = async (convoId) => {
    if (!token || !convoId) {
      setMessages([
        {
          id: "info-no-id",
          text: "No conversation selected or token missing.",
          sender: "ai",
        },
      ]);
      return;
    }

    setLoadingConvoMessages(true);
    setMessages([]); // Clear existing messages immediately

    try {
      console.log(`Workspaceing messages for conversation ID: ${convoId}`);
      // REPLACE with your actual backend endpoint and logic
      const response = await fetch(
        `${API_URL}/chat/conversations/${convoId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          `Failed to fetch messages for convo ${convoId}:`,
          response.status,
          errorData
        );
        setMessages([
          {
            id: "error-load",
            text: "Failed to load conversation history.",
            sender: "ai",
            isError: true,
          },
        ]);
        return;
      }

      const data = await response.json();
      const messageData = data.messages;
      // Assuming data is an array of message objects like {id, content, role, createdAt}
      const loadedMessages = messageData.map((msg) => ({
        id: msg.id || Math.random().toString(),
        text: msg.content, // Assuming content field
        sender: msg.role === "user" ? "user" : "model", // Assuming role field ('user' or 'assistant'/'model')
        createdAt: msg.createdAt || new Date().toISOString(), // Use backend timestamp if available
      }));

      setMessages(loadedMessages);
    } catch (error) {
      console.error(`Error fetching messages for convo ${convoId}:`, error);
      setMessages([
        {
          id: "error-catch",
          text: "An error occurred while loading history.",
          sender: "ai",
          isError: true,
        },
      ]);
    } finally {
      setLoadingConvoMessages(false);
    }
  };

  // --- Handlers for Conversation Switching/Creation ---
  const handleNewConversation = () => {
    setConversationId(null);
    setCurrentConversationTitle("New Chat");
    setMessages([]);
    setIsConversationListVisible(false);
    console.log("Started new conversation.");
  };

  const handleLoadConversation = (convo) => {
    setConversationId(convo.id);
    const title =
      convo.title ||
      (convo.messages && convo.messages[0]?.content
        ? convo.messages[0].content.substring(0, 50).replace(/\n/g, " ") + "..."
        : "Chat");
    setCurrentConversationTitle(title);
    setIsConversationListVisible(false);
    console.log(`Loading conversation: ${convo.id}`);
    fetchMessagesForConversation(convo.id); // Fetch the full message history
  };

  // --- Message Sending Logic ---
  const handleSend = async () => {
    const userMessageText = inputText.trim();
    if (!userMessageText) return;

    const newMessage = {
      id: Math.random().toString(),
      text: userMessageText,
      sender: "user",
      createdAt: new Date().toISOString(),
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputText("");
    setIsSendingMessage(true); // Use component-specific loading for sending

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: userMessageText,
          conversationId: conversationId, // Will be null for new chat
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Backend error:",
          data.error || data.message || `Status: ${response.status}`
        );
        const errorMessage = {
          id: Math.random().toString(),
          text: `Error: ${
            data.error || data.message || "Failed to get response from AI."
          }`,
          sender: "ai",
          isError: true,
          createdAt: new Date().toISOString(),
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
        return;
      }

      const { reply, conversationId: newConversationId } = data;

      const aiMessage = {
        id: Math.random().toString(), // Use backend message ID if provided
        text: reply, // This text will be processed by Markdown
        sender: "ai",
        createdAt: new Date().toISOString(),
      };

      setMessages((prevMessages) => [...prevMessages, aiMessage]);

      if (newConversationId && newConversationId !== conversationId) {
        setConversationId(newConversationId);
        // Optionally update conversations list in background or on next focus
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: Math.random().toString(),
        text: "Sorry, I couldn't get a response. Please try again.",
        sender: "ai",
        isError: true,
        createdAt: new Date().toISOString(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsSendingMessage(false); // Turn off sending loading
      // setGlobalLoading(false); // Use global loading carefully if needed elsewhere
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    // Use a slight delay to ensure layout updates before scrolling
    const timeout = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100); // Adjust delay if needed

    return () => clearTimeout(timeout);
    // Scroll when messages change, or loading states change (for loading bubbles)
  }, [messages, isSendingMessage, loadingConvoMessages]);

  // --- Markdown Styling ---
  // Define styles for the Markdown content
  // We use StyleSheet here because react-native-markdown-display expects RN styles
  // and merging complex twrnc styles deeply can be tricky.
  const markdownStyles = StyleSheet.create({
    // Overall body text style - should match AI bubble text color
    body: {
      color: tw.color("gray-800"), // AI text color
      fontSize: tw.style("text-base").fontSize, // Match base font size
      lineHeight: tw.style("leading-relaxed").lineHeight, // Match line height
    },
    // Paragraph spacing
    paragraph: {
      marginTop: 0, // Reset default margin
      marginBottom: tw.style("mb-2").marginBottom, // Add space below paragraphs
    },
    // Code Block styles
    code_block: {
      backgroundColor: tw.color("gray-800"), // Dark background for code
      borderRadius: tw.style("rounded-md").borderRadius,
      padding: tw.style("p-3").padding,
      marginTop: tw.style("mt-1").marginTop,
      marginBottom: tw.style("mb-2").marginBottom,
      // Preserve whitespace and line breaks
      fontFamily: Platform.select({
        ios: "Courier New",
        android: "monospace",
        default: "monospace",
      }),
      fontSize: tw.style("text-sm").fontSize,
      color: tw.color("white"), // White text for code
      overflow: "hidden", // Hide potential overflow
    },
    // Style for the content inside the code block (usually spans/text)
    // This style object needs to target the specific elements rendered by the library inside code_block.
    // Often, it's applied to Text elements. We set text color explicitly on code_block itself,
    // but some syntax highlight components might need this.
    // Leaving this empty as color is set on code_block above.
    code_inline: {
      backgroundColor: tw.color("gray-200"), // Light background for inline code
      color: tw.color("gray-800"), // Text color for inline code
      borderRadius: tw.style("rounded").borderRadius,
      paddingHorizontal: tw.style("px-1").paddingHorizontal,
      fontFamily: Platform.select({
        ios: "Courier New",
        android: "monospace",
        default: "monospace",
      }),
      fontSize: tw.style("text-sm").fontSize,
    },
    // Blockquote styles (for text starting with >)
    block_quote: {
      borderLeftColor: tw.color("gray-400"),
      borderLeftWidth: 4,
      paddingLeft: tw.style("pl-3").paddingLeft,
      marginLeft: tw.style("ml-1").marginLeft,
      fontStyle: "italic",
      opacity: 0.9,
    },
    // Add styles for headers, lists, etc if you want them formatted
    heading1: {
      fontSize: tw.style("text-2xl").fontSize,
      fontWeight: "bold",
      marginBottom: tw.style("mb-2").marginBottom,
      marginTop: tw.style("mt-2").marginTop,
    },
    heading2: {
      fontSize: tw.style("text-xl").fontSize,
      fontWeight: "bold",
      marginBottom: tw.style("mb-2").marginBottom,
      marginTop: tw.style("mt-2").marginTop,
    },
    // ... add styles for heading3-6, bullet_list, ordered_list, list_item, strong, em, link etc.
  });

  // --- Render a single message bubble ---
  const renderMessageBubble = ({ item }) => {
    // Determine bubble colors and alignment based on sender/error status
    const isUser = item.sender === "user";
    const isAI =
      (item.sender === "model" || item.sender === "ai") && !item.isError;
    const isError = item.isError;

    const bubbleStyle = tw`max-w-4/5 py-2 px-3 rounded-2xl mb-3 ${
      isUser
        ? "bg-purple-600 self-end rounded-br-sm" // User bubble styles
        : isError
        ? "bg-red-500 self-start rounded-bl-sm" // Error bubble styles
        : "bg-gray-300 self-start rounded-bl-sm" // AI bubble styles
    }`;

    const textStyle = tw`${isUser || isError ? "text-white" : "text-gray-800"}`;

    return (
      <View key={item.id} style={bubbleStyle}>
        {isAI ? (
          <Markdown style={markdownStyles}>{item.text}</Markdown>
        ) : (
          <Text style={textStyle}>{item.text}</Text>
        )}
      </View>
    );
  };

  // --- Render a loading indicator bubble (for AI typing) ---
  const renderLoadingBubble = () => (
    <View style={tw`self-start bg-gray-500 py-3 px-4 rounded-xl mb-3`}>
      <ActivityIndicator size="small" color={tw.color("white")} />
    </View>
  );

  // --- Render a single conversation item in the list modal ---
  const renderConversationItem = ({ item }) => {
    // Ensure item and its properties exist before accessing
    if (!item || !item.id || !item.updatedAt) {
      console.warn("Skipping render for invalid conversation item:", item);
      return null;
    }
    // Use the title if available, otherwise fallback to first message preview
    const previewText =
      item.title ||
      (item.messages && item.messages[0]?.content
        ? item.messages[0].content.substring(0, 50).replace(/\n/g, " ") + "..."
        : "Untitled Chat");

    return (
      <TouchableOpacity
        key={item.id}
        style={tw`p-4 border-b border-gray-200 bg-white`}
        onPress={() => handleLoadConversation(item)}
      >
        <Text style={tw`text-lg font-semibold text-gray-800`}>
          {previewText}
        </Text>
        <Text style={tw`text-sm text-gray-500 mt-1`}>
          Last update: {new Date(item.updatedAt).toLocaleString()}
        </Text>
      </TouchableOpacity>
    );
  };

  // --- MAIN RENDER LOGIC ---
  if (isWebViewOpen && chatWebLink) {
    // If WebView is open, render only the WebView and a way to close it
    return (
      <View style={tw`flex-1 bg-black`}>
        <View
          style={tw`bg-gray-800 p-3 flex-row items-center justify-between pt-10`}
        >
          <Text style={tw`text-lg font-semibold text-white`}>Live Support</Text>
          <TouchableOpacity onPress={closeWebView} style={tw`p-2`}>
            {/* <Ionicons name="close" size={28} color={tw.color("white")} /> */}
            <FontAwesome5 name="headset" size={30} color="white" />
          </TouchableOpacity>
        </View>
        <WebView
          source={{ uri: chatWebLink }}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          style={tw`flex-1`} // WebView takes remaining space
          renderLoading={() => (
            <View
              style={tw`flex-1 justify-center items-center absolute top-0 bottom-0 left-0 right-0 bg-white`}
            >
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={tw`mt-4 text-gray-600`}>Loading Chat Page...</Text>
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn("WebView error: ", nativeEvent);
            Alert.alert(
              "Loading Error",
              `Failed to load the web page. ${nativeEvent.description || ""}`,
              [{ text: "OK", onPress: closeWebView }] // Close WebView on error
            );
            // closeWebView(); // Also call it here
          }}
          onLoadStart={() =>
            console.log("WebView load started for:", chatWebLink)
          }
          onLoadEnd={() => console.log("WebView load finished.")}
        />
      </View>
    );
  } else {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={tw`flex-1 bg-gray-100`} // Use light gray background
        keyboardVerticalOffset={Platform.select({ ios: 90, android: 0 })} // Adjust offset considering header height
      >
        <View
          style={tw`bg-white p-4 border-b border-gray-200 flex-row items-center justify-between shadow-sm mt-5`}
        >
          <Text
            style={tw`text-xl font-bold text-gray-800 flex-1 mr-4`}
            numberOfLines={1}
          >
            {currentConversationTitle}
          </Text>
          <TouchableOpacity onPress={() => setIsConversationListVisible(true)}>
            <Ionicons name="menu" size={28} color={tw.color("gray-600")} />
          </TouchableOpacity>
        </View>

        {loadingConvoMessages ? (
          <View style={tw`flex-1 justify-center items-center`}>
            <ActivityIndicator size="large" color={tw.color("purple-600")} />
            <Text style={tw`mt-2 text-gray-600`}>
              Loading conversation history...
            </Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={tw`flex-1 px-3 pt-3`} // Add padding
            contentContainerStyle={tw`pb-3`} // Padding at the bottom
          >
            {messages.map((msg) => renderMessageBubble({ item: msg }))}
            {messages.length > 0 && (
              <TouchableOpacity
                onPress={reportConversationHandler}
                style={tw`bg-red-500 w-2/4 rounded-2xl px-3 mb-1 mt-6 py-3 shadow-md`}
              >
                <Text style={tw`text-white text-sm font-semibold`}>
                  Report Conversation
                </Text>
              </TouchableOpacity>
            )}

            {isSendingMessage && renderLoadingBubble()}
            {!loadingConvoMessages && messages.length === 0 && (
              <View style={tw`flex-1 justify-center items-center p-6`}>
                <Text style={tw`text-lg text-gray-600 text-center`}>
                  Start a new conversation or load a past one from the menu. You
                  can also use the chat widget to start a new conversation with
                  a live agent.
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        <View
          style={tw`flex-row items-center p-3 border-t border-gray-200 bg-white shadow-sm`}
        >
          <TextInput
            style={tw`flex-1 h-12 border border-gray-300 rounded-full px-4 mr-2 text-gray-800 bg-gray-50`}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor={tw.color("gray-500")}
            editable={!isSendingMessage && !loadingConvoMessages} // Disable input while sending or loading history
            multiline // Allow multiline input
            // Adjust height based on content if needed, or use a fixed large height
            // onContentSizeChange={(event) => {
            //   // Optional: Adjust TextInput height based on content
            //   // setInputHeight(event.nativeEvent.contentSize.height);
            // }}
          />
          <TouchableOpacity
            style={tw`w-12 h-12 rounded-full bg-purple-600 justify-center items-center ${
              (isSendingMessage || loadingConvoMessages || !inputText.trim()) &&
              "opacity-50" // Dim when disabled/empty
            }`}
            onPress={handleSend}
            disabled={
              isSendingMessage || loadingConvoMessages || !inputText.trim()
            } // Disable when loading or input is empty
          >
            {/* Send Icon */}
            <Ionicons name="send" size={24} color={tw.color("white")} />
          </TouchableOpacity>
        </View>

        {!isConversationListVisible && (
          <>
            <TouchableOpacity
              style={tw`absolute bottom-20 right-6 bg-green-500 rounded-full w-14 h-14 justify-center items-center shadow-lg z-10`} // Added z-index to ensure it's on top
              onPress={handleNewConversation}
            >
              {/* <Ionicons name="add" size={30} color={tw.color("white")} /> */}
              <FontAwesome5 name="robot" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`absolute bottom-40 right-6 bg-blue-500 rounded-full w-14 h-14 justify-center items-center shadow-lg z-10`}
              onPress={startChatHandler} // This button now opens the WebView
            >
              {/* <Ionicons
                name="help-buoy-outline" 
                size={30}
                color={tw.color("white")}
              /> */}
              {/* <FontAwesome5 name="headset" size={40} color="#FFFFFF" /> */}
              <FontAwesome name="user" size={30} color="white" />
            </TouchableOpacity>
          </>
        )}

        <Modal
          visible={isConversationListVisible}
          animationType="slide"
          onRequestClose={() => setIsConversationListVisible(false)} // Android back button
          presentationStyle="pageSheet" // iOS specific style for a smaller modal from bottom
        >
          <View style={tw`flex-1 bg-gray-100`}>
            {/* Modal Header */}
            <View
              style={tw`flex-row items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm`}
            >
              <Text style={tw`text-xl font-bold text-gray-800`}>
                Conversations
              </Text>
              <TouchableOpacity
                onPress={() => setIsConversationListVisible(false)}
              >
                <Ionicons name="close" size={28} color={tw.color("gray-600")} />
              </TouchableOpacity>
            </View>

            {conversationsList.length === 0 && !globalLoading ? ( // Check global loading for initial fetch
              <View style={tw`flex-1 justify-center items-center p-6`}>
                <Text style={tw`text-lg text-gray-600 text-center`}>
                  No past conversations found.
                </Text>
              </View>
            ) : globalLoading ? ( // Show loading for the list itself if using global loading
              <View style={tw`flex-1 justify-center items-center`}>
                <ActivityIndicator
                  size="large"
                  color={tw.color("purple-600")}
                />
              </View>
            ) : (
              <FlatList
                data={conversationsList}
                keyExtractor={(item) =>
                  item.id?.toString() || Math.random().toString()
                } // Fallback key
                renderItem={renderConversationItem}
                contentContainerStyle={tw`pb-4`}
              />
            )}

            <TouchableOpacity
              style={tw`p-4 bg-purple-600 items-center`}
              onPress={handleNewConversation}
            >
              <Text style={tw`text-white text-lg font-semibold`}>
                Start New AI Chat
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    );
  }
};

// Removed empty StyleSheet.create({});
export default ChatScreen;
