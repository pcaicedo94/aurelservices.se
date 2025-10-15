"use client";
import React, { useState } from "react";
import axios from "axios";

const Chatbot = () => {
  const [chatboxVisible, setChatboxVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // Toggle chatbox visibility
  const toggleChatbox = () => {
    setChatboxVisible(!chatboxVisible);
  };

  // Send message to n8n workflow and get response
  const sendMessage = async () => {
    if (input.trim() === "") return;

    // Add user's message to chatbox
    const userMessage = { sender: "You", text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      // Send the user's message to the n8n workflow
      const response = await axios.post("http://localhost:5678/webhook/d577e66b-35d7-4791-ab06-b9dfeff49222", {
        message: input,
      });

      // Add bot's response to chatbox
      const botMessage = { sender: "Bot", text: response.data.output };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error communicating with n8n:", error);

      // Handle specific errors
      let errorMessageText = "Sorry, something went wrong. Please try again later.";
      if (error.message === "Network Error") {
        errorMessageText = "Unable to connect to the chatbot service. Please check your network or try again later.";
      } else if (error.response) {
        if (error.response.status === 404) {
          errorMessageText = "The chatbot service is currently unavailable. Please try again later.";
        } else if (error.response.data && error.response.data.message.includes("webhook is not registered")) {
          errorMessageText = "The chatbot workflow is inactive. Please contact support.";
        }
      }

      const errorMessage = { sender: "Bot", text: errorMessageText };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }

    setInput("");
  };

  // Handle sending message on Enter key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "80px", // Adjusted to avoid overlapping with the footer
        right: "20px",
        width: chatboxVisible ? "300px" : "60px",
        height: chatboxVisible ? "auto" : "60px",
        borderRadius: chatboxVisible ? "10px" : "50%",
        backgroundColor: "#fff", // Make the bubble fully green
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        overflow: "hidden",
        border: chatboxVisible ? "2px solid #34a783" : "none", // Add a green frame when expanded
        display: "flex",
        flexDirection: chatboxVisible ? "column" : "center",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        zIndex: 9999, // Ensure the chatbox is always on top
      }}
      onClick={!chatboxVisible ? toggleChatbox : undefined}
    >
      {chatboxVisible && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            backgroundColor: "#34a783",
            padding: "10px",
            borderBottom: "1px solid #fff", // Add a subtle divider
          }}
        >
          <span
            style={{
              fontSize: "20px",
              color: "#fff",
              cursor: "pointer",
            }}
            onClick={toggleChatbox}
          >
            ✖ {/* X icon moved to the left */}
          </span>
          <span style={{ fontSize: "16px", color: "#fff" }}>Chatta med Aurel</span>
        </div>
      )}

      {!chatboxVisible && (
        <span style={{ fontSize: "20px", color: "#fff" }}>💬</span> // Chat bubble icon
      )}

      {chatboxVisible && (
        <div style={{ padding: "10px", maxHeight: "400px", overflowY: "auto" }}>
          <div id="chatbox">
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: message.sender === "You" ? "flex-end" : "flex-start",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    padding: "10px",
                    borderRadius: "10px",
                    backgroundColor: message.sender === "You" ? "#34a783" : "#f1f1f1",
                    color: message.sender === "You" ? "#fff" : "#000",
                  }}
                >
                  <strong>{message.sender}:</strong> {message.text}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", marginTop: "10px" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "5px",
                marginRight: "5px",
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                padding: "10px",
                backgroundColor: "#34a783",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
