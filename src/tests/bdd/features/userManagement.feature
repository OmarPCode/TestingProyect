Feature: User Management API
  Como administrador de la aplicación
  Quiero gestionar usuarios a través de la API
  Para asegurarme de que los endpoints de usuario funcionan correctamente

  Background:
    Given la aplicación está corriendo en "http://localhost:3000"
    And existe un usuario admin con email "admin@example.com" y password "adminPass"
    And estoy autenticado como admin

  Scenario: Registrar un nuevo usuario
    When hago POST /users con el siguiente payload:
      | campo    | valor             |
      | name     | John Doe          |
      | email    | john@example.com  |
      | password | secret123         |
    Then el status de la respuesta debe ser 201
    And el body debe contener un "userId"

  Scenario: Inicio de sesión de usuario
    Given existe un usuario con email "john@example.com" y password "secret123"
    When hago POST /users/login con:
      | campo    | valor             |
      | email    | john@example.com  |
      | password | secret123         |
    Then el status de la respuesta debe ser 200
    And el body debe contener un "token"

  Scenario: Obtener usuario por ID
    Given existe un usuario y tengo su "userId"
    And estoy autenticado como admin
    When hago GET /users/{userId}
    Then el status de la respuesta debe ser 200
    And body.userId debe ser {userId}

  Scenario: Actualizar usuario
    Given existe un usuario y tengo su "userId"
    And estoy autenticado como admin
    When hago PUT /users/{userId} con:
      | campo | valor     |
      | name  | Jane Doe  |
    Then el status de la respuesta debe ser 200
    And body.name debe ser "Jane Doe"

  Scenario: Eliminar usuario
    Given existe un usuario y tengo su "userId"
    And estoy autenticado como admin
    When hago DELETE /users/{userId}
    Then el status de la respuesta debe ser 200
    And el usuario ya no debe existir
