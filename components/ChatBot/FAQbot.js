import React, { useState, useEffect, useRef } from "react";
import { CHAT_TREE, chatNode } from "../../lib/chatbot/tree";

// The chatbot is a walk through lib/chatbot/tree.js: every message, button and
// link it shows comes from that module, which builds its price sentences from
// lib/pricing.js. The component holds no copy and no amount of its own, so the
// bot can never quote a rate the calculators no longer charge.
const FAQbot = () => {
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const openButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const wasOpen = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting: the root of the tree.
      setTimeout(() => {
        addBotNode(CHAT_TREE.rootId);
      }, 500);
    }
  }, [isOpen]);

  // On phones the window covers the whole screen: lock the page behind it.
  // Focus moves into the window on open and back to the chat button on close.
  useEffect(() => {
    if (!isOpen) {
      if (wasOpen.current) openButtonRef.current?.focus();
      wasOpen.current = false;
      return undefined;
    }
    wasOpen.current = true;
    closeButtonRef.current?.focus();

    const phone = window.matchMedia("(max-width: 480px)");
    const previousOverflow = document.body.style.overflow;
    const applyScrollLock = () => {
      document.body.style.overflow = phone.matches ? "hidden" : previousOverflow;
    };
    applyScrollLock();
    phone.addEventListener("change", applyScrollLock);

    const handleKey = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKey);

    return () => {
      phone.removeEventListener("change", applyScrollLock);
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // An unknown id would leave the visitor without a way out, so it falls back
  // to the contact node instead of rendering an empty bubble.
  const addBotNode = (nodeId) => {
    const node = chatNode(nodeId) || chatNode(CHAT_TREE.rootId);
    setMessages((prev) => [...prev, { type: "bot", node, timestamp: new Date() }]);
  };

  const addUserMessage = (text) => {
    setMessages((prev) => [...prev, { type: "user", text, timestamp: new Date() }]);
  };

  const handleOptionClick = (option) => {
    addUserMessage(option.label);
    setTimeout(() => {
      addBotNode(option.next);
    }, 500);
  };

  return (
    <>
      {/* Chat Button */}
      <button
        ref={openButtonRef}
        type="button"
        className={`faq-chat-button ${isOpen ? "hidden" : ""}`}
        onClick={() => setIsOpen(true)}
        aria-label="Öppna FAQ chatbot"
      >
        <span>💬</span>
        <span className="chat-button-text">Frågor?</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="faq-chat-window"
          role="dialog"
          aria-labelledby="faq-chat-title"
        >
          <div className="faq-chat-header">
            <h3 id="faq-chat-title">Aurel Services - FAQ</h3>
            <button
              ref={closeButtonRef}
              type="button"
              className="faq-close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Stäng chat"
            >
              ✕
            </button>
          </div>

          <div className="faq-chat-messages">
            {messages.map((message, index) => (
              <div key={index} className={`faq-message ${message.type}`}>
                <div className="faq-message-content">
                  <p>{message.type === "bot" ? message.node.message : message.text}</p>

                  {message.type === "bot" && message.node.links.length > 0 && (
                    <div className="faq-message-links">
                      {message.node.links.map((link) => (
                        <a key={link.href} href={link.href}>
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}

                  {message.type === "bot" && (
                    <div className="faq-options">
                      {message.node.options.map((option) => (
                        <button
                          key={`${option.label}-${option.next}`}
                          type="button"
                          className="faq-option-button"
                          onClick={() => handleOptionClick(option)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="faq-chat-footer">
            <p>Behöver du mer hjälp? <a href="/kontakt">Kontakta oss</a></p>
          </div>
        </div>
      )}
    </>
  );
};

export default FAQbot;
