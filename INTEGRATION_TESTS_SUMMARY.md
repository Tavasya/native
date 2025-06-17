# Timer Integration Tests Summary

## Overview
Integration tests for the timer system that verify multiple components working together in realistic scenarios.

## Test Coverage (6 tests)

### 1. Timer Hook + Display Component Integration
- **`should display time from hook and respond to recording state changes`**
  - Verifies timer hook and display component work together
  - Tests recording state changes affect both timer logic and visual display
  - Confirms timer only counts down when recording is active

- **`should show visual state changes when time gets low`**
  - Tests hook + component integration for warning states
  - Verifies color changes happen at correct time thresholds
  - Confirms visual feedback matches timer logic

- **`should handle time-up callback and negative time display`**
  - Tests end-to-end flow when timer expires
  - Verifies callback triggers and visual styling changes
  - Confirms negative time display with critical styling

### 2. Timer with Recording Controls Integration
- **`should handle full recording workflow with timer`**
  - Tests realistic recording workflow: start → countdown → stop → retry
  - Verifies timer stops when recording stops
  - Confirms reset functionality works with display component

- **`should auto-stop recording when time runs out`**
  - Tests automatic workflow when timer expires
  - Verifies recording state changes when time-up occurs
  - Confirms UI updates to show completion state

### 3. Multiple Question Timer Integration
- **`should reset timer when switching between questions`**
  - Tests timer behavior when moving between questions
  - Verifies timer resets and displays new time limits
  - Confirms recording state resets properly

## Key Differences from Unit Tests
- **Real Component Interaction**: Hook and component work together, not in isolation
- **State Flow**: Tests actual state changes between timer and UI components
- **User Workflows**: Simulates realistic user interactions and scenarios
- **End-to-End Logic**: Verifies complete flows from start to finish

## What Makes These "Integration" Tests
1. **Multiple Components**: Tests hook + component working together
2. **Real Data Flow**: Actual state updates between timer logic and display
3. **User Interactions**: Simulates real button clicks and state changes
4. **Workflow Testing**: Complete scenarios like recording workflow or question switching

## Running the Tests
```bash
npm test -- tests/integration/
```

All tests use fake timers for deterministic behavior and test realistic timing scenarios. 