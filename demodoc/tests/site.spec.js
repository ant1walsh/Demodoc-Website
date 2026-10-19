// @ts-check
const { test, expect } = require('@playwright/test');

const PAGES = [
  ['/', 'Turn market signal into pipeline.'],
  ['/agentic-research/', 'Synthesize, analyze, and activate context.'],
  ['/generative-content/', "Customize content with your brand's tone of voice."],
  ['/forward-deploy/', 'Custom AI, built on your stack.'],
  ['/workshops/', 'Become AI-fluent.'],
  ['/consult/', 'Built by operators, for operators.'],
];

test.describe('SEO: every page is prerendered and indexable', () => {
  for (const [path, h1] of PAGES) {
    test(`${path} ships real HTML without JavaScript`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(html).toContain('<h1');
      expect(html).toContain(h1.replace(/'/g, '&#x27;').slice(0, 20).split('&#x27;')[0]);
      expect(html).toMatch(/<link rel="canonical" href="https:\/\/demodoc\.ai\//);
      expect(html).toMatch(/<meta name="description" content=".{40,}"/);
      expect(html).not.toMatch(/noindex/);
    });
  }
  test('sitemap lists all pages and robots points to it', async ({ request }) => {
    const sm = await (await request.get('/sitemap.xml')).text();
    for (const [path] of PAGES) expect(sm).toContain('https://demodoc.ai' + path);
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Sitemap: https://demodoc.ai/sitemap.xml');
  });
  test('assets are minified', async ({ request }) => {
    for (const f of ['/app.min.js', '/ds.min.js', '/styles.min.css']) {
      const body = await (await request.get(f)).text();
      const lines = body.split('\n').length;
      expect(lines, f + ' should be minified').toBeLessThan(5);
    }
  });
});

test.describe('Rendering and navigation', () => {
  for (const [path, h1] of PAGES) {
    test(`${path} renders with no console errors`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error' && !/calendly|posthog/i.test(m.text())) errors.push(m.text()); });
      await page.goto(path);
      await expect(page.locator('h1').first()).toContainText(h1.slice(0, 18));
      expect(errors).toEqual([]);
    });
  }
  test('nav navigates between pages and updates the URL + title', async ({ page, isMobile }) => {
    await page.goto('/');
    if (isMobile) await page.getByRole('button', { name: /open menu/i }).click();
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'agentic research' }).click();
    await expect(page).toHaveURL(/\/agentic-research\/$/);
    await expect(page).toHaveTitle(/Agentic Research/);
    await page.goBack();
    await expect(page.locator('h1').first()).toContainText('Turn market signal');
  });
  test('book a consultation CTA leads to the consult page', async ({ page, isMobile }) => {
    await page.goto('/forward-deploy/');
    if (isMobile) await page.getByRole('button', { name: /open menu/i }).click();
    await page.getByRole('button', { name: 'book a consultation' }).first().click();
    await expect(page.locator('h1').first()).toContainText('Built by operators');
  });
  test('mobile menu opens and closes with Escape', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /open menu/i });
    await toggle.click();
    await expect(page.getByRole('button', { name: /close menu/i })).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: /open menu/i })).toHaveAttribute('aria-expanded', 'false');
  });
  test('unknown URL serves the 404 page', async ({ page }) => {
    const res = await page.goto('/this-does-not-exist/');
    expect([200, 404]).toContain(res && res.status());
    await expect(page.locator('h1')).toContainText('Page not found');
  });
});

test.describe('Interactive features', () => {
  test('forward deploy: hovering a category highlights its pills', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hover only');
    await page.goto('/forward-deploy/');
    await page.getByRole('button', { name: 'crm', exact: true }).hover();
    const sf = page.locator('span', { hasText: /^Salesforce$/ });
    await expect(sf).toHaveCSS('background-color', 'rgb(28, 27, 25)');
    const claude = page.locator('span', { hasText: /^Claude$/ });
    await expect(claude).toHaveCSS('opacity', '0.45');
  });
  test('consult page embeds Calendly and links to anthony-walsh.com', async ({ page }) => {
    await page.goto('/consult/');
    await expect(page.locator('.calendly-inline-widget, [data-url*="calendly.com/antrobertwalsh/gtm-audit"]').first()).toBeAttached();
    const link = page.getByRole('link', { name: /anthony-walsh\.com/ });
    await expect(link).toHaveAttribute('href', 'https://anthony-walsh.com');
    await expect(link).toHaveAttribute('target', '_blank');
  });
  test('workshop form posts to Web3Forms and confirms a 24-hour response', async ({ page }) => {
    let posted = null;
    await page.route('https://api.web3forms.com/submit', async route => {
      posted = route.request().postData() || '';
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });
    await page.goto('/workshops/');
    await page.getByLabel('Name').fill('Ada Lovelace');
    await page.getByLabel('Email').fill('ada@example.com');
    await page.getByLabel('Company').fill('Analytical Engines');
    await page.getByRole('button', { name: /notify me/i }).click();
    await expect(page.getByRole('status').filter({ hasText: 'response in 24 hours' })).toBeVisible();
    expect(posted).toContain('ada@example.com');
    expect(posted).toContain('access_key');
    await expect(page.getByText(/48 hours/)).toHaveCount(0);
  });
  test('workshop form shows an error when submission fails', async ({ page }) => {
    await page.route('https://api.web3forms.com/submit', r => r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'fail' }) }));
    await page.goto('/workshops/');
    await page.getByLabel('Name').fill('Ada');
    await page.getByLabel('Email').fill('ada@example.com');
    await page.getByRole('button', { name: /notify me/i }).click();
    await expect(page.getByRole('alert')).toContainText('couldn’t send');
  });
});

test.describe('Analytics', () => {
  test('PostHog is configured with masked session replay', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).toContain('disable_session_recording:false');
    expect(html).toContain('maskAllInputs:true');
  });
});

test.describe('Accessibility basics', () => {
  test('skip link, lang, and focusable cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    const card = page.locator('.dd-card--interactive').first();
    await expect(card).toHaveAttribute('tabindex', '0');
    await expect(card).toHaveAttribute('role', 'button');
  });
  test('all images have alt text', async ({ page }) => {
    for (const [path] of PAGES) {
      await page.goto(path);
      const missing = await page.locator('img:not([alt])').count();
      expect(missing, path).toBe(0);
    }
  });
});
