import { Bars3Icon } from '@heroicons/react/24/outline';

export default function Topbar({ title, onMenuClick }) {
  return (
    <header className="topbar">
      <button className="topbar-menu-btn" onClick={onMenuClick}>
        <Bars3Icon />
      </button>
      <h1 className="topbar-title">{title}</h1>
    </header>
  );
}
