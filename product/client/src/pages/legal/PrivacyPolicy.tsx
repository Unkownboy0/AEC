import React from 'react';
import { Shield, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInstitution } from '../../context/InstitutionContext';

const SECTIONS = [
  {
    title: '1. Introduction',
    content: `This Privacy Policy describes how CampusOS ("the Platform", "we", "us", or "our") collects, uses, stores, and protects information about users of the CampusOS college management system operated by your institution. This policy applies to all students, faculty, staff, parents, and administrators who access the Platform.`,
  },
  {
    title: '2. Information We Collect',
    content: `We collect information you provide directly and information generated through your use of the Platform:
    
• Identity data: name, employee ID, student roll number, date of birth, photograph
• Contact data: email address, phone number, address
• Academic data: attendance records, marks, grades, academic history, OD/leave requests
• Financial data: fee payment history and receipts (processed via secure payment gateway)
• Device data: IP address, browser type, device identifiers, session timestamps
• Usage data: pages accessed, features used, actions performed (for audit and security)`,
  },
  {
    title: '3. How We Use Your Information',
    content: `Your information is used exclusively for institutional management purposes:

• Providing access to academic records, attendance, and grades
• Processing fee payments and generating receipts
• Communicating institutional notices, circulars, and announcements
• Supporting administrative workflows (leave, OD, certificates)
• Maintaining audit logs for security and compliance
• Generating official institutional documents (ID cards, certificates, transcripts)`,
  },
  {
    title: '4. Data Sharing',
    content: `We do not sell, rent, or trade your personal information to any third party for marketing purposes. Data may be shared only with:

• Your institution's authorized staff (administrators, faculty, HOD) in the context of their role
• Regulatory bodies if legally required by government or accreditation authorities (e.g., NAAC, UGC)
• Payment processors for fee transactions, solely to complete the transaction
• Cloud infrastructure providers who store Platform data under confidentiality agreements`,
  },
  {
    title: '5. Data Retention',
    content: `Academic records are retained for the duration of your enrollment plus 7 years after graduation or departure, in accordance with institutional policy and applicable regulations. Audit logs are retained for 3 years. Payment records are retained as required by financial compliance regulations.`,
  },
  {
    title: '6. Security',
    content: `We implement industry-standard security measures including:

• End-to-end HTTPS encryption for all data in transit
• AES-256 encryption for sensitive data at rest
• Role-based access control (RBAC) ensuring each user sees only data relevant to their role
• Audit logging for all critical administrative actions
• Rate limiting and brute-force protection on authentication endpoints
• Regular security reviews and vulnerability assessments`,
  },
  {
    title: '7. Your Rights',
    content: `Subject to applicable law, you have the right to:

• Access your personal data held on the Platform
• Request correction of inaccurate data
• Request deletion of data where legally permissible
• Receive a copy of your data in a portable format
• Lodge a complaint with the relevant data protection authority

To exercise these rights, contact your institution's IT administrator or Data Protection Officer.`,
  },
  {
    title: '8. Cookies and Local Storage',
    content: `The Platform uses session cookies and browser local storage solely for authentication session management. No third-party tracking cookies or advertising pixels are used.`,
  },
  {
    title: '9. Children\'s Privacy',
    content: `CampusOS is an institutional platform accessed by enrolled students at the direction of their educational institution. We do not knowingly collect personal information from children under the age of 13 outside of institutional enrollment. Parents or guardians with concerns should contact their institution directly.`,
  },
  {
    title: '10. Changes to This Policy',
    content: `We may update this Privacy Policy periodically. Material changes will be communicated via the Platform's notice board. Continued use of the Platform after notification constitutes acceptance of the updated policy.`,
  },
  {
    title: '11. Contact',
    content: `For privacy-related inquiries, contact your institution's IT department or the CampusOS system administrator. For platform-level concerns, email: privacy@campusos.app`,
  },
];

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const { collegeName } = useInstitution();

  const effective = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Privacy Policy</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {collegeName} · CampusOS Platform
          </p>
          <p className="text-xs text-muted-foreground mt-1">Effective date: {effective}</p>
        </div>

        <div className="space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-sm font-bold text-foreground mb-2">{section.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CampusOS. This document is generated for {collegeName}.
          </p>
        </div>
      </div>
    </div>
  );
}
