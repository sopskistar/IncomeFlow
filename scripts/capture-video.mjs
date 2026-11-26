/** Read-only, genuine moving UI capture. No wallet injection or signed writes. */
import { chromium } from '@playwright/test';
import { browserPath } from './browser-path.ts';
import {mkdirSync,writeFileSync} from 'node:fs';
const root=process.env.PLAYWRIGHT_BASE_URL||'http://localhost:3098';
mkdirSync('artifacts/video/raw',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:browserPath(),args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:'artifacts/video/raw',size:{width:1280,height:720}}});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const start=Date.now(),marks={};const mark=n=>marks[n]=(Date.now()-start)/1000;
try{
 await page.goto(root+'/app?vault=demo&view=activity',{waitUntil:'domcontentloaded'});
 await page.locator('.payment-status').filter({hasText:'Distribution confirmed'}).waitFor({timeout:90000});
 mark('resultStart');
 await page.locator('.payment-row>summary').first().click();
 await page.getByText('Actual recipient transfers').scrollIntoViewIfNeeded();
 await page.waitForTimeout(8000);
 await page.locator('.payment-row details>summary').click();
 await page.waitForTimeout(6000);
 await page.getByRole('navigation',{name:'Workspace'}).getByRole('link',{name:'Health',exact:true}).click();
 await page.getByRole('heading',{name:'Your automation, in view.'}).waitFor();
 await page.waitForTimeout(6000);
 await page.mouse.wheel(0,350);await page.waitForTimeout(6000);
 mark('resultEnd');
 await page.goto(root+'/proof',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);
 mark('proofStart');await page.waitForTimeout(6000);
 await page.locator('.proof-sequence').scrollIntoViewIfNeeded();await page.waitForTimeout(6500);
 await page.mouse.wheel(0,500);await page.waitForTimeout(6000);
 await page.mouse.wheel(0,450);await page.waitForTimeout(7000);
 mark('proofEnd');
 const recording=await page.video().path();await context.close();
 writeFileSync('artifacts/video/read-only-capture.json',JSON.stringify({root,recording,marks,errors,description:'Genuine read-only app navigation and receipt inspection; no simulated transactions or wallet writes.'},null,2));
 if(errors.length)throw new Error(errors.join('\n'));console.log(recording,marks);
}finally{await context.close().catch(()=>{});await browser.close();}
