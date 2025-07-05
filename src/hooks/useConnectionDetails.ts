import { useCallback, useEffect, useState } from 'react';
import { ConnectionDetails } from '@/components/server/index';

export default function useConnectionDetails() {
  // Generate room connection details, including:
  //   - A random Room name
  //   - A random Participant name
  //   - An Access Token to permit the participant to join the room
  //   - The URL of the LiveKit server to connect to
  //
  // In real-world application, you would likely allow the user to specify their
  // own participant name, and possibly to choose from existing rooms to join.

  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null);

  const fetchConnectionDetails = useCallback(() => {
    setConnectionDetails(null);
    const url = new URL(
      import.meta.env.VITE_CONN_DETAILS_ENDPOINT ?? '/api/connection-details',
      'http://localhost:3001'
    );
    fetch(url.toString())
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        // Check if response is actually JSON
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Backend API not available - received HTML instead of JSON');
        }
        
        return res.json();
      })
      .then((data) => {
        setConnectionDetails(data);
      })
      .catch((error) => {
        // Suppress console error if backend is not available (common in dev)
        if (error.message.includes('SyntaxError') || 
            error.message.includes('HTTP 404') ||
            error.message.includes('Backend API not available') ||
            error.message.includes('Unexpected token')) {
          console.warn('Backend API not available - this is expected when running frontend only');
        } else {
          console.error('Error fetching connection details:', error);
        }
      });
  }, []);

  useEffect(() => {
    fetchConnectionDetails();
  }, [fetchConnectionDetails]);

  return { connectionDetails, refreshConnectionDetails: fetchConnectionDetails };
}
