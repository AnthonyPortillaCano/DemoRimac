Feature: Data Storage and Retrieval
  As a user of the API
  I want to store and retrieve data
  So that I can maintain a history of API interactions and custom data

  Background:
    Given the database service is available
    And the database is properly connected
    And appropriate tables exist

  Scenario: Successfully store fused data
    Given valid fused data from Star Wars and Weather APIs
    When I store the fused data
    Then the data should be successfully stored
    And a unique identifier should be returned
    And a success message should be returned
    And the data should be timestamped

  Scenario: Successfully store custom data
    Given valid custom data with required fields
    When I store the custom data
    Then the data should be successfully stored
    And a unique identifier should be returned
    And a success message should be returned
    And the data should be timestamped

  Scenario: Handle storage errors gracefully
    Given invalid or malformed data
    When I attempt to store the data
    Then storage should fail
    And an appropriate error message should be returned
    And no data should be stored in the database

  Scenario: Successfully retrieve fused data history
    Given stored fused data exists in the database
    When I request the fused data history
    Then the data should be successfully retrieved
    And the data should be ordered chronologically
    And pagination information should be included
    And the total count should be accurate

  Scenario: Successfully retrieve custom data
    Given stored custom data exists in the database
    When I request the custom data
    Then the data should be successfully retrieved
    And the data should be ordered chronologically
    And pagination information should be included

  Scenario: Handle pagination correctly
    Given multiple pages of data exist
    When I request a specific page with a limit
    Then only the requested page should be returned
    And the page number should be correct
    And the limit should be respected
    And pagination metadata should be accurate

  Scenario: Handle empty results gracefully
    Given no data exists in the database
    When I request data
    Then an empty array should be returned
    And pagination should show zero total items
    And no error should occur

  Scenario: Cache fused data for 30 minutes
    Given recently stored fused data
    When I request cached data within 30 minutes
    Then the data should be returned from cache
    And the cache flag should be set to true
    And no database query should be executed

  Scenario: Cache expiration after 30 minutes
    Given cached data is older than 30 minutes
    When I request the data
    Then the cache should be considered expired
    And fresh data should be retrieved from the database
    And the cache flag should be set to false

  Scenario: Validate data structure before storage
    Given data with missing required fields
    When I attempt to store the data
    Then validation should fail
    And an error message should indicate missing fields
    And no data should be stored

  Scenario: Validate data types before storage
    Given data with incorrect field types
    When I attempt to store the data
    Then validation should fail
    And an error message should indicate type mismatches
    And no data should be stored

  Scenario: Handle database connection errors
    Given the database is unavailable
    When I attempt to store or retrieve data
    Then an appropriate error should be returned
    And the error should indicate database connectivity issues

  Scenario: Handle concurrent data access
    Given multiple users are accessing the system simultaneously
    When they store and retrieve data
    Then all operations should complete successfully
    And data integrity should be maintained
    And no conflicts should occur 