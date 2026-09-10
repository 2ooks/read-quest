"""End-to-end smoke test: onboarding -> placement -> a full solo session -> reward -> parent dashboard.
Run via: python <skill>/scripts/with_server.py --server "npx vite preview --port 4173 --strictPort" --port 4173 -- python tests/e2e_smoke.py
"""
import json, os, sys, time
from playwright.sync_api import sync_playwright

URL = os.environ.get('RQ_URL', 'http://localhost:4173/')
SHOTS = os.path.join(os.path.dirname(__file__), 'shots')
os.makedirs(SHOTS, exist_ok=True)
errors = []
clicks = []  # (time, description) for diagnostics


def shot(page, name):
    page.screenshot(path=os.path.join(SHOTS, f'{name}.png'))


def current(page):
    return page.evaluate('window.__rq && JSON.stringify(window.__rq.item)')


def still(page, sig):
    return current(page) == sig


def log_click(desc):
    clicks.append((time.time(), desc))


def play_item(page, sig):
    """Play the item identified by `sig`; return as soon as it is no longer current."""
    info = page.evaluate('window.__rq')
    if current(page) != sig:
        return
    item, answer = info['item'], info['answer']
    kind = item['kind']
    stage = page.locator('.stage')

    def click_text(container, text, note):
        """Click the tile in `container` whose text is `text`, if the item is still current."""
        if not still(page, sig):
            return False
        tiles = container.locator('.tile')
        for i in range(tiles.count()):
            t = tiles.nth(i)
            try:
                if t.inner_text(timeout=1000).strip() == str(text):
                    if not still(page, sig):
                        return False
                    t.click(force=True, timeout=2000)
                    log_click(f'{kind}:{note}:{text}')
                    return True
            except Exception:
                return False
        return False

    if kind == 'intro' or (kind == 'tricky' and item.get('intro')):
        page.locator('.next').wait_for(timeout=40000)
        if still(page, sig):
            page.locator('.next').click(force=True)
            log_click('next')
        if kind == 'intro':
            return

    if kind == 'blend':
        for idx, g in enumerate(answer):
            for _ in range(30):
                if not still(page, sig):
                    return
                if stage.locator('.tile.hint').count():
                    break
                page.wait_for_timeout(200)
            # click the live tile until it lights up
            for attempt in range(10):
                if not still(page, sig):
                    return
                if stage.locator('.tile.right').count() > idx:
                    break
                live = stage.locator('.tile.hint')
                if live.count():
                    live.first.click(force=True)
                    log_click(f'blend:blend-tile:{g}')
                page.wait_for_timeout(250)
        for _ in range(100):
            if not still(page, sig):
                return
            if page.locator('.next').count():
                page.locator('.next').click(force=True)
                log_click('blend-next')
                return
            page.wait_for_timeout(200)
        return

    if kind in ('soundHunt', 'wordMatch', 'tricky', 'firstSound'):
        choices = stage.locator('.choices')
        deliberate_miss = (sum(ord(c) for c in sig) % 5 == 0)
        if deliberate_miss:
            page.wait_for_timeout(2200)  # let the prompt finish so the miss registers
            tiles = choices.locator('.tile')
            for i in range(tiles.count()):
                t = tiles.nth(i)
                if t.inner_text().strip() != str(answer) and still(page, sig):
                    t.click(force=True)
                    log_click(f'{kind}:miss:{t.inner_text().strip()}')
                    break
            page.wait_for_timeout(2500)  # miss handling: wobble + "listen again" + replay
        for attempt in range(25):
            if not still(page, sig):
                return
            if not click_text(choices, answer, 'answer'):
                return
            page.wait_for_timeout(700)
            if choices.locator('.tile.right').count():
                return
        return

    if kind == 'build':
        page.wait_for_timeout(300)
        for idx, g in enumerate(answer):
            for attempt in range(15):
                if not still(page, sig):
                    return
                slots = stage.locator('.choices').nth(0).locator('.tile.filled')
                if slots.count() > idx:
                    break
                tray = stage.locator('.choices').nth(1)
                tiles = tray.locator('.tile:not(.used)')
                for i in range(tiles.count()):
                    t = tiles.nth(i)
                    if t.inner_text().strip() == g:
                        t.click(force=True)
                        log_click(f'build:{g}')
                        break
                page.wait_for_timeout(350)
        return

    if kind == 'read':
        for attempt in range(20):
            if not still(page, sig):
                return
            btn = page.locator("button:has-text('She read it!')")
            if btn.count():
                btn.first.click(force=True)
                log_click('read-yes')
            page.wait_for_timeout(700)
        return

    raise AssertionError(f'unknown kind {kind}')


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--autoplay-policy=no-user-gesture-required'])
    context = browser.new_context(viewport={'width': 1180, 'height': 820}, device_scale_factor=1)
    page = context.new_page()
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    shot(page, '01-start')

    page.click("text=Tap to start")
    page.wait_for_selector("text=Make your monster", timeout=15000)
    for step in range(6):
        opts = page.locator('.options button')
        opts.nth(min(step, opts.count() - 1)).click()
        page.click("button:has-text('Next')")
    shot(page, '02-maker')
    page.fill('.name-input', 'Bloop')
    page.click("button:has-text('Done')")

    page.wait_for_selector("text=quick sound check", timeout=15000)
    shot(page, '03-placement-intro')
    page.click("button:has-text('Start')")
    known = 14
    for i in range(40):
        if page.locator("text=Can she blend").count():
            break
        page.click("button:has-text('Said the sound')" if i < known else "button:has-text('Not yet')")
    page.wait_for_selector("text=Can she blend", timeout=10000)
    page.click("button:has-text('Yes')")
    page.wait_for_selector("text=Play by myself", timeout=15000)
    shot(page, '04-home')

    if os.environ.get('RQ_COPLAY'):
        page.evaluate('window.rq.profile.settings.sessionItems = 14')
        page.click("text=Play with a grown-up")
    else:
        page.click("text=Play by myself")
    page.wait_for_function('window.__rq && window.__rq.item', timeout=20000)
    kinds = []
    t0 = time.time()
    sig = None
    try:
        for n in range(60):
            if page.locator("text=All done").count():
                break
            cur = current(page)
            if cur == sig:
                page.wait_for_function(
                    "sig => (window.__rq && JSON.stringify(window.__rq.item) !== sig) || document.body.innerText.includes('All done')",
                    arg=sig, timeout=45000)
                continue
            sig = cur
            item = json.loads(sig)
            kinds.append(item['kind'])
            if len(kinds) in (1, 4, 7, 10):
                shot(page, f'05-item-{len(kinds)}-{item["kind"]}')
            play_item(page, sig)
    except Exception:
        shot(page, 'stuck')
        print('RQ LOG:', page.evaluate('JSON.stringify((window.__rqLog||[]).slice(-6))'))
        print('CLICKS:', [(round(t - t0, 1), d) for t, d in clicks[-8:]])
        raise
    print(f'session kinds ({len(kinds)}): {kinds}  in {time.time() - t0:.0f}s')
    page.wait_for_selector("text=All done", timeout=15000)
    shot(page, '06-complete')
    page.click("button:has-text('Home')")
    page.wait_for_selector("text=Play by myself", timeout=10000)

    page.click("button[title='Dress up']")
    page.wait_for_selector("text=Dress up", timeout=5000)
    shot(page, '07-wardrobe')
    page.click("button:has-text('Done')")

    gear = page.locator("button[title='Grown-ups (hold)']")
    box = gear.bounding_box()
    page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
    page.mouse.down()
    page.wait_for_timeout(1700)
    page.mouse.up()
    page.wait_for_selector("text=Grown-ups", timeout=5000)
    page.wait_for_selector(".grid-gpc", timeout=5000)
    shot(page, '08-parent-progress')
    page.click("button:has-text('Your voice')")
    page.wait_for_selector(".studio-row", timeout=5000)
    shot(page, '09-parent-studio')
    page.click("button:has-text('Settings')")
    page.wait_for_selector("text=Session length", timeout=5000)
    page.click("button:has-text('Data')")
    page.wait_for_selector("text=Your data", timeout=5000)
    page.click("button:has-text('Progress')")
    page.click("button:has-text('Print sentences')")
    page.wait_for_selector("text=Tonight", timeout=5000)
    shot(page, '10-print')

    prof = json.loads(page.evaluate('JSON.stringify(window.rq.profile)'))
    print('sessions:', len(prof['sessions']), 'items unlocked:', prof['monster']['items'], 'theta:', prof['elo'])
    ready = sum(1 for k in prof['gpc'].values() if k['intro'] and k['p'] >= 0.8)
    print('ready gpcs:', ready, 'log events:', len(prof['log']), 'stairs:', prof['stair'])
    assert prof['sessions'], 'session was not recorded'
    assert prof['monster']['items'], 'no reward unlocked'
    assert len(prof['log']) > 10, 'too few log events'

    page.reload()
    page.wait_for_load_state('networkidle')
    page.click("text=Tap to start")
    page.wait_for_selector("text=Play by myself", timeout=15000)
    persisted = page.evaluate('window.rq.profile.sessions.length')
    assert persisted == 1, f'profile did not persist ({persisted})'
    browser.close()

real_errors = [e for e in errors if 'favicon' not in e and 'speechSynthesis' not in e]
print('console errors:', len(real_errors))
for e in real_errors[:10]:
    print('  ', e[:200])
if real_errors:
    sys.exit(1)
print('SMOKE OK')
