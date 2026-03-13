
import { MenuItem, ProductCategory, Table } from './types';

export const ALLERGENS_LIST = [
    'Gluten', 'Crustacee', 'Oua', 'Peste', 'Arahide', 'Soia', 'Lapte',
    'Fructe cu coaja', 'Telina', 'Mustar', 'Susan', 'Sulfiti', 'Lupin', 'Moluste'
];

export const INITIAL_MENU: MenuItem[] = [
  {
    id: '1',
    name: 'Burger Vita Black Angus',
    price: 45,
    category: ProductCategory.FOOD,
    description: 'Carne de vita maturata, cheddar, dulceata de ceapa, chifla brioche.',
    image: 'https://picsum.photos/200/200?random=1',
    active: true,
    vatRate: 9,
    station: 'Grill',
    modifiers: [
      {
        id: 'cooking_level',
        name: 'Grad Gatire',
        minSelection: 1,
        maxSelection: 1,
        options: [
          { id: 'rare', name: 'Rare (In sange)', price: 0 },
          { id: 'medium', name: 'Medium', price: 0 },
          { id: 'well', name: 'Well Done (Bine facut)', price: 0 }
        ]
      },
      {
        id: 'extras',
        name: 'Extra Ingrediente',
        minSelection: 0,
        maxSelection: 3,
        options: [
          { id: 'bacon', name: 'Bacon Crocant', price: 6 },
          { id: 'egg', name: 'Ou Ochi', price: 4 },
          { id: 'jalapeno', name: 'Jalapeno', price: 3 }
        ]
      }
    ],
    instructions: [
        "Scoateti carnea din frigider cu 15 min inainte.",
        "Asezonati cu sare si piper proaspat macinat.",
        "Gatiti pe plita incinsa 3-4 min pe fiecare parte pentru Medium.",
        "Adaugati branza Cheddar in ultimul minut si acoperiti.",
        "Ungeti chifla cu unt si prajiti usor.",
        "Montati: Chifla, Sos, Salata, Carne, Dulceata Ceapa, Chifla."
    ]
  },
  {
    id: '2',
    name: 'Tagliatelle cu Trufe',
    price: 52,
    category: ProductCategory.FOOD,
    description: 'Paste proaspete, sos de smantana, parmezan si trufe negre.',
    image: 'https://picsum.photos/200/200?random=2',
    active: true,
    vatRate: 9,
    station: 'Pasta',
    instructions: [
        "Fierbeti pastele in apa cu sare timp de 3 minute.",
        "Incingeti untul in tigaie, adaugati pasta de trufe.",
        "Adaugati smantana lichida si reduceti focul.",
        "Transferati pastele in sos si amestecati energic.",
        "Adaugati parmezan si putina apa de la paste pentru emulsie.",
        "Serviti cu trufe proaspete rase deasupra."
    ]
  },
  {
    id: '3',
    name: 'Limonada cu Menta',
    price: 18,
    category: ProductCategory.DRINKS,
    description: 'Lamaie proaspata, menta, miere sau zahar.',
    image: 'https://picsum.photos/200/200?random=3',
    active: true,
    vatRate: 19,
    modifiers: [
      {
        id: 'sugar_level',
        name: 'Indulcire',
        minSelection: 1,
        maxSelection: 1,
        options: [
          { id: 'honey', name: 'Miere', price: 2 },
          { id: 'sugar', name: 'Zahar', price: 0 },
          { id: 'no_sugar', name: 'Fara Zahar', price: 0 }
        ]
      }
    ]
  },
  {
    id: '4',
    name: 'Tiramisu Clasic',
    price: 28,
    category: ProductCategory.DESSERT,
    description: 'Piscoturi, mascarpone, cafea espresso si cacao.',
    image: 'https://picsum.photos/200/200?random=4',
    active: true,
    vatRate: 9,
    station: 'Dessert'
  },
  {
    id: '5',
    name: 'Cabernet Sauvignon',
    price: 120,
    category: ProductCategory.ALCOHOL,
    description: 'Vin rosu sec, note de fructe de padure.',
    image: 'https://picsum.photos/200/200?random=5',
    active: true,
    vatRate: 19
  }
];

export const INITIAL_TABLES: Table[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  occupied: false,
  seats: i % 2 === 0 ? 4 : 2,
  zone: 'Interior',
  reserved: false,
  shape: 'square'
}));
