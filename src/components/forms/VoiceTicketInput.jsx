import React, { useState } from "react";
import { Mic, Square, Sparkles, X } from "lucide-react";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { authFetch } from "@/services/authService";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

export default function VoiceTicketInput({ onParsed, managers = [] }) {
  const { listening, transcript, error, start, stop, reset } =
    useSpeechToText();

  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");

  const speechSupported = !!(
    window.SpeechRecognition || window.webkitSpeechRecognition
  );

  const handleGenerate = async () => {
    if (!transcript.trim()) return;
    setParsing(true);
    setParseError("");
    try {
      const res = await authFetch(`${API_BASE_URL}/ai/parse-ticket`, {
        method: "POST",
        body: JSON.stringify({
          rawText: transcript,
          availableManagers: managers.map((m) => m.userName),
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      let managerId = "";
      if (data.managerName) {
        const match = managers.find(
          (m) => m.userName.toLowerCase() === data.managerName.toLowerCase(),
        );
        if (match) managerId = match.id;
      }

      onParsed({ ...data, managerId });
    } catch {
      setParseError(
        "Could not generate ticket. Try again or fill in the form manually.",
      );
    } finally {
      setParsing(false);
    }
  };

  const handleClear = () => {
    reset();
    setParseError("");
  };

  return (
    <Card className="mb-4 border-dashed bg-muted/40 p-4">
      {/* ── Header ── */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">AI Ticket Assistant</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            Voice
          </span>
        </div>

        {/* ── Mic toggle button ── */}
        {speechSupported && (
          <Button
            type="button"
            size="sm"
            variant={listening ? "destructive" : "default"}
            onClick={listening ? stop : start}
          >
            {listening ? (
              <>
                <Square className="mr-1.5 h-3.5 w-3.5" />
                Stop
              </>
            ) : (
              <>
                <Mic className="mr-1.5 h-3.5 w-3.5" />
                {transcript ? "Re-record" : "Start Recording"}
              </>
            )}
          </Button>
        )}
      </div>

      {/* ── Browser not supported ── */}
      {!speechSupported && (
        <Alert>
          <AlertDescription className="text-sm">
            Voice input isn't supported in this browser. Please use{" "}
            <strong>Chrome</strong> or <strong>Edge</strong>.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Listening indicator ── */}
      {listening && (
        <div className="mb-3 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
          </span>
          <span className="text-sm text-red-700">Listening... speak now</span>
        </div>
      )}

      {/* ── Speech API error ── */}
      {error && (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Transcript preview ── */}
      {transcript && (
        <div className="mb-3 rounded-md border bg-background p-3 text-sm text-foreground">
          {transcript}
        </div>
      )}

      {/* ── Parse error ── */}
      {parseError && (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription className="text-sm">{parseError}</AlertDescription>
        </Alert>
      )}

      {/* ── Action buttons — only show when transcript exists and not recording ── */}
      {transcript && !listening && (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleGenerate}
            disabled={parsing}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {parsing ? "Generating..." : "Generate Ticket Fields"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleClear}
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      )}

      {/* ── Instruction hint when idle ── */}
      {!transcript && !listening && speechSupported && (
        <p className="text-xs text-muted-foreground">
          Press <strong>Start Recording</strong> and describe your issue.
          Mention the category, urgency, and manager if relevant.
        </p>
      )}
    </Card>
  );
}
