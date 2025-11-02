// WebSocket event
export const WS_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  AUTH_ERROR: 'auth:error', // Changed from 'connect_error' which is reserved

  // Board room management
  BOARD_JOIN: 'board:join',
  BOARD_LEAVE: 'board:leave',
  BOARD_USER_JOINED: 'board:user:joined',
  BOARD_USER_LEFT: 'board:user:left',
  BOARD_CREATED: 'board:created',
  BOARD_UPDATED: 'board:updated',

  // List events
  LIST_CREATE: 'list:create',
  LIST_CREATED: 'list:created',
  LIST_MOVE: 'list:move',
  LIST_MOVED: 'list:moved',
  LIST_UPDATE: 'list:update',
  LIST_UPDATED: 'list:updated',
  LIST_DELETE: 'list:delete',
  LIST_DELETED: 'list:deleted',

  // Card events
  CARD_CREATE: 'card:create',
  CARD_CREATED: 'card:created',
  CARD_MOVE: 'card:move',
  CARD_MOVED: 'card:moved',
  CARD_UPDATE: 'card:update',
  CARD_UPDATED: 'card:updated',
  CARD_DELETE: 'card:delete',
  CARD_DELETED: 'card:deleted',

  // Comment events
  COMMENT_ADDED: 'card:comment:added',
  COMMENT_UPDATED: 'card:comment:updated',
  COMMENT_DELETED: 'card:comment:deleted',

  // Attachment events
  ATTACHMENT_ADDED: 'card:attachment:added',
  ATTACHMENT_DELETED: 'card:attachment:deleted',

  // Label events
  LABEL_APPLIED: 'card:label:applied',
  LABEL_REMOVED: 'card:label:removed',
  LABEL_CREATED: 'board:label:created',

  // Assignment events
  CARD_ASSIGNED: 'card:assigned',
  CARD_UNASSIGNED: 'card:unassigned',

  // Checklist events
  CHECKLIST_CREATED: 'card:checklist:created',
  CHECKLIST_UPDATED: 'card:checklist:updated',
  CHECKLIST_ITEM_TOGGLED: 'card:checklist:item:toggled',

  // Ping/pong for testing
  PING: 'ping',
  PONG: 'pong',
} as const;
