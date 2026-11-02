import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnswerCard, Channel, ChatMessage, HealthInfo } from '../shared/types';
import { api, ApiError } from './api';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { DemoScenarios } from './components/DemoScenarios';
import { DevPanel } from './components/DevPanel';
import { ServiceDirectory } from './components/ServiceDirectory';
import { Footer } from './components/Footer';

function timeNow(): string {
  return new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

export default function App() {
  const [channel, setChannel] = useState<Channel>('web');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [latestCard, setLatestCard] = useState<AnswerCard | undefined>();
  const [lastRequest, setLastRequest] = useState<{ query?: string; selectedServiceId?: string } | null>(null);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isDevOpen, setIsDevOpen] = useState(false);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const sessionRef = useRef<{ id: string; channel: Channel } | null>(null);

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth(null));
  }, []);

  const ensureSession = useCallback(async (): Promise<string> => {
    if (sessionRef.current && sessionRef.current.channel === channel) return sessionRef.current.id;
    const s = await api.createSession(channel);
    sessionRef.current = { id: s.sessionId, channel };
    return s.sessionId;
  }, [channel]);

  const resetChat = useCallback(() => {
    setMessages([]);
    setLatestCard(undefined);
    setLastRequest(null);
    setError(null);
    sessionRef.current = null;
  }, []);

  const changeChannel = (next: Channel) => {
    if (next === channel) return;
    setChannel(next);
    resetChat();
  };

  const send = useCallback(
    async (body: { query?: string; selectedServiceId?: string }, displayText: string) => {
      if (isLoading) return;
      setError(null);
      setLastRequest(body);
      setMessages((prev) => [...prev, { id: `u_${Date.now()}`, sender: 'user', text: displayText, timestamp: timeNow() }]);
      setIsLoading(true);
      try {
        let sessionId = await ensureSession();
        let res;
        try {
          res = await api.sendMessage(sessionId, channel, body);
        } catch (e) {
          // 對話過期時重新建立一次
          if (e instanceof ApiError && e.status === 404) {
            sessionRef.current = null;
            sessionId = await ensureSession();
            res = await api.sendMessage(sessionId, channel, body);
          } else {
            throw e;
          }
        }
        setLatestCard(res.card);
        // 使用者畫面上的問句也改用遮罩後版本，避免個資留在畫面上
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.sender === 'user' && body.query) copy[copy.length - 1] = { ...last, text: res.card.maskedQuery || last.text };
          return [...copy, { id: res.card.messageId, sender: 'assistant', text: res.card.summary, timestamp: timeNow(), card: res.card }];
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : '連線異常，請稍後再試。');
      } finally {
        setIsLoading(false);
      }
    },
    [channel, ensureSession, isLoading],
  );

  const sendQuery = (query: string) => send({ query }, query);

  // 示範情境可能需要先切換入口，待 channel 更新後再送出
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  useEffect(() => {
    if (!pendingQuery) return;
    const q = pendingQuery;
    setPendingQuery(null);
    send({ query: q }, q);
  }, [pendingQuery, send]);
  const selectService = (serviceId: string, label: string) => send({ selectedServiceId: serviceId }, label);

  return (
    <div className="h-dvh flex flex-col bg-neutral-50 text-neutral-900">
      <div className="shrink-0 z-30">
      <Header
        channel={channel}
        onChangeChannel={changeChannel}
        onOpenDirectory={() => setIsDirectoryOpen(true)}
        onToggleDemo={() => setIsDemoOpen((v) => !v)}
        isDemoOpen={isDemoOpen}
        onReset={resetChat}
        hasMessages={messages.length > 0}
      />

      <DemoScenarios
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onRun={(query, targetChannel) => {
          if (targetChannel !== channel) changeChannel(targetChannel);
          setPendingQuery(query);
        }}
        onOpenDevPanel={() => setIsDevOpen(true)}
        isLoading={isLoading}
      />
      </div>

      <main className="flex-1 min-h-0 flex flex-col w-full max-w-4xl mx-auto">
        <ChatView
          channel={channel}
          messages={messages}
          isLoading={isLoading}
          error={error}
          onSend={sendQuery}
          onSelectService={selectService}
          onRetry={lastRequest ? () => send(lastRequest, lastRequest.query ?? '重試') : undefined}
          onOpenDevPanel={() => setIsDevOpen(true)}
          getSessionId={ensureSession}
        />
      </main>

      <Footer />

      <DevPanel isOpen={isDevOpen} onClose={() => setIsDevOpen(false)} card={latestCard} health={health} channel={channel} />
      <ServiceDirectory
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        channel={channel}
        onSelect={(id, name) => {
          setIsDirectoryOpen(false);
          selectService(id, name);
        }}
      />
    </div>
  );
}
