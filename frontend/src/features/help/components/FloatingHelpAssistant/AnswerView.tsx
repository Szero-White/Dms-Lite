import {
  BulbOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import {
  Tag,
  Typography,
} from 'antd';
import { useTranslation } from 'react-i18next';
import type { HelpAnswer } from '../../types/help.types';
import styles from './FloatingHelpAssistant.module.css';

interface AnswerViewProps {
  answer: HelpAnswer;
}

export function AnswerView({ answer }: AnswerViewProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.answerPanel}>
      <div className={styles.answerIntro}>
        <BulbOutlined />
        <Typography.Text>{answer.answer}</Typography.Text>
      </div>

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