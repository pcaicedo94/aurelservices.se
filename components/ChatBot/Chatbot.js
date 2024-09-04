import React, { useState } from 'react';

const Chatbot = () => {
  const [chatboxVisible, setChatboxVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // Intent-response mapping
  const intents = {
    "hello": "Hi there! How can I assist you today?",
    "hej": "Hej där! Hur kan jag hjälpa till idag?",
    "find glasses": "Sure! We have a wide range of glasses. Are you looking for something specific?",
    "book appointment": "I'd be happy to help you book an appointment. When would you like to come in?",
    "företag": "aurel städ",
    "bye": "Goodbye! Have a great day!",
  };

  // Function to find the correct response based on the user's message
  const getResponse = (message) => {
    const lowerCaseMessage = message.toLowerCase();
    for (const intent in intents) {
      if (lowerCaseMessage.includes(intent)) {
        return intents[intent];
      }
    }
    return "Sorry, jag förstod inte riktigt det där men du kanske är intresserad om att veta om tjänsterna vi erbjuder?";
  };

  const toggleChatbox = () => {
    setChatboxVisible(!chatboxVisible);
  };

  const sendMessage = () => {
    if (input.trim() === '') return;

    // Add user's message to chatbox
    const userMessage = { sender: 'You', text: input };
    const botResponse = { sender: 'Bot', text: getResponse(input) };
    
    setMessages([...messages, userMessage, botResponse]);
    setInput('');

    // Optionally, add options based on specific intents
    addOptions(botResponse.text);
  };

  const addOptions = (responseText) => {
    const options = ['storstädning', 'kontorstädning', 'hemstädning'];
    if (responseText.includes('städ')) {
      setMessages(prevMessages => [
        ...prevMessages,
        {
          sender: 'Bot',
          text: 'Please select an option:',
          options: options,
        },
      ]);
    }
  };

  const sendOption = (option) => {
    const userMessage = { sender: 'You', text: option };
    const botResponse = { sender: 'Bot', text: `You selected ${option}. Here is the information about ${option}...` };

    setMessages([...messages, userMessage, botResponse]);
  };

  return (
    <div hola="ok" style={{display:'flex', alignContent:'center', flexDirection: 'column'}}>
      <h1>Chatta med Oss</h1>
     
        <div id="chatbox-container" style={{height:'300px'}}>
          <div id="chatbox">
            {messages.map((message, index) => (
              <div key={index}>
                <p>
                  <strong>{message.sender}:</strong> {message.text}
                </p>
                {message.options && (
                  <div className="options">
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
          <input
            type="text"
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
    
    </div>
  );
};

export default Chatbot;
