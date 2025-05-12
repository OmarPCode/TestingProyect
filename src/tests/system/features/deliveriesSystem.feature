@system
Feature: Deliveries UI (Selenium)

  Scenario: Crear una entrega desde la interfaz
    Given I am on the login page
    When I log in as "mozo@gmail.com" with password "12345678"
    And I am on the deliveries page
    And I click the "Agregar envio" button and fill the modal with valid data
