const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Collect console messages
  const logs = [];
  page.on("console", msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on("pageerror", err => logs.push(`[ERROR] ${err.message}`));
  
  // Login
  await page.goto("http://localhost:5173/login");
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', "admin@test.local");
  await page.fill('input[type="password"]', "admin123456");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Navigate to a project
  const url = page.url();
  console.log("After login URL:", url);
  
  // Find first project link
  const projectLink = await page.$('a[href*="/projects/"]');
  if (projectLink) {
    await projectLink.click();
    await page.waitForTimeout(3000);
    console.log("Project page URL:", page.url());
    
    // Look for edit button
    const editBtn = await page.$('button:has-text("Редактировать")');
    if (editBtn) {
      await editBtn.click();
      await page.waitForTimeout(3000);
      console.log("Edit page URL:", page.url());
      await page.screenshot({ path: "docs/debug-edit.png", fullPage: true });
    } else {
      console.log("No edit button found");
    }
  } else {
    console.log("No project link found");
  }
  
  // Print collected logs
  console.log("\n=== Console logs ===");
  logs.forEach(l => console.log(l));
  
  await browser.close();
})();
