import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchFacultyRequestById } from '../api/facultyLeaveApi';
import { FacultyLeaveOdRequest } from '../types/facultyLeave.types';
import { ApprovalDetailLayout, adaptFacultyLeaveOdRequest } from '../../../../components/approval';

export const FacultyLeaveDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<FacultyLeaveOdRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchFacultyRequestById(id)
      .then(setRequest)
      .catch((err) => setError(err?.response?.data?.error ?? 'Request not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const viewModel = request ? adaptFacultyLeaveOdRequest(request, 'FACULTY') : null;

  return (
    <ApprovalDetailLayout
      request={viewModel}
      loading={loading}
      error={error}
      onBack={() => navigate(-1)}
      backLabel="Back to My Requests"
    />
  );
};

export default FacultyLeaveDetailPage;
