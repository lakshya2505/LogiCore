export default function StatusPill({ status }) {
  const cls = status
    ? `pill pill-${status.toLowerCase().replace(/\s+/g, '-')}`
    : 'pill pill-retired';
  return <span className={cls}>{status || 'Unknown'}</span>;
}
