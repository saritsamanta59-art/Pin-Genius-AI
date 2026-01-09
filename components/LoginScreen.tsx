import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Image as ImageIcon, Key, ChevronRight, Copy, Check, Info, AlertCircle } from 'lucide-react';
import { pinterestService } from '../services/pinterestService';

interface LoginScreenProps {
  onLogin: () => void;
  onManualLogin: (token: string) => void;
  isVerifying: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onManualLogin, isVerifying }) => {
  const [showManual, setShowManual] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [copied, setCopied] = useState(false);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      onManualLogin(manualToken.trim());
    }
  };

  const copyUri = () => {
    navigator.clipboard.writeText(pinterestService.getRedirectUri()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-red-100 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50" />

      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-8 md:p-12 relative z-10 border border-slate-100">
        <div className="flex flex-col items-center text-center">
          <div className="bg-red-600 p-4 rounded-3xl shadow-lg shadow-red-200 mb-8 transform -rotate-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
            PinGenius <span className="text-red-600">AI</span>
          </h1>
          
          <p className="text-slate-500 mb-8 leading-relaxed font-medium">
            The all-in-one AI tool to design, generate, and schedule viral Pinterest pins.
          </p>

          {!showManual ? (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 text-left">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">Configuration Helper</h4>
                    <p className="text-[11px] text-amber-800 leading-normal mb-3">
                      To avoid "Redirect URI mismatch", ensure this exact URI is saved in your Pinterest Developer Dashboard:
                    </p>
                    <div className="flex items-center gap-2 bg-white/50 border border-amber-200 rounded-lg p-2 overflow-hidden">
                      <code className="text-[10px] font-mono text-amber-900 truncate flex-1">
                        {pinterestService.getRedirectUri()}
                      </code>
                      <button 
                        onClick={copyUri}
                        className="p-1 hover:bg-amber-100 rounded transition-colors"
                        title="Copy URI"
                      >
                        {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-amber-600" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <a 
                href={pinterestService.getAuthUrl()}
                target="_top"
                className={`group w-full py-5 rounded-[1.5rem] bg-[#e60023] text-white font-bold text-lg hover:bg-[#ad001a] transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-100 active:scale-95 ${isVerifying ? 'opacity-70 pointer-events-none' : ''}`}
              >
                {isVerifying ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  <>
                    Log in with Pinterest
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </a>

              <button 
                onClick={() => setShowManual(true)}
                className="mt-6 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest flex items-center gap-2"
              >
                <Key className="w-3 h-3" /> Use Access Token instead
              </button>
            </>
          ) : (
            <form onSubmit={handleManualSubmit} className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="text-left mb-6">
                <button 
                  type="button"
                  onClick={() => setShowManual(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 mb-4 block"
                >
                  ← Back to OAuth
                </button>
                <h3 className="text-lg font-bold text-slate-800">Manual Login</h3>
                <p className="text-xs text-slate-500">Paste your Pinterest Access Token (starts with <b>pina_</b>)</p>
               </div>

               <div className="relative">
                 <input 
                  autoFocus
                  type="password"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="pina_xxxxxxxxxxxx"
                  className="w-full px-4 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono text-sm pr-12"
                 />
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                   <Key className="w-5 h-5" />
                 </div>
               </div>

               <button 
                type="submit"
                disabled={!manualToken || isVerifying}
                className={`w-full py-4 rounded-2xl bg-slate-900 text-white font-bold transition-all flex items-center justify-center gap-2 active:scale-95 ${(!manualToken || isVerifying) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black'}`}
               >
                 {isVerifying ? 'Verifying...' : 'Sign In Now'}
                 {!isVerifying && <ChevronRight className="w-4 h-4" />}
               </button>

               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                 <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                   <b>Where to find?</b> Go to Apps > Your App > Tools > Trial Access Token. Ensure <code>boards</code> and <code>pins</code> scopes are selected.
                 </p>
               </div>
            </form>
          )}

          <p className="mt-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" /> Secure Infrastructure
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
        Official <span className="text-slate-900 font-black">Pinterest</span> Developer Partner
      </div>
    </div>
  );
};