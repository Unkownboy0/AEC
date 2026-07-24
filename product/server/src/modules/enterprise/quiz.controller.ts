import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { NotFoundException, BadRequestException } from '../../utils/exceptions';

const SAMPLE_QUIZZES = [
  {
    id: 'quiz-1',
    title: 'Data Structures & Algorithms Final Assessment',
    description: 'Covers Trees, Graphs, Dynamic Programming, and Sorting Algorithms',
    subjectName: 'Design & Analysis of Algorithms',
    durationMins: 30,
    totalMarks: 50,
    passMarks: 20,
    negativeMark: 0.25,
    status: 'ACTIVE',
    questionsCount: 10,
    questions: [
      { id: 'q1', type: 'MCQ', question: 'What is the time complexity of building a heap from an unsorted array of size N?', options: ['O(N log N)', 'O(N)', 'O(N^2)', 'O(log N)'], correctAnswer: 'O(N)', marks: 5 },
      { id: 'q2', type: 'MCQ', question: 'Which data structure is naturally used to implement Breadth-First Search (BFS)?', options: ['Stack', 'Queue', 'Priority Queue', 'Tree'], correctAnswer: 'Queue', marks: 5 },
      { id: 'q3', type: 'TRUE_FALSE', question: 'In a Directed Acyclic Graph (DAG), topological sorting is always unique.', options: ['True', 'False'], correctAnswer: 'False', marks: 5 },
      { id: 'q4', type: 'MCQ', question: 'Which algorithm is guaranteed to find the shortest path in a graph with non-negative edge weights?', options: ['Dijkstra Algorithm', 'Bellman-Ford Algorithm', 'Floyd-Warshall', 'Kruskal Algorithm'], correctAnswer: 'Dijkstra Algorithm', marks: 5 },
      { id: 'q5', type: 'PROGRAMMING', question: 'Write a function snippet to reverse a singly linked list in-place.', options: [], correctAnswer: 'prev node pointer manipulation', marks: 10 },
    ]
  },
  {
    id: 'quiz-2',
    title: 'Database Management Systems Practice Quiz',
    description: 'Relational Algebra, SQL Joins, Normalization, and ACID Properties',
    subjectName: 'Database Systems',
    durationMins: 20,
    totalMarks: 30,
    passMarks: 12,
    negativeMark: 0,
    status: 'ACTIVE',
    questionsCount: 5,
    questions: [
      { id: 'db1', type: 'MCQ', question: 'Which normal form eliminates partial key dependencies?', options: ['1NF', '2NF', '3NF', 'BCNF'], correctAnswer: '2NF', marks: 6 },
      { id: 'db2', type: 'MCQ', question: 'Which SQL join returns all rows from the left table and matched rows from the right table?', options: ['INNER JOIN', 'RIGHT JOIN', 'LEFT JOIN', 'FULL OUTER JOIN'], correctAnswer: 'LEFT JOIN', marks: 6 },
    ]
  }
];

export class QuizController {
  /**
   * List available quizzes for students
   */
  listQuizzes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({
        status: 'success',
        data: SAMPLE_QUIZZES
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get single quiz details with questions
   */
  getQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const quiz = SAMPLE_QUIZZES.find(q => q.id === id);

      if (!quiz) {
        throw new NotFoundException('Quiz not found');
      }

      res.status(200).json({
        status: 'success',
        data: quiz
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Submit Quiz attempt and auto-evaluate MCQ/True-False questions
   */
  submitQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { answers } = req.body; // { questionId: selectedOption }

      const quiz = SAMPLE_QUIZZES.find(q => q.id === id);
      if (!quiz) {
        throw new NotFoundException('Quiz not found');
      }

      let score = 0;
      let correctCount = 0;
      let wrongCount = 0;

      quiz.questions.forEach(q => {
        const studentAns = answers[q.id];
        if (studentAns) {
          if (studentAns === q.correctAnswer) {
            score += q.marks;
            correctCount++;
          } else {
            score -= (quiz.negativeMark * q.marks);
            wrongCount++;
          }
        }
      });

      const finalScore = Math.max(0, Math.round(score * 10) / 10);
      const passed = finalScore >= quiz.passMarks;

      res.status(200).json({
        status: 'success',
        data: {
          quizId: id,
          totalMarks: quiz.totalMarks,
          passMarks: quiz.passMarks,
          score: finalScore,
          passed,
          correctCount,
          wrongCount,
          totalQuestions: quiz.questions.length,
          submittedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
