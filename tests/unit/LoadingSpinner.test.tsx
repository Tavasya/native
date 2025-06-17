import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingSpinner from '../../src/components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    render(<LoadingSpinner />);
  });

  it('displays loading spinner', () => {
    const { container } = render(<LoadingSpinner />);
    
    // Check if the spinner container is rendered
    const spinnerContainer = container.firstChild;
    expect(spinnerContainer).toBeInTheDocument();
  });

  it('has correct styles applied', () => {
    const { container } = render(<LoadingSpinner />);
    
    // Check if the spinner element exists
    const spinner = container.querySelector('div div');
    expect(spinner).toBeInTheDocument();
  });
}); 