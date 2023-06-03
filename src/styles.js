import core from './styles/core.css' assert { type: 'css' };
import typography from './styles/typography.css' assert { type: 'css' };
import elevations from './styles/elevations.css' assert { type: 'css' };
import pageContent from './styles/page-content.css' assert { type: 'css' };
import anchor from './styles/anchor.css' assert { type: 'css' };
import util from './core/util.js';
import { generate } from './core/theme.js';

util.registerStyleSheet([core, typography, elevations, pageContent, anchor]);
generate();
