// Configuração centralizada do AG Grid
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

// Registrar módulos do AG Grid uma única vez
ModuleRegistry.registerModules([AllCommunityModule]);

// Exportar para garantir que o arquivo seja importado
export const AG_GRID_CONFIGURED = true;
