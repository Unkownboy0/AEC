import { Request, Response, NextFunction } from 'express';
export declare class AiController {
    /**
     * AI Student Counselor Chatbot (with persistent history)
     * Falls back to built-in keyword engine when no API key is configured.
     */
    chat: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * AI Revision Assistant — uses LLM if available, else built-in templates.
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
