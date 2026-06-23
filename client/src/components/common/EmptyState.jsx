import { DocumentTextIcon } from '@heroicons/react/24/outline';

export default function EmptyState({ icon: Icon = DocumentTextIcon, title, message, action }) {
  return (
    <div className="empty-state">
      <Icon className="empty-state-icon" />
      <h4>{title}</h4>
      <p>{message}</p>
      {action}
    </div>
  );
}
