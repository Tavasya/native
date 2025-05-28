import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

//Creat custom hook called useAppDispatch, used the useDispatch hook but uses correct type
export const useAppDispatch: () => AppDispatch = () => {
  console.log('[hooks] useAppDispatch called');
  return useDispatch();
};

//gets the shape of your redux state
export const useAppSelector: TypedUseSelectorHook<RootState> = (selector, equalityFn) => {
  console.log('[hooks] useAppSelector called');
  return useSelector(selector, equalityFn);
};