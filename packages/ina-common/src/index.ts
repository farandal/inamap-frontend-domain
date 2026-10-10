/**
 * ina-common — piezas de plataforma que las apps INAMAP reutilizan del
 * framework: utilidades de los providers de auth/datos, el uploader de
 * imágenes del tenant, las páginas de cuenta (registro, alta, éxito, legal)
 * y el ícono del cargador. Sin lógica de negocio de mapas (ver ina-maps).
 *
 * Las páginas se importan por subruta (`ina-common/pages/Account/SignUp`) para
 * cargarse de forma diferida.
 */
export { logoutFromStorage } from './auth/authProviderUtils';
export * from './data/dataProviderUtils';
export { INAMAP_LOADER_ICON_MARKUP } from './icons';
export { default as TenantImage } from './components/TenantImage';
export { default as ColorPallete } from './components/ColorPallete';
export { default as ThemePallete } from './components/ThemePallete';
