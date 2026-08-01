import {
  CloseOutlined,
  LockOutlined,
  MessageOutlined,
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
import {
  PERMISSIONS,
  hasPermission,
  useAuth,
} from '../../../auth';
import { useAskHelpAssistant } from '../../hooks/useHelpAssistant';
import type { HelpAnswer } from '../../types/help.types';
import { AnswerView } from './AnswerView';
import { AssistantMascot } from './AssistantMascot';
import styles from './FloatingHelpAssistant.module.css';
import {
  GENERAL_PROMPTS,
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

export function FloatingHelpAssistant() {
  const { user } = useAuth();
  const askAssistant = useAskHelpAssistant();
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<HelpAnswer | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<AssistantPosition>(() =>
    clampLauncherPosition(readStoredPosition()),
  );

  const canUseAssistant = hasPermission(user, PERMISSIONS.AI_HELP_VIEW);
  const prompts = useMemo(() => {
    const rolePrompts = ROLE_PROMPTS
      .filter((item) => user?.permissions.includes(item.permission))
      .map((item) => item.prompt);

    return [...rolePrompts.slice(0, 4), ...GENERAL_PROMPTS].slice(0, 6);
  }, [user?.permissions]);
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

    if (!normalizedQuestion) {
      return;
    }

    setQuestion(normalizedQuestion);
    const response = await askAssistant.mutateAsync({ question: normalizedQuestion });
    setAnswer(response);
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
        <section className={styles.assistantPanel} style={{ left: panelPosition.x, top: panelPosition.y }} aria-label="Role-aware assistant">
          <div className={styles.panelHeader}>
            <div className={styles.headerIdentity}>
              <AssistantMascot compact />
              <div>
                <Typography.Text strong>Workflow Buddy</Typography.Text>
                <Typography.Paragraph type="secondary">
                  Scoped to {user?.roles?.[0] ?? 'your role'}
                </Typography.Paragraph>
              </div>
            </div>
            <Tooltip title="Close assistant">
              <Button
                type="text"
                shape="circle"
                icon={<CloseOutlined />}
                onClick={() => setOpen(false)}
              />
            </Tooltip>
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
            {answer ? (
              <AnswerView answer={answer} />
            ) : (
              <div className={styles.emptyState}>
                <AssistantMascot />
                <Typography.Text strong>Ask about the work in front of you.</Typography.Text>
                <Typography.Text type="secondary">
                  I will stay inside your assigned permissions.
                </Typography.Text>
              </div>
            )}
          </div>

          <div className={styles.composer}>
            <Input.TextArea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask a workflow question..."
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
              aria-label="Ask assistant"
            />
          </div>

          <div className={styles.scopeBar}>
            <LockOutlined />
            <span>Role-scoped answers only</span>
          </div>
        </section>
      ) : null}

      <Tooltip title="Hold and drag, or click to open" placement="left">
        <button
          ref={launcherRef}
          type="button"
          className={`${styles.launcher} ${open ? styles.launcherOpen : ''} ${isDragging ? styles.launcherDragging : ''}`}
          aria-label="Open workflow assistant"
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
