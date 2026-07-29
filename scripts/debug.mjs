import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
const logs = [];
page.on('console', msg => logs.push('[' + msg.type() + '] ' + msg.text()));
page.on('pageerror', err => logs.push('[PAGE_ERROR] ' + err.message));

await page.goto('http://localhost:5173/login');
await page.waitForTimeout(2000);
await page.fill('input[type="email"]', 'admin@test.local');
await page.fill('input[type="password"]', 'admin123456');
await page.click('button[type="submit"]');
await page.waitForTimeout(3000);
console.log('URL after login:', page.url());

const links = await page.('a[href*="/projects/"]');
if (links.length > 0) {
  await links[0].click();
  await page.waitForTimeout(3000);
  console.log('Project URL:', page.url());
  
  const editBtn = await page.button:has-text("Редактировать");
  if (editBtn) {
    await editBtn.click();
    await page.waitForTimeout(3000);
    console.log('Edit URL:', page.url());
    
    // Find upload area and try uploading
    const uploadInput = await page.input[type="file"];
    if (uploadInput) {
      console.log('Found upload input');
    } else {
      console.log('No upload input found');
    }
  }
}

console.log('=== Console logs ===');
logs.forEach(l => console.log(l));
await browser.close();
