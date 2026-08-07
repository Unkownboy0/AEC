import React from 'react';
import { DepartmentAvailabilityBoard } from '../../components/availability/DepartmentAvailabilityBoard';

export const DepartmentAvailabilityPage: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in-50 duration-200">
      <DepartmentAvailabilityBoard />
    </div>
  );
};
