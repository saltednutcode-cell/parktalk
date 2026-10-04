"use client";

import React, { useState, useEffect, use, useRef } from "react";
import { 
  Car, 
  MapPin, 
  QrCode, 
  Bell, 
  BellRing, 
  Download, 
  Send, 
  CheckCircle2, 
  Users,
  Clock,
  Sparkles,
  Save,
  CreditCard
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";

interface MessageItem {
  id: string;
  vehicle_id: string;
  session_id: string;
  sender_role: "VISITOR" | "OWNER";
  sender_display: string;
  text: string;
  created_at: string;
}

export default function OwnerDashboard({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const resolvedParams = use(params);
  const carId = resolvedParams.carId || "CAR-7F82K9";

  const [mounted, setMounted] = useState(false);
  const [visitorPublicUrl, setVisitorPublicUrl] = useState("");

  const [vehicle, setVehicle] = useState({
    make: "Hyundai",
    model: "Creta",
    color: "Polar White",
    masked_plate: "***1234",
    status_text: "Back in 10 mins",
    park_location: "",
    custom_greeting: "",
  });

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeSession, setActiveSession] = useState<string>("");
  const [replyText, setReplyText] = useState("");
  const [notificationsAllowed, setNotificationsAllowed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const qrRef = useRef<SVGSVGElement>(null);

  const distinctSessions = Array.from(
    new Set(messages.map((m) => m.session_id).filter(Boolean))
  );

  useEffect(() => {
    setMounted(true);
    setVisitorPublicUrl(`${window.location.origin}/c/${carId}`);

    if ("Notification" in window) {
      setNotificationsAllowed(Notification.permission === "granted");
    }

    async function loadData() {
      const { data: vData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("public_id", carId)
        .single();

      if (vData) setVehicle(vData);

      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: mData } = await supabase
        .from("messages")
        .select("*")
        .eq("vehicle_id", carId)
        .gte("created_at", tenMinutesAgo)
        .order("created_at", { ascending: true });

      if (mData && mData.length > 0) {
        setMessages(mData);
        setActiveSession(mData[mData.length - 1].session_id);
      }
    }

    loadData();

    const channel = supabase
      .channel(`owner-chat-${carId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `vehicle_id=eq.${carId}`,
        },
        (payload) => {
          const newMsg = payload.new as MessageItem;
          setMessages((prev) => [...prev, newMsg]);
          setActiveSession(newMsg.session_id);

          if (newMsg.sender_role === "VISITOR") {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("🚨 Visitor Alert!", {
                body: `${newMsg.sender_display}: ${newMsg.text}`,
                icon: "/favicon.ico",
              });
            }
          }
        }
      )
      .subscribe();

    const cleanupInterval = setInterval(() => {
      const expiry = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      setMessages((prev) => prev.filter((m) => m.created_at >= expiry));
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(cleanupInterval);
    };
  }, [carId]);

  const requestNotificationAccess = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationsAllowed(permission === "granted");
  };

  const handleSaveVehicleInfo = async () => {
    setIsSaved(true);
    await supabase
      .from("vehicles")
      .update({
        make: vehicle.make,
        model: vehicle.model,
        color: vehicle.color,
        masked_plate: vehicle.masked_plate,
        status_text: vehicle.status_text,
        park_location: vehicle.park_location,
        custom_greeting: vehicle.custom_greeting,
      })
      .eq("public_id", carId);

    setTimeout(() => setIsSaved(false), 2000);
  };

  // High-Resolution ATM Card Generator (85.6mm x 53.98mm @ 300 DPI = 1050 x 660 px)
  const downloadAtmCard = () => {
    const svg = qrRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const qrImage = new Image();

    qrImage.onload = () => {
      const canvas = document.createElement("canvas");
      const width = 1050;
      const height = 660;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. ATM Card Base (Dark slate gradient + rounded border)
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#090d16");
      grad.addColorStop(1, "#020617");
      ctx.fillStyle = grad;

      // Draw rounded rectangle
      const radius = 40;
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(width - radius, 0);
      ctx.quadraticCurveTo(width, 0, width, radius);
      ctx.lineTo(width, height - radius);
      ctx.quadraticCurveTo(width, height, width - radius, height);
      ctx.lineTo(radius, height);
      ctx.quadraticCurveTo(0, height, 0, height - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.fill();

      // Outer Card Accent Border
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#1e293b";
      ctx.stroke();

      // Top Header Emerald Line
      ctx.fillStyle = "#10b981";
      ctx.fillRect(40, 40, width - 80, 6);

      // 2. Left Column: Brand Logo & Typography
      // App Name
      ctx.font = "bold 44px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("PARK", 70, 115);
      ctx.fillStyle = "#10b981";
      ctx.fillText("TALK", 200, 115);

      // Subtitle
      ctx.font = "600 20px sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("ANONYMOUS VEHICLE CONTACT", 70, 155);

      // Vehicle Tag Box
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(70, 195, 460, 110);
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.strokeRect(70, 195, 460, 110);

      ctx.font = "bold 26px sans-serif";
      ctx.fillStyle = "#f8fafc";
      ctx.fillText(`${vehicle.make} ${vehicle.model}`, 95, 240);

      ctx.font = "20px monospace";
      ctx.fillStyle = "#38bdf8";
      ctx.fillText(`PLATE: ${vehicle.masked_plate} • ID: ${carId}`, 95, 280);

      // Instructions block
      ctx.font = "bold 22px sans-serif";
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText("NEED THIS CAR MOVED?", 70, 360);

      ctx.font = "18px sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("1. Scan QR with your phone camera", 70, 405);
      ctx.fillText("2. Tap the alert (e.g. 'Car is blocking')", 70, 445);
      ctx.fillText("3. Owner gets alerted on phone instantly", 70, 485);

      // Privacy Badge Footer
      ctx.fillStyle = "#052e16";
      ctx.fillRect(70, 535, 460, 60);
      ctx.strokeStyle = "#166534";
      ctx.strokeRect(70, 535, 460, 60);

      ctx.font = "bold 17px sans-serif";
      ctx.fillStyle = "#4ade80";
      ctx.fillText("🛡️ 100% PRIVATE • ZERO PHONE NUMBERS SHARED", 90, 572);

      // 3. Right Column: White High-Contrast QR Code Plate
      const qrBoxX = 590;
      const qrBoxY = 100;
      const qrBoxSize = 390;

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize + 80, 24);
      ctx.fill();

      // Render QR
      ctx.drawImage(qrImage, qrBoxX + 35, qrBoxY + 30, 320, 320);

      // QR Caption inside card
      ctx.font = "bold 22px sans-serif";
      ctx.fillStyle = "#0f172a";
      ctx.textAlign = "center";
      ctx.fillText("SCAN TO CONTACT OWNER", qrBoxX + qrBoxSize / 2, qrBoxY + 380);

      ctx.font = "16px sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText("No app download required", qrBoxX + qrBoxSize / 2, qrBoxY + 412);
      ctx.textAlign = "left"; // reset

      // 4. Trigger Download
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `ParkTalk-Card-${carId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    qrImage.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  const handleOwnerReply = async () => {
    if (!replyText.trim() || !activeSession) return;
    const textToSend = replyText.trim();
    setReplyText("");

    await supabase.from("messages").insert([
      {
        vehicle_id: carId,
        session_id: activeSession,
        sender_role: "OWNER",
        sender_display: "Vehicle Owner",
        text: textToSend,
      },
    ]);
  };

  const currentChatMessages = messages.filter((m) => m.session_id === activeSession);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center items-start sm:py-8 px-2 sm:px-4">
      <main className="w-full max-w-xl bg-slate-900 min-h-screen sm:min-h-fit sm:rounded-3xl shadow-2xl flex flex-col gap-6 p-5 border border-slate-800">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-emerald-950 border border-emerald-800 rounded-2xl text-emerald-400">
              <Car className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-base font-bold tracking-tight">Vehicle Command Center</h1>
              <p className="text-xs text-slate-400 font-mono">ID: {carId}</p>
            </div>
          </div>

          <button
            onClick={requestNotificationAccess}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              notificationsAllowed 
                ? "bg-emerald-950/60 border-emerald-800 text-emerald-400" 
                : "bg-amber-950/60 border-amber-800 text-amber-400 animate-pulse"
            }`}
          >
            {notificationsAllowed ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
            {notificationsAllowed ? "Notifications On" : "Enable Push"}
          </button>
        </header>

        {/* 1. Vehicle Profile Configuration */}
        <section className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-emerald-400" /> Vehicle Profile
            </span>
            {isSaved && (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Updated
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Make</label>
              <input
                type="text"
                value={vehicle.make}
                onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Model</label>
              <input
                type="text"
                value={vehicle.model}
                onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Color</label>
              <input
                type="text"
                value={vehicle.color}
                onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Masked Plate</label>
              <input
                type="text"
                value={vehicle.masked_plate}
                onChange={(e) => setVehicle({ ...vehicle, masked_plate: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" /> Parking Location Memory
            </label>
            <input
              type="text"
              placeholder="e.g. Basement 2, Slot B-18"
              value={vehicle.park_location || ""}
              onChange={(e) => setVehicle({ ...vehicle, park_location: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Custom Note to Visitors
            </label>
            <input
              type="text"
              placeholder="e.g. Back in 10 mins. Keys at security."
              value={vehicle.custom_greeting || ""}
              onChange={(e) => setVehicle({ ...vehicle, custom_greeting: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <button
            onClick={handleSaveVehicleInfo}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Save className="w-3.5 h-3.5" /> Save Vehicle Details
          </button>
        </section>

        {/* 2. ATM Sized Printable Windshield Card */}
        <section className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            <CreditCard className="w-4 h-4 text-emerald-400" /> Standard ATM-Size QR Card
          </div>

          {/* SVG for canvas export */}
          <div className="bg-white p-3 rounded-2xl shadow-inner min-h-[140px] flex items-center justify-center">
            {mounted && visitorPublicUrl ? (
              <QRCodeSVG
                ref={qrRef}
                value={visitorPublicUrl}
                size={140}
                level={"H"}
                includeMargin={false}
              />
            ) : (
              <div className="w-[140px] h-[140px] bg-slate-200 animate-pulse rounded-xl" />
            )}
          </div>

          <p className="text-[11px] text-slate-400 max-w-sm">
            Generates an exact <strong>85.6 × 54 mm (credit-card size)</strong> windshield card with your vehicle details, logo, and scanner guide.
          </p>

          <button
            onClick={downloadAtmCard}
            disabled={!mounted}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
          >
            <Download className="w-4 h-4" /> Download ATM-Size Sticker (PNG)
          </button>
        </section>

        {/* 3. Multi-Visitor Active Chat Stream */}
        <section className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" /> Active Conversations
            </span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Auto-expires in 10 mins
            </span>
          </div>

          {distinctSessions.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {distinctSessions.map((sessId) => (
                <button
                  key={sessId}
                  onClick={() => setActiveSession(sessId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeSession === sessId 
                      ? "bg-emerald-600 text-white shadow-sm" 
                      : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"
                  }`}
                >
                  Visitor #{sessId.slice(-4)}
                </button>
              ))}
            </div>
          )}

          <div className="max-h-[220px] min-h-[140px] overflow-y-auto space-y-2 pr-1 border border-slate-800/80 p-3 rounded-xl bg-slate-900/50">
            {currentChatMessages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10">
                No active conversations. When someone scans your QR, messages show up here.
              </p>
            ) : (
              currentChatMessages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.sender_role === "OWNER" ? "items-end" : "items-start"}`}>
                  <span className="text-[9px] text-slate-500">{m.sender_role === "OWNER" ? "You" : m.sender_display}</span>
                  <div className={`p-2.5 rounded-xl text-xs max-w-[85%] ${m.sender_role === "OWNER" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-200 border border-slate-700"}`}>
                    {m.text}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              disabled={!activeSession}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleOwnerReply()}
              placeholder={activeSession ? "Reply anonymously..." : "Select a visitor session above to reply"}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            />
            <button
              onClick={handleOwnerReply}
              disabled={!activeSession}
              className="p-2.5 bg-emerald-600 disabled:opacity-50 rounded-xl text-white active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}