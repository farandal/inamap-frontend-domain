import { IDashAutoAdminResourceConfig } from 'dash-auto-admin';
// Efecto secundario: el vocabulario del paquete se registra cuando este chunk carga.
import '../i18n/register';
import InamapResource from './inamapResource';
import InamapCategoryResource from './categoryResource';

/**
 * Recursos de INAMAP para el manifiesto de una app (equivalente de
 * labResources en VaneXa): inamaps (con el editor) y categorías.
 */
const InamapResources: IDashAutoAdminResourceConfig[] = [InamapResource, InamapCategoryResource];

export default InamapResources;
