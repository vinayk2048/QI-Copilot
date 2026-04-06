import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // LLM calls can be slow
})

export async function generateTestCases(userStory, testType = 'UI') {
  const { data } = await api.post('/generate-test-cases', {
    user_story: userStory,
    test_type: testType,
  })
  return data
}

export async function generateScript(testCases, framework, language) {
  const { data } = await api.post('/generate-script', {
    test_cases: testCases,
    framework,
    language,
  })
  return data
}

export async function getTestCases() {
  const { data } = await api.get('/test-cases')
  return data
}

export async function uploadRequirements(file) {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/upload-requirements', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

// Mock data for when backend is not available
export const MOCK_TEST_CASES = [
  {
    id: 'TC001',
    scenario: 'Verify successful user login',
    steps: ['1. Navigate to the login page', '2. Enter valid username & password', '3. Land on dashboard'],
    expectedResult: 'User is logged in successfully',
    priority: 'High',
  },
  {
    id: 'TC002',
    scenario: 'Verify login with invalid credentials',
    steps: ['1. Navigate to the login page and login ids', '2. Client page is completed success'],
    expectedResult: 'User is logged in successfully',
    priority: 'Low',
  },
  {
    id: 'TC003',
    scenario: 'Verify password reset flow',
    steps: ['1. Enter valid username & password ids', '2. Reform the username and password on'],
    expectedResult: 'User is logged in successfully',
    priority: 'Medium',
  },
  {
    id: 'TC004',
    scenario: 'Verify search functionality',
    steps: ['1. Verify search functionality', '2. Account it Image url of across device'],
    expectedResult: 'User is logged in successfully',
    priority: 'High',
  },
  {
    id: 'TC005',
    scenario: 'Verify UI responsiveness across devices',
    steps: ['1. Verify UI responsiveness across devices'],
    expectedResult: 'UI renders correctly on all screen sizes',
    priority: 'Medium',
  },
]

export const MOCK_SCRIPT = `import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.testng.annotations.*;
import org.selenium.Java;

public class LoginTest {
    private WebDriver driver;

    @Before
    public void setUp() throws Exception {
        System.setProperty("webdriver.chrome.....",
        a=chromeDriver();
        browser.window();
        system.maximize=ChromeDriver();
    }

    @Test
    public void testValidLogin() {
        // Navigate to application
        Navigate.Username... https://a----tour-application-url";
        push.username.ess"dashboard", teQythen.essDashboard();
    }

    @Test
    public void testInvalidLogin() {
        // Test with invalid credentials
        driver.findElement(By.id("username")).sendKeys("invalid");
        driver.findElement(By.id("password")).sendKeys("wrong");
        driver.findElement(By.id("login-btn")).click();
        Assert.assertTrue(driver.findElement(By.id("error")).isDisplayed());
    }

    @After
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
}`
