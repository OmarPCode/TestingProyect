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

Given('I am on the login page', async () => {
  await driver.get(`${BASE_URL}/login`);
  await driver.wait(until.elementLocated(By.css('form')), 10_000);
});

When(/^I log in as "([^"]+)" with password "([^"]+)"$/, async (email: string, password: string) => {
  await driver.findElement(By.css('#username')).sendKeys(email);
  await driver.findElement(By.css('#password')).sendKeys(password);
  await driver.findElement(By.css('button[type="button"]')).click();
  // esperamos a que redirija al dashboard
  await driver.wait(until.urlIs(`${BASE_URL}/`), 15_000);
});

When('I am on the users page', async () => {
  // navegamos directamente
  await driver.get(`${BASE_URL}/users`);
  // esperamos a que aparezca el título "Usuarios"
  await driver.wait(until.elementLocated(By.css('h3.delivery-title')), 10_000);
});

Then('I should see the users list', async () => {
  // Espera a que al menos un <li> aparezca bajo .users-list-container
  await driver.wait(
    until.elementsLocated(By.css('.users-list-container li')),
    15_000
  );
  const listItems = await driver.findElements(
    By.css('.users-list-container li')
  );
  expect(listItems.length).to.be.greaterThan(0);
});