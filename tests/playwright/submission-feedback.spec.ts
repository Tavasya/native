import { test, expect } from '@playwright/test';

test.describe('Submission Feedback Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API response for submission data
    await page.route('**/api/submissions/*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: '123',
          student_name: 'John Doe',
          assignment_title: 'Speaking Test',
          status: 'awaiting_review',
          section_feedback: [
            {
              question_id: 1,
              audio_url: 'test.mp3',
              transcript: 'Hello world',
              section_feedback: {
                fluency: { wpm: 150 },
                pronunciation: { word_details: [] },
                grammar: { issues: [] },
                lexical: { issues: [] }
              }
            }
          ]
        })
      });
    });

    // Login and navigate to submission page
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'teacher@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/teacher/dashboard');
    await page.goto('/submission/123');
  });

  test('should display submission details', async ({ page }) => {
    await expect(page.getByTestId('student-name')).toContainText('John Doe');
    await expect(page.getByTestId('assignment-title')).toContainText('Speaking Test');
  });

  test('should edit and save scores', async ({ page }) => {
    // Click edit scores button
    await page.click('[data-testid="edit-scores"]');
    
    // Edit fluency score
    await page.fill('[data-testid="fluency-score"]', '85');
    await page.fill('[data-testid="pronunciation-score"]', '90');
    await page.fill('[data-testid="grammar-score"]', '75');
    await page.fill('[data-testid="vocabulary-score"]', '80');
    
    // Save scores
    await page.click('[data-testid="save-scores"]');
    
    // Verify scores are updated
    await expect(page.getByTestId('fluency-score')).toContainText('85');
    await expect(page.getByTestId('pronunciation-score')).toContainText('90');
  });

  test('should add and save teacher comment', async ({ page }) => {
    // Click edit comment button
    await page.click('[data-testid="edit-comment"]');
    
    // Add comment
    await page.fill('[data-testid="comment-input"]', 'Great job on pronunciation!');
    
    // Save comment
    await page.click('[data-testid="save-comment"]');
    
    // Verify comment is saved
    await expect(page.getByTestId('teacher-comment')).toContainText('Great job on pronunciation!');
  });

  test('should navigate between questions', async ({ page }) => {
    // Click next question button
    await page.click('[data-testid="next-question"]');
    
    // Verify question number changes
    await expect(page.getByTestId('question-number')).toContainText('Question 2');
    
    // Click previous question button
    await page.click('[data-testid="prev-question"]');
    
    // Verify back to first question
    await expect(page.getByTestId('question-number')).toContainText('Question 1');
  });

  test('should submit feedback and show success message', async ({ page }) => {
    // Mock the submit API call
    await page.route('**/api/submissions/*/submit', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true })
      });
    });

    // Click submit feedback button
    await page.click('[data-testid="submit-feedback"]');
    
    // Verify success message
    await expect(page.getByTestId('success-toast')).toBeVisible();
    await expect(page.getByTestId('success-toast')).toContainText('Feedback has been sent to John Doe');
  });

  test('should handle audio playback', async ({ page }) => {
    // Click play button for student audio
    await page.click('[data-testid="play-student-audio"]');
    
    // Verify audio is playing
    await expect(page.getByTestId('audio-player')).toHaveAttribute('data-playing', 'true');
    
    // Click play button for correct pronunciation
    await page.click('[data-testid="play-correct-audio"]');
    
    // Verify correct audio is playing
    await expect(page.getByTestId('audio-player')).toHaveAttribute('data-playing', 'true');
  });

  test('should handle error states', async ({ page }) => {
    // Mock API error
    await page.route('**/api/submissions/*', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    // Refresh page
    await page.reload();
    
    // Verify error message
    await expect(page.getByTestId('error-message')).toBeVisible();
    await expect(page.getByTestId('error-message')).toContainText('Error loading submission');
  });
}); 