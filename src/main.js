import './styles/base.css';
import './styles/panel.css';
import './styles/board.css';
import './styles/dialog.css';
import './styles/overlay.css';
import { loadSprites } from './assets.js';
import { initStage } from './stage.js';
import { initDialog } from './ui/dialog.js';
import { initPanel } from './ui/panel.js';
import { startLoop } from './loop.js';
import { titleScreen } from './story/index.js';

loadSprites();
initStage();
initDialog();
initPanel();
startLoop();
titleScreen();
