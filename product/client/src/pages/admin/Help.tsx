import React from 'react';
import {
  HelpCircle, BookOpen
} from 'lucide-react';

export const Help: React.FC = () => {
  const faqs = [
    { q: 'How do I promote students to the next semester?', a: 'Navigate to the Student Admissions module, search for your target student cohort, click Edit profile, check the Promoted status box, and map them to the next Semester class sequence.' },
    { q: 'Where do I configure class seat caps and advisories?', a: 'Go to Academic Config page inside the Academics portal, select the Sections tab, and edit the target section capacity or Advisor mappings.' },
    { q: 'How do I publish grades and transcripts?', a: 'Navigate to Examinations and Marks entry page, select your active midterm timetable, click Input Marks, enter scores for student rows, and select Publish Grades.' }
  ];

  return (
    <div className="space-y-6 text-xs leading-normal">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Help Center & User Documentation</h1>
        <p className="text-xs text-muted-foreground mt-1 font-semibold">
          Review step-by-step guides, search system operational instructions, and troubleshoot common configuration issues.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Guides */}
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 md:col-span-2">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground flex flex-wrap items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> User Manual Guide Overview
          </h3>
          <div className="space-y-4 font-normal text-muted-foreground">
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-foreground">1. Academic Foundations Setup</h4>
              <p>Initialize the workspace by setting the active Academic Year first, mapping faculties to Departments, configuring program streams, creating course syllabi, and generating semester structures.</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-foreground">2. Student Registry Admissions</h4>
              <p>Enroll student profiles with unique admission codes, assign them to residential hostel rooms or transport vehicles, map their parent contacts, and catalog uploaded documents.</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-foreground">3. Financial Ledger Invoices</h4>
              <p>Create custom term billing structures inside Fees, invoice cohorts, add fine balances to overdue fees, and print payment receipts.</p>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 md:col-span-1">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground flex flex-wrap items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" /> Frequently Asked Questions (FAQ)
          </h3>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="space-y-1">
                <h4 className="font-bold text-primary">{f.q}</h4>
                <p className="font-normal text-muted-foreground leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Help;
