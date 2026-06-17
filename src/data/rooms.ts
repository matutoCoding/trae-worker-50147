import type { Room } from '@/types/room';

export const mockRooms: Room[] = [
  {
    id: 'r001',
    name: '智慧研讨间101',
    building: '图书馆',
    floor: '一楼',
    capacity: 6,
    area: 30,
    description: '配备高清投影仪、智能白板、视频会议系统，适合小组讨论、项目评审等小型会议。',
    imageUrl: 'https://picsum.photos/id/1036/750/500',
    equipments: [
      { id: 'e001', name: '投影仪', icon: '📽️', available: true },
      { id: 'e002', name: '智能白板', icon: '🖊️', available: true },
      { id: 'e003', name: '视频会议系统', icon: '📹', available: true },
      { id: 'e004', name: '音响系统', icon: '🔊', available: true }
    ],
    facilities: ['空调', 'WiFi', '插座', '水杯架'],
    status: 'available',
    openTime: '08:00',
    closeTime: '22:00'
  },
  {
    id: 'r002',
    name: '创想研讨间102',
    building: '图书馆',
    floor: '一楼',
    capacity: 8,
    area: 35,
    description: '宽敞明亮，配备可移动桌椅，支持灵活布局，适合头脑风暴、创意讨论。',
    imageUrl: 'https://picsum.photos/id/1015/750/500',
    equipments: [
      { id: 'e001', name: '投影仪', icon: '📽️', available: true },
      { id: 'e002', name: '白板', icon: '🖊️', available: true },
      { id: 'e005', name: '可移动桌椅', icon: '🪑', available: true }
    ],
    facilities: ['空调', 'WiFi', '插座', '窗帘'],
    status: 'available',
    openTime: '08:00',
    closeTime: '22:00'
  },
  {
    id: 'r003',
    name: '学术研讨间201',
    building: '图书馆',
    floor: '二楼',
    capacity: 12,
    area: 50,
    description: '大型研讨间，配备专业音响和录播设备，适合学术报告、论文答辩、中型会议。',
    imageUrl: 'https://picsum.photos/id/1018/750/500',
    equipments: [
      { id: 'e001', name: '投影仪', icon: '📽️', available: true },
      { id: 'e002', name: '智能白板', icon: '🖊️', available: true },
      { id: 'e003', name: '视频会议系统', icon: '📹', available: true },
      { id: 'e004', name: '专业音响', icon: '🔊', available: true },
      { id: 'e006', name: '录播设备', icon: '🎥', available: true }
    ],
    facilities: ['空调', 'WiFi', '插座', '水杯架', '讲台'],
    status: 'available',
    openTime: '08:00',
    closeTime: '22:00'
  },
  {
    id: 'r004',
    name: '静谧研读间202',
    building: '图书馆',
    floor: '二楼',
    capacity: 4,
    area: 20,
    description: '小型研读间，环境安静，适合2-4人的小型讨论或个人深度研读。',
    imageUrl: 'https://picsum.photos/id/1039/750/500',
    equipments: [
      { id: 'e007', name: '大屏幕显示器', icon: '🖥️', available: true },
      { id: 'e002', name: '小白板', icon: '🖊️', available: true }
    ],
    facilities: ['空调', 'WiFi', '插座', '隔音设计'],
    status: 'available',
    openTime: '08:00',
    closeTime: '22:00'
  },
  {
    id: 'r005',
    name: '多媒体研讨间301',
    building: '图书馆',
    floor: '三楼',
    capacity: 10,
    area: 45,
    description: '配备全套多媒体设备，支持投屏、直播、远程会议等多种功能。',
    imageUrl: 'https://picsum.photos/id/1044/750/500',
    equipments: [
      { id: 'e001', name: '激光投影仪', icon: '📽️', available: true },
      { id: 'e002', name: '智能交互白板', icon: '🖊️', available: true },
      { id: 'e003', name: '视频会议终端', icon: '📹', available: true },
      { id: 'e004', name: '环绕音响', icon: '🔊', available: true },
      { id: 'e008', name: '无线投屏器', icon: '📡', available: true }
    ],
    facilities: ['空调', 'WiFi', '插座', '灯光调节'],
    status: 'maintenance',
    openTime: '08:00',
    closeTime: '22:00'
  },
  {
    id: 'r006',
    name: '团队协作间302',
    building: '图书馆',
    floor: '三楼',
    capacity: 6,
    area: 28,
    description: '专为团队协作设计，配备可拼接桌面，支持多人同时投屏展示。',
    imageUrl: 'https://picsum.photos/id/1082/750/500',
    equipments: [
      { id: 'e007', name: '双屏显示器', icon: '🖥️', available: true },
      { id: 'e002', name: '玻璃白板', icon: '🖊️', available: true },
      { id: 'e008', name: '无线投屏器', icon: '📡', available: true }
    ],
    facilities: ['空调', 'WiFi', '充足插座', '储物柜'],
    status: 'available',
    openTime: '08:00',
    closeTime: '22:00'
  }
];

export const mockEquipmentOptions = [
  { id: 'e001', name: '投影仪', icon: '📽️' },
  { id: 'e002', name: '白板笔', icon: '🖊️' },
  { id: 'e003', name: '笔记本电脑', icon: '💻' },
  { id: 'e004', name: '激光翻页笔', icon: '🔦' },
  { id: 'e005', name: '移动电源', icon: '🔋' },
  { id: 'e006', name: '麦克风', icon: '🎤' }
];
