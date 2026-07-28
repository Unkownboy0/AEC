import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";

export const ROLE_PREFIX_MAP: Record<string, string> = {
  Student: "STU",
  STUDENT: "STU",
  Faculty: "FAC",
  FACULTY: "FAC",
  Teacher: "FAC",
  TEACHER: "FAC",
  Mentor: "MEN",
  MENTOR: "MEN",
  HOD: "HOD",
  "Head of Department": "HOD",
  "Academic Dean": "ADE",
  ACADEMIC_DEAN: "ADE",
  "Administration & Admission Dean": "AAD",
  ADMINISTRATION_AND_ADMISSION_DEAN: "AAD",
  "IQAC Dean": "IQD",
  IQAC_DEAN: "IQD",
  "Vice Principal": "VP",
  VICE_PRINCIPAL: "VP",
  Principal: "PRI",
  PRINCIPAL: "PRI",
  "Accounts Officer": "ACC",
  ACCOUNTS_OFFICER: "ACC",
  "Exam Cell": "EXM",
  "Exam Cell Staff": "EXM",
  EXAM_CELL: "EXM",
  "Placement Officer": "PLC",
  PLACEMENT_OFFICER: "PLC",
  Library: "LIB",
  Librarian: "LIB",
  LIBRARY: "LIB",
  Hostel: "HOS",
  "Hostel Warden": "HOS",
  HOSTEL: "HOS",
  Transport: "TRN",
  "Transport Manager": "TRN",
  TRANSPORT: "TRN",
  "Office Staff": "OFF",
  OFFICE_STAFF: "OFF",
  "College Admin": "CAD",
  COLLEGE_ADMIN: "CAD",
  "Super Admin": "ADM",
  SUPER_ADMIN: "ADM",
  Admin: "ADM",
  ADMIN: "ADM",
};

export class CredentialService {
  /**
   * Determine role prefix string from role name or code
   */
  public getRolePrefix(roleNameOrCode: string): string {
    if (!roleNameOrCode) return "USR";
    const mapped = ROLE_PREFIX_MAP[roleNameOrCode.trim()];
    if (mapped) return mapped;

    // Fallback logic: clean up and take first 3 alphanumeric uppercase characters
    const clean = roleNameOrCode.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return clean.slice(0, 3) || "USR";
  }

  /**
   * Generates a unique sequential username: PREFIX + YEAR + 4-digit/8-digit counter
   * E.g. STU20260001
   */
  public async generateUsername(roleNameOrCode: string, targetYear?: number): Promise<string> {
    const year = targetYear || new Date().getFullYear();
    const prefix = this.getRolePrefix(roleNameOrCode);

    let nextCounter = 1;
    try {
      // Find counter record or create
      const record = await (prisma as any).usernameCounter.upsert({
        where: {
          rolePrefix_year: {
            rolePrefix: prefix,
            year: year,
          },
        },
        update: {
          counter: {
            increment: 1,
          },
        },
        create: {
          rolePrefix: prefix,
          year: year,
          counter: 1,
        },
      });
      nextCounter = record.counter;
    } catch (err) {
      // Fallback: query highest existing user with that prefix
      const count = await (prisma as any).user.count({
        where: {
          username: {
            startsWith: `${prefix}${year}`,
          },
        },
      });
      nextCounter = count + 1;
    }

    let formattedCounter = nextCounter.toString().padStart(4, "0");
    let candidateUsername = `${prefix}${year}${formattedCounter}`;

    // Double-check uniqueness in case of manual overrides
    let exists = await (prisma as any).user.findUnique({
      where: { username: candidateUsername },
    });

    while (exists) {
      nextCounter++;
      formattedCounter = nextCounter.toString().padStart(4, "0");
      candidateUsername = `${prefix}${year}${formattedCounter}`;
      exists = await (prisma as any).user.findUnique({
        where: { username: candidateUsername },
      });
    }

    return candidateUsername;
  }

  /**
   * Generate a strong temporary password meeting security policy:
   * • Minimum 10 characters
   * • Uppercase
   * • Lowercase
   * • Numbers
   * • Special Characters
   */
  public generateTemporaryPassword(): string {
    const uppercaseChars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercaseChars = "abcdefghijkmnopqrstuvwxyz";
    const numberChars = "23456789";
    const specialChars = "@#$%&*!";

    const getRandomChar = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

    // Guarantee at least 2 of each category to be extra strong
    const mandatory = [
      getRandomChar(uppercaseChars),
      getRandomChar(uppercaseChars),
      getRandomChar(lowercaseChars),
      getRandomChar(lowercaseChars),
      getRandomChar(numberChars),
      getRandomChar(numberChars),
      getRandomChar(specialChars),
      getRandomChar(specialChars),
    ];

    const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
    while (mandatory.length < 10) {
      mandatory.push(getRandomChar(allChars));
    }

    // Shuffle mandatory array
    for (let i = mandatory.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mandatory[i], mandatory[j]] = [mandatory[j], mandatory[i]];
    }

    return mandatory.join("");
  }

  /**
   * Validate password compliance
   */
  public validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
    if (!password || password.length < 10) {
      return { valid: false, reason: "Password must be at least 10 characters long" };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, reason: "Password must contain at least one uppercase letter" };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, reason: "Password must contain at least one lowercase letter" };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, reason: "Password must contain at least one number" };
    }
    if (!/[@#$%^&*!_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { valid: false, reason: "Password must contain at least one special character" };
    }
    return { valid: true };
  }

  /**
   * Hash password with bcrypt
   */
  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}

export const credentialService = new CredentialService();
