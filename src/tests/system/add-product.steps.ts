import { Given, When, Then, BeforeAll, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import chromedriver from 'chromedriver';
import { expect } from 'chai';

setDefaultTimeout(120_000);
let driver: WebDriver;
const BASE_URL = 'http://localhost:3001';

BeforeAll(async () => {
  const options = new chrome.Options();
  const service = new chrome.ServiceBuilder(chromedriver.path);
  driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .setChromeService(service)
    .build();
});

AfterAll(async () => {
  await driver.quit();
});

Given('I am on the inventory page', async () => {
  await driver.get(`${BASE_URL}/inventory`);
  await driver.wait(until.elementLocated(By.css('.inventory-list')), 10_000);
});

When('I click on the "Add Product" button', async () => {
  const addProductBtn = await driver.findElement(By.css('button.add-product'));
  await addProductBtn.click();
});

When(/^I enter the product details "([^"]+)" and "([^"]+)"$/, async (productName: string, productPrice: string) => {
  const nameInput = await driver.findElement(By.css('#product-name'));
  const priceInput = await driver.findElement(By.css('#product-price'));
  await nameInput.sendKeys(productName);
  await priceInput.sendKeys(productPrice);
});

When('I click the submit button', async () => {
  const submitBtn = await driver.findElement(By.css('button.submit'));
  await submitBtn.click();
});

Then('I should see the new product in the inventory list', async () => {
  await driver.wait(until.elementLocated(By.css('.inventory-list')), 15_000);
  const productList = await driver.findElements(By.css('.product-item'));
  const productNames = await Promise.all(
    productList.map(async (product) => {
      return product.findElement(By.css('.product-name')).getText();
    })
  );
  expect(productNames).to.include('Nuevo Producto');
});
