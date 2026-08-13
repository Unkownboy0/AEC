import React from 'react';
import { DepartmentAvailabilityBoard } from '../../components/availability/DepartmentAvailabilityBoard';

/**
 * Institution-wide availability must use the authoritative daily board.
 * The board only renders approved Leave/OD records returned by the API and
 * deliberately has no local/demo fallback data.
 */
export const InstitutionAvailabilityDashboard: React.FC = () => (
  <DepartmentAvailabilityBoard />
);

export default InstitutionAvailabilityDashboard;
