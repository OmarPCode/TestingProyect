Feature: Deliveries API

  Background:
    Given an authenticated admin token
    And a driver exists

  Scenario: Create a delivery
    When I POST /deliveries with a valid payload
    Then the response status should be 200
    And the body should contain a deliveryId

  Scenario: List deliveries
    Given a delivery already exists
    When I GET /deliveries
    Then the response status should be 200
    And the body should contain a non‑empty deliveries array

  Scenario: Get delivery by id
    Given a delivery already exists
    When I GET /deliveries/{deliveryId}
    Then the response status should be 200
    And the body.deliveryId should equal {deliveryId}

  Scenario: Update a delivery
    Given a delivery already exists
    When I PUT /deliveries/{deliveryId} with { "status": "stopped" }
    Then the response status should be 200
    And the body.status should equal "stopped"

  Scenario: Delete a delivery
    Given a delivery already exists
    When I DELETE /deliveries/{deliveryId}
    Then the response status should be 200
    And the delivery should no longer exist in the database

  Scenario: Get deliveries by driver
    Given a delivery already exists
    When I GET /deliveries/byDriver?driverId={driverId}
    Then the response status should be 200
    And every returned delivery should belong to {driverId}
