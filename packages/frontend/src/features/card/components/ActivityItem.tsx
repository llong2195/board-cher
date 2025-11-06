/**
 * ActivityItem Component (T260)
 * User Story 7: Activity History and Audit Trail
 *
 * Displays a single activity item with icon, description, and timestamp
 */

import { formatDistanceToNow } from 'date-fns';
import {
  Plus,
  Edit3,
  Trash2,
  Archive,
  ArrowRight,
  MessageSquare,
  Paperclip,
  Tag,
  UserPlus,
  UserMinus,
  CheckSquare,
  Calendar,
  LayoutList,
  CreditCard,
  Layers,
} from 'lucide-react';
import type { Activity, ActivityActionType } from '@/services/api/activity.api';

interface ActivityItemProps {
  activity: Activity;
  showBoardInfo?: boolean; // Show board name if viewing from board activity page
}

const ACTION_ICONS: Record<ActivityActionType, React.ComponentType<{ className?: string }>> = {
  // Board actions
  BOARD_CREATED: Plus,
  BOARD_UPDATED: Edit3,
  BOARD_DELETED: Trash2,
  BOARD_ARCHIVED: Archive,

  // List actions
  LIST_CREATED: LayoutList,
  LIST_UPDATED: Edit3,
  LIST_MOVED: ArrowRight,
  LIST_DELETED: Trash2,
  LIST_ARCHIVED: Archive,

  // Card actions
  CARD_CREATED: CreditCard,
  CARD_UPDATED: Edit3,
  CARD_MOVED: ArrowRight,
  CARD_DELETED: Trash2,
  CARD_ARCHIVED: Archive,

  // Comment actions
  COMMENT_ADDED: MessageSquare,
  COMMENT_EDITED: Edit3,
  COMMENT_DELETED: Trash2,

  // Attachment actions
  ATTACHMENT_ADDED: Paperclip,
  ATTACHMENT_DELETED: Trash2,

  // Label actions
  LABEL_ADDED: Tag,
  LABEL_REMOVED: Tag,
  LABEL_CREATED: Plus,
  LABEL_DELETED: Trash2,

  // Member actions
  MEMBER_ASSIGNED: UserPlus,
  MEMBER_UNASSIGNED: UserMinus,

  // Checklist actions
  CHECKLIST_CREATED: CheckSquare,
  CHECKLIST_ITEM_CHECKED: CheckSquare,
  CHECKLIST_ITEM_UNCHECKED: CheckSquare,

  // Due date actions
  DUE_DATE_SET: Calendar,
  DUE_DATE_REMOVED: Calendar,
};

const ACTION_COLORS: Record<ActivityActionType, string> = {
  // Board actions
  BOARD_CREATED: 'text-green-600',
  BOARD_UPDATED: 'text-blue-600',
  BOARD_DELETED: 'text-red-600',
  BOARD_ARCHIVED: 'text-gray-600',

  // List actions
  LIST_CREATED: 'text-green-600',
  LIST_UPDATED: 'text-blue-600',
  LIST_MOVED: 'text-purple-600',
  LIST_DELETED: 'text-red-600',
  LIST_ARCHIVED: 'text-gray-600',

  // Card actions
  CARD_CREATED: 'text-green-600',
  CARD_UPDATED: 'text-blue-600',
  CARD_MOVED: 'text-purple-600',
  CARD_DELETED: 'text-red-600',
  CARD_ARCHIVED: 'text-gray-600',

  // Comment actions
  COMMENT_ADDED: 'text-blue-600',
  COMMENT_EDITED: 'text-blue-600',
  COMMENT_DELETED: 'text-red-600',

  // Attachment actions
  ATTACHMENT_ADDED: 'text-green-600',
  ATTACHMENT_DELETED: 'text-red-600',

  // Label actions
  LABEL_ADDED: 'text-green-600',
  LABEL_REMOVED: 'text-orange-600',
  LABEL_CREATED: 'text-green-600',
  LABEL_DELETED: 'text-red-600',

  // Member actions
  MEMBER_ASSIGNED: 'text-green-600',
  MEMBER_UNASSIGNED: 'text-orange-600',

  // Checklist actions
  CHECKLIST_CREATED: 'text-green-600',
  CHECKLIST_ITEM_CHECKED: 'text-green-600',
  CHECKLIST_ITEM_UNCHECKED: 'text-orange-600',

  // Due date actions
  DUE_DATE_SET: 'text-blue-600',
  DUE_DATE_REMOVED: 'text-orange-600',
};

export function ActivityItem({ activity, showBoardInfo = false }: ActivityItemProps) {
  const Icon = ACTION_ICONS[activity.actionType] || Layers;
  const iconColor = ACTION_COLORS[activity.actionType] || 'text-gray-600';

  // Format timestamp
  const timeAgo = formatDistanceToNow(activity.createdAt, { addSuffix: true });

  // Extract metadata for additional context with type safety
  const metadata = activity.metadata as Record<string, string> | null;
  const hasMetadata = metadata && Object.keys(metadata).length > 0;

  return (
    <div className="p-3 border-b hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Description */}
          <p className="text-sm text-gray-900">
            <span className="font-medium">{activity.userName || 'Someone'}</span>{' '}
            <span className="text-gray-700">{activity.description}</span>
          </p>

          {/* Metadata details (if any) */}
          {hasMetadata && metadata && (
            <div className="mt-1 text-xs text-gray-500 space-y-0.5">
              {metadata.fromList && metadata.toList && (
                <div>
                  from <span className="font-medium">{String(metadata.fromList)}</span> to{' '}
                  <span className="font-medium">{String(metadata.toList)}</span>
                </div>
              )}
              {metadata.title && <div className="italic truncate">"{String(metadata.title)}"</div>}
              {metadata.labelName && (
                <div>
                  <span
                    className="inline-block px-2 py-0.5 rounded text-white text-xs"
                    style={{ backgroundColor: String(metadata.labelColor || '#666') }}
                  >
                    {String(metadata.labelName)}
                  </span>
                </div>
              )}
              {metadata.assigneeName && (
                <div>
                  Assigned to <span className="font-medium">{String(metadata.assigneeName)}</span>
                </div>
              )}
              {metadata.dueDate && (
                <div>
                  Due:{' '}
                  <span className="font-medium">
                    {new Date(String(metadata.dueDate)).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Timestamp */}
          <p className="mt-1 text-xs text-gray-400">
            {timeAgo}
            {showBoardInfo && metadata?.boardName && (
              <span className="ml-2">• {String(metadata.boardName)}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
