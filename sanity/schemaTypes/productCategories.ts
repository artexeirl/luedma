export const ROOT_CATEGORIES = [
  {title: 'Accesorios de Herramientas', value: 'accesorios-de-herramientas'},
  {title: 'Equipos de Taller', value: 'equipos-de-taller'},
  {title: 'Herramientas Electricas', value: 'herramientas-electricas'},
  {title: 'Herramientas Manuales', value: 'herramientas-manuales'},
  {title: 'Seguridad e Iluminacion', value: 'seguridad-e-iluminacion'},
] as const;

export const SUBCATEGORY_OPTIONS: Record<string, Array<{title: string; value: string}>> = {
  'accesorios-de-herramientas': [
    {title: 'Accesorios Abrasivos', value: 'accesorios-abrasivos'},
    {title: 'Brocas y Puntas', value: 'brocas-y-puntas'},
    {title: 'Discos', value: 'discos'},
    {title: 'Hojas de Sierra', value: 'hojas-sierra'},
    {title: 'Juego de Llaves de Vaso', value: 'juego-de-llaves-de-vaso'},
    {title: 'Sierra Copa', value: 'sierra-copa'},
  ],
  'equipos-de-taller': [
    {title: 'Equipos de Levantamiento y Carga', value: 'equipos-de-levantamiento-y-carga'},
    {title: 'Equipos de Medicion', value: 'equipos-de-medicion'},
    {title: 'Organizacion y Almacenamiento', value: 'organizacion-y-almacenamiento'},
  ],
  'herramientas-electricas': [
    {title: 'Amoladoras y Esmeriles', value: 'amoladoras-y-esmeriles'},
    {title: 'Baterias y Cargadores', value: 'baterias-y-cargadores'},
    {title: 'Lijadoras y Cepillos', value: 'lijadoras-y-cepillos'},
    {title: 'Pistolas de Calor', value: 'pistolas-de-calor'},
    {title: 'Rotomartillos y Demolicion', value: 'rotomartillos-y-demolicion'},
    {title: 'Ruteadoras, Fresadoras, Rebajadoras', value: 'ruteadoras-fresadoras-rebajadoras'},
    {title: 'Sierras y Tronzadoras', value: 'sierras-y-tronzadoras'},
    {title: 'Sopladoras y Aspiradoras', value: 'sopladoras-y-aspiradoras'},
    {title: 'Taladros y Atornilladores', value: 'taladros-y-atornilladores'},
  ],
  'herramientas-manuales': [
    {title: 'Abrazadoras', value: 'abrazadoras'},
    {title: 'Alicates y Prensas', value: 'alicates-y-prensas'},
    {title: 'Bloqueo del Volante', value: 'bloqueo-del-volante'},
    {title: 'Bombas de Pie', value: 'bombas-de-pie'},
    {title: 'Brocas para Metal', value: 'brocas-metal'},
    {title: 'Cierrapuertas', value: 'cierrapuertas'},
    {title: 'Cinceles', value: 'cinceles'},
    {title: 'Cortador de Mayolica', value: 'cortadormayolica'},
    {title: 'Hacha', value: 'hacha'},
  ],
  'seguridad-e-iluminacion': [
    {title: 'Iluminacion de Trabajo', value: 'iluminacion-de-trabajo'},
    {title: 'Material de Seguridad', value: 'material-de-seguridad'},
  ],
};


export const ROOT_TO_SUBCATEGORY_FIELD: Record<string, string> = {
  'accesorios-de-herramientas': 'subcategoryAccesorios',
  'equipos-de-taller': 'subcategoryConstruccion',
  'herramientas-electricas': 'subcategoryElectricas',
  'herramientas-manuales': 'subcategoryManuales',
  'seguridad-e-iluminacion': 'subcategorySeguridad',
};
