@system
Feature: User Authentication UI
  Como administrador,
  Quiero iniciar y cerrar sesión desde la interfaz
  Para asegurar que el flujo de autenticación funciona correctamente

  Scenario: Login y Logout desde la UI
    Given I am on the login page
    When I log in as "mozo@gmail.com" with password "12345678"
    Then I should see the deliveries list
    When I click the logout button
    Then I should be redirected to the login page