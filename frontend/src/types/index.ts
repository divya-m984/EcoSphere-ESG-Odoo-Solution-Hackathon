import type { ReactNode } from 'react';

export type UserRole = 'Admin' | 'ESG_Manager' | 'Employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  departmentId?: string;
}

export interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  children?: NavItem[];
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}
