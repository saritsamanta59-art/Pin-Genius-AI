import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Shield, User, LogOut, ExternalLink, AlertCircle } from 'lucide-react';
import { ControlPanel } from './components/ControlPanel';
import { CanvasPreview, CanvasPreviewHandle } from './components/CanvasPreview';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { generatePinVariations, generatePinImage } from './services/geminiService';
import { pinterestService } from './services/pinterestService';
import { PinVariation, PinConfig, FONTS } from './types';

type View = 'editor' | 'privacy';

export default function App() {
  const canvasRef = useRef<CanvasPreviewHandle>(null);
  
  // Navigation State
  const [view, setView] = useState<View>('editor');

  // Pinterest State
  const [isPinterestConnected, setIsPinterestConnected] = useState(pinterestService.isConnected());
  const [isVerifyingPinterest, setIsVerifyingPinterest] = useState(false);
  
  // Data State
  const [keyword, setKeyword] = useState('');
  const [variations, setVariations] = useState<PinVariation[]>([]);
  const [currentVarIndex, setCurrentVarIndex] = useState(0);
  
  // UI State
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});
  const [errorMsg, setErrorMsg] = useState('');

  // Configuration State
  const [config, setConfig] = useState<PinConfig>({
    headline: 'Your Catchy Headline Here',
    ctaText: 'Download Your 50 Free Woodworking Plan',
    brandText: '',
    fontFamily: FONTS[0].value,
    textColor: '#000000',
    outlineColor: '#ffffff',
    brandColor: '#ffffff',
    ctaBgColor: '#e60023',
    ctaTextColor: '#ffffff',
    textYPos: 45,
    colorScheme: 'standard'
  });

  // Handle Pinterest OAuth Redirect & Verification
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const accessToken = urlParams.get('access_token');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (error) {
      setErrorMsg(`Pinterest connection failed: ${errorDescription || error}`);
      window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
      return;
    }

    if (code || accessToken) {
      const verifyConnection = async () => {
        setIsVerifyingPinterest(true);
        const token = accessToken || code;
        
        if (token) {
          try {
            pinterestService.setAccessToken(token);
            await pinterestService.fetchUser();
            setIsPinterestConnected(true);
            setErrorMsg('');
          } catch (err: any) {
            console.error("Pinterest verification failed:", err);
            if (token.startsWith('pina_')) {
               setErrorMsg("The manual token provided is invalid or expired.");
            } else {
               setErrorMsg("Authorization successful, but session verification failed. Ensure your callback exchanges the 'code' for a valid 'access_token'.");
            }
            pinterestService.disconnect();
            setIsPinterestConnected(false);
          }
        }
        
        setIsVerifyingPinterest(false);
        window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
      };

      verifyConnection();
    }
  }, []);

  const handleConnectPinterest = () => {
    setErrorMsg(''); 
    const authUrl = pinterestService.getAuthUrl();
    // Using window.open instead of window.location.href to avoid iframe "refused to connect" errors
    window.open(authUrl, '_blank', 'width=600,height=700');
    
    // Set a listener/poll for when the token might be set by a popup or redirect back
    const checkInterval = setInterval(() => {
      if (pinterestService.isConnected()) {
        setIsPinterestConnected(true);
        clearInterval(checkInterval);
      }
    }, 2000);
    
    setTimeout(() => clearInterval(checkInterval), 60000);
  };

  const handleLogoutPinterest = () => {
    pinterestService.disconnect();
    setIsPinterestConnected(false);
    setErrorMsg('');
  };

  const handleSchedule = async (params: { boardId: string, sectionId?: string, date?: string }) => {
    const imageData = canvasRef.current?.getBase64();
    if (!imageData) throw new Error("Could not capture image from canvas.");

    const currentVar = variations[currentVarIndex];
    if (!currentVar) throw new Error("No variation selected.");

    try {
      await pinterestService.createPin({
        boardId: params.boardId,
        boardSectionId: params.sectionId,
        title: config.headline || currentVar.seoTitle,
        description: `${currentVar.seoDescription} ${currentVar.hashtags}`,
        imageBase64: imageData,
        publishAt: params.date
      });
    } catch (err: any) {
      if (err.message?.includes('authorized') || err.status === 401) {
        handleLogoutPinterest();
        throw new Error("Your Pinterest session has expired. Please reconnect.");
      }
      throw err;
    }
  };

  const handleGenerate = async () => {
    if (!keyword.trim()) return;
    setIsGeneratingText(true);
    setErrorMsg('');
    setVariations([]);
    setLoadingImages({});

    try {
      const data = await generatePinVariations(keyword);
      
      if (data.variations && data.variations.length > 0) {
        const newVariations: PinVariation[] = data.variations.map(v => ({
          ...v,
          imageUrl: null,
          fallbackMode: false
        }));
        
        setVariations(newVariations);
        setCurrentVarIndex(0);
        
        const firstVar = newVariations[0];
        setConfig(prev => ({
          ...prev,
          headline: firstVar.headline,
        }));
      } else {
        throw new Error("No variations generated.");
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to generate content.");
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleSelectVariation = (index: number) => {
    setCurrentVarIndex(index);
    const selectedVar = variations[index];
    if (selectedVar) {
      setConfig(prev => ({
        ...prev,
        headline: selectedVar.headline
      }));
    }
  };

  useEffect(() => {
    const generateImageIfNeeded = async () => {
      const currentVar = variations[currentVarIndex];
      if (
        currentVar && 
        !currentVar.imageUrl && 
        !currentVar.fallbackMode && 
        !loadingImages[currentVarIndex] &&
        !isGeneratingText
      ) {
        setLoadingImages(prev => ({ ...prev, [currentVarIndex]: true }));
        
        try {
          const base64Image = await generatePinImage(currentVar.imagePrompt);
          setVariations(prev => {
            const newVars = [...prev];
            newVars[currentVarIndex] = { ...newVars[currentVarIndex], imageUrl: base64Image };
            return newVars;
          });
        } catch (e: any) {
          console.warn(`Image gen failed for index ${currentVarIndex}`, e);
          setVariations(prev => {
            const newVars = [...prev];
            newVars[currentVarIndex] = { ...newVars[currentVarIndex], fallbackMode: true };
            return newVars;
          });
          setErrorMsg(e.message || "Image generation failed.");
        } finally {
          setLoadingImages(prev => ({ ...prev, [currentVarIndex]: false }));
        }
      }
    };

    generateImageIfNeeded();
  }, [currentVarIndex, variations, loadingImages, isGeneratingText]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-red-100 selection:text-red-600 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('editor')}>
            <div className="bg-red-600 p-2 rounded-full shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">PinGenius AI</h1>
          </div>

          <div className="flex items-center gap-4">
            {isVerifyingPinterest && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 animate-pulse">
                <Shield className="w-4 h-4" /> Verifying...
              </div>
            )}
            
            {isPinterestConnected && !isVerifyingPinterest ? (
              <button 
                onClick={handleLogoutPinterest}
                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-red-600 transition-colors uppercase tracking-widest"
              >
                <LogOut className="w-4 h-4" /> Disconnect
              </button>
            ) : !isVerifyingPinterest ? (
              <button 
                onClick={handleConnectPinterest}
                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-red-600 transition-colors uppercase tracking-widest"
              >
                <User className="w-4 h-4" /> Connect Pinterest
              </button>
            ) : null}
            <span className="hidden sm:inline px-2 py-1 bg-slate-100 text-[10px] font-bold text-slate-400 rounded uppercase">Pro</span>
          </div>
        </div>
      </header>

      {errorMsg && (
        <div className="bg-red-50 border-b border-red-100 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-3 text-red-700 text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
            <button 
              onClick={() => setErrorMsg('')}
              className="ml-auto text-red-400 hover:text-red-600 font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {view === 'privacy' ? (
          <PrivacyPolicy onBack={() => setView('editor')} />
        ) : (
          <main className="flex-1 max-w-7xl mx-auto p-4 lg:p-8 w-full flex flex-col lg:flex-row gap-8 overflow-hidden">
            <div className="w-full lg:w-1/3 lg:h-[calc(100vh-10rem)] lg:overflow-hidden flex flex-col order-2 lg:order-1">
              <ControlPanel 
                keyword={keyword}
                setKeyword={setKeyword}
                onGenerate={handleGenerate}
                isGenerating={isGeneratingText}
                variations={variations}
                currentVarIndex={currentVarIndex}
                onSelectVariation={handleSelectVariation}
                config={config}
                setConfig={setConfig}
                loadingImages={loadingImages}
                errorMsg={""}
                isPinterestConnected={isPinterestConnected}
                onConnectPinterest={handleConnectPinterest}
                onSchedule={handleSchedule}
              />
            </div>

            <div className="w-full lg:w-2/3 order-1 lg:order-2 flex flex-col items-center justify-start lg:pt-4">
              <CanvasPreview 
                ref={canvasRef}
                variation={variations[currentVarIndex] || null}
                config={config}
                imageUrl={variations[currentVarIndex]?.imageUrl}
                isLoadingImage={loadingImages[currentVarIndex]}
                isGeneratingText={isGeneratingText}
              />
            </div>
          </main>
        )}
      </div>

      <footer className="bg-white border-t border-slate-200 py-8 px-4 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-600 opacity-50" />
            <p>© {new Date().getFullYear()} PinGenius AI. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setView('privacy')} className="hover:text-red-600 transition-colors">Privacy Policy</button>
            <a href="https://ai.google.dev" target="_blank" rel="noopener" className="hover:text-red-600 transition-colors">Gemini API</a>
            <p className="text-xs font-bold uppercase tracking-tighter text-slate-300">Pinterest Authorized Tool</p>
          </div>
        </div>
      </footer>
    </div>
  );
}