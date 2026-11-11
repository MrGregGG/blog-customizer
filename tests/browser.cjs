/* Functional checks against the real Webpack dev server. */
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const path = require('node:path');
const project = path.resolve(__dirname, '..');
const server = spawn(
	process.execPath,
	[
		require.resolve('webpack-cli/bin/cli.js'),
		'serve',
		'--config',
		'webpack/webpack.config.js',
		'--env',
		'env=dev',
		'--host',
		'127.0.0.1',
		'--no-open',
	],
	{ cwd: project, stdio: ['ignore', 'pipe', 'pipe'] }
);
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));
let browser;
let checks = 0;
async function waitServer() {
	for (let i = 0; i < 120; i++) {
		if (server.exitCode !== null) throw new Error(serverLog);
		try {
			if ((await fetch('http://127.0.0.1:8080')).ok) return;
		} catch {}
		await new Promise((r) => setTimeout(r, 250));
	}
	throw new Error('Webpack startup timeout: ' + serverLog);
}
async function check(name, fn) {
	await fn();
	checks++;
	console.log('PASS ' + name);
}
(async () => {
	await waitServer();
	browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
	const page = await browser.newPage({
		viewport: { width: 1600, height: 1000 },
	});
	const errors = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto('http://127.0.0.1:8080');
	await page.evaluate(() => document.fonts.ready);
	const open = () =>
		page.getByRole('button', { name: 'Открыть настройки' }).click();
	const close = () =>
		page.getByRole('button', { name: 'Закрыть настройки' }).click();
	const combo = (name) => page.getByRole('combobox', { name, exact: true });
	const pick = async (name, value) => {
		await combo(name).click();
		await page.getByRole('option', { name: value, exact: true }).click();
	};
	const settings = () =>
		page
			.locator('#root > div')
			.evaluate((el) =>
				[
					'--font-family',
					'--font-size',
					'--font-color',
					'--bg-color',
					'--container-width',
				].map((k) => el.style.getPropertyValue(k))
			);
	const defaults = ['Open Sans', '18px', '#000000', '#FFFFFF', '1394px'];
	await check('01 initial article and settings', async () => {
		assert.deepEqual(await settings(), defaults);
		assert.equal(
			await page.locator('article h1').textContent(),
			'Портрет Западной Швейцарии'
		);
		assert.equal(
			await page
				.locator('article img')
				.evaluate((el) => el.complete && el.naturalWidth > 0),
			true
		);
	});
	if (process.env.SCREENSHOT_DIR)
		await page.screenshot({
			path: path.join(process.env.SCREENSHOT_DIR, 'initial.png'),
			fullPage: true,
		});
	await check('02 open panel', async () => {
		await open();
		await page.getByRole('heading', { name: 'Задайте параметры' }).waitFor();
		assert.equal(await page.getByRole('combobox').count(), 4);
	});
	if (process.env.SCREENSHOT_DIR) {
		await page.waitForTimeout(550);
		await page.screenshot({
			path: path.join(process.env.SCREENSHOT_DIR, 'panel.png'),
		});
	}
	await check('03 close with arrow', async () => {
		await close();
		assert.equal(await page.getByRole('combobox').count(), 0);
	});
	await check('04 outside click', async () => {
		await open();
		await page.locator('article img').click({ position: { x: 1000, y: 80 } });
		assert.equal(await page.getByRole('combobox').count(), 0);
	});
	await open();
	await check('05 font draft only', async () => {
		await pick('Шрифт', 'Merriweather');
		assert.deepEqual(await settings(), defaults);
	});
	await check('06 size draft only', async () => {
		await page.getByText('25px', { exact: true }).click();
		assert.equal(
			await page.getByRole('radio', { name: '25px' }).isChecked(),
			true
		);
		assert.deepEqual(await settings(), defaults);
	});
	await check('07 text color draft only', async () => {
		await pick('Цвет шрифта', 'Фиолетовый');
		assert.deepEqual(await settings(), defaults);
	});
	await check('08 background draft only', async () => {
		await pick('Цвет фона', 'Розовый');
		assert.deepEqual(await settings(), defaults);
	});
	await check('09 width draft only and internal clicks', async () => {
		await pick('Ширина контента', 'Узкий');
		assert.deepEqual(await settings(), defaults);
		assert.equal(await page.getByRole('combobox').count(), 4);
	});
	await check('10 apply all without reload', async () => {
		await page.evaluate(() => (window.__navigationMarker = 123));
		await page.getByRole('button', { name: 'Применить' }).click();
		assert.deepEqual(await settings(), [
			'Merriweather',
			'25px',
			'#5F0DEE',
			'#FEAFE8',
			'948px',
		]);
		assert.equal(await page.evaluate(() => window.__navigationMarker), 123);
		assert.equal(
			await page
				.locator('article')
				.evaluate((el) => getComputedStyle(el).maxWidth),
			'948px'
		);
		assert.equal(
			await page
				.locator('article h1')
				.evaluate((el) => getComputedStyle(el).color),
			'rgb(95, 13, 238)'
		);
	});
	if (process.env.SCREENSHOT_DIR) {
		await page.waitForTimeout(550);
		await page.screenshot({
			path: path.join(process.env.SCREENSHOT_DIR, 'customized.png'),
			fullPage: true,
		});
	}
	await check('11 reset applied settings and controls', async () => {
		await open();
		await page.getByRole('button', { name: 'Сбросить' }).click();
		assert.deepEqual(await settings(), defaults);
		assert.match(await combo('Шрифт').textContent(), /Open Sans/);
		assert.equal(
			await page.getByRole('radio', { name: '18px' }).isChecked(),
			true
		);
	});
	await check('12 reset unapplied draft', async () => {
		await pick('Цвет фона', 'Черный');
		await page.getByRole('button', { name: 'Сбросить' }).click();
		assert.deepEqual(await settings(), defaults);
		assert.match(await combo('Цвет фона').textContent(), /Белый/);
	});
	await check('13 reopen keeps draft without applying', async () => {
		await pick('Шрифт', 'Ubuntu');
		await close();
		await open();
		assert.match(await combo('Шрифт').textContent(), /Ubuntu/);
		assert.deepEqual(await settings(), defaults);
	});
	await check('14 repeated apply and reset', async () => {
		for (let i = 0; i < 3; i++) {
			await page.getByRole('button', { name: 'Применить' }).click();
			await open();
			await page.getByRole('button', { name: 'Сбросить' }).click();
			assert.deepEqual(await settings(), defaults);
			await pick('Шрифт', 'Ubuntu');
		}
		await page.getByRole('button', { name: 'Сбросить' }).click();
	});
	await check('15 keyboard arrow, select, radio and submit', async () => {
		await close();
		await page.getByRole('button', { name: 'Открыть настройки' }).focus();
		await page.keyboard.press('Space');
		await combo('Шрифт').focus();
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		assert.match(await combo('Шрифт').textContent(), /Ubuntu/);
		await page.getByRole('radio', { name: '18px' }).focus();
		await page.keyboard.press('ArrowRight');
		assert.equal(
			await page.getByRole('radio', { name: '25px' }).isChecked(),
			true
		);
		await combo('Цвет шрифта').focus();
		await page.keyboard.press('Space');
		await page.keyboard.press('End');
		await page.keyboard.press('Enter');
		assert.match(await combo('Цвет шрифта').textContent(), /Фиолетовый/);
		await combo('Цвет фона').focus();
		await page.keyboard.press('Enter');
		await page.keyboard.press('Escape');
		assert.equal(await page.getByRole('listbox').count(), 0);
		await page.getByRole('button', { name: 'Применить' }).focus();
		await page.keyboard.press('Enter');
		assert.deepEqual((await settings()).slice(0, 3), [
			'Ubuntu',
			'25px',
			'#5F0DEE',
		]);
		await page.evaluate(() => document.fonts.ready);
		assert.equal(
			await page.evaluate(() => document.fonts.check('18px Ubuntu')),
			true
		);
	});
	await check('16 narrow viewport controls remain reachable', async () => {
		for (const width of [375, 320]) {
			await page.setViewportSize({ width, height: 740 });
			await open();
			await page.getByRole('button', { name: 'Сбросить' }).click();
			await page
				.getByRole('button', { name: 'Применить' })
				.scrollIntoViewIfNeeded();
			assert.equal(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= innerWidth
				),
				true
			);
			await page.getByRole('button', { name: 'Применить' }).click();
		}
	});
	await check('17 no uncaught browser errors', async () =>
		assert.deepEqual(errors, [])
	);
	console.log(`${checks} browser scenarios passed`);
})()
	.catch((e) => {
		console.error(e);
		process.exitCode = 1;
	})
	.finally(async () => {
		if (browser) await browser.close();
		server.kill('SIGTERM');
	});
