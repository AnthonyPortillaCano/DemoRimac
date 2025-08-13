Feature: User Authentication
  As a user of the API
  I want to authenticate with secure credentials
  So that I can access protected endpoints

  Background:
    Given the authentication service is available
    And user accounts exist in the system

  Scenario: Successfully authenticate valid user
    Given a valid username and password
    When I authenticate with these credentials
    Then authentication should succeed
    And a JWT token should be returned
    And the user information should be included

  Scenario: Fail authentication with invalid credentials
    Given an invalid username
    When I authenticate with these credentials
    Then authentication should fail
    And an error message should be returned
    And no token should be returned

  Scenario: Fail authentication with wrong password
    Given a valid username
    And an incorrect password
    When I authenticate with these credentials
    Then authentication should fail
    And an error message should be returned
    And no token should be returned

  Scenario: Fail authentication with empty credentials
    Given empty username and password
    When I authenticate with these credentials
    Then authentication should fail
    And an error message should indicate missing credentials
    And no token should be returned

  Scenario: Successfully validate valid token
    Given a valid JWT token
    When I validate the token
    Then validation should succeed
    And the user information should be extracted
    And the token should be marked as valid

  Scenario: Fail validation with expired token
    Given an expired JWT token
    When I validate the token
    Then validation should fail
    And an error message should indicate token expiration

  Scenario: Fail validation with malformed token
    Given a malformed JWT token
    When I validate the token
    Then validation should fail
    And an error message should indicate invalid token format

  Scenario: Successfully register new user
    Given valid user registration data
    When I register the new user
    Then registration should succeed
    And a new user account should be created
    And the user information should be returned

  Scenario: Fail registration with duplicate username
    Given a username that already exists
    When I register with this username
    Then registration should fail
    And an error message should indicate duplicate username

  Scenario: Fail registration with invalid email
    Given an invalid email format
    When I register with this email
    Then registration should fail
    And an error message should indicate invalid email format

  Scenario: Fail registration with weak password
    Given a password that is too short
    When I register with this password
    Then registration should fail
    And an error message should indicate password requirements

  Scenario: Check user role permissions
    Given an authenticated user
    When I check the user's role
    Then the role should be correctly identified
    And appropriate permissions should be granted 