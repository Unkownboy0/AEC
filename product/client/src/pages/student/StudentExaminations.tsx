import React, { useState } from 'react';
import { Calendar, Search, FileText, Printer, CheckCircle, HelpCircle, Map, Download } from 'lucide-react';
import { toast } from '../../components/ui/Toast';

interface ExamSchedule {
  code: string;
  name: string;
  type: 'INTERNAL' | 'SEMESTER';
  date: string;
  time: string;
  hall: string;
  seatNo: string;
  status: 'SCHEDULED' | 'COMPLETED';
}

const EXAM_SCHEDULE: ExamSchedule[] = [
  { code: 'CS6101', name: 'Design and Analysis of Algorithms', type: 'SEMESTER', date: '2026-08-10', time: '09:30 AM - 12:30 PM', hall: 'Exam Hall 3 (Block A)', seatNo: 'A-42', status: 'SCHEDULED' },
  { code: 'CS6102', name: 'Database Management Systems', type: 'SEMESTER', date: '2026-08-12', time: '09:30 AM - 12:30 PM', hall: 'Exam Hall 3 (Block A)', seatNo: 'A-42', status: 'SCHEDULED' },
  { code: 'CS6103', name: 'Operating Systems', type: 'SEMESTER', date: '2026-08-14', time: '09:30 AM - 12:30 PM', hall: 'Exam Hall 1 (Block B)', seatNo: 'B-12', status: 'SCHEDULED' }
];

export const StudentExaminations: React.FC = () => {
  const [showHallTicket, setShowHallTicket] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" /> Examinations & Hall Ticket Control
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Review examination schedules, verify seat allocations, and download hall tickets</p>
        </div>
        <button
          onClick={() => setShowHallTicket(true)}
          className="px-3.5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow hover:bg-indigo-700 transition-all flex items-center gap-1.5"
        >
          <FileText className="h-4 w-4" /> Generate Hall Ticket
        </button>
      </div>

      {/* Grid split: Exam timetable & guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Timetable Panel */}
        <div className="lg:col-span-8 space-y-4">
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Semester Timetable</h3>
            
            <div className="border bg-card rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full border-collapse text-xs font-semibold">
                <thead>
                  <tr className="border-b bg-muted/20 text-[9px] uppercase font-black text-slate-400 tracking-wider">
                    <th className="p-4 text-left">Subject</th>
                    <th className="p-4 text-center">Date & Time</th>
                    <th className="p-4 text-center">Hall Venue</th>
                    <th className="p-4 text-center">Seat Number</th>
                    <th className="p-4 text-center">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {EXAM_SCHEDULE.map((ex) => (
                    <tr key={ex.code} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 text-left">
                        <span className="font-extrabold text-slate-800 dark:text-white block">{ex.name}</span>
                        <span className="text-[9px] font-mono text-slate-400 block mt-0.5">{ex.code}</span>
                      </td>
                      <td className="p-4 text-center space-y-0.5">
                        <span className="font-extrabold text-slate-800 block">{ex.date}</span>
                        <span className="text-[9px] text-slate-400 block">{ex.time}</span>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-600">{ex.hall}</td>
                      <td className="p-4 text-center font-mono font-bold text-indigo-600">{ex.seatNo}</td>
                      <td className="p-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-indigo-50 text-indigo-700">
                          {ex.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* Guidelines Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4 text-xs font-semibold text-slate-700">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Exams Protocol Guidelines</h3>
            
            <ul className="space-y-3 text-slate-500 font-medium leading-relaxed">
              <li className="flex gap-2">
                <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full shrink-0 mt-1.5"></span>
                <span>Reporting Time: Arrive at least 30 minutes before the scheduled time slot.</span>
              </li>
              <li className="flex gap-2">
                <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full shrink-0 mt-1.5"></span>
                <span>Mandatory items: Carry printed Hall Ticket and physical Student ID card.</span>
              </li>
              <li className="flex gap-2">
                <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full shrink-0 mt-1.5"></span>
                <span>Permitted equipment: Standard scientific calculators are allowed unless specified.</span>
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* Hall Ticket Drawer Overlay */}
      {showHallTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-2xl p-6 rounded-2xl shadow-xl space-y-4 text-left relative max-h-[90vh] overflow-y-auto">
            
            {/* Header Actions */}
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white">Semester Hall Ticket</h3>
                <p className="text-[10px] text-slate-400 font-bold">Verify credentials and print for examinations</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 border rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" /> Print Document
                </button>
                <button
                  onClick={() => setShowHallTicket(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Hall Ticket Card Visual */}
            <div className="p-6 border rounded-2xl space-y-6 bg-slate-50/50 dark:bg-muted/10 font-semibold text-xs text-slate-700 dark:text-slate-300">
              
              {/* College Branding */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">GEETORUS CAMPUSOS</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Office of Controller of Examinations</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-indigo-600 font-black">REGULAR HALL TICKET</p>
                  <p className="text-[8px] text-slate-400 font-bold mt-0.5">TERM: JUL-DEC 2026</p>
                </div>
              </div>

              {/* Student Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider leading-none">Student Name</p>
                  <p className="font-extrabold text-slate-800 dark:text-white mt-1">Udhaya Kumar</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider leading-none">Register Number</p>
                  <p className="font-extrabold text-slate-800 dark:text-white mt-1 font-mono">REG2026001</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider leading-none">Programme / Major</p>
                  <p className="font-extrabold text-slate-800 dark:text-white mt-1">B.Tech - Computer Science</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider leading-none">Semester Major</p>
                  <p className="font-extrabold text-slate-800 dark:text-white mt-1">Semester 6</p>
                </div>
              </div>

              {/* Subjects Table */}
              <table className="w-full border-collapse border rounded-xl overflow-hidden bg-background">
                <thead>
                  <tr className="bg-slate-100 text-[9.5px] uppercase font-black text-slate-400 border-b">
                    <th className="p-2 text-left">Code</th>
                    <th className="p-2 text-left">Subject Title</th>
                    <th className="p-2 text-center">Hall Venue</th>
                    <th className="p-2 text-center">Seat</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {EXAM_SCHEDULE.map(ex => (
                    <tr key={ex.code} className="hover:bg-slate-50/50">
                      <td className="p-2 font-mono font-bold">{ex.code}</td>
                      <td className="p-2">{ex.name}</td>
                      <td className="p-2 text-center font-bold text-slate-500">{ex.hall}</td>
                      <td className="p-2 text-center font-mono font-bold text-indigo-600">{ex.seatNo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default StudentExaminations;
