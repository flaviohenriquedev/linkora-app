export type Professional = {
  id: number;
  name: string;
  role: string;
  city: string;
  stars: number;
  reviews: number;
  specialty: string;
  initials: string;
  color: string;
};

export const professionals: Professional[] = [
  {
    id: 1,
    name: "Ana Beatriz Costa",
    role: "Estilista",
    city: "São Paulo, SP",
    stars: 5,
    reviews: 47,
    specialty: "Moda Feminina",
    initials: "AB",
    color: "#2E7D52",
  },
  {
    id: 2,
    name: "Carlos Mendes",
    role: "Modelista",
    city: "Belo Horizonte, MG",
    stars: 4,
    reviews: 31,
    specialty: "Modelagem Industrial",
    initials: "CM",
    color: "#7B4EA6",
  },
  {
    id: 3,
    name: "Fernanda Lima",
    role: "Cortadora",
    city: "Fortaleza, CE",
    stars: 5,
    reviews: 58,
    specialty: "Corte a Laser",
    initials: "FL",
    color: "#C9A84C",
  },
  {
    id: 4,
    name: "Rafael Torres",
    role: "Fotógrafo",
    city: "Rio de Janeiro, RJ",
    stars: 4,
    reviews: 22,
    specialty: "Editorial de Moda",
    initials: "RT",
    color: "#C04848",
  },
  {
    id: 5,
    name: "Juliana Mendes",
    role: "Private Label",
    city: "Curitiba, PR",
    stars: 5,
    reviews: 39,
    specialty: "Marca Própria",
    initials: "JM",
    color: "#2E7D52",
  },
  {
    id: 6,
    name: "Marcos Oliveira",
    role: "Consultoria",
    city: "Goiânia, GO",
    stars: 4,
    reviews: 17,
    specialty: "Gestão de Confecção",
    initials: "MO",
    color: "#1E6E8C",
  },
  {
    id: 7,
    name: "Camila Rocha",
    role: "Estilista",
    city: "Salvador, BA",
    stars: 5,
    reviews: 63,
    specialty: "Moda Praia",
    initials: "CR",
    color: "#8C5E1E",
  },
  {
    id: 8,
    name: "Thiago Neves",
    role: "Tecidos",
    city: "Americana, SP",
    stars: 4,
    reviews: 28,
    specialty: "Fornecedor Têxtil",
    initials: "TN",
    color: "#4E7B2E",
  },
];
