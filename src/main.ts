import './styles.css';
import { createApp, registerScreen } from './app.ts';
import { startScreen } from './ui/screens/start.ts';
import { makerScreen } from './ui/screens/maker.ts';
import { placementScreen } from './ui/screens/placement.ts';
import { homeScreen } from './ui/screens/home.ts';
import { sessionScreen } from './ui/screens/session.ts';
import { completeScreen } from './ui/screens/complete.ts';
import { parentScreen, printScreen } from './ui/screens/parent.ts';
import { wardrobeScreen } from './ui/screens/wardrobe.ts';

registerScreen('start', startScreen);
registerScreen('maker', makerScreen);
registerScreen('placement', placementScreen);
registerScreen('home', homeScreen);
registerScreen('session', sessionScreen);
registerScreen('complete', completeScreen);
registerScreen('parent', parentScreen);
registerScreen('print', printScreen);
registerScreen('wardrobe', wardrobeScreen);

async function boot(): Promise<void> {
  const root = document.getElementById('app')!;
  const app = await createApp(root);
  app.go('start');
  // Keep audio alive when the tab comes back.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void app.audio.init();
  });
  // Expose for debugging / tests.
  (window as unknown as { rq: unknown }).rq = app;
}

void boot();
