Feature: Deliveries API
  As a user of the API
  I want to manage deliveries
  So that I can create, update, and retrieve delivery information

  Scenario: Retrieve all deliveries
    Given the database contains deliveries
    When I send a GET request to "/deliveries"
    Then I should receive a 200 status code
    And the response should contain a list of deliveries

  Scenario: Create a new delivery
    Given I have valid delivery data
    When I send a POST request to "/deliveries" with the data
    Then I should receive a 201 status code
    And the response should contain the created delivery

  Scenario: Retrieve a delivery by ID
    Given a delivery exists with ID "d123"
    When I send a GET request to "/deliveries/d123"
    Then I should receive a 200 status code
    And the response should contain the delivery details