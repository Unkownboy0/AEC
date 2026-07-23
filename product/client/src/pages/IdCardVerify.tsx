import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, User, Loader2, ArrowLeft } from 'lucide-react';
import api from '../lib/axios';

export const IdCardVerify: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'LOADING' | 'VERIFIED' | 'FAILED'>('LOADING');
  const [errorMsg, setErrorMsg] = useState('');
  const [profile, setProfile] = useState<any | null>(null);

  useEffect(() => {
    if (token) {
      verifyIdentity();
    }
  }, [token]);

  const verifyIdentity = async () => {
    try {
      // Direct call to public endpoint (bypass normal Axios auth interceptor header checks if needed, but endpoint is public anyway)
      const res = await api.get(`/id-card/verify/${token}`);
      if (res.data?.status === 'success' && res.data.data?.verified) {
        setProfile(res.data.data);
        setStatus('VERIFIED');
      } else {
        setStatus('FAILED');
        setErrorMsg('Identity token could not be verified.');
      }
    } catch (err: any) {
      setStatus('FAILED');
      setErrorMsg(err.response?.data?.message || 'Failed to connect to identity servers.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md border border-slate-800 bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 shadow-2xl space-y-6 text-center z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-1">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow">
            <Shield className="h-5 w-5 text-primary-foreground animate-pulse" />
          </div>
          <h1 className="text-sm font-black tracking-widest uppercase mt-3">CampusOS Identity Services</h1>
          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Secured Verification Portal</p>
        </div>

        {/* Status display */}
        {status === 'LOADING' && (
          <div className="py-12 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contacting Central Database...</p>
          </div>
        )}

        {status === 'VERIFIED' && profile && (
          <div className="space-y-6 animate-in zoom-in-95 duration-200">
            
            {/* Status Alert Banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex flex-col items-center gap-1.5">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-wider">Verified Live Identity</span>
              <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                Active Status
              </span>
            </div>

            {/* Profile Detail Card */}
            <div className="border border-slate-850 bg-slate-950/40 p-4 rounded-xl space-y-4 text-left">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full border border-slate-800 bg-slate-900 overflow-hidden flex items-center justify-center shrink-0">
                  {profile.photo ? (
                    <img src={profile.photo} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-7 w-7 text-white/40" />
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-white uppercase">{profile.name}</h2>
                  <span className="text-[9px] text-primary font-bold uppercase tracking-wider block mt-0.5">
                    {profile.role} · {profile.department}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-850 pt-3 grid grid-cols-2 gap-3 text-[10px] font-semibold text-slate-400">
                <div>
                  <span className="text-[8px] uppercase text-slate-500 font-bold block">ID Reference</span>
                  <span className="font-mono text-white text-[11px]">{profile.code}</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase text-slate-500 font-bold block">Authority Domain</span>
                  <span className="text-white text-[11px]">Geetorus Institution</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {status === 'FAILED' && (
          <div className="py-8 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex flex-col items-center gap-1.5">
              <XCircle className="h-6 w-6 text-rose-400" />
              <span className="text-xs font-black uppercase tracking-wider">Verification Failure</span>
              <p className="text-[10px] text-rose-400 font-semibold leading-relaxed mt-1">
                {errorMsg}
              </p>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="pt-2 border-t border-slate-850">
          <Link
            to="/login"
            className="text-[10px] font-bold text-muted-foreground hover:text-white transition-colors flex items-center justify-center gap-1 uppercase tracking-wider"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Portal Login
          </Link>
        </div>

      </div>
    </div>
  );
};
