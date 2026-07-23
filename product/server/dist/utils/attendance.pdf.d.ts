interface AttendanceReportData {
    student: any;
    attendanceRecords: any[];
    settings: Record<string, string>;
    registerNo: string;
    rollNo: string;
}
export declare function generateAttendanceReportPdf(data: AttendanceReportData): Promise<Buffer>;
export {};
