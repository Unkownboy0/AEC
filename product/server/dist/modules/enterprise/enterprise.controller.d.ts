import { Request, Response, NextFunction } from 'express';
export declare class EnterpriseController {
    private service;
    listStudents: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getStudentDashboardSummary: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getStudent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    downloadIdCardPdf: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    downloadAttendancePdf: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getMappingValidation: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    runAutoAssign: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createStudent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateStudent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteStudent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listFaculties: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getFaculty: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createFaculty: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateFaculty: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteFaculty: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listAttendances: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    recordAttendance: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    recordBulkAttendance: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listExams: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getExam: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createExam: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateExam: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteExam: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listMarks: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    recordMark: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listFeeCategories: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createFeeCategory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listFeeBills: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createFeeBill: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    recordPayment: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listLibraryBooks: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getLibraryBook: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createLibraryBook: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateLibraryBook: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteLibraryBook: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listTransportRoutes: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getTransportRoute: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createTransportRoute: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateTransportRoute: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteTransportRoute: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listHostels: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getHostel: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createHostel: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateHostel: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteHostel: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listTickets: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getTicket: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createTicket: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateTicket: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteTicket: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    bulkAction: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listInternships: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    createInternship: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    uploadInternshipDocument: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    listAllInternshipDocuments: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    verifyInternshipDocument: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    assignStudentsToMentor: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    removeStudentFromMentor: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get Student ID Card Data & QR Token
     */
    getStudentIdCard: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get Faculty ID Card Data & QR Token
     */
    getFacultyIdCard: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Public endpoint to decode token & verify identity from QR Code scan
     */
    verifyIdCard: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    listCounselingRecords: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createCounselingRecord: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    globalSearch: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getStudentFullProfile: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getFacultyFullProfile: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
}
