@system
Feature: Route Suggestions UI (Selenium)

  Scenario: Calcular ruta en manejo de rutas
    Given I am on the login page
    When I log in as "mozo@gmail.com" with password "12345678"
    And I navigate to the route suggestion page
    And I fill in the origin with "ITESO, Guadalajara"
    And I fill in the destination with "Plaza del Sol, Guadalajara"
    And I click the "Calcular Ruta" button
    Then the map should display a route
