import { createAsyncThunk } from "@reduxjs/toolkit";
import { CreateClassDto } from "./types";
import { classService } from "./classService";

export const createClass = createAsyncThunk(
    'class/createClass',
    async (classData: CreateClassDto, { rejectWithValue }) => {
        try {
            return await classService.createClass(classData);
        } catch (error) {
            return rejectWithValue((error as Error).message)
        }
    }
)

export const fetchClasses = createAsyncThunk(
    'class/fetchClasses',
    async (
        { role, userId }: { role: string, userId: string },
        { rejectWithValue }
    ) => {
        try {
            if (role === "teacher") {
                return await classService.getClassesByTeacher(userId);
            }
            if (role === "student") {
                return await classService.getClassesByStudent(userId);
            }
            throw new Error('Invalid user role');
        } catch (error) {
            return rejectWithValue((error as Error).message);
        }
    }
)

export const fetchClassStatsByTeacher = createAsyncThunk(
    'class/fetchClassStatsByTeacher',
    async (teacherId: string, { rejectWithValue }) => {
        try {
            return await classService.getClassStatsByTeacher(teacherId);
        } catch (error) {
            return rejectWithValue((error as Error).message)
        }
    }
)

export const deleteClass = createAsyncThunk(
    'class/deleteClass',
    async (classId: string, { rejectWithValue }) => {
        try {
            await classService.deleteClass(classId);
            return classId;
        } catch (error) {
            return rejectWithValue((error as Error).message)
        }
    }
)

