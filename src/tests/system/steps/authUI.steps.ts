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
});

Then('I should see the deliveries list', async () => {
  // El login redirige a '/', que muestra la lista de envíos
  await driver.wait(until.elementLocated(By.css('h3.delivery-title')), 15_000);
  const title = await driver.findElement(By.css('h3.delivery-title')).getText();
  expect(title.toLowerCase()).to.contain('envios');
});

When('I click the logout button', async () => {
  const logoutBtn = await driver.findElement(By.css('button.avatar'));
  await logoutBtn.click();
});

Then('I should be redirected to the login page', async () => {
  await driver.wait(until.urlIs(`${BASE_URL}/login`), 15_000);
  const form = await driver.findElement(By.css('form'));
  expect(form).to.exist;
});