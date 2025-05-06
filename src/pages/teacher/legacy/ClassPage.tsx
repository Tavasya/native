// import React, { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useAppSelector, useAppDispatch } from '@/app/hooks';
// import { fetchClasses, fetchClassStatsByTeacher } from '@/features/class/classThunks';
// import { fetchAssignmentByClass, createAssignment } from '@/features/assignments/assignmentThunks';
// import { Question } from '@/features/assignments/types';
// import Modal from '@/components/Modal';
// import AssignmentList from '@/components/AssignmentList';

// const buttonBaseStyle = {
//   color: 'white',
//   padding: '20px',
//   border: 'none',
//   borderRadius: '8px',
//   cursor: 'pointer',
//   fontSize: '16px',
//   display: 'flex',
//   flexDirection: 'column',
//   alignItems: 'center',
//   gap: '8px',
//   transition: 'all 0.2s ease'
// } as const;

// export default function ClassPage() {
//   const { classId } = useParams<{ classId: string }>();
//   const navigate = useNavigate();
//   const dispatch = useAppDispatch();
//   const { user } = useAppSelector(state => state.auth);
//   const { classStats, loading: classLoading } = useAppSelector(state => state.classes);
//   const { assignments, loading: assignmentLoading } = useAppSelector(state => state.assignments);
//   const [isCreateAssignmentModalOpen, setIsCreateAssignmentModalOpen] = useState(false);
//   const [assignmentData, setAssignmentData] = useState({
//     title: '',
//     dueDate: '',
//     topic: '',
//     questions: [{
//       text: '',
//       showExample: false,
//       example: ''
//     }] as Question[]
//   });

//   // Find the current class from both classes and classStats arrays
//   const currentClass = classStats.find(cls => cls.id === classId);

//   // Fetch class and assignment data
//   useEffect(() => {
//     if (user) {
//       // Fetch both regular class data and class stats
//       dispatch(fetchClasses({ role: 'teacher', userId: user.id }));
//       dispatch(fetchClassStatsByTeacher(user.id));
//     }
//     if (classId) {
//       dispatch(fetchAssignmentByClass(classId));
//     }
//   }, [user, dispatch, classId]);

//   // Mouse event handlers
//   const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
//     const btn = e.currentTarget;
//     btn.style.transform = 'translateY(-2px)';
//     btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
//   };
  
//   const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
//     const btn = e.currentTarget;
//     btn.style.transform = 'none';
//     btn.style.boxShadow = 'none';
//   };

//   const handleCreateAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!classId) return;

//     const newAssignment = {
//       class_id: classId,
//       title: assignmentData.title,
//       due_date: assignmentData.dueDate,
//       topic: assignmentData.topic,
//       questions: assignmentData.questions
//     };

//     await dispatch(createAssignment(newAssignment));
//     setIsCreateAssignmentModalOpen(false);
//     setAssignmentData({
//       title: '',
//       dueDate: '',
//       topic: '',
//       questions: [{
//         text: '',
//         showExample: false,
//         example: ''
//       }]
//     });
//   };

//   const addQuestion = () => {
//     setAssignmentData({
//       ...assignmentData,
//       questions: [...assignmentData.questions, {
//         text: '',
//         showExample: false,
//         example: ''
//       }]
//     });
//   };

//   const removeQuestion = (index: number) => {
//     const newQuestions = [...assignmentData.questions];
//     newQuestions.splice(index, 1);
//     setAssignmentData({
//       ...assignmentData,
//       questions: newQuestions
//     });
//   };

//   const updateQuestion = (index: number, field: 'text' | 'example', value: string) => {
//     const newQuestions = [...assignmentData.questions];
//     newQuestions[index] = {
//       ...newQuestions[index],
//       [field]: value
//     };
//     setAssignmentData({
//       ...assignmentData,
//       questions: newQuestions
//     });
//   };

//   const toggleExample = (index: number) => {
//     const newQuestions = [...assignmentData.questions];
//     newQuestions[index] = {
//       ...newQuestions[index],
//       showExample: !newQuestions[index].showExample
//     };
//     setAssignmentData({
//       ...assignmentData,
//       questions: newQuestions
//     });
//   };

//   if (currentClass) {
//     return (
//       <div style={{ 
//         maxWidth: '1200px', 
//         margin: '40px auto',
//         padding: '0 20px'
//       }}>
//         <header style={{
//           background: '#2a2a2a',
//           padding: '24px',
//           borderRadius: '12px',
//           marginBottom: '24px',
//           boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
//         }}>
//           <h1 style={{ 
//             fontSize: '32px',
//             color: '#fff',
//             marginBottom: '8px'
//           }}>{currentClass.name}</h1>
//           <p style={{ 
//             fontSize: '18px',
//             color: '#ccc'
//           }}>Class Code: {currentClass.class_code}</p>
//         </header>

//         {/* Quick Actions */}
//         <div style={{ 
//           background: '#2a2a2a',
//           padding: '24px',
//           borderRadius: '12px',
//           marginBottom: '24px',
//           boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
//         }}>
//           <h2 style={{ 
//             fontSize: '24px',
//             color: '#fff',
//             marginBottom: '20px',
//             display: 'flex',
//             alignItems: 'center',
//             gap: '8px'
//           }}>
//             🛠️ Quick Actions
//           </h2>
//           <div style={{ 
//             display: 'grid',
//             gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
//             gap: '16px'
//           }}>
//             <button
//   onClick={() => navigate(`/teacher/class/${classId}/create-assignment`)}
//   onMouseEnter={handleMouseEnter}
//   onMouseLeave={handleMouseLeave}
//   style={{
//     ...buttonBaseStyle,
//     background: '#FF9800',
//   }}
// >
//   <span style={{ fontSize: '24px' }}>📝</span>
//   Create Assignment
// </button>
//             <button
//               onClick={() => console.log('View Students clicked')}
//               onMouseEnter={handleMouseEnter}
//               onMouseLeave={handleMouseLeave}
//               style={{
//                 ...buttonBaseStyle,
//                 background: '#2196F3',
//               }}
//             >
//               <span style={{ fontSize: '24px' }}>👥</span>
//               View Students
//             </button>
//             <button
//               onClick={() => console.log('View Analytics clicked')}
//               onMouseEnter={handleMouseEnter}
//               onMouseLeave={handleMouseLeave}
//               style={{
//                 ...buttonBaseStyle,
//                 background: '#9C27B0',
//               }}
//             >
//               <span style={{ fontSize: '24px' }}>📊</span>
//               View Analytics
//             </button>
//           </div>
//         </div>

//         {/* Assignments Section */}
//         <div style={{ 
//           background: '#2a2a2a',
//           padding: '24px',
//           borderRadius: '12px',
//           marginBottom: '24px',
//           boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
//         }}>
//           <h2 style={{ 
//             fontSize: '24px',
//             color: '#fff',
//             marginBottom: '20px',
//             display: 'flex',
//             alignItems: 'center',
//             gap: '8px'
//           }}>
//             📚 Assignments
//           </h2>
//           {assignmentLoading ? (
//             <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
//               Loading assignments...
//             </div>
//           ) : (
//             <AssignmentList assignments={assignments} />
//           )}
//         </div>

//         <div style={{
//           display: 'grid',
//           gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
//           gap: '20px',
//           marginBottom: '24px'
//         }}>
//           <div style={{
//             background: '#2a2a2a',
//             padding: '20px',
//             borderRadius: '12px',
//             boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
//           }}>
//             <h3 style={{ color: '#fff', marginBottom: '8px' }}>Students</h3>
//             <p style={{ fontSize: '24px', color: '#fff' }}>{currentClass.student_count}</p>
//           </div>
//           <div style={{
//             background: '#2a2a2a',
//             padding: '20px',
//             borderRadius: '12px',
//             boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
//           }}>
//             <h3 style={{ color: '#fff', marginBottom: '8px' }}>Assignments</h3>
//             <p style={{ fontSize: '24px', color: '#fff' }}>{currentClass.assignment_count}</p>
//           </div>
//           <div style={{
//             background: '#2a2a2a',
//             padding: '20px',
//             borderRadius: '12px',
//             boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
//           }}>
//             <h3 style={{ color: '#fff', marginBottom: '8px' }}>Average Grade</h3>
//             <p style={{ fontSize: '24px', color: '#fff' }}>
//               {currentClass.avg_grade !== null ? `${currentClass.avg_grade}%` : 'N/A'}
//             </p>
//           </div>
//         </div>

//         {/* Placeholder for future content */}
//         <div style={{
//           background: '#2a2a2a',
//           padding: '24px',
//           borderRadius: '12px',
//           boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
//         }}>
//           <h2 style={{ color: '#fff', marginBottom: '16px' }}>Class Content</h2>
//           <p style={{ color: '#ccc' }}>More class details and actions will be added here.</p>
//         </div>

//         {/* Create Assignment Modal */}
//         <Modal
//           isOpen={isCreateAssignmentModalOpen}
//           onClose={() => setIsCreateAssignmentModalOpen(false)}
//           title="Create New Assignment"
//         >
//           <form onSubmit={handleCreateAssignment} style={{ color: '#fff' }}>
//             <div style={{ marginBottom: '20px' }}>
//               <label style={{ display: 'block', marginBottom: '8px' }}>
//                 Title:
//                 <input
//                   type="text"
//                   value={assignmentData.title}
//                   onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
//                   required
//                   style={{
//                     width: '100%',
//                     padding: '8px',
//                     borderRadius: '4px',
//                     border: '1px solid #444',
//                     background: '#333',
//                     color: '#fff'
//                   }}
//                 />
//               </label>
//             </div>

//             <div style={{ marginBottom: '20px' }}>
//               <label style={{ display: 'block', marginBottom: '8px' }}>
//                 Due Date:
//                 <input
//                   type="datetime-local"
//                   value={assignmentData.dueDate}
//                   onChange={(e) => setAssignmentData({ ...assignmentData, dueDate: e.target.value })}
//                   required
//                   style={{
//                     width: '100%',
//                     padding: '8px',
//                     borderRadius: '4px',
//                     border: '1px solid #444',
//                     background: '#333',
//                     color: '#fff'
//                   }}
//                 />
//               </label>
//             </div>

//             <div style={{ marginBottom: '20px' }}>
//               <label style={{ display: 'block', marginBottom: '8px' }}>
//                 Topic (optional):
//                 <input
//                   type="text"
//                   value={assignmentData.topic}
//                   onChange={(e) => setAssignmentData({ ...assignmentData, topic: e.target.value })}
//                   style={{
//                     width: '100%',
//                     padding: '8px',
//                     borderRadius: '4px',
//                     border: '1px solid #444',
//                     background: '#333',
//                     color: '#fff'
//                   }}
//                 />
//               </label>
//             </div>

//             <div style={{ marginBottom: '20px' }}>
//               <h3 style={{ marginBottom: '16px' }}>Questions</h3>
//               {assignmentData.questions.map((question, index) => (
//                 <div key={index} style={{ 
//                   marginBottom: '16px',
//                   padding: '16px',
//                   border: '1px solid #444',
//                   borderRadius: '8px'
//                 }}>
//                   <div style={{ marginBottom: '12px' }}>
//                     <label style={{ display: 'block', marginBottom: '8px' }}>
//                       Question {index + 1}:
//                       <textarea
//                         value={question.text}
//                         onChange={(e) => updateQuestion(index, 'text', e.target.value)}
//                         required
//                         style={{
//                           width: '100%',
//                           padding: '8px',
//                           borderRadius: '4px',
//                           border: '1px solid #444',
//                           background: '#333',
//                           color: '#fff',
//                           minHeight: '100px'
//                         }}
//                       />
//                     </label>
//                   </div>

//                   <div style={{ marginBottom: '12px' }}>
//                     <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                       <input
//                         type="checkbox"
//                         checked={question.showExample}
//                         onChange={() => toggleExample(index)}
//                       />
//                       Include Example
//                     </label>
//                   </div>

//                   {question.showExample && (
//                     <div style={{ marginBottom: '12px' }}>
//                       <label style={{ display: 'block', marginBottom: '8px' }}>
//                         Example:
//                         <textarea
//                           value={question.example}
//                           onChange={(e) => updateQuestion(index, 'example', e.target.value)}
//                           required
//                           style={{
//                             width: '100%',
//                             padding: '8px',
//                             borderRadius: '4px',
//                             border: '1px solid #444',
//                             background: '#333',
//                             color: '#fff',
//                             minHeight: '100px'
//                           }}
//                         />
//                       </label>
//                     </div>
//                   )}

//                   {assignmentData.questions.length > 1 && (
//                     <button
//                       type="button"
//                       onClick={() => removeQuestion(index)}
//                       style={{
//                         background: '#ff4444',
//                         color: 'white',
//                         border: 'none',
//                         borderRadius: '4px',
//                         padding: '8px 12px',
//                         cursor: 'pointer'
//                       }}
//                     >
//                       Remove Question
//                     </button>
//                   )}
//                 </div>
//               ))}

//               <button
//                 type="button"
//                 onClick={addQuestion}
//                 style={{
//                   background: '#4CAF50',
//                   color: 'white',
//                   border: 'none',
//                   borderRadius: '4px',
//                   padding: '8px 12px',
//                   cursor: 'pointer',
//                   marginRight: '8px'
//                 }}
//               >
//                 Add Question
//               </button>
//             </div>

//             <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
//             <button
//   onClick={() => navigate(`/teacher/class/${classId}`)}
//   style={{
//     padding: '12px 24px',
//     borderRadius: '8px',
//     border: 'none',
//     backgroundColor: '#666',
//     color: '#fff',
//     cursor: 'pointer',
//     fontSize: '16px',
//     marginBottom: '24px' // or marginTop if at bottom
//   }}
// >
//   Cancel
// </button>
//               <button
//                 type="submit"
//                 style={{
//                   background: '#2196F3',
//                   color: 'white',
//                   border: 'none',
//                   borderRadius: '4px',
//                   padding: '8px 16px',
//                   cursor: 'pointer'
//                 }}
//               >
//                 Create Assignment
//               </button>
//             </div>
//           </form>
//         </Modal>
//       </div>
//     );
//   }

//   // If we're loading and don't have the class, show a loading state
//   if (classLoading) {
//     return (
//       <div style={{ 
//         maxWidth: '1200px', 
//         margin: '40px auto',
//         padding: '0 20px',
//         opacity: 0.7,
//         transition: 'opacity 0.3s ease-in-out'
//       }}>
//         <div style={{ color: '#fff', padding: '20px' }}>Loading class details...</div>
//       </div>
//     );
//   }

//   // If we're not loading and don't have the class, it doesn't exist
//   return (
//     <div style={{ 
//       maxWidth: '1200px', 
//       margin: '40px auto',
//       padding: '0 20px',
//       opacity: 0.7,
//       transition: 'opacity 0.3s ease-in-out'
//     }}>
//       <div style={{ color: '#fff', padding: '20px' }}>Class not found</div>
//     </div>
//   );
// } 