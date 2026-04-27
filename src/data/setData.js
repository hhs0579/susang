/** SET 카테고리 — 카메라 풀세트 등 (목록/상세 폴백 데이터). Firebase `category: set` 이 있으면 그쪽이 우선됩니다. */

const IMG = {
  alexa35: '/assets/images/homepage_img/01_Camera/01_Camera Full Set/ARRI ALEXA 35 FULL SET.jpg',
  venice2: '/assets/images/homepage_img/01_Camera/01_Camera Full Set/VENICE2.png',
  miniLf: '/assets/images/homepage_img/01_Camera/01_Camera Full Set/ARRI ALEXA MINI LF FULL SET.jpg',
  alexaMini: '/assets/images/homepage_img/01_Camera/01_Camera Full Set/ARRI ALEXA MINI FULL SET.jpg',
  buranoV2: '/assets/images/homepage_img/01_Camera/01_Camera Full Set/SONY BURANO FULL SET ver.2.jpg',
  buranoV1: '/assets/images/homepage_img/01_Camera/01_Camera Full Set/SONY BURANO FULL SET ver.1.jpg',
  amira: '/assets/images/homepage_img/01_Camera/01_Camera Full Set/ARRI AMIRA FULL SET.jpg',
  c400: '/assets/images/homepage_img/01_Camera/01_Camera Full Set/CANON C400 FULL SET.png',
  fx9: '/assets/images/homepage_img/01_Camera/01_Camera Full Set/SONY PXW FX9 FULL SET.jpg',
  fx6: '/assets/images/homepage_img/01_Camera/01_Camera Full Set/SONY ILME FX6 FULL SET.jpg',
  c80: '/assets/images/homepage_img/01_Camera/01_Camera Full Set/CANON C80 FULL SET.png',
}

const studioMonitor = {
  group: 'Studio Monitor (Single, Y)',
  items: [
    'TVLOGIC LVM-180A +0',
    'SWIT FM-215HDR +20,000',
    'Atomos SUMO 19SE +20,000',
    'SMALLHD CINE18 +40,000',
  ],
}

const wirelessLt = {
  group: 'Wireless Transmitter (Multiple, Y)',
  items: [
    'Teradek Bolt LT 1:2 +0',
    'Teradek Bolt LT RX +30,000',
    'Teradek Serv Pro +30,000',
    'SMALLHD CINE 7 Bolt 4K RX +70,000',
  ],
}

const wirelessBolt = {
  group: 'Wireless Transmitter (Multiple, Y)',
  items: [
    'Teradek Bolt 1:2 +0',
    'Teradek Bolt RX +30,000',
    'Teradek Serv Pro +30,000',
    'SMALLHD CINE 7 Bolt 4K RX +70,000',
  ],
}

const wirelessBolt11 = {
  group: 'Wireless Transmitter (Multiple, Y)',
  items: [
    'Teradek Bolt 1:1 +0',
    'Teradek Bolt RX +30,000',
    'Teradek Serv Pro +30,000',
    'SMALLHD CINE 7 Bolt 4K RX +70,000',
  ],
}

const wirelessBolt11NoSmallhd = {
  group: 'Wireless Transmitter (Multiple, Y)',
  items: ['Teradek Bolt 1:1 +0', 'Teradek Bolt RX +30,000', 'Teradek Serv Pro +30,000'],
}

const wirelessFocusNs2 = {
  group: 'Wireless Focus (Single, Y)',
  items: ['Tilta Nucleus-m II +0', 'ARRI HI-5 XS +115,000'],
}

const wirelessFocusNs125 = {
  group: 'Wireless Focus (Single, Y)',
  items: ['Tilta Nucleus-m II +0', 'ARRI HI-5 XS +125,000'],
}

const focusGripMultiN = {
  group: 'Focus Grip (Multiple, N)',
  items: ['Focus Grip +0', 'Wheel Base Stand +5,000'],
}

const cartMultiN = {
  group: 'Cart (Multiple, N)',
  items: ['Cine Cart +10,000', 'Wagon +10,000'],
}

const cartMultiN20 = {
  group: 'Cart (Multiple, N)',
  items: ['Cine Cart +20,000', 'Wagon +10,000'],
}

const head99_18p = {
  group: 'Head (Single, Y)',
  items: ['SACHTLER 9+9 +0', 'SACHTLER 18P +0'],
}

const matteLmb = {
  group: 'Matte Box (Single, Y)',
  items: ['ARRI LMB 2+1 stage +0'],
}

const onCam01F7hs = {
  group: '#01 On-Camera Monitor (Single, Y)',
  items: [
    'TVLOGIC F-7HS +0',
    'SMALLHD CINE5 + 5,000',
    'SMALLHD INDIE7 +5,000',
    'SMALLHD CINE7 +15,000',
  ],
}

const onCam02F7hs = {
  group: '#02 On-Camera Monitor (Single, Y)',
  items: [
    'TVLOGIC F-7HS +0',
    'SMALLHD CINE5 + 5,000',
    'SMALLHD INDIE7 +5,000',
    'SMALLHD CINE7 +15,000',
  ],
}

const onCam01F7h = {
  group: '#01 On-Camera Monitor (Single, Y)',
  items: [
    'TVLOGIC F-7H +0',
    'TVLOGIC F-5A +0',
    'SMALLHD INDIE7 +5,000',
    'SMALLHD CINE5 + 5,000',
    'SMALLHD CINE7 +15,000',
  ],
}

const onCam02F7h = {
  group: '#02 On-Camera Monitor (Single, Y)',
  items: [
    'TVLOGIC F-7H +0',
    'TVLOGIC F-5A +0',
    'SMALLHD INDIE7 +5,000',
    'SMALLHD CINE5 + 5,000',
    'SMALLHD CINE7 +15,000',
  ],
}

const bodyLplPlEf = {
  group: 'Body Mount (Multiple, Y)',
  items: ['LPL +0', 'PL +0', 'EF +10,000'],
}

const bodyEPlEf = {
  group: 'Body Mount (Multiple, Y)',
  items: ['E +0', 'PL +0', 'EF +10,000'],
}

const bodyPlEf = {
  group: 'Body Mount (Multiple, Y)',
  items: ['PL +0', 'EF +10,000'],
}

const buranoMatte = {
  group: 'Matte Box (Single, Y)',
  items: ['Tilta MB-T12 +0', 'Misfit Atom +0', 'Tilta Mirage MatteBox +0', 'LMB 4x5 +10,000'],
}

const matteTilta3 = {
  group: 'Matte Box (Single, Y)',
  items: ['Tilta MB-T12 +0', 'Misfit Atom +0', 'Tilta Mirage MatteBox +0'],
}

export const setProducts = [
  {
    id: 'set-arri-alexa-35',
    name: 'ARRI ALEXA 35',
    brand: 'ARRI',
    originalPrice: 1000000,
    discountPrice: 600000,
    image: IMG.alexa35,
    accessories: [],
    baseComponents: [
      'ARRI ALEXA 35',
      'Codex compact Drive 2TB x 2ea',
      'Codex compact Drive 1TB x 2ea',
      'Codex Compact Drive reader (USB-C) x 1ea',
      'Gentree 12A 290w B-Mount Battery x 5ea',
      'Gentree 15A 290w V-Mount Battery x 4ea',
      'Gentree Cube station charge 4ch c100 B x 1ea',
      'Gentree Cube station charge 4ch x 1ea',
    ],
    options: [
      {
        group: 'Cage Setup (Single, Y)',
        items: ['ARRI ALEXA 35 Cage Setup +0', 'IGNITE Cage Setup (Movi Pro 반출시) +0'],
      },
      bodyLplPlEf,
      head99_18p,
      matteLmb,
      onCam01F7hs,
      onCam02F7hs,
      studioMonitor,
      wirelessLt,
      wirelessFocusNs2,
      focusGripMultiN,
      {
        group: 'Hand Grip (Multiple, N)',
        items: [
          'Wooden Shoulder Rig V3 +25,000',
          'Compact Rig Setup (바디 파워 라인+멀티디탭+V-Mount 24V 승압기) +10,000',
        ],
      },
      cartMultiN,
    ],
  },
  {
    id: 'set-sony-venice2',
    name: 'SONY VENICE2',
    brand: 'SONY',
    originalPrice: 1000000,
    discountPrice: 600000,
    image: IMG.venice2,
    accessories: [],
    baseComponents: [
      'SONY VENICE2',
      'AXSM 1TB x 4ea',
      'AXSM reader x 1ea',
      'Gentree 15A 290w V-Mount Battery x 8ea',
      'Gentree Cube station charge 4ch x 1ea',
    ],
    options: [
      {
        group: 'Cage Setup (Single, Y)',
        items: ['Sony Venice2 Cage Setup +0', 'IGNITE Cage Setup (Movi Pro 반출시) +0'],
      },
      bodyEPlEf,
      head99_18p,
      matteLmb,
      onCam01F7hs,
      onCam02F7hs,
      studioMonitor,
      wirelessLt,
      wirelessFocusNs2,
      { group: 'Extension System (Single, Y)', items: ['Venice2 Rialto +200,000'] },
      focusGripMultiN,
      { group: 'Hand Grip (Single, N)', items: ['Wooden Shoulder Rig V3 +25,000'] },
      { group: 'Cart (Single, N)', items: ['Cine Cart +10,000', 'Wagon +10,000'] },
    ],
  },
  {
    id: 'set-arri-alexa-mini-lf',
    name: 'ARRI ALEXA MINI LF',
    brand: 'ARRI',
    originalPrice: 650000,
    discountPrice: 350000,
    image: IMG.miniLf,
    accessories: [],
    baseComponents: [
      'ARRI ALEXA MINI LF',
      'Codex compact Drive 1TB x 4ea',
      'Codex Compact Drive Dock (TB3) x 1ea',
      'Gentree 15A 290w V-Mount Battery x 8ea',
      'Gentree Cube station charge 4ch x 1ea',
    ],
    options: [
      {
        group: 'Cage Setup (Single, Y)',
        items: ['ARRI ALEXA MINI LF Cage Setup +0', 'IGNITE Cage Setup (Movi Pro 반출시) +0'],
      },
      bodyLplPlEf,
      head99_18p,
      matteLmb,
      onCam01F7hs,
      onCam02F7hs,
      studioMonitor,
      wirelessLt,
      wirelessFocusNs2,
      focusGripMultiN,
      {
        group: 'Hand Grip (Multiple, N)',
        items: ['Wooden Shoulder Rig V3 +25,000', 'Compact Rig Setup (바디 파워 라인+멀티디탭) +10,000'],
      },
      cartMultiN,
    ],
  },
  {
    id: 'set-arri-alexa-mini',
    name: 'ARRI ALEXA MINI',
    brand: 'ARRI',
    originalPrice: 450000,
    discountPrice: 300000,
    image: IMG.alexaMini,
    accessories: [],
    baseComponents: [
      'ARRI ALEXA MINI',
      'Cfast2.0 256GB x 2ea',
      'Cfast2.0 128GB x 2ea',
      'Cfast2.0 Reader x 1ea',
      'Gentree 15A 290w V-Mount Battery x 8ea',
      'Gentree Cube station charge 4ch x 1ea',
    ],
    options: [
      {
        group: 'Cage Setup (Single, Y)',
        items: ['ARRI ALEXA MINI Cage Setup +0', 'IGNITE Cage Setup (Movi Pro 반출시) +0'],
      },
      bodyPlEf,
      head99_18p,
      matteLmb,
      {
        group: '#01 On-Camera Monitor (Single, Y)',
        items: [
          'TVLOGIC F-7H +0',
          'TVLOGIC F-5A +0',
          'SMALLHD INDIE7 +5,000',
          'SMALLHD CINE5 + 5,000',
          'SMALLHD CINE7 +15,000',
        ],
      },
      {
        group: '#02 On-Camera Monitor (Single, Y)',
        items: [
          'TVLOGIC F-7H +0',
          'TVLOGIC F-5A +0',
          'SMALLHD INDIE7 +5,000',
          'SMALLHD CINE5 + 5,000',
          'SMALLHD CINE7 +15,000',
        ],
      },
      studioMonitor,
      {
        group: 'Wireless Transmitter (Multiple, Y)',
        items: [
          'Teradek Bolt 1:2 +0',
          'Teradek Bolt RX +30,000',
          'Teradek Serv Pro +30,000',
          'SMALLHD CINE 7 Bolt 4K RX +70,000',
        ],
      },
      {
        group: 'Wireless Focus (Single, Y)',
        items: ['Tilta Nucleus-m +0', 'Tilta Nucleus-m II +10,000', 'ARRI HI-5 XS +125,000'],
      },
      focusGripMultiN,
      {
        group: 'Hand Grip (Multiple, N)',
        items: ['Wooden Shoulder Rig V3 +25,000', 'Compact Rig Setup (바디 파워 라인+멀티디탭) +10,000'],
      },
      cartMultiN,
    ],
  },
  {
    id: 'sony-burano-full-set-ver-2',
    name: 'SONY BURANO FULL SET ver.2',
    brand: 'SONY',
    originalPrice: 460000,
    discountPrice: 290000,
    image: IMG.buranoV2,
    accessories: [],
    baseComponents: [
      'Sony Burano',
      'CFExpress Type B 2TB x 2ea, 960GB x 2ea',
      'CFExpress Reader x 1ea',
      'Gentree 15A 290w V-Mount Battery x 4ea',
      'Gentree 15A 195w V-Mount Battery x 4ea',
      'Gentree Cube station charge 4ch x 1ea',
    ],
    options: [
      {
        group: 'Cage Setup (Single, Y)',
        items: ['SONY BURANO Cage Setup +0', 'IGNITE Cage Setup (Movi Pro 반출시) +0'],
      },
      bodyEPlEf,
      {
        group: 'Head (Single, Y)',
        items: ['SACHTLER 25P +0', 'SACHTLER 18P +0'],
      },
      buranoMatte,
      onCam01F7h,
      onCam02F7h,
      studioMonitor,
      wirelessBolt,
      wirelessFocusNs125,
      focusGripMultiN,
      { group: 'Hand Grip (Single, N)', items: ['Wooden Shoulder Rig V3 +25,000'] },
      cartMultiN,
    ],
  },
  {
    id: 'sony-burano-full-set-ver-1',
    name: 'SONY BURANO FULL SET ver.1',
    brand: 'SONY',
    originalPrice: 280000,
    discountPrice: 220000,
    image: IMG.buranoV1,
    accessories: [],
    baseComponents: [
      'Sony Burano',
      'CFExpress Type B 2TB x 2ea, 960GB x 2ea',
      'CFExpress Reader x 1ea',
      'Gentree 15A 290w V-Mount Battery x 2ea',
      'Gentree 15A 195w V-Mount Battery x 2ea',
      'Gentree Cube station charge 2ch x 1ea',
    ],
    options: [
      {
        group: 'Cage Setup (Single, Y)',
        items: ['SONY BURANO Cage Setup +0', 'IGNITE Cage Setup (Movi Pro 반출시) +0'],
      },
      bodyEPlEf,
      {
        group: 'Head (Single, Y)',
        items: ['SACHTLER 18P +0', 'SACHTLER 25P +15,000'],
      },
      buranoMatte,
      {
        group: 'On-Camera Monitor (Single, Y)',
        items: [
          'TVLOGIC F-7H +0',
          'TVLOGIC F-5A +0',
          'SMALLHD CINE5 +5,000',
          'SMALLHD INDIE7 +5,000',
          'SMALLHD CINE7 +15,000',
        ],
      },
      studioMonitor,
      wirelessBolt11,
      {
        group: 'Focus (Multiple, N)',
        items: ['Tilta FF-T07 +0', 'Tilta Nucleus-m +25,000', 'Tilta Nucleus-m II +35,000'],
      },
      { group: 'Hand Grip (Single, N)', items: ['Wooden Shoulder Rig V3 +25,000'] },
      cartMultiN20,
    ],
  },
  {
    id: 'set-arri-amira',
    name: 'ARRI AMIRA',
    brand: 'ARRI',
    originalPrice: 300000,
    discountPrice: 150000,
    image: IMG.amira,
    accessories: [],
    baseComponents: [
      'ARRI AMIRA',
      'Cfast2.0 256GB x 2ea',
      'Cfast2.0 128GB x 2ea',
      'Cfast2.0 Reader x 1ea',
      'Gentree 15A 290w V-Mount Battery x 4ea',
      'Gentree Cube station charge 2ch x 1ea',
    ],
    options: [
      { group: 'Cage Setup (Single, Y)', items: ['ARRI AMIRA Cage Setup +0'] },
      {
        group: 'Head (Single, Y)',
        items: ['SACHTLER 25P +0', 'SACHTLER 9+9 +30,000'],
      },
      matteTilta3,
      onCam01F7h,
      studioMonitor,
      wirelessBolt11,
      {
        group: 'Focus (Multiple, N)',
        items: ['Tilta FF-T07 +0', 'Tilta Nucleus-m +25,000', 'Tilta Nucleus-m II +35,000'],
      },
      { group: 'Hand Grip (Single, N)', items: ['Wooden Shoulder Rig V3 +25,000'] },
      cartMultiN20,
    ],
  },
  {
    id: 'canon-c400-full-set',
    name: 'CANON C400 FULL SET',
    brand: 'CANON',
    originalPrice: 150000,
    discountPrice: 120000,
    image: IMG.c400,
    accessories: [],
    baseComponents: [
      'CANON C400',
      'CFExpress Type B 1TB x 3ea',
      'CFExpress Type B Reader x 1ea',
      'Gentree 15A 290w V-Mount Battery x 2ea',
      'Gentree 15A 195w V-Mount Battery x 2ea',
      'Gentree Cube station charge 2ch x 1ea',
      'CANON BP x 3ea (요청시)',
      'CANON Charger x 1ea (요청시)',
    ],
    options: [
      {
        group: 'Cage Setup (Single, Y)',
        items: ['CANON C400 V-Mount Cage +0', 'CANON C400 Body +0'],
      },
      { group: 'Head (Single, Y)', items: ['SACHTLER 18P +0'] },
      buranoMatte,
      {
        group: 'On-Camera Monitor (Single, Y)',
        items: [
          'TVLOGIC F-7H +0',
          'TVLOGIC F-5A +0',
          'SMALLHD CINE5 + 5,000',
          'SMALLHD INDIE7 +5,000',
          'SMALLHD CINE7 +15,000',
        ],
      },
      studioMonitor,
      wirelessBolt11NoSmallhd,
      {
        group: 'Focus (Multiple, N)',
        items: ['Tilta FF-T07 +0', 'Tilta Nucleus-m +25,000', 'Tilta Nucleus-m II +35,000'],
      },
      { group: 'Hand Grip (Multiple, N)', items: ['Wooden Shoulder Rig V3 +25,000'] },
      cartMultiN20,
    ],
  },
  {
    id: 'sony-fx9-full-set',
    name: 'SONY FX9 FULL SET',
    brand: 'SONY',
    originalPrice: 150000,
    discountPrice: 120000,
    image: IMG.fx9,
    accessories: [],
    baseComponents: [
      'SONY FX9',
      'XQD 120 x 3ea',
      'XQD Reader x 1ea',
      'Gentree 15A 290w V-Mount Battery x 2ea',
      'Gentree 15A 195w V-Mount Battery x 2ea',
      'Gentree Cube station charge 2ch x 1ea',
      'SONY BP-U35 x 3ea (요청시)',
      'SONY BP-U Charger x 1ea (요청시)',
    ],
    options: [
      {
        group: 'Cage Setup (Single, Y)',
        items: ['SONY FX9 Tilta V-Mount Cage +0', 'SONY FX9 Body +0'],
      },
      {
        group: 'Body Mount (Multiple, Y)',
        items: ['E +0', 'PL +10,000', 'EF +10,000'],
      },
      { group: 'Head (Single, Y)', items: ['SACHTLER 18P +0'] },
      buranoMatte,
      onCam01F7h,
      studioMonitor,
      {
        group: 'Wireless Transmitter (Multiple, Y)',
        items: [
          'DJI SDR Transmission 1:1 +0',
          'DJI SDR Transmission RX +10,000',
          'Teradek Bolt 1:1 +0',
          'Teradek Bolt RX +30,000',
          'Teradek Serv Pro +30,000',
        ],
      },
      {
        group: 'Focus (Multiple, N)',
        items: ['Tilta FF-T07 +0', 'Tilta Nucleus-m +25,000', 'Tilta Nucleus-m II +35,000'],
      },
      {
        group: 'Hand Grip (Multiple, N)',
        items: ['FX9 Side Grip +0', 'Wooden Shoulder Rig V3 +25,000'],
      },
      cartMultiN20,
    ],
  },
  {
    id: 'sony-fx6-full-set',
    name: 'SONY FX6 FULL SET',
    brand: 'SONY',
    originalPrice: 150000,
    discountPrice: 120000,
    image: IMG.fx6,
    accessories: [],
    baseComponents: [
      'SONY FX6',
      'CFExpress Type A 80GB x 1ea',
      'CFExpress Type A 160GB x 2ea',
      'CFExpress Reader x 1ea',
      'Gentree 15A 195w V-Mount Battery x 4ea',
      'Gentree Cube station charge 2ch x 1ea',
      'SONY BP-U35 x 3ea (요청시)',
      'SONY BP-U Charger x 1ea (요청시)',
    ],
    options: [
      {
        group: 'Cage Setup (Single, Y)',
        items: [
          'SONY FX6 Tilta V-Mount Cage Setup+0',
          'SONY FX6 Body +0',
          'IGNITE Cage Setup (Movi Pro 반출시) +0',
        ],
      },
      {
        group: 'Body Mount (Single, Y)',
        items: ['E +0', 'PL +10,000', 'EF +10,000'],
      },
      {
        group: 'Head / Tripod (Single, Y)',
        items: ['SACHTLER 18P +0', 'AKTIV6 + Flowtech +0'],
      },
      buranoMatte,
      {
        group: 'On-Camera Monitor (Single, Y)',
        items: [
          'TVLOGIC F-7H +0',
          'TVLOGIC F-5A +0',
          'SMALLHD CINE5 + 5,000',
          'SMALLHD INDIE7 +5,000',
          'SMALLHD CINE7 +15,000',
        ],
      },
      studioMonitor,
      {
        group: 'Wireless Transmitter (Multiple, Y)',
        items: [
          'DJI SDR Transmission 1:1 +0',
          'DJI SDR Transmission RX +10,000',
          'Teradek Bolt 1:1 +0',
          'Teradek Bolt RX +30,000',
          'Teradek Serv Pro +30,000',
        ],
      },
      {
        group: 'Focus (Single, N)',
        items: ['Tilta FF-T07 +0', 'Tilta Nucleus-m +25,000', 'Tilta Nucleus-m II +35,000'],
      },
      {
        group: 'Hand Grip (Multiple, N)',
        items: ['FX6 Side Grip +0', 'Wooden Shoulder Rig V3 +25,000'],
      },
      cartMultiN20,
    ],
  },
  {
    id: 'canon-c80-full-set',
    name: 'CANON C80 FULL SET',
    brand: 'CANON',
    originalPrice: 140000,
    discountPrice: 112000,
    image: IMG.c80,
    accessories: [],
    baseComponents: [
      'CANON C80',
      'SUNEAST SD V90 300MB/s 256GB x 3ea',
      'SD Reader x 1ea',
      'Gentree 15A 195w V-Mount Battery x 4ea',
      'Gentree Cube station charge 2ch x 1ea',
      'CANON BP x 3ea (요청시)',
      'CANON Charger x 1ea (요청시)',
    ],
    options: [
      {
        group: 'Cage Setup (Single, Y)',
        items: ['CANON C80 V-Mount Cage +0', 'CANON C80 Body +0'],
      },
      {
        group: 'Head / Tripod (Single, Y)',
        items: ['SACHTLER 18P +0', 'AKTIV6 + Flowtech +0'],
      },
      buranoMatte,
      {
        group: 'On-Camera Monitor (Single, Y)',
        items: [
          'TVLOGIC F-7H +0',
          'TVLOGIC F-5A +0',
          'SMALLHD CINE5 + 5,000',
          'SMALLHD INDIE7 +5,000',
          'SMALLHD CINE7 +15,000',
        ],
      },
      studioMonitor,
      {
        group: 'Wireless Transmitter (Multiple, Y)',
        items: [
          'DJI SDR Transmission 1:1 +0',
          'DJI SDR Transmission RX +10,000',
          'Teradek Bolt 1:1 +0',
          'Teradek Bolt RX +30,000',
          'Teradek Serv Pro +30,000',
        ],
      },
      {
        group: 'Focus (Single, N)',
        items: ['Tilta FF-T07 +0', 'Tilta Nucleus-m +25,000', 'Tilta Nucleus-m II +35,000'],
      },
      {
        group: 'Hand Grip (Multiple, N)',
        items: ['C80 Side Grip +0', 'Wooden Shoulder Rig V3 +25,000'],
      },
      cartMultiN20,
    ],
  },
]
