import { Request, Response, NextFunction } from 'express';
export declare class TimetableController {
    private service;
    listSlots: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createSlot: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteSlot: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    generateAIDraft: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    facultyCreateSlot: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    facultyUpdateSlot: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    facultyDeleteSlot: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Submit timetable for Academic Dean review
     */
    submitForReview: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Review timetable (Dean approval/rejection)
     */
    reviewTimetable: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Publish approved timetable
     */
    publishTimetable: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get current publish status of department timetable
     */
    getPublishStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
