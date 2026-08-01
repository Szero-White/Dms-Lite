import {
  CloseOutlined,
  LockOutlined,
  MessageOutlined,
  ReloadOutlined,
  SendOutlined,
} from '@ant-design/icons';
import {
  Button,
  Input,
  Tooltip,
  Typography,
} from 'antd';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  PERMISSIONS,
  hasPermission,
  useAuth,
} from '../../../auth';
import { useAskHelpAssistant } from '../../hooks/useHelpAssistant';
import type {
  HelpAnswer,
  HelpConversationTurn,
} from '../../types/help.types';
import { AnswerView } from './AnswerView';
import { AssistantMascot } from './AssistantMascot';
import styles from './FloatingHelpAssistant.module.css';
import {
  GENERAL_PROMPT_KEYS,
  POSITION_STORAGE_KEY,
  ROLE_PROMPTS,
} from './assistant.constants';
import {
  clampLauncherPosition,
  getLauncherSize,
  getPanelPosition,
  readStoredPosition,
  type AssistantPosition,
} from './assistantPosition';

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  origin: AssistantPosition;
  moved: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  question?: string;
  answer?: HelpAnswer;
}

const CONTEXT_MESSAGE_LIMIT = 8;

function answerToContextContent(answer: HelpAnswer) {
  const steps = answer.steps.length > 0 ? ` Steps: ${answer.steps.join(' ')}` : '';
  const modules = answer.relatedModules.length > 0 ? ` Modules: ${answer.relatedModules.join(', ')}.` : '';

  return `${answer.answer}${steps}${modules}`.trim();
}

function toConversationContext(messages: ChatMessage[]): HelpConversationTurn[] {
  return messages
    .flatMap((message): HelpConversationTurn[] => {
      if (message.role === 'user' && message.question) {
        return [{ role: 'user', content: message.question }];
      }

      if (message.role === 'assistant' && message.answer) {
        return [{ role: 'assistant', content: answerToContextContent(message.answer) }];
      }

      return [];
    })
    .slice(-CONTEXT_MESSAGE_LIMIT);
}

export function FloatingHelpAssistant() {
  const { user } = useAuth();
  const { i18n, t } = useTranslation();
  const askAssistant = useAskHelpAssistant();
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<AssistantPosition>(() =>
    clampLauncherPosition(readStoredPosition()),
  );

  const canUseAssistant = hasPermission(user, PERMISSIONS.AI_HELP_VIEW);
  const prompts = useMemo(() => {
    const rolePrompts = ROLE_PROMPTS
      .filter((item) => user?.permissions.includes(item.permission))
      .map((item) => t(item.promptKey));

    return [
      ...rolePrompts.slice(0, 4),
      ...GENERAL_PROMPT_KEYS.map((key) => t(key)),
    ].slice(0, 6);
  }, [t, user?.permissions]);
  const panelPosition = useMemo(
    () => getPanelPosition(position, getLauncherSize(launcherRef.current)),
    [position],
  );

  useEffect(() => {
    const launcherSize = getLauncherSize(launcherRef.current);

    setPosition((currentPosition) => clampLauncherPosition(currentPosition, launcherSize));
  }, [open]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleResize = () => {
      const launcherSize = getLauncherSize(launcherRef.current);
      setPosition((currentPosition) => clampLauncherPosition(currentPosition, launcherSize));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [open]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
    }
  }, [position]);

  useEffect(() => {
    if (open) {
      conversationEndRef.current?.scrollIntoView({ block: 'end' });
    }
  }, [messages, askAssistant.isPending, open]);

  const handlePointerDown = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: position,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    const dragState = dragRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      dragState.moved = true;
      setIsDragging(true);
    }

    if (!dragState.moved) {
      return;
    }

    const launcherSize = getLauncherSize(launcherRef.current);
    const nextPosition = {
      x: dragState.origin.x + deltaX,
      y: dragState.origin.y + deltaY,
    };

    setPosition(clampLauncherPosition(nextPosition, launcherSize));
  }, []);

  const handlePointerUp = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    const dragState = dragRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (dragState.moved) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }

    dragRef.current = null;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  if (!canUseAssistant) {
    return null;
  }

  async function submitQuestion(value = question) {
    const normalizedQuestion = value.trim();

    if (!normalizedQuestion || askAssistant.isPending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      question: normalizedQuestion,
    };
    const context = toConversationContext(messages);

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setQuestion('');

    const response = await askAssistant.mutateAsync({
      question: normalizedQuestion,
      locale: i18n.resolvedLanguage || i18n.language,
      context,
    });

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        answer: response,
      },
    ]);
  }

  function startNewConversation() {
    setMessages([]);
    setQuestion('');
  }

  function toggleAssistant() {
    if (suppressClickRef.current) {
      return;
    }

    setOpen((current) => !current);
  }

  return (
    <div
      className={styles.assistantShell}
      style={{ left: position.x, top: position.y }}
    >
      {open ? (
        <section className={styles.assistantPanel} style={{ left: panelPosition.x, top: panelPosition.y }} aria-label={t('assistant.title')}>
          <div className={styles.panelHeader}>
            <div className={styles.headerIdentity}>
              <AssistantMascot compact />
              <div>
                <Typography.Text strong>{t('assistant.title')}</Typography.Text>
                <Typography.Paragraph type="secondary">
                  {t('assistant.scopedTo', { role: user?.roles?.[0] ?? t('assistant.yourRole') })}
                </Typography.Paragraph>
              </div>
            </div>
            <div className={styles.headerActions}>
              <Tooltip title={t('assistant.newChat')}>
                <Button
                  type="text"
                  shape="circle"
                  icon={<ReloadOutlined />}
                  onClick={startNewConversation}
                  disabled={messages.length === 0 && question.length === 0}
                  aria-label={t('assistant.newChat')}
                />
              </Tooltip>
              <Tooltip title={t('assistant.close')}>
                <Button
                  type="text"
                  shape="circle"
                  icon={<CloseOutlined />}
                  onClick={() => setOpen(false)}
                  aria-label={t('assistant.close')}
                />
              </Tooltip>
            </div>
          </div>

          <div className={styles.promptStrip}>
            {prompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  void submitQuestion(prompt);
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className={styles.conversationArea}>
            {messages.length > 0 ? (
              <div className={styles.messageList}>
                {messages.map((message) => (
                  message.role === 'user' ? (
                    <div key={message.id} className={`${styles.chatMessage} ${styles.userMessage}`}>
                      <Typography.Text>{message.question}</Typography.Text>
                    </div>
                  ) : message.answer ? (
                    <div key={message.id} className={`${styles.chatMessage} ${styles.assistantMessage}`}>
                      <AnswerView answer={message.answer} />
                    </div>
                  ) : null
                ))}
                {askAssistant.isPending ? (
                  <div className={`${styles.chatMessage} ${styles.assistantMessage} ${styles.thinkingMessage}`}>
                    <AssistantMascot compact />
                    <Typography.Text>{t('assistant.thinking')}</Typography.Text>
                  </div>
                ) : null}
                <div ref={conversationEndRef} />
              </div>
            ) : (
              <div className={styles.emptyState}>
                <AssistantMascot />
                <Typography.Text strong>{t('assistant.emptyTitle')}</Typography.Text>
                <Typography.Text type="secondary">
                  {t('assistant.emptyDescription')}
                </Typography.Text>
              </div>
            )}
          </div>

          <div className={styles.composer}>
            <Input.TextArea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={t('assistant.placeholder')}
              autoSize={{ minRows: 2, maxRows: 4 }}
              maxLength={500}
              onPressEnter={(event) => {
                if (!event.shiftKey) {
                  event.preventDefault();
                  void submitQuestion();
                }
              }}
            />
            <Button
              type="primary"
              shape="circle"
              icon={<SendOutlined />}
              loading={askAssistant.isPending}
              onClick={() => {
                void submitQuestion();
              }}
              aria-label={t('assistant.ask')}
            />
          </div>

          <div className={styles.scopeBar}>
            <LockOutlined />
            <span>{t('assistant.scopeBar')}</span>
          </div>
        </section>
      ) : null}

      <Tooltip title={t('assistant.launcherTooltip')} placement="left">
        <button
          ref={launcherRef}
          type="button"
          className={`${styles.launcher} ${open ? styles.launcherOpen : ''} ${isDragging ? styles.launcherDragging : ''}`}
          aria-label={t('assistant.launcherLabel')}
          onClick={toggleAssistant}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <AssistantMascot compact />
          <MessageOutlined className={styles.launcherIcon} />
        </button>
      </Tooltip>
    </div>
  );
}
