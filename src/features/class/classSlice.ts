import { createSlice } from "@reduxjs/toolkit";
import { ClassState, ClassStats } from "./types";
import { createClass, fetchClasses, fetchClassStatsByTeacher, deleteClass, joinClass } from "./classThunks";

const initialState: ClassState = {
    classes: [],
    classStats: [],
    loading: false,
    error: null,
    createClassLoading: false,
    deletingClassId: null,
};

const classSlice  = createSlice({
    name: "class",
    initialState,
    reducers: {
      //synchronous reducers  
    },
    extraReducers: (builder) => {
        //Handle CreateClass Thunk
        builder
            //Create Classes
            .addCase(createClass.pending, (state) => {
                state.createClassLoading = true;
                state.error = null;
            })
            .addCase(createClass.fulfilled, (state, action) => {
                state.createClassLoading = false;
                // Convert Class to ClassStats
                const classStats: ClassStats = {
                    id: action.payload.id,
                    name: action.payload.name,
                    class_code: action.payload.class_code,
                    teacher_id: action.payload.teacherId,
                    student_count: 0,
                    assignment_count: 0,
                    avg_grade: null
                };
                state.classes.push(classStats);
                // Add to classStats array as well
                state.classStats.push(classStats);
            })
            .addCase(createClass.rejected, (state, action) => {
                state.createClassLoading = false;
                state.error = action.payload as string;
            })

            //Fetch Classes
            .addCase(fetchClasses.pending, (state) => {
                state.loading = true;
                state.error = null;
              })
              .addCase(fetchClasses.fulfilled, (state, action) => {
                state.loading = false;
                // Convert Class[] to ClassStats[]
                state.classes = action.payload.map(cls => ({
                    id: cls.id,
                    name: cls.name,
                    class_code: cls.class_code,
                    teacher_id: cls.teacherId,
                    student_count: 0,
                    assignment_count: 0,
                    avg_grade: null
                }));
              })
              .addCase(fetchClasses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
              })

            //Fetch All Class Stats
            .addCase(fetchClassStatsByTeacher.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchClassStatsByTeacher.fulfilled, (state, action) => {
                state.loading = false;
                state.classStats = action.payload;
            })
            .addCase(fetchClassStatsByTeacher.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            //Delete Class
            .addCase(deleteClass.pending, (state, action) => {
                state.deletingClassId = action.meta.arg;
                state.error = null;
            })
            .addCase(deleteClass.fulfilled, (state, action) => {
                state.deletingClassId = null;
                state.classes = state.classes.filter(cls => cls.id !== action.payload);
                state.classStats = state.classStats.filter(cls => cls.id !== action.payload);
            })
            .addCase(deleteClass.rejected, (state, action) => {
                state.deletingClassId = null;
                state.error = action.payload as string;
            })

            //Join Class
            .addCase(joinClass.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(joinClass.fulfilled, (state, action) => {
                state.loading = false;
                // Convert joined class to ClassStats format
                const classStats: ClassStats = {
                    id: action.payload.id,
                    name: action.payload.name,
                    class_code: action.payload.class_code,
                    teacher_id: action.payload.teacherId,
                    student_count: 0,
                    assignment_count: 0,
                    avg_grade: null
                };
                state.classes.push(classStats);
            })
            .addCase(joinClass.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
    }
})

export default classSlice.reducer;