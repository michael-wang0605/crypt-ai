"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [dissolving, setDissolving] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  const pollProof = (proofId: string, explorerBase: string) => {
    const start = Date.now();
    const timer = setInterval(async () => {
      try {
        const r = await fetch(`http://localhost:8000/proof/${proofId}`);
        const j = await r.json(); // { status, tx_hash, explorer_url, error? }

        if (j.status === "ok" && j.tx_hash) {
          clearInterval(timer);
          const link = j.explorer_url || (explorerBase + j.tx_hash);
          // replace pending line with link
          setMessages(prev => {
            const cp = [...prev];
            const i = cp.length - 1;
            const cur = cp[i].content || "";
            cp[i] = {
              ...cp[i],
              content: cur.replace(/⏳ Proof pending…/g, `[🔗 View proof on Polygonscan](${link})`),
            };
            return cp;
          });
        } else if (j.status === "error") {
          clearInterval(timer);
          setMessages(prev => {
            const cp = [...prev];
            const i = cp.length - 1;
            const cur = cp[i].content || "";
            cp[i] = {
              ...cp[i],
              content: cur.replace(/⏳ Proof pending…/g, `⚠️ Proof failed. Try again later.`),
            };
            return cp;
          });
        }

        // stop after ~45s
        if (Date.now() - start > 45000) {
          clearInterval(timer);
          setMessages(prev => {
            const cp = [...prev];
            const i = cp.length - 1;
            const cur = cp[i].content || "";
            cp[i] = {
              ...cp[i],
              content: cur.replace(/⏳ Proof pending…/g, `⚠️ Proof status unknown. Check later.`),
            };
            return cp;
          });
        }
      } catch (e) {
        // transient blip; keep polling
        console.warn("Proof poll failed:", e);
      }
    }, 2500);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || busy) return;

    const userMessage = input;
    setInput("");
    setBusy(true);

    // show user bubble
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [...messages, { role: "user", content: userMessage }],
        }),
      });

      if (!res.ok) throw new Error("Network response was not ok");
      // Backend returns: { reply, proof_id, proof_status_url, explorer_base }
      const data = await res.json();

      const reply: string = data?.reply ?? "⚠️ No response.";
      const proofId: string | undefined = data?.proof_id;
      const explorerBase: string = data?.explorer_base || "https://amoy.polygonscan.com/tx/";

      // create empty assistant bubble
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      // type-out effect
      let idx = 0;
      typingTimer.current = setInterval(() => {
        if (idx < reply.length) {
          setMessages(prev => {
            const cp = [...prev];
            cp[cp.length - 1] = { role: "assistant", content: reply.slice(0, idx + 1) };
            return cp;
          });
          idx++;
        } else {
          if (typingTimer.current) clearInterval(typingTimer.current);
          typingTimer.current = null;
          setBusy(false);

          // add a pending line under the reply
          setMessages(prev => {
            const cp = [...prev];
            const i = cp.length - 1;
            cp[i] = { ...cp[i], content: `${cp[i].content}\n\n⏳ Proof pending…` };
            return cp;
          });

          // start polling blockchain proof (non-blocking)
          if (proofId) pollProof(proofId, explorerBase);
        }
      }, 10);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "❌ Error contacting backend." },
      ]);
      setBusy(false);
    }
  };

  const handleClear = () => {
    if (typingTimer.current) {
      clearInterval(typingTimer.current);
      typingTimer.current = null;
    }
    setDissolving(true);
    setTimeout(() => {
      setMessages([]);
      setDissolving(false);
      setBusy(false);
    }, 2000);
  };

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !busy) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=VT323&display=swap');
        body {
          font-family: 'Share Tech Mono', monospace;
          font-size: 1.15rem;
          line-height: 1.6;
          background-color: #000;
          color: #fff;
        }
        h1, .site-title {
          font-family: 'VT323', monospace;
          font-size: 3.5rem;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        h2, h3, h4 {
          font-family: 'VT323', monospace;
          font-size: 2rem;
        }
        @keyframes dissolve {
          0% { opacity: 1; filter: blur(0px); transform: translateY(0px) scale(1); }
          50% { filter: blur(2px); transform: translateY(-10px) scale(1.05); }
          100% { opacity: 0; filter: blur(4px); transform: translateY(-30px) scale(1.1); }
        }
        .dissolving { animation: dissolve 2s ease forwards; }
        @font-face {
          font-family: "DashScript";
          src: url("https://fonts.cdnfonts.com/s/91481/Dash Horizon.woff") format("woff");
        }
        textarea { font-family: 'Share Tech Mono', monospace; }
      `}</style>

      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-between p-4">
        <div className="relative w-full max-w-2xl flex flex-col h-[calc(100vh-2rem)]">
          {/* Title */}
          <h1
            className="text-center whitespace-pre leading-none tracking-tight"
            style={{ fontFamily: "monospace", fontSize: "0.7rem", overflow: "hidden" }}
          >
{`
                                    __                    _ 
  _____   _____   __  __    ____   / /_         ____ _   (_)
 / ___/  / ___/  / / / /   / __ \\ / __/        / __ \`/  / / 
/ /__   / /     / /_/ /   / /_/ // /_         / /_/ /  / /  
\\___/  /_/      \\__, /   / .___/ \\__/         \\__,_/  /_/   
               /____/   /_/                                 
`}
          </h1>

          {/* Trash button */}
          <button
            onClick={handleClear}
            className={`absolute top-4 right-4 text-white hover:text-gray-300 transition-colors ${
              shaking ? "animate-[shake_0.5s_cubic-bezier(0.36,0.07,0.19,0.97)_both]" : ""
            }`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          {/* Message list */}
          <div
            ref={messagesRef}
            className={`flex-1 overflow-y-auto space-y-4 p-4 transition-all duration-1000 ${
              dissolving ? "dissolving" : ""
            }`}
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-white text-black"
                      : msg.content.startsWith("❌")
                        ? "bg-red-900 border border-red-500 text-white"
                        : "bg-zinc-900 border border-white text-white"
                  } ${msg.content === "" ? "animate-pulse" : ""}`}
                >
                  <div className="prose prose-invert prose-p:my-1 prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1 max-w-none">
                    <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input area */}
          <form onSubmit={handleSend} className="flex items-end space-x-2 border-t border-white pt-4">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={busy}
              placeholder="type your message..."
              className="flex-1 bg-black text-white p-2 rounded-lg resize-none border border-white focus:outline-none text-sm overflow-hidden max-h-40"
              rows={1}
              style={{ lineHeight: "1.5", fontFamily: "Share Tech Mono, monospace" }}
            />
            <button
              type="submit"
              disabled={busy}
              className={`p-2 rounded-lg border border-white ${
                busy ? "opacity-40 cursor-not-allowed" : "hover:bg-white hover:text-black transition"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
