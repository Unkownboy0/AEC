import { Request, Response, NextFunction } from 'express';
export declare class AiController {
    /**
     * AI Student Counselor Chatbot (with persistent history)
     */
    chat: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * AI Revision Assistant - generates revision notes, MCQ sheets, flash cards, viva questions, formulas, etc.
     */
    generateRevision: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get Chat History for logged-in student
     */
    getChatHistory: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Clear Chat History for logged-in student
     */
    clearHistory: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * AI Analytics & Predictive Risk Assessment Engine
     */
    getPredictions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
