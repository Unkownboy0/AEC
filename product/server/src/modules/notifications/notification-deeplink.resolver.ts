import type { DomainEvent } from './domain-events.types';

export class NotificationDeepLinkResolver {
  /**
   * Resolves the exact canonical frontend route for a specific recipient user.
   */
  public static resolve(event: DomainEvent, userRoleName?: string): string {
    if (event.deepLinkRoute) return event.deepLinkRoute;

    const role = (userRoleName || '').toUpperCase();
    const type = event.eventType;
    const id = event.entityId;

    // 1. Leave & On-Duty Workflows
    if (type.includes('LEAVE') || type.includes('OD')) {
      if (role.includes('HOD')) {
        return id ? `/hod/leave-approvals/${id}` : '/hod/leave-approvals';
      }
      if (role.includes('PRINCIPAL') || role.includes('VP') || role.includes('VICE')) {
        return '/principal/approval-center';
      }
      if (role.includes('MENTOR')) {
        return id ? `/faculty/mentor/leave-od/${id}` : '/faculty/mentor/leave-od';
      }
      if (role.includes('FACULTY')) {
        return id ? `/faculty/leave-od/${id}` : '/faculty/leave-od';
      }
      return id ? `/student/leave-od/${id}` : '/student/leave-od';
    }

    // 2. Tasks & Action Items
    if (type.includes('TASK')) {
      if (role.includes('HOD')) return '/hod/tasks';
      if (role.includes('PRINCIPAL')) return '/principal/tasks';
      if (role.includes('DEAN')) return '/academic-dean/tasks';
      if (role.includes('FACULTY')) return '/faculty/tasks';
      return '/tasks';
    }

    // 3. Assignments & Submissions
    if (type.includes('ASSIGNMENT')) {
      if (role.includes('FACULTY')) return '/faculty/assignments';
      return '/student/assignments';
    }

    // 4. Timetable & Substitution
    if (type.includes('TIMETABLE') || type.includes('SUBSTITUT')) {
      if (role.includes('HOD')) return '/hod/timetable';
      if (role.includes('FACULTY')) return '/faculty/timetable';
      return '/student/timetable';
    }

    // 5. Attendance & Risks
    if (type.includes('ATTENDANCE') || type.includes('MENTEE') || type.includes('RISK')) {
      if (role.includes('MENTOR')) return '/faculty/mentorship';
      if (role.includes('HOD')) return '/hod/attendance';
      if (role.includes('FACULTY')) return '/faculty/attendance';
      return '/student/attendance';
    }

    // 6. Examinations & Results (COE)
    if (type.includes('EXAM') || type.includes('VALUATION') || type.includes('QP') || type.includes('MODERATION')) {
      if (role.includes('COE') || role.includes('EXAM')) return '/exams/schedule';
      return '/student/examinations';
    }

    if (type.includes('RESULT') || type.includes('MARKS')) {
      if (role.includes('FACULTY')) return '/faculty/internal-marks';
      if (role.includes('COE') || role.includes('EXAM')) return '/exams/results';
      return '/student/results';
    }

    // 7. Fees & Finance
    if (type.includes('FEE') || type.includes('PAYMENT') || type.includes('RECEIPT') || type.includes('REFUND') || type.includes('VOUCHER')) {
      if (role.includes('ACCOUNT') || role.includes('AO') || role.includes('FINANCE')) {
        return '/finance/fee-collection';
      }
      return '/student/fees';
    }

    // 8. Circulars & Announcements
    if (type.includes('CIRCULAR') || type.includes('ANNOUNCEMENT') || type.includes('NOTICE')) {
      if (role.includes('HOD')) return id ? `/hod/circulars/${id}` : '/hod/circulars';
      if (role.includes('FACULTY')) return id ? `/faculty/circulars/${id}` : '/faculty/circulars';
      if (role.includes('PRINCIPAL')) return id ? `/principal/circulars/${id}` : '/principal/circulars';
      return id ? `/student/circulars/${id}` : '/student/circulars';
    }

    // 9. Complaints & Grievances
    if (type.includes('COMPLAINT') || type.includes('GRIEVANCE')) {
      if (role.includes('HOD')) return '/hod/complaints';
      if (role.includes('ADMISSION') || role.includes('A&A')) return '/admission-dean/dashboard';
      if (role.includes('PRINCIPAL') || role.includes('VP')) return '/principal/complaints';
      return '/student/complaints';
    }

    // 10. Hostel
    if (type.includes('HOSTEL') || type.includes('OUTING') || type.includes('MESS') || type.includes('ROOM')) {
      if (role.includes('WARDEN') || role.includes('HOSTEL')) return '/hostel/dashboard';
      return '/student/hostel';
    }

    // 11. Transport
    if (type.includes('TRANSPORT') || type.includes('BUS') || type.includes('ROUTE')) {
      if (role.includes('TRANSPORT')) return '/transport/dashboard';
      return '/student/transport';
    }

    // 12. Library
    if (type.includes('LIBRARY') || type.includes('BOOK')) {
      if (role.includes('LIBRARIAN')) return '/library/books';
      return '/student/library';
    }

    // 13. Placements
    if (type.includes('PLACEMENT') || type.includes('JOB') || type.includes('INTERVIEW')) {
      if (role.includes('PLACEMENT')) return '/placements/dashboard';
      return '/student/placements';
    }

    // 14. IQAC & Quality
    if (type.includes('IQAC') || type.includes('EVIDENCE') || type.includes('ACCREDIT') || type.includes('APPRAISAL')) {
      return '/iqac/dashboard';
    }

    // 15. IT & College Admin Tickets
    if (type.includes('MAINTENANCE') || type.includes('TICKET') || type.includes('NETWORK') || type.includes('DEVICE')) {
      if (role.includes('ADMIN')) return '/admin/maintenance';
      return '/support';
    }

    // Default Fallbacks
    if (role.includes('HOD')) return '/hod/notifications';
    if (role.includes('FACULTY')) return '/faculty/notifications';
    if (role.includes('PRINCIPAL')) return '/principal/notifications';
    if (role.includes('VP')) return '/vp/notifications';
    if (role.includes('STUDENT')) return '/student/notifications';
    return '/notifications';
  }
}
