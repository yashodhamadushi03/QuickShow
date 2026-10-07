import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Film, MapPin, Ticket, Bot } from "lucide-react";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 Ayubowan! Welcome to QuickShow Cinema Assistant. How can I help you book tickets or find movie showtimes in Sri Lanka today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const quickPrompts = [
    "🎬 Movies showing today?",
    "📍 Scope & Savoy Theaters",
    "🍿 Recommend an Action movie",
    "🎟️ How do I receive my ticket email?"
  ];

  const generateBotReply = (userQuery) => {
    const query = userQuery.toLowerCase();

    if (query.includes("movie") || query.includes("showing") || query.includes("film")) {
      return "🎬 Currently screening across Scope Cinemas & Savoy: \n1. Dune: Part Two (English)\n2. Kandak Sema (Sinhala)\n3. GOAT (Tamil)\n4. Oppenheimer\n5. Stree 2 (Hindi)\n\nClick 'Movies' in the top header or use our Live Search bar to book!";
    }

    if (query.includes("theater") || query.includes("colombo") || query.includes("jaffna") || query.includes("location")) {
      return "📍 QuickShow is available at 10 Sri Lankan locations including:\n• Scope Cinemas - Colombo City Centre & Havelock City Mall (IMAX)\n• Liberty Colpetty\n• Savoy 3D Wellawatte & Maharagama\n• PVR One Galle Face\n• Regal Jaffna, Gampaha & Nuwara Eliya!";
    }

    if (query.includes("ticket") || query.includes("email") || query.includes("pass") || query.includes("confirmation")) {
      return "🎟️ After selecting your seats on the seat matrix grid, enter your Email Address at checkout. An HTML entrance pass with your unique entry passcode (TXN-LK...) will be sent directly to your inbox!";
    }

    if (query.includes("recommend") || query.includes("best") || query.includes("action") || query.includes("sinhala")) {
      return "✨ Top Recommendations for You:\n🔥 Action/Sci-Fi: 'Dune: Part Two' or 'GOAT'\n🇱🇰 Sri Lankan Drama: 'Kandak Sema'\n🎧 Pro Tip: On the seat booking page, click '✨ Best Seats' to auto-select optimal acoustic center seats!";
    }

    return "😊 I'm here to help! You can ask about movie showtimes, cinema locations across Sri Lanka, seat reservations, or digital email tickets.";
  };

  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsg = {
      sender: "user",
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");

    // Simulate AI bot response delay
    setTimeout(() => {
      const replyText = generateBotReply(text);
      const botMsg = {
        sender: "bot",
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 600);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-2xl shadow-rose-900/50 hover:scale-110 transition-all duration-300 flex items-center justify-center"
        title="QuickShow AI Cinema Assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Chatbox Window Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-96 h-[500px] bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  QuickShow Assistant <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                </h3>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Online Sri Lanka
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl whitespace-pre-line leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-rose-600 text-white rounded-br-none"
                      : "bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-full whitespace-nowrap shrink-0 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about movies, theaters, or tickets..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className={`p-2.5 rounded-xl text-white transition-all ${
                inputMessage.trim()
                  ? "bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/30"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
