import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ExportData {
  employee: {
    name: string;
    department: string;
  };
  type: string;
  start_date: string;
  end_date: string;
  status: string;
  total_days: number;
  created_at: string;
}

const formatStatus = (status: string): string => {
  switch (status) {
    case 'en_attente':
      return 'En attente';
    case 'validee_par_direction':
      return 'Validée';
    case 'rejetee_par_direction':
      return 'Rejetée';
    default:
      return status;
  }
};

export const exportToExcel = (
  data: ExportData[],
  type: 'all' | 'validated' | 'rejected'
) => {
  // Filtrer les données selon le type
  const filteredData = data.filter((item) => {
    if (type === 'validated') {
      return item.status === 'validee_par_direction';
    }
    if (type === 'rejected') {
      return item.status === 'rejetee_par_direction';
    }
    return true;
  });

  // Transformer les données pour l'export
  const exportData = filteredData.map((item) => ({
    'Nom de l\'employé': item.employee.name,
    'Département': item.employee.department,
    'Type de congé': item.type,
    'Date de début': format(new Date(item.start_date), 'dd/MM/yyyy', {
      locale: fr,
    }),
    'Date de fin': format(new Date(item.end_date), 'dd/MM/yyyy', {
      locale: fr,
    }),
    'Nombre de jours': item.total_days,
    'Statut': formatStatus(item.status),
    'Date de création': format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', {
      locale: fr,
    }),
  }));

  // Créer un nouveau classeur
  const wb = XLSX.utils.book_new();

  // Créer une nouvelle feuille
  const ws = XLSX.utils.json_to_sheet(exportData, {
    header: [
      'Nom de l\'employé',
      'Département',
      'Type de congé',
      'Date de début',
      'Date de fin',
      'Nombre de jours',
      'Statut',
      'Date de création',
    ],
  });

  // Définir la largeur des colonnes
  const colWidths = [
    { wch: 25 }, // Nom
    { wch: 20 }, // Département
    { wch: 15 }, // Type
    { wch: 12 }, // Date début
    { wch: 12 }, // Date fin
    { wch: 15 }, // Nombre de jours
    { wch: 15 }, // Statut
    { wch: 20 }, // Date création
  ];
  ws['!cols'] = colWidths;

  // Ajouter la feuille au classeur
  const sheetName = type === 'all' 
    ? 'Toutes les demandes' 
    : type === 'validated' 
    ? 'Demandes validées' 
    : 'Demandes rejetées';
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Générer le nom du fichier
  const fileName = `demandes_conges_${type}_${format(
    new Date(),
    'dd-MM-yyyy_HH-mm',
    { locale: fr }
  )}.xlsx`;

  // Exporter le fichier
  XLSX.writeFile(wb, fileName);
};
