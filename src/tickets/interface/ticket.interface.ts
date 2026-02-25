export interface ITicket {
  id: number;
  title: string;
  description: string;
  departmentId: number;
  departmentName?: string;
  status: string;
  priority: string;
  customerId: string;
  customerName: string | null;
  customerEmail: string | null;
  assignedTo?: number | null;
  assignedToName?: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  closedBy: number | null;
}

export interface ITicketResponse extends ITicket {}

export interface ITicketWithMessages extends ITicket {
  messages: ITicketMessage[];
}

export interface ITicketMessage {
  id: number;
  senderType:string;// 'admin' | 'customer';
  senderId: string;
  message: string;
  createdAt: Date;
}

export interface ITicketStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  daily: {
    date: string;
    count: number;
  }[];
  avgResponseTime: string;
}

export interface ITicketAssignment {
  id: number;
  ticketId: number;
  adminId: number;
  adminName?: string;
  assignedAt: Date;
  unassignedAt: Date | null;
}