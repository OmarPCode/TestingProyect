@system
Feature: Usuarios UI (Selenium)

  Scenario: Ver lista de usuarios desde la interfaz
    Given I am on the login page
    When I log in as "mozo@gmail.com" with password "12345678"
    And I am on the users page
    Then I should see the users list
