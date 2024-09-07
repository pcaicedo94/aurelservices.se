"use client"
import React, { useState } from "react";

const Chatbot = () => {
  const [chatboxVisible, setChatboxVisible] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "Bot",
      text: "Please select an option:",
      options: ["storstädning", "kontorstädning", "hemstädning"],
    },
  ]);
  const [input, setInput] = useState("");

  // Intent-response mapping
  const intents = {
    hello: "Hi there! How can I assist you today?",
    hej: "Hej där! Hur kan jag hjälpa till idag?",
    "find glasses":
      "Sure! We have a wide range of glasses. Are you looking for something specific?",
    "book appointment":
      "I'd be happy to help you book an appointment. When would you like to come in?",
    företag: "aurel städ",
    bye: "Goodbye! Have a great day!",
    städ: "Vi erbjuder städningstjänster för företag och privatpersoner.",
    storstädning: [{
      sender: "Bot",
      text: "Please select an option:", options: ["1-50kvm: 2400 kr (fast pris)",
        "51-70kvm: 2900 kr",
        "71-100kvm: 3400 kr",
        "101-150kvm: 4000 kr",
        "151-200 kvm: 4800 kr"
      ]
    }]
  };

  // Function to find the correct response based on the user's message
  const getResponse = (message) => {
    console.log("message", message);
    const lowerCaseMessage = message?.toLowerCase();
    for (const intent in intents) {
      if (lowerCaseMessage.includes(intent)) {
        console.log("intents[intent]", intents[intent]);
        return intents[intent];
      }
    }
    return "Sorry, jag förstod inte riktigt det där men du kanske är intresserad om att veta om tjänsterna vi erbjuder?";
  };

  const toggleChatbox = () => {
    setChatboxVisible(!chatboxVisible);
  };

  const sendMessage = () => {
    if (input.trim() === "") return;

    // Add user's message to chatbox
    const userMessage = { sender: "You", text: input };
    const botResponseText = getResponse(input);
    console.log("botResponseText", botResponseText, "input", input);
    const botResponse = { sender: "Bot", text: botResponseText };

    // Update messages with user and bot responses
    setMessages([...messages, userMessage, botResponse]);

    // Optionally, add options based on specific intents
    addOptions(botResponseText);

    setInput("");
  };

  const addOptions = (responseText) => {
    const options = ["storstädning", "kontorstädning", "hemstädning"];
    console.log("responseText", responseText);
    if (responseText.toLowerCase().includes('storstädning')) {
      setMessages((prevMessages) => [

        {
          sender: "Bot",
          text: "Please select an option:",
          options: intents.storstädning.options,
        },
      ]); return
    }
    console.log("messages Add options", messages);
    if (typeof responseText?.toLowerCase == 'string' && responseText.toLowerCase().includes("städ")) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: "Bot",
          text: "Please select an option:",
          options: options,
        },
      ]);
    }

  };

  const sendOption = (option) => {
    const userMessage = { sender: "You", text: option };
    const botResponse = {
      sender: "Bot",
      text: `You selected ${option}. Here is the information about ${option}...`,
    };

    setMessages([...messages, userMessage, botResponse]);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "left",
        justifyContent: "left",
        border: "1px solid gray",
        flexDirection: "column",
        position: "relative",
        overflow: "auto",
      }}
    >
      <h1>Chatta med Oss</h1>
      <div
        id="chatbox-container"
        style={{
          height: "300px",
          overflowY: "auto",
          height: "300px",
          "overflow-y": "auto",
          textAlign: "left",
          paddingLeft: "12px",
        }}
      >
        <div id="chatbox">
          <h4>Hej Välkommen </h4>
          {messages?.map((message, index) => (
            <div key={index}>
              <p>
                <strong>{message.sender}:</strong> {message.text}
              </p>
              {message.options && (
                <div
                  className="options"
                  style={{
                    display: "flex",
                    gap: "20px",
                    paddingBottom: "2rem",
                  }}
                >
                  {message.options.map((option, index) => (
                    <button key={index} onClick={() => sendOption(option)}>
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", bottom: 0 }}>
          <input
            type="text"
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>Skicka</button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
