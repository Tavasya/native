import React, { useEffect, useState, useCallback } from 'react'
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { useNavigate } from 'react-router-dom';
import { createClass, deleteClass, fetchClassStatsByTeacher } from '@/features/class/classThunks';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 20px;
`;

const Header = styled.header`
  background: #2a2a2a;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: opacity 0.3s ease-in-out;
`;

const Title = styled.h1`
  font-size: 32px;
  color: #fff;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: #ccc;
`;

const QuickActions = styled.div`
  background: #2a2a2a;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: opacity 0.3s ease-in-out;
`;

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
`;

const ActionButton = styled.button<{ $background: string }>`
  color: white;
  padding: 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  background: ${props => props.$background};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
`;

const ClassesList = styled.div`
  background: #2a2a2a;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  transition: opacity 0.3s ease-in-out;
`;

const Table = styled.table`
  width: 100%;
  color: #fff;
  border-collapse: collapse;
`;

const TableRow = styled.tr<{ $isDeleting: boolean }>`
  cursor: pointer;
  background-color: ${props => props.$isDeleting ? '#2a2a2a' : 'inherit'};
  transition: background 0.2s;

  &:hover {
    background-color: #333;
  }
`;

const DeleteButton = styled.button`
  padding: 6px 12px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #c82333;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #2a2a2a;
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  color: #fff;
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #fff;
  font-size: 16px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  background-color: #363636;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 16px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const ModalButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 12px 20px;
  background-color: ${props => props.$variant === 'primary' ? '#4CAF50' : '#555'};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.$variant === 'primary' ? '#45a049' : '#666'};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

export default function TeacherDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classData, setClassData] = useState({ name: '' });
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector(state => state.auth);
  const { classStats, loading, createClassLoading, deletingClassId } = useAppSelector(state => state.classes);

  const fetchClasses = useCallback(() => {
    if (user) {
      dispatch(fetchClassStatsByTeacher(user.id));
    }
  }, [user, dispatch]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const generateClassCode = useCallback((length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  }, []);

  const handleCreateClass = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const class_code = generateClassCode();
    await dispatch(createClass({ ...classData, teacher_id: user.id, class_code }));
    setClassData({ name: '' });
    setIsModalOpen(false);
  }, [user, classData, dispatch, generateClassCode]);

  const handleDeleteClass = useCallback(async (classId: string) => {
    if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      await dispatch(deleteClass(classId));
    }
  }, [dispatch]);

  const handleRowClick = useCallback((classId: string) => {
    navigate(`/teacher/class/${classId}`);
  }, [navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardContainer>
      <Header>
        <Title>Teacher Dashboard</Title>
        <Subtitle>Welcome, {user?.name || 'Teacher'}!</Subtitle>
      </Header>

      <QuickActions>
        <h2 style={{ fontSize: '24px', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🛠️ Dev Mode Quick Actions
        </h2>
        <ButtonGrid>
          <ActionButton
            onClick={() => setIsModalOpen(true)}
            $background="#4CAF50"
          >
            <span style={{ fontSize: '24px' }}>📚</span>
            Create Class
          </ActionButton>
          <ActionButton
            onClick={() => console.log('View Students clicked')}
            $background="#2196F3"
          >
            <span style={{ fontSize: '24px' }}>👥</span>
            View Students
          </ActionButton>
          <ActionButton
            onClick={() => console.log('View Analytics clicked')}
            $background="#9C27B0"
          >
            <span style={{ fontSize: '24px' }}>📊</span>
            View Analytics
          </ActionButton>
        </ButtonGrid>
      </QuickActions>

      <ClassesList>
        <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '16px' }}>Your Classes</h3>
        <Table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px' }}>Class Name</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Class Code</th>
              <th style={{ textAlign: 'left', padding: '8px' }}># Students</th>
              <th style={{ textAlign: 'left', padding: '8px' }}># Assignments</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Avg Grade</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classStats.map(cls => (
              <TableRow
                key={cls.id}
                onClick={() => handleRowClick(cls.id)}
                $isDeleting={deletingClassId === cls.id}
              >
                <td style={{ padding: '8px' }}>{cls.name}</td>
                <td style={{ padding: '8px' }}>{cls.class_code}</td>
                <td style={{ padding: '8px' }}>{cls.student_count || 0}</td>
                <td style={{ padding: '8px' }}>{cls.assignment_count || 0}</td>
                <td style={{ padding: '8px' }}>
                  {cls.avg_grade !== null && cls.avg_grade !== undefined ? `${cls.avg_grade}%` : 'N/A'}
                </td>
                <td style={{ padding: '8px' }}>
                  <DeleteButton
                    disabled={deletingClassId === cls.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClass(cls.id);
                    }}
                  >
                    {deletingClassId === cls.id ? "Deleting..." : "Delete"}
                  </DeleteButton>
                </td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </ClassesList>

      {isModalOpen && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>Create New Class</ModalTitle>
            <form onSubmit={handleCreateClass}>
              <FormGroup>
                <Label>Class Name</Label>
                <Input
                  type="text"
                  value={classData.name}
                  onChange={(e) => setClassData({...classData, name: e.target.value})}
                  required
                  disabled={createClassLoading}
                />
              </FormGroup>
              <ButtonGroup>
                <ModalButton
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={createClassLoading}
                >
                  Cancel
                </ModalButton>
                <ModalButton
                  type="submit"
                  $variant="primary"
                  disabled={createClassLoading}
                >
                  {createClassLoading ? "Creating..." : "Create Class"}
                </ModalButton>
              </ButtonGroup>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
    </DashboardContainer>
  );
}