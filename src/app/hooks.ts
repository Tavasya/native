import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

//Creat custom hook called useAppDispatch, used the useDispatch hook but uses correct type
export const useAppDispatch: () => AppDispatch = () => {
  return useDispatch();
};

//gets the shape of your redux state
export const useAppSelector: TypedUseSelectorHook<RootState> = (selector, equalityFn) => {

  return useSelector(selector, equalityFn);
};