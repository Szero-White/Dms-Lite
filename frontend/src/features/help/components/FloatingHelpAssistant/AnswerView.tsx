import {
  BulbOutlined,
  DatabaseOutlined,
  RobotOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import {
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useTranslation } from 'react-i18next';
import {
  answerSourceTranslationKey,
  assistantVisibleSource,
} from '../../utils/answerProvenance';
import type { HelpAnswer } from '../../types/help.types';
import styles from './FloatingHelpAssistant.module.css';

interface AnswerViewProps {
  answer: HelpAnswer;
}

export function AnswerView({ answer }: AnswerViewProps) {
  const { t } = useTranslation();
  const visibleSource = answer.blocked ? null : assistantVisibleSource(answer.answerSource);

  return (
    <div className={styles.answerPanel}>
      <div className={styles.answerIntro}>
        <BulbOutlined />
        <Typography.Text>{answer.answer}</Typography.Text>
      </div>

      {(visibleSource || answer.generationProvider === 'GEMINI') ? (
        <div className={styles.provenanceRow}>
          {visibleSource ? (
            <Tag
              icon={visibleSource === 'LIVE_DATA' ? <DatabaseOutlined /> : undefined}
              color={visibleSource === 'LIVE_DATA' ? 'blue' : 'default'}
            >
              {t(answerSourceTranslationKey(visibleSource))}
            </Tag>
          ) : null}
          {answer.generationProvider === 'GEMINI' ? (
            <Tooltip title={t('assistant.answer.aiAssistedTooltip')}>
              <Tag icon={<RobotOutlined />} color="purple">
                {t('assistant.answer.aiAssisted')}
              </Tag>
            </Tooltip>
          ) : null}
        </div>
      ) : null}

      <div className={styles.answerSection}>
        <Typography.Text strong>{t('assistant.answer.nextSteps')}</Typography.Text>
        <ol>
          {answer.steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </div>

      <div className={styles.answerSection}>
        <Typography.Text strong>{t('assistant.answer.allowedContext')}</Typography.Text>
        <div className={styles.tagList}>
          {answer.relatedModules.length > 0 ? answer.relatedModules.map((module) => (
            <Tag color="purple" key={module}>{module}</Tag>
          )) : <Tag>{t('assistant.answer.limitedAccess')}</Tag>}
        </div>
      </div>

      <div className={styles.guardrailBox}>
        <SafetyOutlined />
        <div>
          <Typography.Text strong>{answer.scopeNotice}</Typography.Text>
          {answer.guardrails.map((guardrail) => (
            <Typography.Text key={guardrail} type="secondary">{guardrail}</Typography.Text>
          ))}
        </div>
      </div>
    </div>
  );
}
