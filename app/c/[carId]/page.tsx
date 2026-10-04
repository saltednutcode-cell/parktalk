"use client";

import React, { useState, useEffect, use } from "react";
import { 
  Car, 
  Clock, 
  Send, 
  AlertCircle, 
  ShieldAlert, 
  Lightbulb, 
  DoorClosed,
  MessageSquareQuote
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface MessageItem {
  id: string;
  sender_role: "VISITOR" | "OWNER";
  sender_display: string;
  text: string;
  created_at: string;
}

export default function VisitorCarPage({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const resolvedParams = use(params);
  const carId = resolvedParams.carId || "CAR-7F82K9";

  // Unique anonymous session for this individual visitor
  const [sessionId, setSessionId] = useState("");

  const [vehicle, setVehicle] = useState({
    make: "Vehicle",
    model: "Details",
    color: "",
    masked_plate: "...",
    status_text: "Loading status...",
    custom_greeting: "",
  });

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    // Generate or restore anonymous session ID
    let currentSession = sessionStorage.getItem(`parktalk_session_${carId}`);
    if (!currentSession) {
      currentSession = `visitor-${Math.random().toString(36).substring(2, 8)}`;
      sessionStorage.setItem(`parktalk_session_${carId}`, currentSession);
    }
    setSessionId(currentSession);

    async function loadData() {
      // 1. Fetch latest vehicle details
      const { data: vData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("public_id", carId)
        .single();

      if (vData) setVehicle(vData);

      // 2. Fetch messages only within the last 10 minutes for this session
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: mData } = await supabase
        .from("messages")
        .select("*")
        .eq("vehicle_id", carId)
        .eq("session_id", currentSession)
        .gte("created_at", tenMinutesAgo)
        .order("created_at", { ascending: true });

      if (mData) setMessages(mData);
    }

    loadData();

    // 3. Realtime subscription filtered to this visitor's session
    const channel = supabase
      .channel(`chat-${carId}-${currentSession}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `vehicle_id=eq.${carId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.session_id === currentSession) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    // 4. Client-side purge after 10 minutes
    const purgeTimer = setInterval(() => {
      const expiry = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      setMessages((prev) => prev.filter((m) => m.created_at >= expiry));
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(purgeTimer);
    };
  }, [carId]);

  const quickAlerts = [
    { icon: AlertCircle, label: "Your car is blocking me", color: "bg-amber-50 text-amber-900 border-amber-200" },
    { icon: Lightbulb, label: "Headlights are ON", color: "bg-blue-50 text-blue-900 border-blue-200" },
    { icon: DoorClosed, label: "Window / door is open", color: "bg-rose-50 text-rose-900 border-rose-200" },
    { icon: ShieldAlert, label: "Parking issue in bay", color: "bg-orange-50 text-orange-900 border-orange-200" },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !sessionId) return;

    if (!textToSend) setInputText("");

    const { error } = await supabase.from("messages").insert([
      {
        vehicle_id: carId,
        session_id: sessionId,
        sender_role: "VISITOR",
        sender_display: `Anonymous (${sessionId.slice(-4)})`,
        text: text.trim(),
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      alert("Failed to send message: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-start sm:py-6">
      <main className="w-full max-w-md bg-white min-h-screen sm:min-h-[92vh] sm:rounded-3xl shadow-xl flex flex-col justify-between overflow-hidden border border-slate-200">
        
        {/* Header */}
        <header className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-800 rounded-xl">
              <Car className="w-5 h-5 text-emerald-400" />
            </span>
            <div>
              <h1 className="text-sm font-bold tracking-tight">PARKTALK</h1>
              <p className="text-[11px] text-slate-400">Anonymous Vehicle Contact</p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
            {carId}
          </span>
        </header>

        {/* Vehicle Identity */}
        <section className="p-4 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xl font-extrabold text-slate-900 tracking-tight">
                {vehicle.make} {vehicle.model}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {vehicle.color} • Plate: {vehicle.masked_plate}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>

          {/* Owner Custom Greeting (if set) */}
          {vehicle.custom_greeting && (
            <div className="mt-2.5 flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs leading-relaxed">
              <MessageSquareQuote className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Note from owner: </span>
                {vehicle.custom_greeting}
              </div>
            </div>
          )}
        </section>

        {/* Message Thread */}
        <section className="flex-1 px-4 py-3 overflow-y-auto space-y-3 max-h-[340px]">
          <div className="text-center my-1">
            <span className="text-[11px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              Chats auto-clear 10 mins after inactivity
            </span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender_role === "VISITOR" ? "items-end" : "items-start"
              }`}
            >
              <div className="text-[10px] text-slate-400 mb-0.5 px-1">
                {msg.sender_role === "VISITOR" ? "You" : "Vehicle Owner"}
              </div>
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-normal shadow-sm leading-relaxed ${
                  msg.sender_role === "VISITOR"
                    ? "bg-emerald-600 text-white rounded-br-none"
                    : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200"
                }`}
              >
                {msg.text}
              </div>
              <span 
                suppressHydrationWarning 
                className="text-[9px] text-slate-400 mt-1 px-1"
              >
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </section>

        {/* Quick Contact Buttons */}
        <section className="px-4 py-2 bg-slate-50 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Quick Alerts
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickAlerts.map((btn, i) => {
              const Icon = btn.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(btn.label)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold active:scale-95 transition-transform ${btn.color}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{btn.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Input Bar */}
        <footer className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type a message to owner..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="p-3 bg-emerald-600 disabled:bg-slate-200 text-white rounded-full active:scale-90 transition-transform shadow-md"
          >
            <Send className="w-5 h-5" />
          </button>
        </footer>

      </main>
    </div>
  );
}