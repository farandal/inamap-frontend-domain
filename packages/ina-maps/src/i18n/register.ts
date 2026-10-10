/**
 * Efecto secundario: registra el vocabulario de ina-maps en el registro de
 * traducciones en tiempo de ejecución cuando se carga el chunk del paquete,
 * en lugar de exigir que cada app lo mezcle en su entrada (dashadmin-i18n).
 */
import { registerTranslations } from './runtime';
import en from './en';
import es from './es';

registerTranslations({ en, es });
