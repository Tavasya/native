import { createSlice } from "@reduxjs/toolkit";
import { ClassState } from "./types";
import { createClass, fetchClasses } from "./classThunks";

const initialState: ClassState = {
    classes: [],
    loading: false,
    error: null,
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
                state.loading = true;
                state.error = null;
            })
            .addCase(createClass.fulfilled, (state, action) => {
                state.loading = false;
                state.classes.push(action.payload); //push new class onto array
            })
            .addCase(createClass.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            //Fetch Classes
            .addCase(fetchClasses.pending, (state) => {
                state.loading = true;
                state.error = null;
              })
              .addCase(fetchClasses.fulfilled, (state, action) => {
                state.loading = false;
                state.classes = action.payload;
              })
              .addCase(fetchClasses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
              });
    }
})


export default classSlice.reducer;