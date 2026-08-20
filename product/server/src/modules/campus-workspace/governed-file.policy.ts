export type GovernedFileAction = 'VIEW' | 'DOWNLOAD' | 'COMMENT' | 'EDIT' | 'MANAGE';
export type GovernedPrincipalType =
  | 'SPECIFIC_USER'
  | 'ROLE'
  | 'WORKSPACE'
  | 'DEPARTMENT'
  | 'SECTION'
  | 'ALL_INSTITUTION';

export interface GovernedFileActor {
  userId: string;
  role: string;
  workspace?: string | null;
  departmentId?: string | null;
  sectionId?: string | null;
}

export interface GovernedGrantLike {
  principalType: string;
  principalId?: string | null;
  accessLevel: string;
  expiresAt?: Date | string | null;
  revokedAt?: Date | string | null;
}

const ACTIONS_BY_LEVEL: Record<string, ReadonlySet<GovernedFileAction>> = {
  VIEW: new Set(['VIEW']),
  DOWNLOAD: new Set(['VIEW', 'DOWNLOAD']),
  COMMENT: new Set(['VIEW', 'COMMENT']),
  EDIT: new Set(['VIEW', 'DOWNLOAD', 'COMMENT', 'EDIT']),
  MANAGE: new Set(['VIEW', 'DOWNLOAD', 'COMMENT', 'EDIT', 'MANAGE']),
};

export function normalizeFileRole(value?: string | null): string {
  return String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
}

export function grantIsActive(grant: GovernedGrantLike, now = new Date()): boolean {
  if (grant.revokedAt) return false;
  return !grant.expiresAt || new Date(grant.expiresAt).getTime() > now.getTime();
}

export function grantMatchesActor(grant: GovernedGrantLike, actor: GovernedFileActor): boolean {
  const type = normalizeFileRole(grant.principalType) as GovernedPrincipalType;
  const principalId = String(grant.principalId || '');
  switch (type) {
    case 'SPECIFIC_USER':
      return principalId === actor.userId;
    case 'ROLE':
      return normalizeFileRole(principalId) === normalizeFileRole(actor.role);
    case 'WORKSPACE':
      return normalizeFileRole(principalId) === normalizeFileRole(actor.workspace || actor.role);
    case 'DEPARTMENT':
      return Boolean(actor.departmentId && principalId === actor.departmentId);
    case 'SECTION':
      return Boolean(actor.sectionId && principalId === actor.sectionId);
    case 'ALL_INSTITUTION':
      return true;
    default:
      return false;
  }
}

export function grantAllowsAction(grant: GovernedGrantLike, action: GovernedFileAction): boolean {
  return ACTIONS_BY_LEVEL[normalizeFileRole(grant.accessLevel)]?.has(action) ?? false;
}

export function actorHasGrantedAccess(
  grants: GovernedGrantLike[],
  actor: GovernedFileActor,
  action: GovernedFileAction,
  now = new Date()
): boolean {
  return grants.some((grant) =>
    grantIsActive(grant, now) && grantMatchesActor(grant, actor) && grantAllowsAction(grant, action)
  );
}
