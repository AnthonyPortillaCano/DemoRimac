Feature: Rate Limiting
  As a system administrator
  I want to prevent API abuse
  So that the system remains stable and available for all users

  Background:
    Given the rate limiting service is active
    And rate limiting rules are configured
    And user tracking is enabled

  Scenario: Allow requests within rate limit
    Given a user has made requests within the allowed limit
    When the user makes another request
    Then the request should be allowed
    And the response should be processed normally
    And the rate limit counter should be incremented

  Scenario: Block requests exceeding rate limit
    Given a user has exceeded the rate limit
    When the user makes another request
    Then the request should be blocked
    And a rate limit exceeded error should be returned
    And the response should include retry information
    And the user should be informed of the limit

  Scenario: Reset rate limit counter after time window
    Given a user has exceeded the rate limit
    And the time window has expired
    When the user makes a new request
    Then the request should be allowed
    And the rate limit counter should be reset
    And normal processing should resume

  Scenario: Different rate limits for different endpoints
    Given different endpoints have different rate limits
    When a user makes requests to different endpoints
    Then each endpoint should enforce its own limit
    And the limits should be independent of each other
    And the user should be able to use other endpoints

  Scenario: Rate limiting based on user authentication
    Given an authenticated user
    And an unauthenticated user
    When both users make requests
    Then authenticated users should have higher limits
    And unauthenticated users should have stricter limits
    And the limits should be enforced appropriately

  Scenario: Rate limiting based on IP address
    Given requests are tracked by IP address
    When multiple requests come from the same IP
    Then the IP should be rate limited appropriately
    And the limit should apply to all requests from that IP
    And different IPs should have independent limits

  Scenario: Handle rate limit bypass attempts
    Given a user is rate limited
    When the user attempts to bypass the limit
    Then the bypass attempt should be detected
    And the user should remain rate limited
    And appropriate security measures should be taken

  Scenario: Rate limit information in response headers
    Given a user makes a request
    When the response is returned
    Then rate limit headers should be included
    And the headers should show current usage
    And the headers should show remaining requests
    And the headers should show reset time

  Scenario: Graceful degradation under high load
    Given the system is under high load
    When rate limits are enforced
    Then the system should remain stable
    And legitimate users should still be served
    And abusive traffic should be filtered out

  Scenario: Rate limit configuration updates
    Given rate limit rules need to be updated
    When the configuration is changed
    Then the new rules should take effect immediately
    And existing rate limit counters should be preserved
    And the system should continue to function normally

  Scenario: Rate limit monitoring and alerts
    Given rate limiting is active
    When rate limits are exceeded
    Then the events should be logged
    And monitoring systems should be notified
    And administrators should be alerted if thresholds are exceeded

  Scenario: Rate limit whitelist for trusted users
    Given certain users are whitelisted
    When whitelisted users make requests
    Then their requests should not be rate limited
    And they should have higher priority access
    And their usage should still be monitored

  Scenario: Rate limit blacklist for abusive users
    Given certain users are blacklisted
    When blacklisted users make requests
    Then their requests should be blocked immediately
    And no rate limit counting should occur
    And their access should remain blocked until manually reviewed 