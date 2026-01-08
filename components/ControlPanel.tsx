import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Layout, 
  Droplet, 
  Layers, 
  Check, 
  Copy, 
  MousePointerClick,
  Loader2,
  Sparkles,
  Calendar,
  Share2,
  ChevronDown,
  User as UserIcon,
  ExternalLink,
  Info
} from 'lucide-react';
import { PinConfig, PinVariation, FONTS, PinterestBoard, PinterestSection, PinterestUser } from '../types';
import { pinterestService } from '../services/pinterestService';

interface ControlPanelProps {
  keyword: string;
  setKeyword: (k: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  variations: PinVariation[];
  currentVarIndex: number;
  onSelectVariation: (idx: number) => void;
  config: PinConfig;
  setConfig: (c: PinConfig) => void;
  loadingImages: Record<number, boolean>;
  errorMsg: string;
  isPinterestConnected: boolean;
  onConnectPinterest: () => void;
  onSchedule: (data: { boardId: string, sectionId?: string, date?: string }) => Promise<void>;
}

const COLOR_SCHEMES = [
  { id: 'standard', name: 'Standard', icon: Palette },
  { id: 'monochrome', name: 'Monochrome', icon: Droplet },
  { id: 'dark-overlay', name: 'Dark Overlay', icon: Layers },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  keyword,
  setKeyword,
  onGenerate,
  isGenerating,
  variations,
  currentVarIndex,
  onSelectVariation,
  config,
  setConfig,
  loadingImages,
  errorMsg,
  isPinterestConnected,
  onConnectPinterest,
  onSchedule
}) => {
  const [activeTab, setActiveTab] = useState<'design' | 'publish'>('design');
  const [copied, setCopied] = React.useState(false);
  const [copiedUri, setCopiedUri] = React.useState(false);
  
  // Pinterest UI State
  const [user, setUser] = useState<PinterestUser | null>(null);
  const [boards, setBoards] = useState<PinterestBoard[]>([]);
  const [sections, setSections] = useState<PinterestSection[]>([]);
  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  useEffect(() => {
    if (isPinterestConnected && activeTab === 'publish') {
      pinterestService.fetchUser().then(setUser).catch(console.error);
      pinterestService.fetchBoards().then(setBoards).catch(console.error);
    }
  }, [isPinterestConnected, activeTab]);

  useEffect(() => {
    if (selectedBoard) {
      pinterestService.fetchSections(selectedBoard).then(setSections).catch(console.error);
    } else {
      setSections([]);
    }
  }, [selectedBoard]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyUri = () => {
    navigator.clipboard.writeText(pinterestService.getRedirectUri()).then(() => {
      setCopiedUri(true);
      setTimeout(() => setCopiedUri(false), 2000);
    });
  };

  const updateConfig = (key: keyof PinConfig, value: any) => {
    setConfig({ ...config, [key]: value });
  };

  const handleScheduleClick = async () => {
    if (!selectedBoard) return;
    setIsPublishing(true);
    setPublishSuccess(false);

    try {
      await onSchedule({
        boardId: selectedBoard,
        sectionId: selectedSection || undefined,
        date: publishDate || undefined
      });
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 3000);
    } catch (e: any) {
      alert(e.message || "Failed to schedule pin");
    } finally {
      setIsPublishing(false);
    }
  };

  const currentVariation = variations[currentVarIndex];

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 1. Input Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          What is your Pin about?
        </label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. Minimalist Home Office"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
          />
          <button 
            onClick={onGenerate}
            disabled={isGenerating || !keyword.trim()}
            className={`px-6 py-3 rounded-xl font-semibold text-white transition-all flex items-center gap-2 ${
              isGenerating || !keyword.trim() ? 'bg-slate-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-md'
            }`}
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Create
          </button>
        </div>
        {errorMsg && (
          <div className="mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
            {errorMsg}
          </div>
        )}
      </div>

      {/* 2. Controls Section */}
      {variations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
          {/* Tab Header */}
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setActiveTab('design')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'design' ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Palette className="w-4 h-4" /> Design
            </button>
            <button 
              onClick={() => setActiveTab('publish')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'publish' ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Calendar className="w-4 h-4" /> Publish
            </button>
          </div>

          <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar flex-1">
            {activeTab === 'design' ? (
              <>
                {/* Variation Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-3 h-3" /> Select Variation
                  </label>
                  <div className="flex gap-2">
                    {variations.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSelectVariation(idx)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all border ${
                          currentVarIndex === idx 
                          ? 'bg-red-600 border-red-600 text-white shadow-md' 
                          : 'bg-white border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-500'
                        }`}
                      >
                        {loadingImages[idx] ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* SEO Section */}
                <div className="space-y-6">
                    {currentVariation && (
                      <>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 group relative">
                          <div className="flex justify-between items-start mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">SEO Title</label>
                            <button onClick={() => copyToClipboard(currentVariation.seoTitle)} className="text-slate-400 hover:text-red-600 transition-colors">
                              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-sm text-slate-800 font-medium">{currentVariation.seoTitle}</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 group relative">
                          <div className="flex justify-between items-start mb-2">
                              <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                              <button onClick={() => copyToClipboard(`${currentVariation.seoDescription}\n\n${currentVariation.hashtags}`)} className="text-slate-400 hover:text-red-600 transition-colors">
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {currentVariation.seoDescription}
                            <br /><br />
                            <span className="text-blue-600 font-medium">{currentVariation.hashtags}</span>
                          </p>
                        </div>
                      </>
                    )}
                </div>

                <div className="h-px bg-slate-100" />

                {/* Design Styling */}
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Overlay Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      {COLOR_SCHEMES.map((scheme) => {
                        const Icon = scheme.icon;
                        return (
                          <button
                            key={scheme.id}
                            onClick={() => updateConfig('colorScheme', scheme.id)}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition-all ${
                              config.colorScheme === scheme.id
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <Icon className="w-4 h-4 mb-1" />
                            {scheme.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Headline</label>
                    <textarea 
                      value={config.headline}
                      onChange={(e) => updateConfig('headline', e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-200 text-slate-700 text-sm focus:border-red-500 outline-none resize-none h-20"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                {!isPinterestConnected ? (
                  <div className="text-center py-8">
                    <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Share2 className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Connect Pinterest</h3>
                    <p className="text-sm text-slate-500 mb-6 px-4">
                      Authorize PinGenius AI to publish and schedule pins directly to your boards.
                    </p>
                    
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Setup Instructions</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal mb-3">
                        Ensure the Redirect URI below is added to your Pinterest App at <strong>developers.pinterest.com</strong>:
                      </p>
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 overflow-hidden">
                        <code className="text-[10px] text-red-600 flex-1 truncate font-mono">{pinterestService.getRedirectUri()}</code>
                        <button onClick={copyUri} className="text-slate-400 hover:text-red-600 shrink-0">
                          {copiedUri ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <button 
                      onClick={onConnectPinterest}
                      className="w-full py-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      Connect Account <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-3">
                      {user?.profile_image ? (
                        <img src={user.profile_image} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="Profile" />
                      ) : (
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-green-800 uppercase tracking-wider">Connected as</p>
                        <p className="text-xs text-green-600 font-bold">@{user?.username || 'Pinterest User'}</p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Choose Board</label>
                        <div className="relative">
                          <select 
                            value={selectedBoard}
                            onChange={(e) => setSelectedBoard(e.target.value)}
                            className="w-full appearance-none bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                          >
                            <option value="">Select a board...</option>
                            {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {sections.length > 0 && (
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Section (Optional)</label>
                          <div className="relative">
                            <select 
                              value={selectedSection}
                              onChange={(e) => setSelectedSection(e.target.value)}
                              className="w-full appearance-none bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            >
                              <option value="">No section</option>
                              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Publish Date & Time</label>
                        <input 
                          type="datetime-local" 
                          value={publishDate}
                          onChange={(e) => setPublishDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                      </div>

                      <button 
                        onClick={handleScheduleClick}
                        disabled={!selectedBoard || isPublishing}
                        className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                          publishSuccess 
                            ? 'bg-green-500 text-white' 
                            : !selectedBoard 
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                              : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {isPublishing ? <Loader2 className="w-5 h-5 animate-spin" /> : publishSuccess ? <Check className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                        {isPublishing ? 'Scheduling...' : publishSuccess ? 'Successfully Scheduled!' : 'Schedule Pin'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};