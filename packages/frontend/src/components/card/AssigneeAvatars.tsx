import type { User } from './AssigneeSelector';

/**
 * AssigneeAvatars Component (T219)
 * User Story 6: Card Assignment and Notifications
 *
 * Displays assigned users as compact avatar badges on card previews.
 * Shows up to 3 avatars with a "+N more" indicator for additional assignees.
 */

interface AssigneeAvatarsProps {
  assignees: User[];
  maxVisible?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function AssigneeAvatars({
  assignees,
  maxVisible = 3,
  size = 'sm',
  className = '',
}: AssigneeAvatarsProps) {
  if (!assignees || assignees.length === 0) {
    return null;
  }

  const visibleAssignees = assignees.slice(0, maxVisible);
  const remainingCount = Math.max(0, assignees.length - maxVisible);

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarUrl = (user: User) => {
    return user.avatarUrl || undefined;
  };

  const sizeClasses = {
    sm: {
      avatar: 'w-6 h-6 text-xs',
      text: 'text-xs',
      overlap: '-ml-2',
    },
    md: {
      avatar: 'w-8 h-8 text-sm',
      text: 'text-sm',
      overlap: '-ml-3',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex items-center ${className}`} role="group" aria-label="Assigned users">
      {visibleAssignees.map((assignee, index) => (
        <div
          key={assignee.id}
          className={`${classes.avatar} rounded-full border-2 border-white flex-shrink-0 ${
            index > 0 ? classes.overlap : ''
          }`}
          title={`${assignee.name} (${assignee.email})`}
          style={{ zIndex: visibleAssignees.length - index }}
        >
          {assignee.avatarUrl ? (
            <img
              src={getAvatarUrl(assignee)}
              alt={assignee.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full rounded-full bg-blue-500 text-white flex items-center justify-center font-medium"
              aria-label={assignee.name}
            >
              {getUserInitials(assignee.name)}
            </div>
          )}
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={`${classes.avatar} ${classes.overlap} rounded-full border-2 border-white bg-gray-200 text-gray-700 flex items-center justify-center font-medium flex-shrink-0`}
          title={`${remainingCount} more assignee${remainingCount > 1 ? 's' : ''}`}
          style={{ zIndex: 0 }}
        >
          <span className={classes.text}>+{remainingCount}</span>
        </div>
      )}
    </div>
  );
}

/**
 * AssigneeAvatarsList Component
 * Alternative layout for displaying assignees in a vertical list with full names.
 * Used in card details or lists where space is not constrained.
 */

interface AssigneeAvatarsListProps {
  assignees: User[];
  className?: string;
}

export function AssigneeAvatarsList({ assignees, className = '' }: AssigneeAvatarsListProps) {
  if (!assignees || assignees.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        <p>No assignees</p>
      </div>
    );
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarUrl = (user: User) => {
    return user.avatarUrl || undefined;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {assignees.map((assignee) => (
        <div key={assignee.id} className="flex items-center gap-2">
          {assignee.avatarUrl ? (
            <img
              src={getAvatarUrl(assignee)}
              alt={assignee.name}
              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
              {getUserInitials(assignee.name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{assignee.name}</p>
            <p className="text-xs text-gray-500 truncate">{assignee.email}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
