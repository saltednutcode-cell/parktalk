"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Car, QrCode, Shield, ArrowRight, PlusCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();
  const [vehicleIdInput, setVehicleIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Car Registration Form State
  const [newCar, setNewCar] = useState({
    make: "",
    model: "",
    color: "",
    maskedPlate: "",
  });

  const handleOpenExistingCar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleIdInput.trim()) return;
    router.push(`/owner/${vehicleIdInput.trim().toUpperCase()}`);
  };

  const handleCreateNewVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCar.make || !newCar.model || !newCar.maskedPlate) {
      alert("Please fill in the vehicle make, model, and plate numbers.");
      return;
    }

    setLoading(true);

    // Generate a unique 8-character vehicle ID like CAR-9B2F4A
    const generatedId = `CAR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { error } = await supabase.from("vehicles").insert([
      {
        public_id: generatedId,
        make: newCar.make.trim(),
        model: newCar.model.trim(),
        color: newCar.color.trim() || "Unspecified",
        masked_plate: newCar.maskedPlate.trim(),
        status_text: "Parked - Back shortly",
        park_location: "",
        custom_greeting: "",
      },
    ]);

    setLoading(false);

    if (error) {
      alert("Error generating vehicle profile: " + error.message);
      return;
    }

    // Direct owner to their newly minted command center
    router.push(`/owner/${generatedId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Navbar */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="p-2.5 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-400">
            <Car className="w-5 h-5" />
          </span>
          <span className="font-extrabold tracking-tight text-lg text-white">PARKTALK</span>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <PlusCircle className="w-4 h-4" /> Add Vehicle
        </button>
      </header>

      {/* Hero Section */}
      <main className="max-w-2xl mx-auto w-full flex flex-col items-center text-center my-auto py-12 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          Zero Phone Numbers Shared • Complete Anonymity
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Vehicle Window QR Alerts. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            Instant & Private.
          </span>
        </h1>

        <p className="text-slate-400 text-xs sm:text-sm max-w-lg leading-relaxed">
          Stick a reusable QR card on your car's windshield. When blocked or in an emergency, anyone can reach you securely without seeing your personal contact info.
        </p>

        {/* Existing Car Access Input */}
        <div className="w-full max-w-md bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-xl">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-left">
            Manage Existing Vehicle
          </p>
          <form onSubmit={handleOpenExistingCar} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Vehicle ID (e.g. CAR-7F82K9)"
              value={vehicleIdInput}
              onChange={(e) => setVehicleIdInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
            <button
              type="submit"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl active:scale-95 transition-all border border-slate-700"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Shortcut */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
            <span>Try demo vehicle:</span>
            <button
              onClick={() => router.push("/owner/CAR-7F82K9")}
              className="text-emerald-400 hover:underline flex items-center gap-1 font-mono font-bold"
            >
              CAR-7F82K9 <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </main>

      {/* Modal: Register New Car */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" /> Register Vehicle & Generate QR
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewVehicle} className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Make (Brand)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toyota, Hyundai, Honda"
                  value={newCar.make}
                  onChange={(e) => setNewCar({ ...newCar, make: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Model</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fortuner, Creta, Civic"
                  value={newCar.model}
                  onChange={(e) => setNewCar({ ...newCar, model: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Color</label>
                  <input
                    type="text"
                    placeholder="e.g. Pearl White"
                    value={newCar.color}
                    onChange={(e) => setNewCar({ ...newCar, color: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Masked Plate</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ***5678"
                    value={newCar.maskedPlate}
                    onChange={(e) => setNewCar({ ...newCar, maskedPlate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                {loading ? "Generating Vehicle QR..." : "Create Vehicle & Open Dashboard"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-[11px] text-slate-500 py-4 border-t border-slate-800">
        ParkTalk Anonymous Vehicle Protocol • Connected to Supabase
      </footer>
    </div>
  );
}