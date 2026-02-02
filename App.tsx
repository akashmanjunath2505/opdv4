
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import logo from './assets/logo.png';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { UserRole, Chat, Message, PreCodedGpt, DoctorProfile, ClinicalProtocol } from './types';
import { PRE_CODED_GPTS } from './constants';
import { Icon } from './components/Icon';
import { LicenseVerificationModal } from './components/LicenseVerificationModal';
import { ScribeSessionView } from './components/VedaSessionView';
import { CLINICAL_PROTOCOLS } from './knowledgeBase';
import { PrintViewModal } from './components/PrintViewModal';
import { AboutModal } from './components/AboutModal';
import { generateCaseSummary } from './services/geminiService';
import { CaseSummaryModal } from './components/CaseSummaryModal';

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const userRole = UserRole.DOCTOR;
  const [language, setLanguage] = useState('English');
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [isDoctorVerified, setIsDoctorVerified] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingVerificationMessage, setPendingVerificationMessage] = useState<string | null>(null);
  const [pendingFirstMessage, setPendingFirstMessage] = useState<string | null>(null);

  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile>({
    name: 'Dr. Sharma',
    qualification: 'BAMS',
    canPrescribeAllopathic: 'no'
  });

  type View = 'chat' | 'scribe';
  const [activeView, setActiveView] = useState<View>('chat');

  const [isInsightsPanelOpen, setIsInsightsPanelOpen] = useState(false);
  const knowledgeBaseProtocols = useMemo(() => CLINICAL_PROTOCOLS, []);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);


  const activeChat = useMemo(() => {
    return chats.find(chat => chat.id === activeChatId) || null;
  }, [chats, activeChatId]);

  const handleNewChat = useCallback((gpt?: PreCodedGpt) => {
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      title: gpt ? gpt.title : `New Conversation`,
      messages: gpt ? [{
        id: `msg-${Date.now()}`,
        sender: 'AI',
        text: `You've started a new session with ${gpt.title}. ${gpt.description} How can I help you today?`,
        action_type: 'Informational',
      }] : [],
      userRole: userRole,
      gptId: gpt?.id,
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setActiveView('chat');
    setPendingVerificationMessage(null);
    setPendingFirstMessage(null);
    setIsInsightsPanelOpen(false);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [userRole]);

  const updateChat = useCallback((chatId: string, messages: Message[]) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, messages } : chat
    ));
  }, []);

  const handleSelectChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
    setActiveView('chat');
    setPendingVerificationMessage(null);
    setIsInsightsPanelOpen(false);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  const relevantGpts = useMemo(() => PRE_CODED_GPTS, []);

  const handleVerifyLicense = () => {
    setIsDoctorVerified(true);
    setShowVerificationModal(false);
  };

  const handleStartScribeSession = () => {
    setActiveView('scribe');
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleGenerateCaseSummary = useCallback(async () => {
    if (!activeChat || activeChat.messages.length === 0) return;
    setIsGeneratingSummary(true);
    setSummaryContent(null);
    setIsSummaryModalOpen(true);
    try {
      const summary = await generateCaseSummary(activeChat.messages, language, doctorProfile);
      setSummaryContent(summary);
    } catch (error) {
      console.error("Failed to generate case summary:", error);
      setSummaryContent("Error generating summary.");
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [activeChat, language, doctorProfile]);

  const renderActiveView = () => {
    switch (activeView) {
      case 'scribe':
        return <ScribeSessionView
          onEndSession={() => setActiveView('chat')}
          doctorProfile={doctorProfile}
          language={language}
        />;
      case 'chat':
      default:
        return (
          <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-aivana-dark via-aivana-dark-sider to-aivana-dark">
            <div className="text-center px-8">
              {/* Logo/Icon */}
              <div className="mb-8 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-aivana-accent opacity-20 blur-3xl rounded-full"></div>
                  <img src={logo} alt="Aivana Logo" className="w-32 h-auto relative z-10 object-contain drop-shadow-2xl" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                Aivana
              </h1>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto">
                AI-Powered Medical Transcription
              </p>

              {/* Main Action Button */}
              <button
                onClick={handleStartScribeSession}
                className="group relative inline-flex items-center justify-center gap-4 px-12 py-6 bg-aivana-accent hover:bg-purple-700 text-white font-semibold text-lg rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transform"
              >
                <Icon name="sparkles" className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
                <span>Start Transcription</span>
              </button>

              {/* Feature hints */}
              <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Icon name="microphone" className="w-4 h-4" />
                  <span>Real-time Recording</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="language" className="w-4 h-4" />
                  <span>Multi-language Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="document-text" className="w-4 h-4" />
                  <span>Instant Documentation</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  }


  return (
    <div className="flex h-screen w-screen text-aivana-text bg-aivana-dark-sider">
      {/* Sidebar - Hidden in Scribe Mode */}
      {activeView !== 'scribe' && (
        <Sidebar
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          gpts={relevantGpts}
          chats={chats}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          activeChat={activeChat}
          activeChatId={activeChatId}
          language={language}
          setLanguage={setLanguage}
          doctorProfile={doctorProfile}
          setDoctorProfile={setDoctorProfile}
          onStartScribeSession={handleStartScribeSession}
          activeView={activeView}
          onShowPrintModal={() => setIsPrintModalOpen(true)}
          onShowAboutModal={() => setIsAboutModalOpen(true)}
          onGenerateCaseSummary={() => setIsSummaryModalOpen(true)}
        />
      )}
      <main className="flex-1 flex flex-col bg-aivana-dark relative">
        {renderActiveView()}
      </main>
      <LicenseVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onVerify={handleVerifyLicense}
      />
      <PrintViewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        protocols={knowledgeBaseProtocols}
      />
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
      <CaseSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summaryContent={summaryContent}
        isGenerating={isGeneratingSummary}
        chatTitle={activeChat?.title || "Case Summary"}
      />
    </div>
  );
};

export default App;
