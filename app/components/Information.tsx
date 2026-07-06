'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

// ── 1. The shape of a single message ──────────────────────────────
type InfoType = 'success' | 'error' | 'info' | 'warning';

interface InfoMessage {
  id: string;
  type: InfoType;
  text: string;
}

// ── 2. What any component gets when it calls useInformation() ────
interface InformationContextValue {
  show: (type: InfoType, text: string) => void;
}

const InformationContext = createContext<InformationContextValue | undefined>(
  undefined
);

// ── 3. One place that defines what each type LOOKS like ──────────
const STYLES: Record<
  InfoType,
  { bg: string; border: string; text: string; Icon: typeof CheckCircle2 }
> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    text: 'text-green-800',
    Icon: CheckCircle2,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    text: 'text-red-800',
    Icon: XCircle,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    text: 'text-blue-800',
    Icon: Info,
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    text: 'text-yellow-800',
    Icon: AlertTriangle,
  },
};

// ── 4. The Provider: holds the list of active messages ────────────
export function InformationProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<InfoMessage[]>([]);

  const remove = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const show = useCallback(
    (type: InfoType, text: string) => {
      const id = crypto.randomUUID();
      setMessages((prev) => [...prev, { id, type, text }]);
      // auto-dismiss after 3 seconds
      setTimeout(() => remove(id), 3000);
    },
    [remove]
  );

  return (
    <InformationContext.Provider value={{ show }}>
      {children}

      {/* the actual boxes stacked in the corner of the screen */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
        {messages.map((m) => {
          const s = STYLES[m.type];
          const Icon = s.Icon;
          return (
            <div
              key={m.id}
              role="status"
              className={`flex items-center gap-2 rounded-lg border-l-4 ${s.bg} ${s.border} ${s.text} px-4 py-3 shadow-md`}
            >
              <Icon size={18} className="shrink-0" />
              <span className="text-sm font-medium flex-1">{m.text}</span>
              <button
                onClick={() => remove(m.id)}
                aria-label="Dismiss"
                className="opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </InformationContext.Provider>
  );
}

// ── 5. The hook every component uses to trigger a message ────────
export function useInformation() {
  const ctx = useContext(InformationContext);
  if (!ctx) {
    throw new Error('useInformation must be used inside <InformationProvider>');
  }
  return ctx;
}