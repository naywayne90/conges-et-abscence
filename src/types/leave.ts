export type LeaveStatus = 
  | 'en_attente'
  | 'validee_par_direction'
  | 'rejetee_par_direction'
  | 'validee_rh'
  | 'rejetee_rh';

export type LeaveType = 
  | 'Annuel'
  | 'Maladie'
  | 'Décès'
  | 'Maternité'
  | 'Spécial';

export interface LeaveRequest {
  id: string;
  employee: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: LeaveStatus;
  attachments: {
    id: string;
    url: string;
    type: string;
  }[];
  comments: {
    id: string;
    text: string;
    author: string;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}
