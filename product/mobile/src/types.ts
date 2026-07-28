export type Permission = string;

export type MenuItem = {
  id?: string;
  label?: string;
  title?: string;
  name?: string;
  path?: string;
  route?: string;
  icon?: string;
  permission?: string;
  children?: MenuItem[];
};

export type Workspace = {
  id: string;
  name: string;
  role?: string;
  permissions?: Permission[];
  menus?: MenuItem[];
};

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: Permission[];
  menus: MenuItem[];
  profilePhoto?: string | null;
  forcePasswordChange?: boolean;
  workspaces?: Workspace[];
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type DashboardStats = {
  metrics?: {
    collegeName?: string;
    collegeAddress?: string;
    totalStudents?: number;
    totalFaculty?: number;
    totalDepartments?: number;
    totalCourses?: number;
    totalSubjects?: number;
    totalActiveUsers?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type Circular = {
  id: string;
  title: string;
  category?: string;
  priority?: string;
  description?: string;
  content?: string;
  status?: string;
  publishedAt?: string;
  isRead?: boolean;
  createdAt?: string;
};

export type Notification = {
  id: string;
  title: string;
  content: string;
  type?: string;
  status?: string;
  createdAt?: string;
};

export type WorkflowRequest = {
  id: string;
  type?: string;
  title?: string;
  reason?: string;
  status?: string;
  createdAt?: string;
  student?: { firstName?: string; lastName?: string };
};