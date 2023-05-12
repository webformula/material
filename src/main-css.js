import core from './core/core.css' assert { type: 'css' };
import typography from './core/typography.css' assert { type: 'css' };
import elevations from './core/elevations.css' assert { type: 'css' };
import pageContent from './core/page-content.css' assert { type: 'css' };
import anchor from './core/anchor.css' assert { type: 'css' };
import util from './core/util.js';

util.registerStyleSheet([core, typography, elevations, pageContent, anchor]);
