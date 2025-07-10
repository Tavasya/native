import { PracticeSession } from './practiceTypes';

const PYTHON_BACKEND_URL = 'https://classconnect-staging-107872842385.us-west2.run.app';

export const practiceService = {
  async testApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${PYTHON_BACKEND_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Python Backend Health Check Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        return false;
      }

      const data = await response.json();
      console.log('Python backend health check:', data);
      return true;
    } catch (error) {
      console.error('Python backend health check failed:', error);
      return false;
    }
  },

  async startPractice(sessionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${PYTHON_BACKEND_URL}/api/v1/practice/sessions/${sessionId}/start-practice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Python Backend API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`Python Backend API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error starting practice:', error);
      throw new Error('Failed to start practice');
    }
  },

  async getSessionStatus(sessionId: string): Promise<PracticeSession> {
    try {
      const response = await fetch(`${PYTHON_BACKEND_URL}/api/v1/practice/sessions/${sessionId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Python Backend API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`Python Backend API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error getting session status:', error);
      throw new Error('Failed to get session status');
    }
  },
}; 