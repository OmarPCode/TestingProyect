Feature: Add product to inventory

  Scenario: Successfully adding a new product to the inventory
    Given I am on the inventory page
    When I click on the "Add Product" button
    And I enter the product details "Nuevo Producto" and "100"
    And I click the submit button
    Then I should see the new product in the inventory list
