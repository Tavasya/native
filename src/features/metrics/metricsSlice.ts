// src/features/metrics/metricsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as service from './metricsService';
import {
  LastLogin,
  AssignmentMetric,
  TeacherLoginWeekly,
  TeacherAssignmentWeekly,
  StudentEngagement,
  InactiveUser,
  SubmissionTrend,
} from './metricsTypes';

interface MetricsState {
  lastLogins: LastLogin[];
  allLastLogins: LastLogin[];
  assignmentMetrics: AssignmentMetric[];
  teacherLoginsWeekly: TeacherLoginWeekly[];
  teacherAssignmentsWeekly: TeacherAssignmentWeekly[];
  studentEngagement: StudentEngagement[];
  inactiveUsers: InactiveUser[];
  selectedTeacher: AssignmentMetric | null;
  submissionTrends: SubmissionTrend[];
  userCreationData: {
    user_id: string;
    name: string;
    email: string;
    role: 'teacher' | 'student' | string;
    created_at: string;
    onboarding_completed_at?: string;
    view?: boolean;
  }[];

  // loading / error flags for each fetch
  loadingLastLogins: boolean;
  loadingAllLastLogins: boolean;
  loadingAssignmentMetrics: boolean;
  loadingTeacherLoginsWeekly: boolean;
  loadingTeacherAssignmentsWeekly: boolean;
  loadingStudentEngagement: boolean;
  loadingInactiveUsers: boolean;
  loadingUserCreationData: boolean;
  loadingSubmissionTrends: boolean;

  errorLastLogins: string | null;
  errorAllLastLogins: string | null;
  errorAssignmentMetrics: string | null;
  errorTeacherLoginsWeekly: string | null;
  errorTeacherAssignmentsWeekly: string | null;
  errorStudentEngagement: string | null;
  errorInactiveUsers: string | null;
  errorUserCreationData: string | null;
  errorSubmissionTrends: string | null;

  // hideUser
  hidingUser: boolean;
  errorHidingUser: string | null;

  // pagination
  usersPage: number;
  usersPerPage: number;
  hasMoreUsers: boolean;

  hidingAssignment: boolean;
  errorHidingAssignment: string | null;
}

const initialState: MetricsState = {
  lastLogins: [],
  allLastLogins: [],
  assignmentMetrics: [],
  teacherLoginsWeekly: [],
  teacherAssignmentsWeekly: [],
  studentEngagement: [],
  inactiveUsers: [],
  selectedTeacher: null,
  submissionTrends: [],
  userCreationData: [],

  loadingLastLogins: false,
  loadingAllLastLogins: false,
  loadingAssignmentMetrics: false,
  loadingTeacherLoginsWeekly: false,
  loadingTeacherAssignmentsWeekly: false,
  loadingStudentEngagement: false,
  loadingInactiveUsers: false,
  loadingUserCreationData: false,
  loadingSubmissionTrends: false,

  errorLastLogins: null,
  errorAllLastLogins: null,
  errorAssignmentMetrics: null,
  errorTeacherLoginsWeekly: null,
  errorTeacherAssignmentsWeekly: null,
  errorStudentEngagement: null,
  errorInactiveUsers: null,
  errorUserCreationData: null,
  errorSubmissionTrends: null,

  hidingUser: false,
  errorHidingUser: null,

  // pagination
  usersPage: 1,
  usersPerPage: 20,
  hasMoreUsers: true,

  hidingAssignment: false,
  errorHidingAssignment: null,
};

/** Thunks **/
export const fetchLastLogins = createAsyncThunk<
  LastLogin[],
  { page: number; perPage: number },
  { rejectValue: string }
>('metrics/fetchLastLogins', async ({ page, perPage }, { rejectWithValue }) => {
  try {
    return await service.getLastLogins(page, perPage);
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

export const fetchAssignmentMetrics = createAsyncThunk<
  AssignmentMetric[],
  void,
  { rejectValue: string }
>('metrics/fetchAssignmentMetrics', async (_, { rejectWithValue }) => {
  try {
    return await service.getAssignmentMetrics();
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

export const fetchTeacherLoginsWeekly = createAsyncThunk<
  TeacherLoginWeekly[],
  void,
  { rejectValue: string }
>('metrics/fetchTeacherLoginsWeekly', async (_, { rejectWithValue }) => {
  try {
    return await service.getTeacherLoginsWeekly();
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

export const fetchTeacherAssignmentsWeekly = createAsyncThunk<
  TeacherAssignmentWeekly[],
  void,
  { rejectValue: string }
>('metrics/fetchTeacherAssignmentsWeekly', async (_, { rejectWithValue }) => {
  try {
    return await service.getTeacherAssignmentsWeekly();
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

export const fetchStudentEngagement = createAsyncThunk<
  StudentEngagement[],
  void,
  { rejectValue: string }
>('metrics/fetchStudentEngagement', async (_, { rejectWithValue }) => {
  try {
    return await service.getStudentEngagement();
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

export const fetchInactiveUsers = createAsyncThunk<
  InactiveUser[],
  void,
  { rejectValue: string }
>('metrics/fetchInactiveUsers', async (_, { rejectWithValue }) => {
  try {
    return await service.getInactiveUsers();
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

export const fetchAllLastLogins = createAsyncThunk<
  LastLogin[],
  void,
  { rejectValue: string }
>('metrics/fetchAllLastLogins', async (_, { rejectWithValue }) => {
  try {
    return await service.getAllLastLogins();
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

export const fetchUserCreationData = createAsyncThunk<
  {
    user_id: string;
    name: string;
    email: string;
    role: 'teacher' | 'student' | string;
    created_at: string;
    onboarding_completed_at?: string;
    view?: boolean;
  }[],
  void,
  { rejectValue: string }
>('metrics/fetchUserCreationData', async (_, { rejectWithValue }) => {
  try {
    return await service.getUserCreationData();
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

export const fetchSubmissionTrends = createAsyncThunk<
  SubmissionTrend[],
  void,
  { rejectValue: string }
>('metrics/fetchSubmissionTrends', async (_, { rejectWithValue }) => {
  try {
    return await service.getSubmissionTrends();
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

/**
 * New thunk: hide a user by ID, then re-fetch lastLogins table.
 */
export const hideUserById = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>('metrics/hideUserById', async (userId, { rejectWithValue }) => {
  try {
    // Call our service helper to set view = false
    await service.hideUser(userId);
    
    // No need to re-fetch the entire list, we'll update the state directly
    // The fulfilled case in the reducer will handle removing the user
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

/**
 * New thunk: hide an assignment by ID
 */
export const hideAssignmentById = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>('metrics/hideAssignmentById', async (assignmentId, { rejectWithValue, dispatch }) => {
  try {
    await service.hideAssignment(assignmentId);
    // Update the assignment metrics to reflect the hidden assignment
    dispatch(fetchAssignmentMetrics());
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

/** Slice **/
const metricsSlice = createSlice({
  name: 'metrics',
  initialState,
  reducers: {
    clearMetrics(state) {
      state.lastLogins = [];
      state.allLastLogins = [];
      state.assignmentMetrics = [];
      state.teacherLoginsWeekly = [];
      state.teacherAssignmentsWeekly = [];
      state.studentEngagement = [];
      state.inactiveUsers = [];
      state.userCreationData = [];
      state.submissionTrends = [];

      state.loadingLastLogins = false;
      state.loadingAllLastLogins = false;
      state.loadingAssignmentMetrics = false;
      state.loadingTeacherLoginsWeekly = false;
      state.loadingTeacherAssignmentsWeekly = false;
      state.loadingStudentEngagement = false;
      state.loadingInactiveUsers = false;
      state.loadingUserCreationData = false;
      state.loadingSubmissionTrends = false;

      state.errorLastLogins = null;
      state.errorAllLastLogins = null;
      state.errorAssignmentMetrics = null;
      state.errorTeacherLoginsWeekly = null;
      state.errorTeacherAssignmentsWeekly = null;
      state.errorStudentEngagement = null;
      state.errorInactiveUsers = null;
      state.errorUserCreationData = null;
      state.errorSubmissionTrends = null;

      state.hidingUser = false;
      state.errorHidingUser = null;

      // Reset pagination
      state.usersPage = 1;
      state.hasMoreUsers = true;
    },
    loadMoreUsers(state) {
      state.usersPage += 1;
    },
    removeUserFromList(state, action: PayloadAction<string>) {
      state.lastLogins = state.lastLogins.filter(user => user.user_id !== action.payload);
    },
    setSelectedTeacher(state, action: PayloadAction<AssignmentMetric>) {
      state.selectedTeacher = action.payload;
    },
    clearSelectedTeacher(state) {
      state.selectedTeacher = null;
    },
    setLastLogins(state, action: PayloadAction<LastLogin[]>) {
      state.lastLogins = action.payload;
    }
  },
  extraReducers: (builder) => {
    /** fetchLastLogins **/
    builder
      .addCase(fetchLastLogins.pending, (state) => {
        state.loadingLastLogins = true;
        state.errorLastLogins = null;
      })
      .addCase(
        fetchLastLogins.fulfilled,
        (state, action: PayloadAction<LastLogin[]>) => {
          state.loadingLastLogins = false;
          if (state.usersPage === 1) {
            state.lastLogins = action.payload;
          } else {
            state.lastLogins = [...state.lastLogins, ...action.payload];
          }
          state.hasMoreUsers = action.payload.length === state.usersPerPage;
        }
      )
      .addCase(fetchLastLogins.rejected, (state, action) => {
        state.loadingLastLogins = false;
        state.errorLastLogins = action.payload || action.error.message || 'Error';
      });

    /** fetchAssignmentMetrics **/
    builder
      .addCase(fetchAssignmentMetrics.pending, (state) => {
        state.loadingAssignmentMetrics = true;
        state.errorAssignmentMetrics = null;
      })
      .addCase(
        fetchAssignmentMetrics.fulfilled,
        (state, action: PayloadAction<AssignmentMetric[]>) => {
          state.loadingAssignmentMetrics = false;
          state.assignmentMetrics = action.payload;
        }
      )
      .addCase(fetchAssignmentMetrics.rejected, (state, action) => {
        state.loadingAssignmentMetrics = false;
        state.errorAssignmentMetrics = action.payload || action.error.message || 'Error';
      });

    /** fetchTeacherLoginsWeekly **/
    builder
      .addCase(fetchTeacherLoginsWeekly.pending, (state) => {
        state.loadingTeacherLoginsWeekly = true;
        state.errorTeacherLoginsWeekly = null;
      })
      .addCase(
        fetchTeacherLoginsWeekly.fulfilled,
        (state, action: PayloadAction<TeacherLoginWeekly[]>) => {
          state.loadingTeacherLoginsWeekly = false;
          state.teacherLoginsWeekly = action.payload;
        }
      )
      .addCase(fetchTeacherLoginsWeekly.rejected, (state, action) => {
        state.loadingTeacherLoginsWeekly = false;
        state.errorTeacherLoginsWeekly = action.payload || action.error.message || 'Error';
      });

    /** fetchTeacherAssignmentsWeekly **/
    builder
      .addCase(fetchTeacherAssignmentsWeekly.pending, (state) => {
        state.loadingTeacherAssignmentsWeekly = true;
        state.errorTeacherAssignmentsWeekly = null;
      })
      .addCase(
        fetchTeacherAssignmentsWeekly.fulfilled,
        (state, action: PayloadAction<TeacherAssignmentWeekly[]>) => {
          state.loadingTeacherAssignmentsWeekly = false;
          state.teacherAssignmentsWeekly = action.payload;
        }
      )
      .addCase(fetchTeacherAssignmentsWeekly.rejected, (state, action) => {
        state.loadingTeacherAssignmentsWeekly = false;
        state.errorTeacherAssignmentsWeekly = action.payload || action.error.message || 'Error';
      });

    /** fetchStudentEngagement **/
    builder
      .addCase(fetchStudentEngagement.pending, (state) => {
        state.loadingStudentEngagement = true;
        state.errorStudentEngagement = null;
      })
      .addCase(
        fetchStudentEngagement.fulfilled,
        (state, action: PayloadAction<StudentEngagement[]>) => {
          state.loadingStudentEngagement = false;
          state.studentEngagement = action.payload;
        }
      )
      .addCase(fetchStudentEngagement.rejected, (state, action) => {
        state.loadingStudentEngagement = false;
        state.errorStudentEngagement = action.payload || action.error.message || 'Error';
      });

    /** fetchInactiveUsers **/
    builder
      .addCase(fetchInactiveUsers.pending, (state) => {
        state.loadingInactiveUsers = true;
        state.errorInactiveUsers = null;
      })
      .addCase(
        fetchInactiveUsers.fulfilled,
        (state, action: PayloadAction<InactiveUser[]>) => {
          state.loadingInactiveUsers = false;
          state.inactiveUsers = action.payload;
        }
      )
      .addCase(fetchInactiveUsers.rejected, (state, action) => {
        state.loadingInactiveUsers = false;
        state.errorInactiveUsers = action.payload || action.error.message || 'Error';
      });

    /** fetchAllLastLogins **/
    builder
      .addCase(fetchAllLastLogins.pending, (state) => {
        state.loadingAllLastLogins = true;
        state.errorAllLastLogins = null;
      })
      .addCase(fetchAllLastLogins.fulfilled, (state, action: PayloadAction<LastLogin[]>) => {
        state.loadingAllLastLogins = false;
        state.allLastLogins = action.payload;
      })
      .addCase(fetchAllLastLogins.rejected, (state, action) => {
        state.loadingAllLastLogins = false;
        state.errorAllLastLogins = action.payload || action.error.message || 'Error';
      });

    /** fetchUserCreationData **/
    builder
      .addCase(fetchUserCreationData.pending, (state) => {
        state.loadingUserCreationData = true;
        state.errorUserCreationData = null;
      })
      .addCase(
        fetchUserCreationData.fulfilled,
        (state, action: PayloadAction<{
          user_id: string;
          name: string;
          email: string;
          role: 'teacher' | 'student' | string;
          created_at: string;
          onboarding_completed_at?: string;
          view?: boolean;
        }[]>) => {
          state.loadingUserCreationData = false;
          state.userCreationData = action.payload;
        }
      )
      .addCase(fetchUserCreationData.rejected, (state, action) => {
        state.loadingUserCreationData = false;
        state.errorUserCreationData = action.payload || action.error.message || 'Error';
      });

    /** fetchSubmissionTrends **/
    builder
      .addCase(fetchSubmissionTrends.pending, (state) => {
        state.loadingSubmissionTrends = true;
        state.errorSubmissionTrends = null;
      })
      .addCase(
        fetchSubmissionTrends.fulfilled,
        (state, action: PayloadAction<SubmissionTrend[]>) => {
          state.loadingSubmissionTrends = false;
          state.submissionTrends = action.payload;
        }
      )
      .addCase(fetchSubmissionTrends.rejected, (state, action) => {
        state.loadingSubmissionTrends = false;
        state.errorSubmissionTrends = action.payload || action.error.message || 'Error';
      });

    /** hideUserById **/
    builder
      .addCase(hideUserById.pending, (state) => {
        state.hidingUser = true;
        state.errorHidingUser = null;
      })
      .addCase(hideUserById.fulfilled, (state, action) => {
        state.hidingUser = false;
        state.lastLogins = state.lastLogins.filter(user => user.user_id !== action.meta.arg);
      })
      .addCase(hideUserById.rejected, (state, action) => {
        state.hidingUser = false;
        state.errorHidingUser = action.payload || action.error.message || 'Failed to hide user';
      });

    /** hideAssignmentById **/
    builder
      .addCase(hideAssignmentById.pending, (state) => {
        state.hidingAssignment = true;
        state.errorHidingAssignment = null;
      })
      .addCase(hideAssignmentById.fulfilled, (state) => {
        state.hidingAssignment = false;
      })
      .addCase(hideAssignmentById.rejected, (state, action) => {
        state.hidingAssignment = false;
        state.errorHidingAssignment = action.payload || action.error.message || 'Failed to hide assignment';
      });
  },
});

export const { 
  clearMetrics, 
  loadMoreUsers, 
  removeUserFromList,
  setSelectedTeacher,
  clearSelectedTeacher,
  setLastLogins
} = metricsSlice.actions;
export default metricsSlice.reducer;
