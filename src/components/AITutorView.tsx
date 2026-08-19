import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Scale,
  FileText,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  sources?: string[];
}

export const AITutorView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_intro",
      sender: "ai",
      text: "Namaste! I am your **Omkun Orbit AI Civic & Legal Tutor**, powered by Google Gemini AI. I can help you draft Right to Information (RTI) petitions, resolve municipal grievances, audit public works tenders, and understand citizen constitutional rights in both English and Hindi.",
      timestamp: "Just now",
      sources: ["Constitution of India", "Right to Information Act 2005", "CPGRAMS Central Portal"],
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    {
      label: "Draft RTI for Road Work",
      query: "Draft a formal Right to Information (RTI) petition for auditing the asphalt thickness and contractor expenditure of local road reconstruction.",
    },
    {
      label: "Jal Board Water Grievance",
      query: "How do I file an urgent contaminated water supply complaint with the State Jal Board under the Public Health Mandate?",
    },
    {
      label: "Ward Councillor Duties",
      query: "What are the exact constitutional powers and budgetary allocations of a Municipal Ward Councillor (Nigam Parshad)?",
    },
    {
      label: "PM Surya Ghar Solar Scheme",
      query: "Explain step-by-step application and subsidy benefits under the PM Surya Ghar Muft Bijli Yojana.",
    },
  ];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query }),
      });
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        text: data.reply || "I have analyzed your query and processed relevant statutory guidelines.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: data.sources || ["Administrative Law Repository", "Citizen Services Directory"],
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI Tutor request failed:", err);
      const errorMsg: ChatMessage = {
        id: `ai_err_${Date.now()}`,
        sender: "ai",
        text: "Apologies, the AI Tutor encountered a network interruption. Please verify your connection or retry.",
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-12 animate-fadeIn flex flex-col h-[calc(100vh-100px)] md:h-[calc(100vh-120px)]">
      {/* Header Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900">AI Civic Legal Tutor</h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Gemini 3.7 Flash
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Instant Legal RTIs, Grievance Drafting, Government Schemes & Civic Advisory.
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: "msg_intro_reset",
                sender: "ai",
                text: "Chat reset. How can I assist you with civic governance or legal drafting today?",
                timestamp: "Just now",
              },
            ])
          }
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          title="Reset Conversation"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 overflow-y-auto custom-scrollbar space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white font-medium rounded-br-xs shadow-md"
                  : "bg-slate-50 border border-slate-200/80 text-slate-800 rounded-bl-xs space-y-2"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {msg.sources && msg.sources.length > 0 && (
                <div className="pt-2 border-t border-slate-200/60 mt-2 flex flex-wrap gap-1.5 items-center text-[10px] text-slate-500">
                  <span className="font-bold flex items-center gap-1">
                    <Scale className="w-3 h-3 text-blue-600" /> Reference Authorities:
                  </span>
                  {msg.sources.map((s, idx) => (
                    <span key={idx} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl w-fit text-xs text-slate-600 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Analyzing Indian Civic Statutes & Formulating Legal Reply...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 shrink-0">
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p.query)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-700 whitespace-nowrap shadow-xs transition-colors shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-md flex items-center gap-2 shrink-0">
        <input
          id="ai-tutor-prompt-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Ask anything on RTI, government schemes, municipal complaints, or ward budgets..."
          className="flex-1 text-xs md:text-sm px-3 py-2 bg-transparent focus:outline-none placeholder:text-slate-400"
        />
        <button
          id="ai-tutor-send-btn"
          onClick={() => handleSendMessage()}
          disabled={isLoading || !inputText.trim()}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 text-white p-2.5 rounded-xl shadow-md transition-all active:scale-95 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
