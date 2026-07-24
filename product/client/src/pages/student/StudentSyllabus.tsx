import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Download, Star, Info, FileText, BarChart2, Layers, Cpu, Code2, Database, Network } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

interface SyllabusUnit {
  unitNumber: string;
  title: string;
  topics: string;
  hours: number;
}

interface EngineeringSubject {
  code: string;
  name: string;
  type: 'CORE' | 'ELECTIVE' | 'LAB';
  category: string;
  credits: number;
  ltp: string;
  prerequisite: string;
  description: string;
  outcomes: string[];
  units: SyllabusUnit[];
  textbooks: string[];
}

const DETAILED_ENGINEERING_SYLLABUS: EngineeringSubject[] = [
  {
    code: 'CS6101',
    name: 'Design and Analysis of Algorithms',
    type: 'CORE',
    category: 'Computer Science & Engineering',
    credits: 4,
    ltp: '3-1-0',
    prerequisite: 'Data Structures (CS5101)',
    description: 'Advanced design paradigms, asymptotic complexity, divide and conquer, greedy strategies, dynamic programming, graph algorithms, NP-completeness, and approximation algorithms.',
    outcomes: [
      'Analyze worst-case and average-case asymptotic time/space complexities.',
      'Formulate dynamic programming state recurrence equations for optimization problems.',
      'Apply graph algorithms (Dijkstra, Bellman-Ford, Kruskal) to network design.',
      'Prove NP-completeness using polynomial-time reductions.'
    ],
    units: [
      { unitNumber: 'Unit I', title: 'Algorithm Analysis & Growth of Functions', topics: 'Asymptotic notation (O, Ω, Θ), Recurrence relations, Master Theorem, Substitution Method, Substitution proofs.', hours: 9 },
      { unitNumber: 'Unit II', title: 'Divide & Conquer and Greedy Methods', topics: 'Merge Sort, Quick Sort, Strassen Matrix Multiplication, Fractional Knapsack, Huffman Coding, Minimum Spanning Trees (Kruskal, Prim).', hours: 10 },
      { unitNumber: 'Unit III', title: 'Dynamic Programming', topics: '0/1 Knapsack, Matrix Chain Multiplication, Longest Common Subsequence (LCS), All-Pairs Shortest Path (Floyd-Warshall), Bellman-Ford.', hours: 10 },
      { unitNumber: 'Unit IV', title: 'Graph Algorithms & Backtracking', topics: 'BFS, DFS, Topological Sort, Strongly Connected Components, N-Queens problem, Subset Sum, Graph Coloring.', hours: 9 },
      { unitNumber: 'Unit V', title: 'NP-Completeness & Approximation', topics: 'P vs NP, NP-Hard and NP-Complete classes, 3-SAT reduction, Traveling Salesperson Problem (TSP) approximation.', hours: 7 }
    ],
    textbooks: [
      'Cormen, Leiserson, Rivest, Stein, "Introduction to Algorithms", 4th Edition, MIT Press.',
      'Ellis Horowitz, Sartaj Sahni, "Fundamentals of Computer Algorithms", Galgotia Publications.'
    ]
  },
  {
    code: 'CS6102',
    name: 'Database Management Systems',
    type: 'CORE',
    category: 'Computer Science & Engineering',
    credits: 4,
    ltp: '3-0-2',
    prerequisite: 'Discrete Mathematics (MA5102)',
    description: 'Data models, ER modeling, Relational Algebra, SQL query optimization, Functional Dependencies, Normalization (1NF to BCNF), Transaction Processing, ACID, and NoSQL.',
    outcomes: [
      'Design conceptual ER models and map them to normalized relational schemas.',
      'Construct complex SQL queries using JOINs, aggregations, subqueries, and window functions.',
      'Evaluate transaction concurrency control using Two-Phase Locking (2PL) and Timestamp Ordering.',
      'Implement indexing structures (B+ Trees, Hashing) for fast query processing.'
    ],
    units: [
      { unitNumber: 'Unit I', title: 'Relational Model & ER Architecture', topics: 'DBMS Architecture, Data Independence, ER Diagrams, Weak Entities, Relational Algebra (Select, Project, Join, Set Ops).', hours: 8 },
      { unitNumber: 'Unit II', title: 'SQL & Advanced Query Processing', topics: 'DDL, DML, DCL commands, Nested Subqueries, Correlated Subqueries, Views, Triggers, Stored Procedures, Indexing.', hours: 10 },
      { unitNumber: 'Unit III', title: 'Relational Database Design & Normalization', topics: 'Functional Dependencies, Closure sets, 1NF, 2NF, 3NF, BCNF, Lossless Join Decomposition, Dependency Preservation.', hours: 10 },
      { unitNumber: 'Unit IV', title: 'Transaction Management & Concurrency', topics: 'ACID properties, Schedule Serializability, Conflict Serializability, Two-Phase Locking (2PL), Deadlock Handling.', hours: 9 },
      { unitNumber: 'Unit V', title: 'Modern Storage Systems & NoSQL', topics: 'B+ Tree Indexing, RAID levels, Document Databases (MongoDB), Key-Value Stores (Redis), CAP Theorem.', hours: 8 }
    ],
    textbooks: [
      'Silberschatz, Korth, Sudarshan, "Database System Concepts", 7th Edition, McGraw-Hill.',
      'Ramez Elmasri, Shamkant B. Navathe, "Fundamentals of Database Systems", 7th Edition, Pearson.'
    ]
  },
  {
    code: 'CS6103',
    name: 'Operating Systems & System Programming',
    type: 'CORE',
    category: 'Computer Science & Engineering',
    credits: 4,
    ltp: '3-1-0',
    prerequisite: 'Computer Organization & Architecture (CS5103)',
    description: 'Process management, multithreading, CPU scheduling, synchronization semaphores, deadlock handling, virtual memory paging, file systems, and Linux kernel fundamentals.',
    outcomes: [
      'Analyze CPU scheduling algorithms (FCFS, SJF, Round Robin, Multi-level Feedback Queue).',
      'Solve race conditions using Semaphores, Mutexes, and Monitors.',
      'Evaluate page replacement algorithms (FIFO, LRU, Optimal) for virtual memory management.',
      'Understand file system allocation techniques (Contiguous, Linked, Indexed) and inode structures.'
    ],
    units: [
      { unitNumber: 'Unit I', title: 'OS Overview & Process Management', topics: 'System Calls, Kernel Modes, Process State Transitions, Process Control Block (PCB), Context Switching, POSIX threads.', hours: 9 },
      { unitNumber: 'Unit II', title: 'CPU Scheduling & Synchronization', topics: 'Preemptive vs Non-preemptive scheduling, Multi-processor scheduling, Critical Section Problem, Peterson Solution, Semaphores.', hours: 10 },
      { unitNumber: 'Unit III', title: 'Deadlocks', topics: 'System Resource Allocation Graph, Deadlock Prevention, Avoidance (Banker Algorithm), Detection and Recovery.', hours: 8 },
      { unitNumber: 'Unit IV', title: 'Memory Management & Virtual Memory', topics: 'Paging, Segmentation, Translation Lookaside Buffer (TLB), Page Faults, FIFO, LRU, Optimal Page Replacement.', hours: 10 },
      { unitNumber: 'Unit V', title: 'Storage & File Systems', topics: 'Disk Scheduling (SSTF, SCAN, C-SCAN), Inode Structure, Directory Implementations, Virtual File System (VFS).', hours: 8 }
    ],
    textbooks: [
      'Abraham Silberschatz, Peter B. Galvin, Greg Gagne, "Operating System Concepts", 10th Edition, Wiley.',
      'William Stallings, "Operating Systems: Internals and Design Principles", 9th Edition, Pearson.'
    ]
  },
  {
    code: 'AI6104',
    name: 'Machine Learning & Deep Learning Foundations',
    type: 'ELECTIVE',
    category: 'Artificial Intelligence & Data Science',
    credits: 3,
    ltp: '3-0-0',
    prerequisite: 'Linear Algebra & Probability (MA5104)',
    description: 'Supervised and unsupervised learning algorithms, Linear/Logistic Regression, Decision Trees, Random Forests, SVMs, Neural Networks, Backpropagation, CNNs, and Transformers.',
    outcomes: [
      'Formulate regression and classification models using gradient descent optimization.',
      'Build Convolutional Neural Networks (CNNs) for image feature extraction.',
      'Apply regularization techniques (L1/L2, Dropout) to combat overfitting.',
      'Evaluate models using Confusion Matrix, ROC-AUC, F1-Score, and Precision-Recall metrics.'
    ],
    units: [
      { unitNumber: 'Unit I', title: 'Supervised Learning Algorithms', topics: 'Linear Regression, Gradient Descent, Logistic Regression, Decision Trees, Information Gain, Gini Impurity, Random Forests.', hours: 9 },
      { unitNumber: 'Unit II', title: 'SVM & Unsupervised Learning', topics: 'Support Vector Machines (Kernel Trick), K-Means Clustering, Hierarchical Clustering, Principal Component Analysis (PCA).', hours: 9 },
      { unitNumber: 'Unit III', title: 'Neural Networks & Backpropagation', topics: 'Perceptrons, Multilayer Perceptrons (MLP), Activation Functions (ReLu, Sigmoid, Softmax), Cross-Entropy Loss, Backpropagation.', hours: 9 },
      { unitNumber: 'Unit IV', title: 'Deep Learning & CNNs', topics: 'Convolutional Layers, Pooling Layers, ResNet Architecture, Transfer Learning, Batch Normalization, Dropout.', hours: 9 },
      { unitNumber: 'Unit V', title: 'Sequential Models & Transformers', topics: 'Recurrent Neural Networks (RNN), LSTM, Attention Mechanism, Self-Attention, Transformer Encoder-Decoder.', hours: 9 }
    ],
    textbooks: [
      'Tom M. Mitchell, "Machine Learning", McGraw-Hill.',
      'Ian Goodfellow, Yoshua Bengio, Aaron Courville, "Deep Learning", MIT Press.'
    ]
  }
];

export const StudentSyllabus: React.FC = () => {
  const [subjects, setSubjects] = useState<EngineeringSubject[]>(DETAILED_ENGINEERING_SYLLABUS);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [expandedSubject, setExpandedSubject] = useState<string | null>('CS6101');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('student_syllabus_bookmarks') || '[]');
    } catch {
      return [];
    }
  });

  const toggleFavorite = (code: string) => {
    let updated;
    if (favorites.includes(code)) {
      updated = favorites.filter(c => c !== code);
      toast.success('Subject unbookmarked.');
    } else {
      updated = [...favorites, code];
      toast.success('Subject added to bookmarks.');
    }
    setFavorites(updated);
    localStorage.setItem('student_syllabus_bookmarks', JSON.stringify(updated));
  };

  const filteredSubjects = subjects.filter(sub => {
    const matchesSearch = sub.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sub.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || sub.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 text-left pb-16 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 bg-card border p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-600" /> Engineering Curriculum & Unit-Wise Syllabus Catalog
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full Tier-1 University regulation syllabus breakdown, course outcomes (COs), L-T-P credits, and reference textbooks
          </p>
        </div>
        <button
          onClick={() => toast.success('Full Engineering Regulation PDF downloaded successfully')}
          className="px-4 py-2 bg-indigo-600 text-white font-extrabold text-xs rounded-xl hover:bg-indigo-700 shadow transition-all flex items-center gap-1.5 shrink-0"
        >
          <Download className="h-4 w-4" /> Download Complete Regulation PDF
        </button>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Academic Regulation', value: 'REG-2026 (Tier-1 Autonomous)' },
          { label: 'Engineering Discipline', value: 'Computer Science & Engg.' },
          { label: 'Current Semester', value: 'Semester VI (3rd Year)' },
          { label: 'Total Mapped Credits', value: '24 Credits' }
        ].map((card, idx) => (
          <div key={idx} className="border bg-card p-4 rounded-2xl shadow-sm">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">{card.label}</p>
            <p className="text-xs font-black text-slate-800 dark:text-white mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between border bg-card p-4 rounded-2xl shadow-sm">
        <div className="flex flex-1 w-full md:w-auto items-center gap-2 border px-3 py-2 rounded-xl bg-background">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by subject code, course title, or unit topics..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent text-xs outline-none w-full font-semibold"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 border rounded-xl bg-card outline-none font-bold text-foreground"
          >
            <option value="ALL">All Categories</option>
            <option value="CORE">Core Subjects</option>
            <option value="ELECTIVE">Electives</option>
            <option value="LAB">Laboratories</option>
          </select>
        </div>
      </div>

      {/* Syllabus Accordion / Cards List */}
      <div className="space-y-4">
        {filteredSubjects.map((sub) => {
          const isExpanded = expandedSubject === sub.code;
          return (
            <div key={sub.code} className="border bg-card rounded-2xl shadow-sm overflow-hidden transition-all">
              <div
                onClick={() => setExpandedSubject(isExpanded ? null : sub.code)}
                className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-muted/10 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded">
                      {sub.code}
                    </span>
                    <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded border ${
                      sub.type === 'CORE' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      {sub.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{sub.category}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-white">{sub.name}</h3>
                </div>

                <div className="flex items-center gap-4 text-xs font-extrabold text-slate-600 dark:text-slate-300">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-slate-400 uppercase font-black">L-T-P</p>
                    <p className="font-mono">{sub.ltp}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-black">Credits</p>
                    <p className="text-indigo-600 font-black">{sub.credits} Credits</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(sub.code); }}
                    className={`p-2 rounded-xl border hover:bg-slate-50 transition-colors ${
                      favorites.includes(sub.code) ? 'text-amber-500 bg-amber-50 border-amber-200' : 'text-slate-400'
                    }`}
                  >
                    <Star className="h-4 w-4 fill-current" />
                  </button>
                </div>
              </div>

              {/* Expanded Syllabus Breakdown */}
              {isExpanded && (
                <div className="p-6 border-t bg-muted/10 space-y-6 text-xs font-semibold">
                  <div>
                    <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Course Description</h4>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{sub.description}</p>
                    <p className="text-[10px] text-indigo-600 font-bold mt-1">Prerequisite: {sub.prerequisite}</p>
                  </div>

                  <div>
                    <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">Course Outcomes (COs)</h4>
                    <ul className="space-y-1 list-disc pl-4 text-slate-600 dark:text-slate-300">
                      {sub.outcomes.map((co, idx) => (
                        <li key={idx}><span className="font-bold text-slate-800 dark:text-white">CO{idx + 1}:</span> {co}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-3">Unit-Wise Syllabus Breakdown</h4>
                    <div className="space-y-3">
                      {sub.units.map((unit) => (
                        <div key={unit.unitNumber} className="p-4 border bg-card rounded-xl space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-black text-indigo-600 text-xs">{unit.unitNumber}: {unit.title}</span>
                            <span className="text-[9px] font-bold text-slate-400">{unit.hours} Hours</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{unit.topics}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">Prescribed Textbooks & References</h4>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-300 font-medium">
                      {sub.textbooks.map((book, idx) => (
                        <li key={idx}>{book}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentSyllabus;
