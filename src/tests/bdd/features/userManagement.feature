Feature: User Management API
  Como administrador de la aplicación
  Quiero gestionar usuarios a través de la API
  Para asegurarme de que los endpoints de usuario funcionan correctamente

  Background:
    Given la aplicación está corriendo en "http://localhost:3000"
    And existe un usuario admin con email "admin@example.com" y password "adminPass"
    And estoy autenticado como admin

  Scenario: Registrar un nuevo usuario
    When hago POST /user/register con el siguiente payload:
      | campo    | valor             |
      | name     | John Doe          |
      | email    | john@example.com  |
      | password | secret123         |
      | role     | user              |
    Then el status de la respuesta debe ser 200
    And el body debe contener un "message"

  Scenario: Inicio de sesión de usuario
    Given existe un usuario con email "john@example.com" y password "secret123" y role "user"
    When hago POST /user/login con:
      | campo    | valor             |
      | email    | john@example.com  |
      | password | secret123         |
    Then el status de la respuesta debe ser 200
    And el body debe contener un "token"

  Scenario: Obtener usuario por ID
    Given existe un usuario y tengo su "userId"
    When hago GET /user/{userId}
    Then el status de la respuesta debe ser 200
    And body.userId debe ser {userId}

  Scenario: Actualizar usuario
    Given existe un usuario y tengo su "userId"
    When hago PUT /user/{userId} con:
      | campo | valor     |
      | name  | Jane Doe  |
    Then el status de la respuesta debe ser 200
    And body.name debe ser "Jane Doe"

  Scenario: Eliminar usuario
    Given existe un usuario y tengo su "userId"
    When hago DELETE /user/{userId}
    Then el status de la respuesta debe ser 200
    And el usuario ya no debe existir