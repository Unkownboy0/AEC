"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const prisma_1 = require("../../lib/prisma");
// ─── Rich keyword response map ─────────────────────────────────────────────
const RESPONSE_MAP = [
    {
        keywords: ['attendance', 'absent', 'present', 'shortage'],
        reply: (ctx) => `📊 **Attendance Summary** for ${ctx.name}:\n- Attendance Rate: **${ctx.attendancePct}%**\n- Classes Present: ${ctx.present}/${ctx.total}\n\n${parseFloat(ctx.attendancePct) < 75
            ? '⚠️ **Critical:** Your attendance is below 75%. You may be barred from exams. Please apply for OD/Leave immediately and meet your class advisor.'
            : parseFloat(ctx.attendancePct) < 85
                ? '⚠️ **Warning:** Attendance is approaching the 75% threshold. Try not to miss any more classes this month.'
                : '✅ Your attendance is healthy! Keep attending regularly.'}`,
    },
    {
        keywords: ['exam', 'grade', 'mark', 'gpa', 'score', 'result', 'internal', 'external'],
        reply: (ctx) => `📝 **Academic Performance** for ${ctx.name} (${ctx.semester}):\n- Subjects Recorded: **${ctx.subjectCount}**\n- Average GPA: **${ctx.avgGpa}**\n\n${parseFloat(ctx.avgGpa) < 5
            ? '⚠️ Your GPA is critically low. Consider enrolling in remedial classes or speaking with your faculty mentor.'
            : parseFloat(ctx.avgGpa) < 7
                ? '📌 GPA is below average. Focus on upcoming internal assessments to improve your scores.'
                : '🎉 Great performance! Keep maintaining your academic excellence.'}\n\nYou can view full marksheets in the **Examinations** tab.`,
    },
    {
        keywords: ['fee', 'pay', 'due', 'pending', 'challan', 'scholarship'],
        reply: (ctx) => `💰 **Fee Status** for ${ctx.name}:\n- Pending Bills: **${ctx.pendingFees}**\n\n${ctx.pendingFees > 0
            ? '⚠️ You have outstanding fee dues. Please pay before the due date to avoid late fines. Visit the **Fees** tab for details.'
            : '✅ All your fees are cleared. No pending dues found.'}\n\nContact the Finance Office at finance@campus.edu for scholarship queries.`,
    },
    {
        keywords: ['timetable', 'schedule', 'class', 'timing', 'period', 'slot'],
        reply: (ctx) => `🗓️ Your class timetable is available in the **Timetable** tab of your student portal.\n\nYour current semester is **${ctx.semester}**, Section **${ctx.section}**, Department **${ctx.department}**.\n\nIf you find any scheduling conflicts, please inform your class advisor.`,
    },
    {
        keywords: ['assignment', 'homework', 'submit', 'submission', 'deadline', 'task'],
        reply: (ctx) => `📋 **Assignments** for ${ctx.name}:\n- Pending Submissions: **${ctx.pendingAssignments}**\n\nCheck the **Assignments** tab in your portal to view, download, and submit assignments.\n\n⚡ Submit before the deadline to avoid mark deduction!`,
    },
    {
        keywords: ['mentor', 'advisor', 'counseling', 'guidance', 'personal', 'stress', 'help', 'issue', 'problem'],
        reply: (_ctx) => `🤝 **Academic Counseling Support**\n\nYou are not alone. Your assigned faculty mentor is available for one-on-one sessions.\n\n- Visit the **Counseling** section from the portal sidebar\n- Or email mentoring@campus.edu\n\nIf this is an emergency, please contact the student welfare office immediately.`,
    },
    {
        keywords: ['library', 'book', 'borrow', 'return', 'issue'],
        reply: (_ctx) => `📚 **Library Services**\n\nYou can view your issued books and due dates in the **Library** tab.\n\n- Return books before the due date to avoid fines\n- Request new books via the library portal\n- E-resources are available 24/7 at library.campus.edu`,
    },
    {
        keywords: ['hostel', 'room', 'warden', 'mess', 'accommodation'],
        reply: (ctx) => `🏠 **Hostel Information** for ${ctx.name}:\n${ctx.hostel
            ? `- Hostel: **${ctx.hostel}**, Room No: **${ctx.roomNo || 'Not assigned'}**`
            : '- You are currently not assigned to a hostel.'}\n\nFor hostel-related concerns, contact the warden or raise a support ticket from the **Help Desk** tab.`,
    },
    {
        keywords: ['transport', 'bus', 'route', 'stop', 'vehicle'],
        reply: (ctx) => `🚌 **Transport Details**:\n${ctx.transportRoute
            ? `- Route: **${ctx.transportRoute}**`
            : '- You are not enrolled in any transport route.'}\n\nFor route changes or issues, contact the Transport Manager.`,
    },
    {
        keywords: ['semester', 'year', 'batch', 'current semester'],
        reply: (ctx) => `📅 **Academic Details** for ${ctx.name}:\n- Department: **${ctx.department}**\n- Program: **${ctx.program}**\n- Semester: **${ctx.semester}**\n- Section: **${ctx.section}**\n- Academic Year: **${ctx.academicYear}**`,
    },
    {
        keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'start'],
        reply: (ctx) => `👋 Hello, **${ctx.name}**! Welcome to your AI Academic Adviser.\n\nI can help you with:\n- 📊 Attendance queries\n- 📝 Marks & Exam results\n- 💰 Fee status\n- 🗓️ Timetable info\n- 📋 Assignments\n- 🏠 Hostel & Transport\n- 🤝 Counseling & Support\n\nWhat would you like to know today?`,
    },
];
// ─── Built-in revision templates (used when no LLM key is configured) ────────
const REVISION_TEMPLATES = {
    'Revision Notes': (subject, topic, ctx) => `# 📖 Revision Notes — ${subject}\n**Department:** ${ctx.department} | **Semester:** ${ctx.semester}\n**Topic:** ${topic || 'General Syllabus'}\n\n---\n\n## 📌 Key Concepts\n1. Understand core definitions and terminology\n2. Focus on fundamental theorems and principles\n3. Practice solved examples for each concept\n4. Review previous question papers\n\n## ⚡ Important Topics\n- Core Theory & Fundamentals\n- Problem-Solving Techniques\n- Application & Case Studies\n- Standard Formulae & Derivations\n\n## 📋 Study Tips\n- Spend 2–3 hours daily on revision\n- Summarize each chapter in your own words\n- Solve 5–10 past-year questions per topic\n- Form study groups for discussion`,
    'MCQ Sheet': (subject, topic, _ctx) => `# 🗒️ MCQ Practice Sheet — ${subject}\n**Topic:** ${topic || 'General Syllabus'}\n\n---\n\n## Sample MCQs\n\n**Q1.** Which of the following best describes the primary objective of ${subject}?\n- (A) Option A\n- (B) Option B ✅\n- (C) Option C\n- (D) Option D\n\n**Q2.** The core principle of ${topic || subject} is:\n- (A) Principle X\n- (B) Principle Y\n- (C) Principle Z ✅\n- (D) Principle W\n\n> 💡 Tip: Practice these MCQs under timed conditions. Aim for 1 minute per question.`,
    'Flash Cards': (subject, topic, _ctx) => `# ⚡ Flash Cards — ${subject}\n**Topic:** ${topic || 'General Syllabus'}\n\n---\n\n**Card 1:**\n> 🔵 **Q:** What is the definition of ${topic || subject}?\n> 🟢 **A:** [Review your textbook Chapter 1 definition]\n\n**Card 2:**\n> 🔵 **Q:** What are the key components of ${topic || subject}?\n> 🟢 **A:** List the primary components from your lecture notes\n\n**Card 3:**\n> 🔵 **Q:** Give one real-world application of ${topic || subject}.\n> 🟢 **A:** Identify a practical use case from your syllabus\n\n> 📌 Review 10 flash cards daily for best retention.`,
    'Viva Questions': (subject, topic, ctx) => `# 🎤 Viva Questions — ${subject}\n**Department:** ${ctx.department} | **Semester:** ${ctx.semester}\n**Topic:** ${topic || 'General Syllabus'}\n\n---\n\n## Common Viva Questions\n\n1. **Define ${topic || subject} in your own words.**\n2. **What are the key principles governing ${topic || subject}?**\n3. **How does ${topic || subject} relate to real-world applications?**\n4. **Explain the differences between the main approaches in ${subject}.**\n5. **What are the common mistakes students make in this topic?**\n6. **How would you apply ${topic || subject} to solve a practical problem?**\n7. **Name the key researchers or founders associated with ${subject}.**\n\n> ✅ Tip: Answer viva questions confidently, clearly, and concisely. Always back answers with examples.`,
    'Formula Sheet': (subject, topic, ctx) => `# 📐 Formula Sheet — ${subject}\n**Department:** ${ctx.department} | **Semester:** ${ctx.semester}\n**Topic:** ${topic || 'General Syllabus'}\n\n---\n\n## Key Formulae\n\n| Formula | Description |\n|---------|-------------|\n| F = ma  | Newton's Second Law (example) |\n| E = mc² | Mass-Energy Equivalence (example) |\n\n> ⚠️ Replace the above with actual formulae from your ${subject} syllabus.\n\n## Derivation Steps\n1. Start with the base definition\n2. Apply relevant theorems\n3. Simplify step by step\n4. Validate with known values\n\n> 💡 Memorize commonly asked formulae and their derivation paths.`,
};
async function buildStudentContext(studentId) {
    const student = await prisma_1.prisma.student.findUnique({
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
    if (!student)
        return null;
    const total = student.attendanceRecords.length;
    const present = student.attendanceRecords.filter((r) => r.status === 'PRESENT').length;
    const attendancePct = total > 0 ? ((present / total) * 100).toFixed(1) : '100.0';
    const avgGpa = student.marks.length > 0
        ? (student.marks.reduce((s, m) => s + (m.gpa ?? 0), 0) / student.marks.length).toFixed(2)
        : '0.00';
    const pendingFees = student.feeBills.filter((b) => b.status === 'PENDING').length;
    const pendingAssignments = student.submissions.filter((s) => s.status === 'SUBMITTED' || !s.fileUrl).length;
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
        transportRoute: student.transportRoute?.routeName ?? null,
    };
}
function generateReply(message, ctx) {
    const lower = message.toLowerCase();
    for (const entry of RESPONSE_MAP) {
        if (entry.keywords.some((kw) => lower.includes(kw))) {
            return entry.reply(ctx);
        }
    }
    return `🤖 I understand you asked: *"${message}"*\n\n**Hi ${ctx.name}!** I'm your AI Academic Adviser. Here's a quick snapshot of your profile:\n\n| Detail | Info |\n|--------|------|\n| Department | ${ctx.department} |\n| Semester | ${ctx.semester} |\n| Attendance | ${ctx.attendancePct}% |\n| Average GPA | ${ctx.avgGpa} |\n| Pending Fees | ${ctx.pendingFees} |\n\nI can assist with **attendance**, **grades**, **fees**, **timetable**, **assignments**, **counseling**, **library**, **hostel**, and **transport** queries.\n\nCould you rephrase your question or pick a specific topic?`;
}
async function callLLM(prompt) {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!geminiKey && !openaiKey) {
        return null; // Signal to fall back to local engine
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
            const data = await res.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response candidate received from Gemini.';
        }
        else {
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
            const data = await res.json();
            return data.choices?.[0]?.message?.content || 'No response content received from OpenAI.';
        }
    }
    catch (err) {
        console.error("LLM Provider Communication Failed:", err);
        return null; // Fall back to local engine on error
    }
}
class AiController {
    /**
     * AI Student Counselor Chatbot (with persistent history)
     * Falls back to built-in keyword engine when no API key is configured.
     */
    chat = async (req, res, next) => {
        try {
            const { message, sessionId } = req.body;
            const user = req.user;
            if (!message?.trim()) {
                return res.status(400).json({ status: 'error', message: 'Message content is required' });
            }
            // Resolve student record
            const student = await prisma_1.prisma.student.findFirst({
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
            let reply;
            const geminiKey = process.env.GEMINI_API_KEY;
            const openaiKey = process.env.OPENAI_API_KEY;
            if (geminiKey || openaiKey) {
                // LLM path: build a rich prompt with academic context
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
                const llmReply = await callLLM(prompt);
                // If LLM call failed, fall back to local engine
                reply = llmReply || generateReply(message, ctx);
            }
            else {
                // No API key configured — use built-in keyword engine
                reply = generateReply(message, ctx);
            }
            // Persist chat history
            await prisma_1.prisma.aiMessage.createMany({
                data: [
                    { role: 'user', content: message.trim(), studentId: student.id, sessionId: sessionId || null },
                    { role: 'assistant', content: reply, studentId: student.id, sessionId: sessionId || null },
                ],
            });
            res.status(200).json({ status: 'success', reply, context: ctx });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * AI Revision Assistant — uses LLM if available, else built-in templates.
     */
    generateRevision = async (req, res, next) => {
        try {
            const { subject, format, topic } = req.body;
            const user = req.user;
            if (!subject || !format) {
                return res.status(400).json({ status: 'error', message: 'Subject and format parameters are required.' });
            }
            const student = await prisma_1.prisma.student.findFirst({
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
            const geminiKey = process.env.GEMINI_API_KEY;
            const openaiKey = process.env.OPENAI_API_KEY;
            let data;
            if (geminiKey || openaiKey) {
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
                const llmReply = await callLLM(prompt);
                data = llmReply || (REVISION_TEMPLATES[format] || REVISION_TEMPLATES['Revision Notes'])(subject, topic || '', ctx);
            }
            else {
                // No API key — use built-in template engine
                const templateFn = REVISION_TEMPLATES[format] || REVISION_TEMPLATES['Revision Notes'];
                data = templateFn(subject, topic || '', ctx);
            }
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            console.error("AI Revision Generation Failed:", error);
            res.status(500).json({ status: 'error', message: error.message || 'AI Revision Generation Failed' });
        }
    };
    /**
     * Get Chat History for logged-in student
     */
    getChatHistory = async (req, res, next) => {
        try {
            const user = req.user;
            const { sessionId, limit = '50' } = req.query;
            const student = await prisma_1.prisma.student.findFirst({
                where: { userId: user.id, deleted: false },
                select: { id: true },
            });
            if (!student) {
                return res.status(403).json({ status: 'error', message: 'Only students can access AI chat history.' });
            }
            const messages = await prisma_1.prisma.aiMessage.findMany({
                where: {
                    studentId: student.id,
                    ...(sessionId ? { sessionId: sessionId } : {}),
                },
                orderBy: { createdAt: 'asc' },
                take: parseInt(limit, 10),
            });
            res.status(200).json({ status: 'success', data: messages });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Clear Chat History for logged-in student
     */
    clearHistory = async (req, res, next) => {
        try {
            const user = req.user;
            const student = await prisma_1.prisma.student.findFirst({
                where: { userId: user.id, deleted: false },
                select: { id: true },
            });
            if (!student) {
                return res.status(403).json({ status: 'error', message: 'Only students can clear AI chat history.' });
            }
            await prisma_1.prisma.aiMessage.deleteMany({ where: { studentId: student.id } });
            res.status(200).json({ status: 'success', message: 'Chat history cleared.' });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * AI Analytics & Predictive Risk Assessment Engine
     */
    getPredictions = async (req, res, next) => {
        try {
            const students = await prisma_1.prisma.student.findMany({
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
                }
                else if (attRate < 85.0) {
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
                    }
                    else if (daysLeft < 15) {
                        feeRisk = 'MEDIUM';
                        feeProbability = 60;
                        feeRecommendation = 'Due date approaching within a week. Email notification dispatched.';
                    }
                    else {
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
                }
                else {
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
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AiController = AiController;
//# sourceMappingURL=ai.controller.js.map