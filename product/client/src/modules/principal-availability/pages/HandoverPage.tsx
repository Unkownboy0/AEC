import React from 'react';
import { HandoverSummaryCard } from '../components/HandoverSummaryCard';
import { useNavigate } from 'react-router-dom';

export const HandoverPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-white">Delegation Handover</h1>
      <HandoverSummaryCard
        onReviewReturned={() => navigate('/principal/approval-center')}
      />
    </div>
  );
};
