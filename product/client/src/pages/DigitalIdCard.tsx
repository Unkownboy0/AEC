import React, { useState, useEffect, useRef } from 'react';
import { Shield, User, CreditCard, Download, Printer, RefreshCw, Layers } from 'lucide-react';
import { toast } from '../components/ui/Toast';
import api from '../lib/axios';
import html2canvas from 'html2canvas';

interface DigitalIdCardProps {
  role?: 'Student' | 'Faculty';
  entityId?: string;
}

export const DigitalIdCard: React.FC<DigitalIdCardProps> = ({ role, entityId }) => {
  const [details, setDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCardDetails();
  }, [role, entityId]);

  const fetchCardDetails = async () => {
    setIsLoading(true);
    try {
      // Determine correct api path
      const targetRole = role || 'Student';
      const path = targetRole === 'Faculty'
        ? `/enterprise/id-card/faculty/${entityId || 'me'}`
        : `/enterprise/id-card/student/${entityId || 'me'}`;

      const res = await api.get(path);
      if (res.data?.status === 'success') {
        const cardData = res.data.data;
        // Generate QR code link pointing to the verification page
        const verificationUrl = `${window.location.origin}/verify/${cardData.qrCodeToken}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;
        
        setDetails({
          ...cardData,
          qrUrl
        });
      }
    } catch (err) {
      toast.error('Failed to load digital ID card.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPNG = async () => {
    if (!cardRef.current) return;
    try {
      toast.success('Preparing PNG download...');
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2 // High resolution
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${details?.name || 'ID_Card'}_Digital_ID.png`;
      a.click();
    } catch (err) {
      toast.error('Failed to generate PNG card image.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="border bg-card p-12 text-center rounded-xl flex items-center justify-center">
        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="border bg-card p-12 text-center rounded-xl flex flex-col items-center justify-center gap-3">
        <CreditCard className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-bold text-foreground">Digital ID Card Unavailable</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Unable to generate digital credentials. Please contact college admin.
        </p>
      </div>
    );
  }

  const isStudent = !details.employeeId;

  return (
    <div className="space-y-6 max-w-md mx-auto print:p-0 print:m-0">
      
      {/* Action Buttons */}
      <div className="flex gap-2 justify-end print:hidden">
        <button
          onClick={downloadPNG}
          className="h-8 px-3 bg-muted text-muted-foreground font-bold text-xs rounded hover:bg-muted/80 flex items-center gap-1.5 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Download PNG
        </button>
        <button
          onClick={handlePrint}
          className="h-8 px-3 bg-primary text-primary-foreground font-bold text-xs rounded hover:bg-primary/95 flex items-center gap-1.5 transition-colors shadow"
        >
          <Printer className="h-3.5 w-3.5" />
          Print ID Card
        </button>
      </div>

      {/* ID Card Outer Shell */}
      <div className="flex justify-center">
        <div
          ref={cardRef}
          className="w-[320px] bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl shadow-xl overflow-hidden border border-slate-800 flex flex-col select-none relative"
        >
          
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
          
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center gap-2.5 bg-slate-950/40">
            <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center shadow shrink-0">
              <span className="text-indigo-950 font-black text-sm">G</span>
            </div>
            <div className="text-left min-w-0">
              <h1 className="text-[10px] font-black tracking-widest uppercase text-white leading-tight">Geetorus Institution</h1>
              <p className="text-[7px] text-indigo-300 font-bold uppercase tracking-wider">Campus OS Portal Verified</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 flex flex-col items-center text-center space-y-4">
            
            {/* Avatar Photo Frame */}
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-2 border-primary bg-slate-850 overflow-hidden shadow-inner flex items-center justify-center shrink-0">
                {details.photo ? (
                  <img src={details.photo} alt="Avatar Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-white/40" />
                )}
              </div>
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                {isStudent ? 'Student' : 'Faculty'}
              </span>
            </div>

            {/* Profile Info */}
            <div className="space-y-1">
              <h2 className="text-sm font-black text-white uppercase">{details.name}</h2>
              <p className="text-[9px] text-primary/80 font-bold uppercase tracking-wide">
                {isStudent ? details.department : `${details.designation} · ${details.department}`}
              </p>
            </div>

            {/* Card Metadata Fields */}
            <div className="w-full bg-slate-950/30 border border-white/5 rounded-xl p-3 grid grid-cols-2 gap-2 text-left text-[9px] font-semibold text-slate-300">
              {isStudent ? (
                <>
                  <div>
                    <span className="text-slate-500 uppercase font-bold text-[8px] block">Reg Number</span>
                    <span className="font-mono text-white text-[10px]">{details.registerNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-bold text-[8px] block">Section / Yr</span>
                    <span className="text-white text-[10px]">{details.section} · Yr {details.year}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-bold text-[8px] block">Blood Group</span>
                    <span className="text-white text-[10px]">{details.bloodGroup}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-bold text-[8px] block">Signature</span>
                    <span className="text-emerald-400 font-serif italic text-[10px]">Verified</span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-slate-500 uppercase font-bold text-[8px] block">Employee ID</span>
                    <span className="font-mono text-white text-[10px]">{details.employeeId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-bold text-[8px] block">Designation</span>
                    <span className="text-white text-[10px]">{details.designation}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 uppercase font-bold text-[8px] block">Signature</span>
                    <span className="text-emerald-400 font-serif italic text-[10px]">System Verified</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Instructions Box */}
          <div className="px-5 pb-3">
            <div className="bg-slate-950/20 border border-white/5 p-3 rounded-xl space-y-1 text-[8px] text-slate-400 leading-normal font-medium text-left">
              <p className="font-black text-slate-300 text-[9px] uppercase tracking-wider">INSTRUCTIONS:</p>
              <p>1. This card is non-transferable and remains college property.</p>
              <p>2. Must be visible at all times on campus premises.</p>
              <p>3. Report loss immediately to the Registrar office.</p>
            </div>
          </div>

          {/* QR Code footer */}
          <div className="bg-slate-950/60 p-4 border-t border-white/10 flex justify-between items-center mt-auto">
            <div className="text-left">
              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block">
                SCAN TO VERIFY CARD
              </span>
              <span className="text-[7px] text-primary/80 font-bold block mt-0.5">
                AUTHENTICITY AND RECORD
              </span>
            </div>
            <div className="h-14 w-14 bg-white p-1 rounded-lg flex items-center justify-center shrink-0 shadow">
              <img src={details.qrUrl} alt="Verification QR Code" className="h-full w-full object-contain" />
            </div>
          </div>

        </div>
      </div>

      {/* Printable styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-card, #printable-card * {
            visibility: visible;
          }
          #printable-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 320px;
          }
        }
      `}</style>

    </div>
  );
};
