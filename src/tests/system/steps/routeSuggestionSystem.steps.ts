import { Given, When, Then, BeforeAll, AfterAll, setDefaultTimeout } from "@cucumber/cucumber";
import { Builder, By, until, WebDriver } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import chromedriver from "chromedriver";
import { expect } from "chai";

setDefaultTimeout(60_000);
let driver: WebDriver;
const BASE_URL = "http://localhost:3001";

BeforeAll(async () => {
  const options = new chrome.Options();
  const service = new chrome.ServiceBuilder(chromedriver.path);
  driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .setChromeService(service)
    .build();
});

AfterAll(async () => {
  await driver.quit();
});

Given("I am on the login page", async () => {
  await driver.get(`${BASE_URL}/login`);
  await driver.wait(until.elementLocated(By.css("form")), 10_000);
});

When(/^I log in as "([^"]+)" with password "([^"]+)"$/, async (email: string, password: string) => {
  await driver.findElement(By.css("#username")).sendKeys(email);
  await driver.findElement(By.css("#password")).sendKeys(password);
  await driver.findElement(By.css("button[type='button']")).click();
  await driver.wait(until.urlIs(`${BASE_URL}/`), 10_000);
});

When("I navigate to the route suggestion page", async () => {
  await driver.findElement(By.xpath("//button[.//div[text()='Manejo de rutas']]")).click();
  await driver.wait(until.elementLocated(By.css("#origin")), 10_000);
});

When(/^I fill in the origin with "([^"]+)"$/, async (origin: string) => {
  const input = await driver.findElement(By.css("#origin"));
  await input.clear();
  await input.sendKeys(origin);
});

When(/^I fill in the destination with "([^"]+)"$/, async (destination: string) => {
  const input = await driver.findElement(By.css("#destination"));
  await input.clear();
  await input.sendKeys(destination);
});

When("I click the {string} button", async (buttonText: string) => {
  const button = await driver.findElement(By.xpath(`//button[contains(text(),'${buttonText}')]`));
  await button.click();
});

Then("the map should display a route", async () => {
  await driver.sleep(4000); // Espera a que la ruta sea renderizada
  const map = await driver.findElement(By.css("#map"));
  const displayed = await map.isDisplayed();
  expect(displayed).to.be.true;
});
