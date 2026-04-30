export const intercomProducts = [
  {
    id: 'solidcom-se',
    section: 'INTERCOM',
    name: 'SOLIDCOM SE',
    brand: 'Hollyland',
    originalPrice: 30000,
    discountPrice: 30000,
    image: '/assets/images/homepage_img/06_Intercom/SOLIDCOM SE.jpg',
    accessories: [],
    baseComponents: ['Solidcom SE x 5ea', 'Battery x 5ea', 'Charger x 1ea', 'Pouch x 5ea'],
    options: [
      {
        group: '옵션 (Multiple, N)',
        items: ['Solidcom SE x 1ea +6,000', 'Solidcom SE x 1ea +6,000', 'Solidcom SE x 1ea +6,000', 'Solidcom SE x 1ea +6,000'],
      },
    ],
  },
  {
    id: 't82-extreme',
    section: 'INTERCOM',
    name: 'T82 EXTREME',
    brand: 'Motorola',
    originalPrice: 10000,
    discountPrice: 10000,
    image: '/assets/images/homepage_img/06_Intercom/T82 EXTREME.jpg',
    accessories: [],
    baseComponents: ['T82 Extreme x 2ea', 'Charger x 1ea', 'Strap x 2ea', 'Ear Mic x 2ea'],
    options: [],
  },
]

export function formatIntercomPrice(value) {
  return `₩${Number(value || 0).toLocaleString('ko-KR')}`
}

export function getIntercomById(id) {
  return intercomProducts.find((item) => item.id === id)
}
