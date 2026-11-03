import { useToasts } from './toast';

export function Toaster() {
  const list = useToasts();
  return (
    <div className="toaster" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className="toast">
          {t.text}
        </div>
      ))}
    </div>
  );
}
