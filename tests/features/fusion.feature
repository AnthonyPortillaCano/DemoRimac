Feature: Data Fusion
  As a user of the API
  I want to combine Star Wars character data with weather information
  So that I can get comprehensive information about characters and their homeworlds

  Background:
    Given the Star Wars API is available
    And the Weather API is available
    And the database is connected

  Scenario: Successfully fuse Star Wars character with weather data
    Given a Star Wars character exists
    And a planet exists for the character
    And weather data exists for the planet
    When I request fused data
    Then the data should be successfully fused
    And the character information should be included
    And the planet information should be included
    And the weather information should be included
    And a timestamp should be recorded

  Scenario: Handle Star Wars API failure
    Given the Star Wars API is unavailable
    When I request fused data
    Then an error should be returned
    And the error should indicate Star Wars API failure

  Scenario: Handle Weather API failure
    Given a Star Wars character exists
    And the Weather API is unavailable
    When I request fused data
    Then an error should be returned
    And the error should indicate Weather API failure

  Scenario: Cache fused data for 30 minutes
    Given fused data has been retrieved
    When I request the same data within 30 minutes
    Then the data should be returned from cache
    And no new API calls should be made

  Scenario: Cache expiration after 30 minutes
    Given cached data is older than 30 minutes
    When I request the data
    Then new API calls should be made
    And fresh data should be returned 