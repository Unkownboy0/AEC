export type Permission = 'VIEWER' | 'COMMENTER' | 'EDITOR' | 'OWNER';
const RANK: Record<Permission, number> = { VIEWER: 1, COMMENTER: 2, EDITOR: 3, OWNER: 4 };

export const atLeast = (have: Permission | null, need: Permission): boolean =>
  !!have && RANK[have] >= RANK[need];

export type ShareLike = {
  scope: string; // USER | ROLE | DEPARTMENT | INSTITUTION
  userId: string | null;
  roleName: string | null;
  departmentId: string | null;
  permission: string;
};

export type FileLike = {
  ownerId: string;
  departmentId: string | null;
  scope: string; // PERSONAL | DEPARTMENT | INSTITUTION
};

export type ActorCtx = { userId: string; roleName: string | null; departmentId: string | null };

const asPermission = (value: string): Permission =>
  value === 'EDITOR' || value === 'COMMENTER' || value === 'OWNER' ? (value as Permission) : 'VIEWER';

// Backend-enforced resolution — never derive access from what the UI shows.
// Highest applicable permission wins across: ownership, scope baseline
// (department/institution-wide files default to viewable), and explicit
// user/role/department/institution shares.
export const resolveAccess = (file: FileLike, shares: ShareLike[], ctx: ActorCtx): Permission | null => {
  if (file.ownerId === ctx.userId) return 'OWNER';

  let best: Permission | null = null;
  const upgrade = (p: Permission) => {
    if (!best || RANK[p] > RANK[best]) best = p;
  };

  if (file.scope === 'DEPARTMENT' && file.departmentId && file.departmentId === ctx.departmentId) upgrade('VIEWER');
  if (file.scope === 'INSTITUTION') upgrade('VIEWER');

  for (const share of shares) {
    const matches =
      (share.scope === 'USER' && share.userId === ctx.userId) ||
      (share.scope === 'ROLE' && share.roleName && share.roleName === ctx.roleName) ||
      (share.scope === 'DEPARTMENT' && share.departmentId && share.departmentId === ctx.departmentId) ||
      share.scope === 'INSTITUTION';
    if (matches) upgrade(asPermission(share.permission));
  }

  return best;
};
