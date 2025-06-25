import { createAsyncThunk } from '@reduxjs/toolkit';
import { setLoading, setError, setItems, addItem, updateItem, removeItem } from './librarySlice';
import { LibraryItem } from './librarySlice';

// Fetch library items for a teacher
export const fetchLibraryItems = createAsyncThunk(
  'library/fetchItems',
  async (teacherId: string, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      // TODO: Replace with actual API call
      // const response = await api.get(`/library/teacher/${teacherId}`);
      // return response.data;
      
      // Mock data for now
      const mockItems: LibraryItem[] = [
        {
          id: '1',
          title: 'Family & Relationships Speaking Practice',
          description: 'Complete IELTS speaking assignment covering family topics, relationships, and personal experiences',
          type: 'template',
          category: 'Family & Relationships',
          tags: ['IELTS', 'Speaking', 'Family', 'Relationships'],
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          teacher_id: teacherId,
          is_public: true,
          usage_count: 45,
          assignment: {
            questions: [
              {
                id: 'q1',
                type: 'normal',
                question: 'Tell me about your family. How many people are in your family?',
                speakAloud: false,
                timeLimit: '1',
                prepTime: '0:15'
              },
              {
                id: 'q2',
                type: 'bulletPoints',
                question: 'Describe a close family member who has influenced you.',
                bulletPoints: [
                  'Who this person is',
                  'How you know them',
                  'What they have done',
                  'And explain why they have influenced you'
                ],
                speakAloud: false,
                timeLimit: '2',
                prepTime: '0:15'
              },
              {
                id: 'q3',
                type: 'normal',
                question: 'Do you think family relationships are changing in modern society?',
                speakAloud: false,
                timeLimit: '1',
                prepTime: '0:15'
              }
            ],
            metadata: {
              autoGrade: true,
              isTest: false
            }
          }
        },
        {
          id: '2',
          title: 'Work & Career Development',
          description: 'Professional development and career planning speaking assignment',
          type: 'template',
          category: 'Work & Career',
          tags: ['IELTS', 'Speaking', 'Work', 'Career'],
          created_at: '2024-01-10T14:30:00Z',
          updated_at: '2024-01-12T09:15:00Z',
          teacher_id: teacherId,
          is_public: false,
          usage_count: 12,
          assignment: {
            questions: [
              {
                id: 'q1',
                type: 'normal',
                question: 'What do you do for work? Do you enjoy your job?',
                speakAloud: false,
                timeLimit: '1',
                prepTime: '0:15'
              },
              {
                id: 'q2',
                type: 'bulletPoints',
                question: 'Describe a job you would like to have in the future.',
                bulletPoints: [
                  'What the job is',
                  'Why you want this job',
                  'What skills you need',
                  'And explain how you plan to achieve this'
                ],
                speakAloud: false,
                timeLimit: '2',
                prepTime: '0:15'
              },
              {
                id: 'q3',
                type: 'normal',
                question: 'How important is work-life balance in your opinion?',
                speakAloud: false,
                timeLimit: '1',
                prepTime: '0:15'
              }
            ],
            metadata: {
              autoGrade: true,
              isTest: false
            }
          }
        },
        {
          id: '3',
          title: 'Technology & Social Media Impact',
          description: 'Modern technology and social media effects on society',
          type: 'template',
          category: 'Technology & Media',
          tags: ['IELTS', 'Speaking', 'Technology', 'Social Media'],
          created_at: '2024-01-05T16:20:00Z',
          updated_at: '2024-01-05T16:20:00Z',
          teacher_id: teacherId,
          is_public: true,
          usage_count: 89,
          assignment: {
            questions: [
              {
                id: 'q1',
                type: 'normal',
                question: 'How often do you use technology in your daily life?',
                speakAloud: false,
                timeLimit: '1',
                prepTime: '0:15'
              },
              {
                id: 'q2',
                type: 'bulletPoints',
                question: 'Describe a piece of technology that has changed your life.',
                bulletPoints: [
                  'What the technology is',
                  'When you first used it',
                  'How it has changed your life',
                  'And explain why it was important'
                ],
                speakAloud: false,
                timeLimit: '2',
                prepTime: '0:15'
              },
              {
                id: 'q3',
                type: 'normal',
                question: 'Do you think social media has more positive or negative effects on society?',
                speakAloud: false,
                timeLimit: '1',
                prepTime: '0:15'
              }
            ],
            metadata: {
              autoGrade: true,
              isTest: false
            }
          }
        },
        {
          id: '4',
          title: 'Travel & Tourism Experiences',
          description: 'Travel experiences and tourism industry discussion',
          type: 'template',
          category: 'Travel & Tourism',
          tags: ['IELTS', 'Speaking', 'Travel', 'Tourism'],
          created_at: '2024-01-20T11:45:00Z',
          updated_at: '2024-01-20T11:45:00Z',
          teacher_id: teacherId,
          is_public: true,
          usage_count: 67,
          assignment: {
            questions: [
              {
                id: 'q1',
                type: 'normal',
                question: 'Do you enjoy traveling? What type of places do you like to visit?',
                speakAloud: false,
                timeLimit: '1',
                prepTime: '0:15'
              },
              {
                id: 'q2',
                type: 'bulletPoints',
                question: 'Describe a memorable trip you have taken.',
                bulletPoints: [
                  'Where you went',
                  'When you went there',
                  'What you did',
                  'And explain why it was memorable'
                ],
                speakAloud: false,
                timeLimit: '2',
                prepTime: '0:15'
              },
              {
                id: 'q3',
                type: 'normal',
                question: 'How has tourism changed in recent years?',
                speakAloud: false,
                timeLimit: '1',
                prepTime: '0:15'
              }
            ],
            metadata: {
              autoGrade: true,
              isTest: false
            }
          }
        },
        {
          id: '5',
          title: 'Health & Lifestyle Choices',
          description: 'Health awareness and lifestyle decision making',
          type: 'template',
          category: 'Health & Lifestyle',
          tags: ['IELTS', 'Speaking', 'Health', 'Lifestyle'],
          created_at: '2024-01-25T09:30:00Z',
          updated_at: '2024-01-25T09:30:00Z',
          teacher_id: teacherId,
          is_public: true,
          usage_count: 34,
          assignment: {
            questions: [
              {
                id: 'q1',
                type: 'normal',
                question: 'How important is health to you? What do you do to stay healthy?',
                speakAloud: false,
                timeLimit: '1',
                prepTime: '0:15'
              },
              {
                id: 'q2',
                type: 'bulletPoints',
                question: 'Describe a healthy habit you have developed.',
                bulletPoints: [
                  'What the habit is',
                  'When you started it',
                  'How you developed it',
                  'And explain the benefits you have experienced'
                ],
                speakAloud: false,
                timeLimit: '2',
                prepTime: '0:15'
              },
              {
                id: 'q3',
                type: 'normal',
                question: 'Do you think people are more health-conscious today than in the past?',
                speakAloud: false,
                timeLimit: '1',
                prepTime: '0:15'
              }
            ],
            metadata: {
              autoGrade: true,
              isTest: false
            }
          }
        }
      ];
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      dispatch(setItems(mockItems));
      return mockItems;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch library items';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Create a new library item
export const createLibraryItem = createAsyncThunk(
  'library/createItem',
  async (item: Omit<LibraryItem, 'id' | 'created_at' | 'updated_at' | 'usage_count'>, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      // TODO: Replace with actual API call
      // const response = await api.post('/library', item);
      // return response.data;
      
      // Mock creation
      const newItem: LibraryItem = {
        ...item,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        usage_count: 0,
      };
      
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      dispatch(addItem(newItem));
      return newItem;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create library item';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Update a library item
export const updateLibraryItem = createAsyncThunk(
  'library/updateItem',
  async (item: LibraryItem, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      // TODO: Replace with actual API call
      // const response = await api.put(`/library/${item.id}`, item);
      // return response.data;
      
      // Mock update
      const updatedItem: LibraryItem = {
        ...item,
        updated_at: new Date().toISOString(),
      };
      
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      dispatch(updateItem(updatedItem));
      return updatedItem;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update library item';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Delete a library item
export const deleteLibraryItem = createAsyncThunk(
  'library/deleteItem',
  async (itemId: string, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      // TODO: Replace with actual API call
      // await api.delete(`/library/${itemId}`);
      
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      dispatch(removeItem(itemId));
      return itemId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete library item';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
); 