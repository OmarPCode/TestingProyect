import { Given, When, Then, BeforeAll, AfterAll, setDefaultTimeout } from "@cucumber/cucumber";
import { Builder, By, until, WebDriver, Key } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import chromedriver from "chromedriver"; 
import { expect } from "chai";

setDefaultTimeout(90_000);
let driver: WebDriver;
const ISO_DATE = "30-12-2025";
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
  await driver.wait(until.urlIs(`${BASE_URL}/`), 15_000);
});


When("I am on the deliveries page", async () => {
  await driver.get(`${BASE_URL}/deliveries`);
  await driver.wait(until.elementLocated(By.css("h3.delivery-title")), 10_000);
});


When("I click the \"Agregar envio\" button and fill the modal with valid data", async () => {
  await driver.sleep(10_000);
  await driver.findElement(By.css("button.button2")).click();
  
  await driver.wait(until.elementLocated(By.css("div.swal2-modal")), 10_000);
  await driver.findElement(By.css("#swal-pickup")).sendKeys("Warehouse A");
  await driver.findElement(By.css("#swal-delivery")).sendKeys("123 Main St");
  await driver.findElement(By.css("#swal-fecha")).sendKeys("31-12-2025");
  


  const assign = await driver.findElement(By.css("#swal-assign"));
  await assign.sendKeys(Key.ARROW_DOWN, Key.ENTER);
  await driver.sleep(10_000);


  await driver.findElement(By.css("button.swal2-confirm")).click();


  await driver.wait(until.elementLocated(By.css("div.swal2-modal")), 10_000);
  await driver.findElement(By.css("#swal-product-name")).sendKeys("Test Product");
  await driver.findElement(By.css("#swal-product-description")).sendKeys("Automated test");
  await driver.findElement(By.css("#swal-product-quantity")).sendKeys("2");
  await driver.findElement(By.css("#swal-product-weight")).sendKeys("1");
  await driver.findElement(By.css("button.swal2-confirm")).click();


});

