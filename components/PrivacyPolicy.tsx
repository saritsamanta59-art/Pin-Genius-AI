import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Back to App
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-12">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
        </div>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
          <section>
            <h2 className="text-xl font-bold text-slate-900">Data Collection</h2>
            <p>PinGenius AI collects keywords and images you provide to generate content using the Google Gemini API. We do not store your designs permanently on our servers.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">Pinterest Integration</h2>
            <p>Our app uses Pinterest OAuth 2.0 to access your boards and publish pins. We store your access token locally in your browser (LocalStorage). We do not have access to your Pinterest password.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">Third-Party Services</h2>
            <p>We use Google Gemini for AI generation. Any data shared with Gemini is subject to Google's privacy policies.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">Security</h2>
            <p>We take industry-standard measures to protect your data, including secure OAuth flows and local token encryption where applicable.</p>
          </section>
        </div>
      </div>
    </div>
  );
};