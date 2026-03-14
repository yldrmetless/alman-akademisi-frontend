import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ExamStatePhase = 'intro' | 'active' | 'result';

export interface UserAnswer {
    questionId: number;
    optionId: number;
    isCorrect: boolean;
}

interface ExamEngineState {
    phase: ExamStatePhase;
    currentQuestionIndex: number;
    userAnswers: UserAnswer[];
    remainingTime: number; // in seconds
    timerActive: boolean;
}

const initialState: ExamEngineState = {
    phase: 'intro',
    currentQuestionIndex: 0,
    userAnswers: [],
    remainingTime: 0,
    timerActive: false,
};

export const examSlice = createSlice({
    name: 'examEngine',
    initialState,
    reducers: {
        startExam: (state, action: PayloadAction<number>) => {
            state.phase = 'active';
            state.currentQuestionIndex = 0;
            state.userAnswers = [];
            state.remainingTime = action.payload * 60; // Assume payload is in minutes
            state.timerActive = true;
        },
        answerQuestion: (state, action: PayloadAction<UserAnswer>) => {
            const existingIndex = state.userAnswers.findIndex(a => a.questionId === action.payload.questionId);
            if (existingIndex >= 0) {
                state.userAnswers[existingIndex] = action.payload;
            } else {
                state.userAnswers.push(action.payload);
            }
        },
        nextQuestion: (state) => {
            state.currentQuestionIndex += 1;
        },
        finishExam: (state) => {
            state.phase = 'result';
            state.timerActive = false;
        },
        tickTimer: (state) => {
            if (state.timerActive && state.remainingTime > 0) {
                state.remainingTime -= 1;
            } else if (state.timerActive && state.remainingTime <= 0) {
                state.phase = 'result';
                state.timerActive = false;
            }
        },
        resetExam: (state) => {
            state.phase = 'intro';
            state.currentQuestionIndex = 0;
            state.userAnswers = [];
            state.remainingTime = 0;
            state.timerActive = false;
        }
    },
});

export const { startExam, answerQuestion, nextQuestion, finishExam, tickTimer, resetExam } = examSlice.actions;

export default examSlice.reducer;
