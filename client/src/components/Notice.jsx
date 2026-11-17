import { useT } from '../i18n/index.js';

export default function Notice({ status, error }) {
  const t = useT();
  if (status === 'offline') {
    return (
      <p className="notice" role="status">
        {t('notice.offline')}
        <small> {error}</small>
      </p>
    );
  }
  return null;
}
