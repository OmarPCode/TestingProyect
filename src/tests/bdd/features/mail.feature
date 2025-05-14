Feature: Password reset email sending

  @mail @smtpError
  Scenario: SMTP server fails
    Given a mail payload with recipient "dest@example.com", subject "Hello" and body "Test message"
    And sending the email will fail with "SMTP down"
    When I send the password reset email
    Then the mail response status should be 500
