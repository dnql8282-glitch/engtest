import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface MenuItem {
  icon?: ReactNode;
  label: string;
  onSelect: () => void;
}

interface MenuProps {
  trigger: (props: { onClick: () => void; 'aria-expanded': boolean }) => ReactNode;
  items: MenuItem[];
  align?: 'left' | 'right';
}

// 버튼을 누르면 뜨는 작은 팝업 메뉴 (카드의 ⋮, 프로필 메뉴 등에 재사용)
// 바깥을 클릭하거나 Esc를 누르면 닫혀요.
export function Menu({ trigger, items, align = 'right' }: MenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="menu-anchor" ref={ref}>
      {trigger({ onClick: () => setOpen((v) => !v), 'aria-expanded': open })}
      {open && (
        <ul className={`menu-popup ${align}`} role="menu">
          {items.map((item) => (
            <li key={item.label} role="menuitem">
              <button
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
