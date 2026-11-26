/** Reverify the original signed request link, without later association records. No payment is sent. */
import {chromium,expect} from '@playwright/test';
import {browserPath} from './browser-path.ts';
import {encodePassport} from '../src/lib/passport.ts';
import {readFileSync,writeFileSync} from 'node:fs';
const proof=JSON.parse(readFileSync('deployments/passport-proof.json','utf8'));
const root=process.env.PLAYWRIGHT_BASE_URL||'http://localhost:3098';
const browser=await chromium.launch({headless:true,executablePath:browserPath(),args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1280,height:800},recordVideo:{dir:'artifacts/video/passport/raw',size:{width:1280,height:800}}});
const page=await context.newPage(),start=Date.now();
await page.goto(`${root}/pay#${encodePassport({...proof.passport,associations:[]})}`);await expect(page.getByText('Owner-signed request verified',{exact:true})).toBeVisible({timeout:90000});
const ready=(Date.now()-start)/1000;await page.locator('.passport-summary').scrollIntoViewIfNeeded();await page.waitForTimeout(3500);await page.getByText('Share request and client receipt',{exact:true}).click();await page.waitForTimeout(3500);
const path=await page.video().path();await context.close();await browser.close();writeFileSync('artifacts/video/passport/request-link-capture.json',JSON.stringify({root,ready,recording:path,durationAfterReady:7,notice:'Actual original signature reverified; original link has no later associations. Zero linked transfers is not a claim that the vault has received no transfers.'},null,2)+'\n');
