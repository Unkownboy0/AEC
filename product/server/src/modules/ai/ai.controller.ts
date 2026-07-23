import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';

// ─── Rich keyword response map ─────────────────────────────────────────────
const RESPONSE_MAP: { keywords: string[]; reply: (ctx: StudentContext) => string }[] = [
  {
    keywords: ['attendance', 'absent', 'present', 'shortage'],
    reply: (ctx) =>
      `📊 **Attendance Summary** for ${ctx.name}:\n- Attendance Rate: **${ctx.attendancePct}%**\n- Classes Present: ${ctx.present}/${ctx.total}\n\n${
        parseFloat(ctx.attendancePct) < 75
          ? '⚠️ **Critical:** Your attendance is below 75%. You may be barred from exams. Please apply for OD/Leave immediately and meet your class advisor.'
          : parseFloat(ctx.attendancePct) < 85
          ? '⚠️ **Warning:** Attendance is approaching the 75% threshold. Try not to miss any more classes this month.'
          : '✅ Your attendance is healthy! Keep attending regularly.'
      }`,
  },
  {
    keywords: ['exam', 'grade', 'mark', 'gpa', 'score', 'result', 'internal', 'external'],
    reply: (ctx) =>
      `📝 **Academic Performance** for ${ctx.name} (${ctx.semester}):\n- Subjects Recorded: **${ctx.subjectCount}**\n- Average GPA: **${ctx.avgGpa}**\n\n${
        parseFloat(ctx.avgGpa) < 5
          ? '⚠️ Your GPA is critically low. Consider enrolling in remedial classes or speaking with your faculty mentor.'
          : parseFloat(ctx.avgGpa) < 7
          ? '📌 GPA is below average. Focus on upcoming internal assessments to improve your scores.'
          : '🎉 Great performance! Keep maintaining your academic excellence.'
      }\n\nYou can view full marksheets in the **Examinations** tab.`,
  },
  {
    keywords: ['fee', 'pay', 'due', 'pending', 'challan', 'scholarship'],
    reply: (ctx) =>
      `💰 **Fee Status** for ${ctx.name}:\n- Pending Bills: **${ctx.pendingFees}**\n\n${
        ctx.pendingFees > 0
          ? '⚠️ You have outstanding fee dues. Please pay before the due date to avoid late fines. Visit the **Fees** tab for details.'
          : '✅ All your fees are cleared. No pending dues found.'
      }\n\nContact the Finance Office at finance@campus.edu for scholarship queries.`,
  },
  {
    keywords: ['timetable', 'schedule', 'class', 'timing', 'period', 'slot'],
    reply: (ctx) =>
      `🗓️ Your class timetable is available in the **Timetable** tab of your student portal.\n\nYour current semester is **${ctx.semester}**, Section **${ctx.section}**, Department **${ctx.department}**.\n\nIf you find any scheduling conflicts, please inform your class advisor.`,
  },
  {
    keywords: ['assignment', 'homework', 'submit', 'submission', 'deadline', 'task'],
    reply: (ctx) =>
      `📋 **Assignments** for ${ctx.name}:\n- Pending Submissions: **${ctx.pendingAssignments}**\n\nCheck the **Assignments** tab in your portal to view, download, and submit assignments.\n\n⚡ Submit before the deadline to avoid mark deduction!`,
  },
  {
    keywords: ['mentor', 'advisor', 'counseling', 'guidance', 'personal', 'stress', 'help', 'issue', 'problem'],
    reply: (_ctx) =>
      `🤝 **Academic Counseling Support**\n\nYou are not alone. Your assigned faculty mentor is available for one-on-one sessions.\n\n- Visit the **Counseling** section from the portal sidebar\n- Or email mentoring@campus.edu\n\nIf this is an emergency, please contact the student welfare office immediately.`,
  },
  {
    keywords: ['library', 'book', 'borrow', 'return', 'issue'],
    reply: (_ctx) =>
      `📚 **Library Services**\n\nYou can view your issued books and due dates in the **Library** tab.\n\n- Return books before the due date to avoid fines\n- Request new books via the library portal\n- E-resources are available 24/7 at library.campus.edu`,
  },
  {
    keywords: ['hostel', 'room', 'warden', 'mess', 'accommodation'],
    reply: (ctx) =>
      `🏠 **Hostel Information** for ${ctx.name}:\n${
        ctx.hostel
          ? `- Hostel: **${ctx.hostel}**, Room No: **${ctx.roomNo || 'Not assigned'}**`
          : '- You are currently not assigned to a hostel.'
      }\n\nFor hostel-related concerns, contact the warden or raise a support ticket from the **Help Desk** tab.`,
  },
  {
    keywords: ['transport', 'bus', 'route', 'stop', 'vehicle'],
    reply: (ctx) =>
      `🚌 **Transport Details**:\n${
        ctx.transportRoute
          ? `- Route: **${ctx.transportRoute}**`
          : '- You are not enrolled in any transport route.'
      }\n\nFor route changes or issues, contact the Transport Manager.`,
  },
  {
    keywords: ['semester', 'year', 'batch', 'current semester'],
    reply: (ctx) =>
      `📅 **Academic Details** for ${ctx.name}:\n- Department: **${ctx.department}**\n- Program: **${ctx.program}**\n- Semester: **${ctx.semester}**\n- Section: **${ctx.section}**\n- Academic Year: **${ctx.academicYear}**`,
  },
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'start'],
    reply: (ctx) =>
      `👋 Hello, **${ctx.name}**! Welcome to your AI Academic Adviser.\n\nI can help you with:\n- 📊 Attendance queries\n- 📝 Marks & Exam results\n- 💰 Fee status\n- 🗓️ Timetable info\n- 📋 Assignments\n- 🏠 Hostel & Transport\n- 🤝 Counseling & Support\n\nWhat would you like to know today?`,
  },
];

interface StudentContext {
  name: string;
  department: string;
  program: string;
  semester: string;
  section: string;
  academicYear: string;
  attendancePct: string;
  present: number;
  total: number;
  avgGpa: string;
  subjectCount: number;
  pendingFees: number;
  pendingAssignments: number;
  hostel: string | null;
  roomNo: string | null;
  transportRoute: string | null;
}

async function buildStudentContext(studentId: string): Promise<StudentContext | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      department: true,
      program: true,
      semester: true,
      section: true,
      academicYear: true,
      attendanceRecords: true,
      marks: true,
      feeBills: true,
      hostelBuilding: true,
      transportRoute: true,
      submissions: { include: { assignment: true } },
    },
  });

  if (!student) return null;

  const total = student.attendanceRecords.length;
  const present = student.attendanceRecords.filter((r) => r.status === 'PRESENT').length;
  const attendancePct = total > 0 ? ((present / total) * 100).toFixed(1) : '100.0';

  const avgGpa =
    student.marks.length > 0
      ? (student.marks.reduce((s, m) => s + (m.gpa ?? 0), 0) / student.marks.length).toFixed(2)
      : '0.00';

  const pendingFees = student.feeBills.filter((b) => b.status === 'PENDING').length;

  const pendingAssignments = student.submissions.filter(
    (s) => s.status === 'SUBMITTED' || !s.fileUrl
  ).length;

  return {
    name: `${student.firstName} ${student.lastName}`,
    department: student.department?.name || 'N/A',
    program: student.program?.name || 'N/A',
    semester: student.semester?.name || 'N/A',
    section: student.section?.name || 'N/A',
    academicYear: student.academicYear?.name || 'N/A',
    attendancePct,
    present,
    total,
    avgGpa,
    subjectCount: student.marks.length,
    pendingFees,
    pendingAssignments,
    hostel: student.hostelBuilding?.name ?? null,
    roomNo: student.roomNo ?? null,
    transportRoute: (student.transportRoute as any)?.routeName ?? null,
  };
}

function generateReply(message: string, ctx: StudentContext): string {
  const lower = message.toLowerCase();
  for (const entry of RESPONSE_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.reply(ctx);
    }
  }
  return `🤖 I understand you asked: *"${message}"*\n\nI'm your AI Academic Adviser for **${ctx.name}**. I can assist with attendance, grades, fees, timetable, assignments, counseling, library, hostel, and transport queries.\n\nCould you rephrase your question or choose a specific topic?`;
}

async function callLLM(prompt: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!geminiKey && !openaiKey) {
    throw new Error('AI Provider Key Missing: Neither GEMINI_API_KEY nor OPENAI_API_KEY is configured in the server environment variables. Please contact the administrator to setup the AI keys in the .env file.');
  }

  try {
    if (geminiKey) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API Error: ${res.statusText} - ${errText}`);
      }
      const data: any = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response candidate received from Gemini.';
    } else {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI API Error: ${res.statusText} - ${errText}`);
      }
      const data: any = await res.json();
      return data.choices?.[0]?.message?.content || 'No response content received from OpenAI.';
    }
  } catch (err: any) {
    console.error("LLM Provider Communication Failed:", err);
    throw new Error(`LLM Provider Communication Failed: ${err.message}`);
  }
}

export class AiController {
  /**
   * AI Student Counselor Chatbot (with persistent history)
   */
  chat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, sessionId } = req.body;
      const user = (req as any).user;

      if (!message?.trim()) {
        return res.status(400).json({ status: 'error', message: 'Message content is required' });
      }

      // Verify API Key exists
      const geminiKey = process.env.GEMINI_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!geminiKey && !openaiKey) {
        return res.status(500).json({
          status: 'error',
          message: 'AI Provider Key Missing: Neither GEMINI_API_KEY nor OPENAI_API_KEY environment variables are configured. Please contact the administrator to setup the AI keys in the .env file.'
        });
      }

      // Resolve student record
      const student = await prisma.student.findFirst({
        where: { userId: user.id, deleted: false },
        select: { id: true, firstName: true, lastName: true },
      });

      if (!student) {
        return res.status(403).json({ status: 'error', message: 'Only students can use the AI Adviser.' });
      }

      // Build context
      const ctx = await buildStudentContext(student.id);
      if (!ctx) {
        return res.status(404).json({ status: 'error', message: 'Student data not found.' });
      }

      // Build prompt with rich academic context
      const prompt = `
[Student Academic Context]
Name: ${ctx.name}
Department: ${ctx.department}
Program: ${ctx.program}
Semester: ${ctx.semester}
Section: ${ctx.section}
Academic Year: ${ctx.academicYear}
Attendance Rate: ${ctx.attendancePct}%
Average GPA: ${ctx.avgGpa}
Pending Fees: ${ctx.pendingFees}
Pending Assignments: ${ctx.pendingAssignments}

[User Prompt]
${message}

Please respond as a highly knowledgeable, helpful AI Academic Adviser. Format your response beautifully using Markdown. Use lists, tables, code blocks, or bold styling where appropriate to present a highly structured and readability-optimized response.
`;

      const reply = await callLLM(prompt);

      // Persist chat history
      await prisma.aiMessage.createMany({
        data: [
          { role: 'user', content: message.trim(), studentId: student.id, sessionId: sessionId || null },
          { role: 'assistant', content: reply, studentId: student.id, sessionId: sessionId || null },
        ],
      });

      res.status(200).json({ status: 'success', reply, context: ctx });
    } catch (error) {
      next(error);
    }
  };

  /**
   * AI Revision Assistant - generates revision notes, MCQ sheets, flash cards, viva questions, formulas, etc.
   */
  generateRevision = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { subject, format, topic } = req.body;
      const user = (req as any).user;

      if (!subject || !format) {
        return res.status(400).json({ status: 'error', message: 'Subject and format parameters are required.' });
      }

      // Verify API Key exists
      const geminiKey = process.env.GEMINI_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!geminiKey && !openaiKey) {
        return res.status(500).json({
          status: 'error',
          message: 'AI Provider Key Missing: Neither GEMINI_API_KEY nor OPENAI_API_KEY environment variables are configured. Please contact the administrator to setup the AI keys in the .env file.'
        });
      }

      const student = await prisma.student.findFirst({
        where: { userId: user.id, deleted: false },
        select: { id: true },
      });

      if (!student) {
        return res.status(403).json({ status: 'error', message: 'Only students can generate revision materials.' });
      }

      const ctx = await buildStudentContext(student.id);
      if (!ctx) {
        return res.status(404).json({ status: 'error', message: 'Student data not found.' });
      }

      const prompt = `
[Student Context]
Department: ${ctx.department}
Program: ${ctx.program}
Semester: ${ctx.semester}
Subject: ${subject}
Topic/Focus Area: ${topic || 'General Syllabus'}
Revision Format Requested: ${format}

Please generate comprehensive, professional revision materials for the student.
Format requirements:
- Title: ${format} for ${subject}
- Content: Deliver extremely valuable revision notes, important topics, frequently asked questions, formulas, viva questions, or flash cards matching ${format} specifically.
- Structure: Format beautifully using Markdown headings, bullet points, code blocks, or clean tables.
`;

      const data = await callLLM(prompt);
      res.status(200).json({ status: 'success', data });
    } catch (error: any) {
      console.error("AI Revision Generation Failed:", error);
      res.status(500).json({ status: 'error', message: error.message || 'AI Revision Generation Failed' });
    }
  };

  /**
   * Get Chat History for logged-in student
   */
  getChatHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { sessionId, limit = '50' } = req.query;

      const student = await prisma.student.findFirst({
        where: { userId: user.id, deleted: false },
        select: { id: true },
      });

      if (!student) {
        return res.status(403).json({ status: 'error', message: 'Only students can access AI chat history.' });
      }

      const messages = await prisma.aiMessage.findMany({
        where: {
          studentId: student.id,
          ...(sessionId ? { sessionId: sessionId as string } : {}),
        },
        orderBy: { createdAt: 'asc' },
        take: parseInt(limit as string, 10),
      });

      res.status(200).json({ status: 'success', data: messages });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Clear Chat History for logged-in student
   */
  clearHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      const student = await prisma.student.findFirst({
        where: { userId: user.id, deleted: false },
        select: { id: true },
      });

      if (!student) {
        return res.status(403).json({ status: 'error', message: 'Only students can clear AI chat history.' });
      }

      await prisma.aiMessage.deleteMany({ where: { studentId: student.id } });

      res.status(200).json({ status: 'success', message: 'Chat history cleared.' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * AI Analytics & Predictive Risk Assessment Engine
   */
  getPredictions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const students = await prisma.student.findMany({
        where: { deleted: false },
        include: {
          attendanceRecords: true,
          marks: true,
          feeBills: true,
          department: true,
          section: true,
        },
      });

      const predictions = students.map((student) => {
        const totalClasses = student.attendanceRecords.length;
        const presentClasses = student.attendanceRecords.filter((r) => r.status === 'PRESENT').length;
        const attRate = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 85.0;

        let attendanceRisk = 'LOW';
        let attRecommendation = 'Healthy attendance levels. Keep attending lectures.';
        if (attRate < 75.0) {
          attendanceRisk = 'HIGH';
          attRecommendation = 'High risk of hall ticket withholding. Issue warning letter and notify parents immediately.';
        } else if (attRate < 85.0) {
          attendanceRisk = 'MEDIUM';
          attRecommendation = 'Approaching borderline limits. Mentor should check in.';
        }

        const pendingBills = student.feeBills.filter((b) => b.status === 'PENDING');
        let feeRisk = 'LOW';
        let feeProbability = 10;
        let feeRecommendation = 'No pending financial dues.';

        if (pendingBills.length > 0) {
          const firstDue = pendingBills[0].dueDate;
          const daysLeft = Math.ceil((new Date(firstDue).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          if (daysLeft < 7) {
            feeRisk = 'HIGH';
            feeProbability = 90;
            feeRecommendation = 'Dues overdue or critical threshold. Send automated payment reminder and call parent.';
          } else if (daysLeft < 15) {
            feeRisk = 'MEDIUM';
            feeProbability = 60;
            feeRecommendation = 'Due date approaching within a week. Email notification dispatched.';
          } else {
            feeRisk = 'LOW';
            feeProbability = 30;
            feeRecommendation = 'Pending bill is within safety window.';
          }
        }

        const failingMarks = student.marks.filter((m) => m.grade === 'F' || m.grade === 'E');
        let academicRisk = 'LOW';
        let academicRecommendation = 'Consistent grades. Maintain focus.';
        if (failingMarks.length > 0) {
          academicRisk = 'HIGH';
          academicRecommendation = 'Failing core courses. Enroll in mandatory remedial tutoring.';
        } else {
          const lowMarks = student.marks.filter((m) => (m.gpa ?? 10) < 6.5);
          if (lowMarks.length > 0) {
            academicRisk = 'MEDIUM';
            academicRecommendation = 'GPA dipped below average. Monitor midterm assessments.';
          }
        }

        return {
          id: student.id,
          admissionNo: student.admissionNo,
          name: `${student.firstName} ${student.lastName}`,
          department: student.department?.code || 'N/A',
          section: student.section?.name || 'N/A',
          attendanceRate: attRate.toFixed(1) + '%',
          predictions: {
            attendance: { status: attendanceRisk, recommendation: attRecommendation },
            fees: { status: feeRisk, probability: feeProbability + '%', recommendation: feeRecommendation },
            academics: { status: academicRisk, recommendation: academicRecommendation },
          },
        };
      });

      res.status(200).json({ status: 'success', data: predictions });
    } catch (error) {
      next(error);
    }
  };
}
