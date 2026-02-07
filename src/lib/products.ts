import type { Product } from '@/types';
import { PlaceHolderImages } from './placeholder-images';

const products: Product[] = [
  {
    id: 'mango-himsagar',
    name: 'Himsagar Mango',
    description: 'Sweet, fragrant, and fiberless.',
    longDescription:
      'The Himsagar mango is a popular mango cultivar, originating in the modern-day Bangladesh. It is a medium-sized mango, with a sweet, fragrant, and fiberless pulp. The skin is thin and the stone is small, offering a high pulp content.',
    price: 5.99,
    currency: 'BDT',
    images: PlaceHolderImages.filter((img) => img.id.startsWith('mango-')),
    origin: 'Rajshahi, Bangladesh',
    story:
      'Sourced directly from the famed orchards of Rajshahi, our Himsagar mangoes are grown using traditional methods, ensuring each fruit is packed with authentic flavor.',
  },
  {
    id: 'dates-mariam',
    name: 'Mariam Dates',
    description: 'Rich, caramel-like, and chewy.',
    longDescription:
      'Mariam dates are a premium variety known for their rich, caramel-like flavor and soft, chewy texture. They are packed with natural sugars, fiber, and essential minerals, making them a healthy and delicious snack.',
    price: 12.5,
    currency: 'BDT',
    images: PlaceHolderImages.filter((img) => img.id.startsWith('dates-')),
    origin: 'Saudi Arabia (Imported)',
    story:
      'We carefully select and import the finest Mariam dates to bring you a taste of luxury. Each date is hand-picked to ensure it meets our high standards of quality and freshness.',
  },
  {
    id: 'date-molasses',
    name: 'Date Palm Molasses (Nolen Gur)',
    description: 'Smoky, aromatic liquid gold.',
    longDescription:
      'Nolen Gur, or Date Palm Molasses, is a winter delicacy in Bengal. This liquid gold is extracted from date palm trees and boiled to create a smoky, aromatic, and incredibly flavorful sweetener. Perfect for desserts or as a topping.',
    price: 8.0,
    currency: 'BDT',
    images: PlaceHolderImages.filter((img) => img.id.startsWith('molasses-')),
    origin: 'Jessore, Bangladesh',
    story:
      'Our Nolen Gur is made by skilled artisans in Jessore who have perfected the craft over generations. The process is slow and natural, capturing the true essence of the date palm sap.',
  },
  {
    id: 'sundarban-honey',
    name: 'Sundarbans Honey',
    description: 'Wild, raw, and full-bodied.',
    longDescription:
      "Collected from the heart of the Sundarbans mangrove forest, this honey is truly wild and raw. It has a unique, slightly tangy, and full-bodied flavor profile, reflecting the diverse flora of the world's largest mangrove forest.",
    price: 15.0,
    currency: 'BDT',
    images: PlaceHolderImages.filter((img) => img.id.startsWith('honey-')),
    origin: 'Sundarbans, Bangladesh',
    story:
      'Brave honey hunters (Mawals) venture deep into the Sundarbans to collect this precious honey. We partner with them to ensure sustainable collection practices that protect both the forest and their livelihoods.',
  },
];

export const getProducts = () => products;

export const getProductById = (id: string) => {
  return products.find((product) => product.id === id);
};
