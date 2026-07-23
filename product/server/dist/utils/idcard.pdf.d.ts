interface IDCardData {
    student: any;
    settings: Record<string, string>;
    registerNo: string;
    rollNo: string;
    validUntil: string;
}
/**
 * Build a two-page CR80 size PDF card (Front & Back)
 */
export declare function buildStudentIDCardPDF(data: IDCardData): Promise<PDFKit.PDFDocument>;
export {};
