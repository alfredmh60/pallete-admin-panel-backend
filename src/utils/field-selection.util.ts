export const allowedFieldsMap: Record<string, string[]> = {
  admins: ['id', 'email', 'name', 'avatar', 'roleName', 'isActive', 'createdAt', 'updatedAt'],
  roles: ['id', 'name', 'description', 'createdAt'],
  permissions: ['id', 'name', 'description', 'createdAt'],
  logs: ['id', 'adminId', 'action', 'entityType', 'entityId', 'details', 'ip', 'userAgent', 'createdAt'],
  discounts: ['id', 'name', 'description', 'type', 'value', 'minOrderAmount', 'maxDiscountAmount', 'startDate', 'endDate', 'isActive', 'createdAt'],
  tickets: ['id', 'title', 'description', 'status', 'priority', 'sellerId', 'sellerName', 'createdAt', 'closedAt'],
  messages: ['id', 'senderType', 'senderId', 'message', 'createdAt'],
  finance: ['id', 'type', 'amount', 'description', 'date', 'createdAt'],
  staffChat: ['id', 'type', 'title', 'createdBy', 'createdAt', 'updatedAt'],
  staffMessages: ['id', 'conversationId', 'senderId', 'message', 'createdAt'],
};

export function getAllowedFields(resource: string): string[] {
  return allowedFieldsMap[resource] || [];
}

export function parseFields(fieldsParam: string | undefined, allowedFields: string[]): string[] {
  if (!fieldsParam) return [];

  const fieldList = fieldsParam.split(',').map(f => f.trim());
  return fieldList.filter(f => allowedFields.includes(f));
}
