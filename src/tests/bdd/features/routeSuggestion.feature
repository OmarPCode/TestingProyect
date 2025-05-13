Feature: Route Suggestions API

  Background:
    Given an authenticated admin token

  Scenario: Create route suggestion
    When I POST /routeSuggestions with a valid payload
    Then the response status should be 200
    And the body should contain a routeSuggestionId

  Scenario: Create route suggestion with duplicate ID
    Given a route suggestion already exists
    When I POST /routeSuggestions with the same payload
    Then the response status should be 400

  Scenario: Create route suggestion with invalid payload
    When I POST /routeSuggestions with an invalid payload
    Then the response status should be 400

  Scenario: Get all route suggestions
    Given a route suggestion already exists
    When I GET /routeSuggestions
    Then the response status should be 200
    And the body should contain a non-empty array

  Scenario: Get route suggestion by ID
    Given a route suggestion already exists
    When I GET /routeSuggestions/{routeSuggestionId}
    Then the response status should be 200
    And the body.routeSuggestionId should equal {routeSuggestionId}

  Scenario: Get route suggestion with nonexistent ID
    When I GET /routeSuggestions/{nonexistentId}
    Then the response status should be 404

  Scenario: Update a route suggestion
    Given a route suggestion already exists
    When I PUT /routeSuggestions/{routeSuggestionId} with { "estimatedTime": 999 }
    Then the response status should be 200
    And the body.estimatedTime should equal 999

  Scenario: Update a nonexistent route suggestion
    When I PUT /routeSuggestions/{nonexistentId} with { "estimatedTime": 100 }
    Then the response status should be 400

  Scenario: Delete a route suggestion
    Given a route suggestion already exists
    When I DELETE /routeSuggestions/{routeSuggestionId}
    Then the response status should be 200
    And the route suggestion should no longer exist in the database

  Scenario: Delete nonexistent route suggestion
    When I DELETE /routeSuggestions/{nonexistentId}
    Then the response status should be 400

  Scenario: Get a route from GraphHopper
    When I POST /routeSuggestions/fromMap with valid start and end
    Then the response status should be 200

  Scenario: Fail to get route from GraphHopper due to missing points
    When I POST /routeSuggestions/fromMap with missing points
    Then the response status should be 400
