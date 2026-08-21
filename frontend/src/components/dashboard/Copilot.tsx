"use client";

import Image from "next/image";
import { FormEvent, KeyboardEvent, useState } from "react";
import ReactMarkdown from "react-markdown";

type CopilotProps = {
  context: unknown;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

const suggestedQuestions = [
  "Where is my idle capital?",
  "What is my biggest portfolio risk?",
  "What is the best yield opportunity?",
  "Are there any upcoming unlock risks?",
];

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "I’m AlphaLens Copilot. Ask me about your wallet, idle capital, pool opportunities, portfolio risks, or upcoming token unlocks. I’ll use the data currently available in your dashboard and call out uncertainty where it exists.",
};

export function Copilot({ context }: CopilotProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitQuestion(rawQuestion: string) {
    const prompt = rawQuestion.trim();

    if (!prompt || !context || isLoading) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      { id: crypto.randomUUID(), role: "user", content: prompt },
    ]);
    setQuestion("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt, context }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Copilot could not generate a response.");
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            data.answer ??
            "I could not generate a response from the available data.",
        },
      ]);
    } catch (requestError) {
      console.error("Copilot request failed:", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Copilot could not generate a response.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitQuestion(question);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void submitQuestion(question);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]">
      <header className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="" width={36} height={36} />
          <div>
            <h2 className="font-semibold">AlphaLens Copilot</h2>
            <p className="mt-0.5 text-sm text-white/45">
              On-chain portfolio intelligence · BOT Chain
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#00D4FF]/25 bg-[#00D4FF]/5 px-3 py-1 font-mono text-xs text-[#00D4FF]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00D4FF]" />
          Online
        </span>
      </header>

      <div
        className="max-h-[520px] min-h-[360px] space-y-5 overflow-y-auto px-5 py-6 sm:px-6"
        aria-live="polite"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <Image
                className="mt-1 h-7 w-7 shrink-0"
                src="/logo.svg"
                alt="AlphaLens"
                width={28}
                height={28}
              />
            )}
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-6 sm:max-w-[75%] ${
                message.role === "user"
                  ? "border border-[#00D4FF]/30 bg-[#00D4FF]/10 text-white"
                  : "border border-white/10 bg-white/[0.04] text-white/75"
              }`}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <Image
              className="mt-1 h-7 w-7 shrink-0"
              src="/logo.svg"
              alt="AlphaLens"
              width={28}
              height={28}
            />
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/55">
              Analysing your dashboard data…
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 bg-black/10 p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestedQuestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void submitQuestion(suggestion)}
              disabled={isLoading || !context}
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60 transition hover:border-[#00D4FF]/30 hover:bg-[#00D4FF]/5 hover:text-[#00D4FF] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex items-end gap-3 rounded-xl border border-white/10 bg-black/30 p-2 focus-within:border-[#00D4FF]/40">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask AlphaLens about your portfolio…"
              className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-white/35"
            />
            <button
              type="submit"
              disabled={isLoading || !question.trim() || !context}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00D4FF] text-[#02060b] transition hover:bg-[#4de2ff] disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Send message"
            >
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 3L17 10L3 17L5.5 10L3 3Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-xs text-white/35">
            Press Ctrl/Cmd + Enter to send. AlphaLens provides analysis, not
            financial advice or transaction execution.
          </p>
        </form>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-rose-400/25 bg-rose-400/5 px-3 py-2 text-sm text-rose-300"
          >
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
