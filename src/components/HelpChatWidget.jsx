import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircleQuestion,
  X,
  Send,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useHelpChat } from "@/hooks/useHelpChat";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Hi! I'm the IT Help Desk assistant. Describe the issue you're running into and I'll try to help you solve it — no ticket needed for most things.",
};

const SUGGESTIONS = [
  "My computer is running slow",
  "Outlook won't send emails",
  "I forgot my Wi-Fi password",
  "Printer isn't working",
];

export default function HelpChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const chat = useHelpChat();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, chat.isPending]);

  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed || chat.isPending) return;

    const next = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");

    // Only send role+content history (strip the local welcome message's UI-only nature isn't needed, it's fine to include)
    chat.mutate(
      next.map((m) => ({ role: m.role, content: m.content })),
      {
        onSuccess: (data) => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.reply },
          ]);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleReset = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <Card className="flex h-[500px] w-[360px] flex-col overflow-hidden shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">Help Assistant</div>
                <div className="text-xs text-muted-foreground">
                  Quick fixes, no ticket needed
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleReset}
                title="Start over"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
            <div className="flex flex-col gap-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {chat.isPending && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                    Thinking...
                  </div>
                </div>
              )}

              {messages.length === 1 && (
                <div className="mt-1 flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    Or try one of these:
                  </span>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="rounded-md border bg-background px-3 py-1.5 text-left text-xs hover:bg-muted"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          <Separator />

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3">
            <Textarea
              rows={1}
              placeholder="Describe your issue..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              className="max-h-24 min-h-9 resize-none"
            />
            <Button
              type="submit"
              size="icon"
              disabled={chat.isPending || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      )}

      {/* Floating toggle button */}
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircleQuestion className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
