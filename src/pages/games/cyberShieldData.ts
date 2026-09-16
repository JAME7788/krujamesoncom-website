// ข้อมูลเกม 🛡️ Cyber Shield: ป้อมปราการไซเบอร์ (Network & Firewall Defender)

export type ThreatType = 'malware' | 'phishing' | 'ransomware' | 'spyware' | 'ddos';

export interface ThreatConfig {
  type: ThreatType;
  name: string;
  emoji: string;
  desc: string;
  maxHp: number;
  speed: number; // pixels per second on path
  reward: number; // bandwidth coins awarded
  serverDamage: number; // damage to school server if reaches end
  color: string;
  shield?: boolean; // resistant to basic attacks
  stealth?: boolean; // requires 2FA or upgraded scanner to hit
}

export const THREAT_CONFIGS: Record<ThreatType, ThreatConfig> = {
  malware: {
    type: 'malware',
    name: 'มัลแวร์ทั่วไป (Malware)',
    emoji: '🦠',
    desc: 'ไวรัสคอมพิวเตอร์ที่แฝงมากับไฟล์หรือแฟลชไดรฟ์ มุ่งทำลายข้อมูลเครื่อง',
    maxHp: 80,
    speed: 65,
    reward: 20,
    serverDamage: 10,
    color: '#ef4444',
  },
  phishing: {
    type: 'phishing',
    name: 'สแปม/ฟิชชิ่ง (Phishing)',
    emoji: '🎣',
    desc: 'ลิงก์และอีเมลหลอกลวง เคลื่อนที่รวดเร็ว มุ่งขโมยรหัสผ่านของนักเรียน',
    maxHp: 50,
    speed: 105,
    reward: 25,
    serverDamage: 15,
    color: '#f97316',
  },
  ransomware: {
    type: 'ransomware',
    name: 'มัลแวร์เรียกค่าไถ่ (Ransomware)',
    emoji: '🔒',
    desc: 'ไวรัสเกราะหนา เคลื่อนที่ช้าแต่ทำลายล้างสูง จ้องล็อกไฟล์คะแนนและเอกสารสำคัญ',
    maxHp: 240,
    speed: 40,
    reward: 55,
    serverDamage: 30,
    color: '#a855f7',
    shield: true,
  },
  spyware: {
    type: 'spyware',
    name: 'สปายแวร์/โทรจัน (Spyware)',
    emoji: '🕵️',
    desc: 'โปรแกรมสายลับแอบดักจับแป้นพิมพ์และข้อมูลธุรกรรม ต้องตรวจจับด้วยระบบ 2FA',
    maxHp: 90,
    speed: 75,
    reward: 40,
    serverDamage: 20,
    color: '#06b6d4',
    stealth: true,
  },
  ddos: {
    type: 'ddos',
    name: 'คลื่นดีดอส (DDoS Botnet)',
    emoji: '🌊',
    desc: 'ฝูงแพ็กเก็ตขยะมหาศาล มุ่งถล่มแบนด์วิดท์เซิร์ฟเวอร์ให้ระบบล่ม',
    maxHp: 40,
    speed: 90,
    reward: 15,
    serverDamage: 8,
    color: '#3b82f6',
  },
};

export type TowerType = 'firewall' | 'antivirus' | 'encryption' | 'twofa' | 'cloudbackup';

export interface TowerConfig {
  type: TowerType;
  name: string;
  emoji: string;
  role: string;
  desc: string;
  cost: number;
  upgradeCost: number;
  range: number; // in pixels
  damage: number;
  fireRate: number; // attacks per second
  color: string;
  special: string;
}

export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  firewall: {
    type: 'firewall',
    name: 'ไฟร์วอลล์ (Firewall)',
    emoji: '🛡️',
    role: 'สกัดกั้นและชะลอความเร็ว',
    desc: 'ตรวจกรองพอร์ตและ IP แปลกปลอม ลดความเร็วศัตรูลง 40% และสร้างความเสียหายต่อเนื่อง',
    cost: 100,
    upgradeCost: 80,
    range: 110,
    damage: 18,
    fireRate: 1.1,
    color: '#f59e0b',
    special: 'ชะลอความเร็ว 40% (Slow)',
  },
  antivirus: {
    type: 'antivirus',
    name: 'แอนตี้ไวรัส (Anti-Virus)',
    emoji: '💉',
    role: 'สแกนยิงทำลายมัลแวร์',
    desc: 'ยิงลำแสงเลเซอร์ความถี่สูง กำจัดมัลแวร์และไวรัสทั่วไปได้อย่างแม่นยำและรวดเร็ว',
    cost: 125,
    upgradeCost: 100,
    range: 130,
    damage: 32,
    fireRate: 1.6,
    color: '#10b981',
    special: 'ยิงรัวโจมตีเป้าหมายเดี่ยว',
  },
  encryption: {
    type: 'encryption',
    name: 'เกตเวย์เข้ารหัส (SSL/TLS)',
    emoji: '🔐',
    role: 'คลื่นพัลส์ทำลายแบบกลุ่ม',
    desc: 'ปล่อยคลื่นแม่เหล็กเข้ารหัส สร้างความเสียหายกระจายรอบตัว จัดการฝูง DDoS ได้ดีเยี่ยม',
    cost: 160,
    upgradeCost: 120,
    range: 100,
    damage: 42,
    fireRate: 0.8,
    color: '#6366f1',
    special: 'ดาเมจกระจายรอบตัว (AoE)',
  },
  twofa: {
    type: 'twofa',
    name: 'ระบบยืนยันตัวตน 2FA',
    emoji: '🔑',
    role: 'สไนเปอร์เจาะเกราะและตรวจจับ',
    desc: 'สไนเปอร์ระยะไกลพิเศษ เจาะเกราะ Ransomware และตรวจจับ Spyware ที่พรางตัวได้ 100%',
    cost: 200,
    upgradeCost: 150,
    range: 180,
    damage: 75,
    fireRate: 0.6,
    color: '#ec4899',
    special: 'เจาะเกราะ & ตรวจจับสปายแวร์',
  },
  cloudbackup: {
    type: 'cloudbackup',
    name: 'คลาวด์สำรองข้อมูล (Backup)',
    emoji: '☁️',
    role: 'ฟื้นฟูเซิร์ฟเวอร์ & เพิ่มเหรียญ',
    desc: 'ซ่อมแซมพลังชีวิตเซิร์ฟเวอร์ +10 HP ทุก 4 วินาที และผลิตแบนด์วิดท์โบนัส +15 ต่อนัด',
    cost: 150,
    upgradeCost: 110,
    range: 80,
    damage: 0,
    fireRate: 0.25,
    color: '#0ea5e9',
    special: 'ฟื้นฟูเซิร์ฟเวอร์ + สร้างเหรียญ',
  },
};

export interface CyberBriefingQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  bonusBandwidth: number;
}

export interface WaveDefinition {
  threats: Array<{
    type: ThreatType;
    count: number;
    intervalSeconds: number;
  }>;
}

export interface MissionLevel {
  id: number;
  title: string;
  subtitle: string;
  location: string;
  story: string;
  initialBandwidth: number;
  targetUnit: string;
  briefing: CyberBriefingQuestion;
  waves: WaveDefinition[];
  mapNodes: Array<{ x: number; y: number }>; // placement sockets for towers
  pathPoints: Array<{ x: number; y: number }>; // waypoints from Internet to Server
}

// 8 ด่านภารกิจมาตรฐาน
export const MISSION_LEVELS: MissionLevel[] = [
  {
    id: 1,
    title: 'ภารกิจที่ 1: ห้องคอมพิวเตอร์โรงเรียน',
    subtitle: 'ตรวจจับไวรัสจากแฟลชไดรฟ์',
    location: 'ห้องปฏิบัติการคอมพิวเตอร์ 1',
    story: 'มีนักเรียนเสียบแฟลชไดรฟ์ที่ไม่ทราบที่มาลงในคอมพิวเตอร์ ทำให้มัลแวร์พยายามวิ่งเข้าสู่ระบบเครือข่าย! จงติดตั้งไฟร์วอลล์และแอนตี้ไวรัสเพื่อสกัดกั้น',
    initialBandwidth: 250,
    targetUnit: 'ป.4 หน่วย 4 / ม.1 หน่วย 1',
    briefing: {
      question: 'เมื่อพบแฟลชไดรฟ์ตกอยู่ที่พื้นหรือมีคนแปลกหน้ายื่นให้ ควรทำอย่างไรจึงปลอดภัยที่สุด?',
      options: [
        'รีบเสียบเข้าคอมพิวเตอร์เพื่อดูว่าข้างในมีไฟล์อะไร',
        'ส่งต่อให้เพื่อนลองเปิดดู',
        'นำไปส่งครู และไม่เสียบเข้าเครื่องเพราะอาจมีมัลแวร์แฝงอยู่',
        'ฟอร์แมตทันทีโดยไม่ต้องตรวจอะไร',
      ],
      correctIndex: 2,
      explanation: 'แฟลชไดรฟ์ที่ไม่ทราบที่มาอาจถูกฝังมัลแวร์หรือโปรแกรมขโมยข้อมูล การไม่เสียบใช้งานและแจ้งคุณครูเป็นวิธีที่ถูกต้องและปลอดภัยที่สุด',
      bonusBandwidth: 100,
    },
    pathPoints: [
      { x: 30, y: 160 },
      { x: 220, y: 160 },
      { x: 220, y: 320 },
      { x: 440, y: 320 },
      { x: 440, y: 160 },
      { x: 670, y: 160 },
    ],
    mapNodes: [
      { x: 120, y: 90 },
      { x: 120, y: 230 },
      { x: 330, y: 240 },
      { x: 330, y: 390 },
      { x: 550, y: 90 },
      { x: 550, y: 230 },
    ],
    waves: [
      {
        threats: [{ type: 'malware', count: 5, intervalSeconds: 1.8 }],
      },
      {
        threats: [
          { type: 'malware', count: 6, intervalSeconds: 1.4 },
          { type: 'malware', count: 4, intervalSeconds: 1.0 },
        ],
      },
      {
        threats: [
          { type: 'malware', count: 10, intervalSeconds: 1.0 },
        ],
      },
    ],
  },
  {
    id: 2,
    title: 'ภารกิจที่ 2: Wi-Fi โรงอาหารโรงเรียน',
    subtitle: 'สกัดกั้นลิงก์ฟิชชิ่งความเร็วสูง',
    location: 'โรงอาหาร & อาคารอเนกประสงค์',
    story: 'มีผู้ไม่หวังดีปล่อยสัญญาณ Wi-Fi ปลอม และส่งข้อความฟิชชิ่งหลอกว่า "แจกเน็ตฟรีคลิกเลย" เพื่อดักจับรหัสผ่านของนักเรียน!',
    initialBandwidth: 280,
    targetUnit: 'ป.5 หน่วย 4 / ม.1 หน่วย 2',
    briefing: {
      question: 'ข้อใดคือลักษณะของ "ลิงก์ฟิชชิ่ง (Phishing)" ที่สังเกตได้ง่ายที่สุด?',
      options: [
        'เป็นลิงก์ของเว็บไซต์ทางการที่มีนามสกุล .go.th หรือ .ac.th',
        'มีข้อความเร่งรัด เช่น "ด่วน! บัญชีของคุณถูกระงับ คลิกกู้คืนทันที" และชื่อเว็บสะกดผิดเพี้ยน',
        'เป็นข้อความที่คุณครูแจ้งในห้องเรียนอย่างเป็นทางการ',
        'เว็บไซต์ที่มีไอคอนรูปแม่กุญแจและมีระบบ 2FA ครบถ้วน',
      ],
      correctIndex: 1,
      explanation: 'ฟิชชิ่งมักใช้จิตวิทยาหลอกให้ตกใจหรือโลภ มีคำสะกดผิดเพี้ยน เช่น faceb00k แทนที่จะเป็น facebook ของจริง',
      bonusBandwidth: 110,
    },
    pathPoints: [
      { x: 30, y: 100 },
      { x: 320, y: 100 },
      { x: 320, y: 350 },
      { x: 670, y: 350 },
    ],
    mapNodes: [
      { x: 160, y: 170 },
      { x: 250, y: 220 },
      { x: 390, y: 220 },
      { x: 480, y: 270 },
      { x: 480, y: 420 },
      { x: 250, y: 420 },
    ],
    waves: [
      {
        threats: [
          { type: 'phishing', count: 4, intervalSeconds: 1.5 },
          { type: 'malware', count: 4, intervalSeconds: 1.8 },
        ],
      },
      {
        threats: [
          { type: 'phishing', count: 8, intervalSeconds: 1.1 },
          { type: 'malware', count: 4, intervalSeconds: 1.3 },
        ],
      },
      {
        threats: [
          { type: 'phishing', count: 12, intervalSeconds: 0.9 },
        ],
      },
    ],
  },
  {
    id: 3,
    title: 'ภารกิจที่ 3: ฐานข้อมูลเกรดเฉลี่ย ปพ.5',
    subtitle: 'ป้องกันมัลแวร์เรียกค่าไถ่ Ransomware',
    location: 'ห้องทะเบียนและวัดผลการเรียน',
    story: 'มัลแวร์เรียกค่าไถ่ (Ransomware) กำลังคืบคลานเข้าสู่ฐานข้อมูลผลการเรียน หากมันเข้าไปได้ มันจะเข้ารหัสล็อกไฟล์ทั้งหมด! ต้องใช้ระบบ 2FA และเกตเวย์เข้ารหัสช่วยสกัด',
    initialBandwidth: 320,
    targetUnit: 'ป.6 หน่วย 4 / ม.2 หน่วย 1',
    briefing: {
      question: 'เมื่อคอมพิวเตอร์ถูก "แรนซัมแวร์ (Ransomware)" โจมตี จะเกิดอะไรขึ้นกับไฟล์ข้อมูล?',
      options: [
        'ไฟล์จะถูกเข้ารหัสลับและเปิดไม่ได้ โดยมีข้อความเรียกเงินค่าไถ่เพื่อแลกกับกุญแจถอดรหัส',
        'เครื่องคอมพิวเตอร์จะระเบิดทันที',
        'ไฟล์ทั้งหมดจะถูกเปลี่ยนเป็นภาพการ์ตูน',
        'แป้นพิมพ์จะพิมพ์ภาษาไทยไม่ได้อย่างเดียว',
      ],
      correctIndex: 0,
      explanation: 'Ransomware จะเข้ารหัสไฟล์ของเราทำให้เปิดใช้งานไม่ได้ และขู่กรรโชกให้จ่ายเงินค่าไถ่ วิธีป้องกันที่ดีที่สุดคือการสำรองข้อมูล (Backup) สม่ำเสมอ',
      bonusBandwidth: 120,
    },
    pathPoints: [
      { x: 30, y: 240 },
      { x: 180, y: 240 },
      { x: 180, y: 100 },
      { x: 500, y: 100 },
      { x: 500, y: 360 },
      { x: 670, y: 360 },
    ],
    mapNodes: [
      { x: 100, y: 160 },
      { x: 260, y: 170 },
      { x: 380, y: 170 },
      { x: 420, y: 280 },
      { x: 580, y: 280 },
      { x: 580, y: 430 },
    ],
    waves: [
      {
        threats: [
          { type: 'ransomware', count: 2, intervalSeconds: 3.5 },
          { type: 'malware', count: 5, intervalSeconds: 1.5 },
        ],
      },
      {
        threats: [
          { type: 'ransomware', count: 4, intervalSeconds: 3.0 },
          { type: 'phishing', count: 6, intervalSeconds: 1.2 },
        ],
      },
      {
        threats: [
          { type: 'ransomware', count: 6, intervalSeconds: 2.5 },
          { type: 'malware', count: 8, intervalSeconds: 1.0 },
        ],
      },
      {
        threats: [
          { type: 'ransomware', count: 8, intervalSeconds: 2.2 },
          { type: 'phishing', count: 8, intervalSeconds: 1.0 },
        ],
      },
    ],
  },
  {
    id: 4,
    title: 'ภารกิจที่ 4: บัญชีธนาคารดิจิทัลโรงเรียน',
    subtitle: 'จับม้าโทรจันและสปายแวร์แฝงตัว',
    location: 'ห้องการเงินและสหกรณ์โรงเรียน',
    story: 'มีสปายแวร์พรางตัวแอบดักจับข้อมูลแป้นพิมพ์ (Keylogger) เพื่อหวังขโมยรหัสผ่านบัญชีธนาคาร! วางระบบ 2FA และแอนตี้ไวรัสขั้นสูงเพื่อเปิดโปงร่างจริง',
    initialBandwidth: 350,
    targetUnit: 'ม.2 หน่วย 2 / ม.3 หน่วย 1',
    briefing: {
      question: 'การเปิดใช้งาน "การยืนยันตัวตนแบบสองปัจจัย (2FA / OTP)" ช่วยป้องกันได้อย่างไร?',
      options: [
        'ทำให้คอมพิวเตอร์พิมพ์เร็วขึ้น 2 เท่า',
        'แม้คนร้ายจะรู้รหัสผ่าน ก็ไม่สามารถเข้าระบบได้เพราะไม่มีรหัสผ่านชั้นที่สองที่ส่งเข้ามือถือเรา',
        'ทำให้ไม่ต้องจำรหัสผ่านอีกต่อไป',
        'ป้องกันไม่ให้หน้าจอคอมพิวเตอร์ดับ',
      ],
      correctIndex: 1,
      explanation: '2FA เพิ่มความปลอดภัยอีกชั้น แม้รหัสผ่านหลักจะรั่วไหล ผู้บุกรุกก็ยังไม่สามารถเข้าใช้งานได้หากไม่มีรหัส OTP หรือแอป Authenticator ของเรา',
      bonusBandwidth: 130,
    },
    pathPoints: [
      { x: 30, y: 350 },
      { x: 220, y: 350 },
      { x: 220, y: 120 },
      { x: 460, y: 120 },
      { x: 460, y: 300 },
      { x: 670, y: 300 },
    ],
    mapNodes: [
      { x: 140, y: 270 },
      { x: 140, y: 420 },
      { x: 320, y: 190 },
      { x: 380, y: 260 },
      { x: 540, y: 210 },
      { x: 540, y: 370 },
    ],
    waves: [
      {
        threats: [
          { type: 'spyware', count: 4, intervalSeconds: 2.0 },
          { type: 'malware', count: 6, intervalSeconds: 1.5 },
        ],
      },
      {
        threats: [
          { type: 'spyware', count: 6, intervalSeconds: 1.8 },
          { type: 'ransomware', count: 3, intervalSeconds: 3.0 },
        ],
      },
      {
        threats: [
          { type: 'spyware', count: 8, intervalSeconds: 1.4 },
          { type: 'phishing', count: 8, intervalSeconds: 1.1 },
        ],
      },
      {
        threats: [
          { type: 'spyware', count: 10, intervalSeconds: 1.2 },
          { type: 'ransomware', count: 5, intervalSeconds: 2.4 },
        ],
      },
    ],
  },
  {
    id: 5,
    title: 'ภารกิจที่ 5: เซิร์ฟเวอร์เว็บไซต์โรงเรียน',
    subtitle: 'ต้านทานคลื่นการโจมตี DDoS ถล่มแบนด์วิดท์',
    location: 'ศูนย์คอมพิวเตอร์แม่ข่าย (Server Room)',
    story: 'บ็อตเน็ตจากหลายพันเครื่องระดมส่งข้อมูลปลอมเข้ามาเป็นคลื่นยักษ์ (DDoS Attack) เพื่อทำให้เว็บไซต์โรงเรียนล่ม! ใช้เกตเวย์เข้ารหัส SSL ปล่อยคลื่น AoE และไฟร์วอลล์บล็อกพอร์ต',
    initialBandwidth: 400,
    targetUnit: 'ม.2 หน่วย 3 / ม.3 หน่วย 2',
    briefing: {
      question: 'การโจมตีแบบ "DDoS (Distributed Denial of Service)" มีเป้าหมายเพื่ออะไร?',
      options: [
        'ขโมยหน้าจอคอมพิวเตอร์ไปขาย',
        'ส่งข้อมูลมหาศาลเข้ามาพร้อมกันจนเซิร์ฟเวอร์ประมวลผลไม่ทันและบริการล่ม',
        'เปลี่ยนชื่อเว็บไซต์ให้กลายเป็นภาษาอื่น',
        'ทำให้เมาส์ของครูขยับไม่ได้',
      ],
      correctIndex: 1,
      explanation: 'DDoS มุ่งยิงทราฟฟิกขยะปริมาณมหาศาลเข้ามาอุดตันท่อเครือข่ายและ CPU ทำให้ผู้ใช้จริงไม่สามารถเข้าใช้งานเว็บไซต์หรือระบบได้',
      bonusBandwidth: 140,
    },
    pathPoints: [
      { x: 30, y: 160 },
      { x: 180, y: 160 },
      { x: 180, y: 350 },
      { x: 360, y: 350 },
      { x: 360, y: 160 },
      { x: 520, y: 160 },
      { x: 520, y: 350 },
      { x: 670, y: 350 },
    ],
    mapNodes: [
      { x: 100, y: 90 },
      { x: 270, y: 260 },
      { x: 270, y: 420 },
      { x: 440, y: 90 },
      { x: 440, y: 260 },
      { x: 600, y: 260 },
      { x: 600, y: 420 },
    ],
    waves: [
      {
        threats: [{ type: 'ddos', count: 15, intervalSeconds: 0.6 }],
      },
      {
        threats: [
          { type: 'ddos', count: 20, intervalSeconds: 0.5 },
          { type: 'malware', count: 5, intervalSeconds: 1.2 },
        ],
      },
      {
        threats: [
          { type: 'ddos', count: 25, intervalSeconds: 0.4 },
          { type: 'phishing', count: 8, intervalSeconds: 0.9 },
        ],
      },
      {
        threats: [
          { type: 'ddos', count: 30, intervalSeconds: 0.35 },
          { type: 'ransomware', count: 4, intervalSeconds: 2.5 },
        ],
      },
      {
        threats: [
          { type: 'ddos', count: 40, intervalSeconds: 0.3 },
          { type: 'spyware', count: 6, intervalSeconds: 1.2 },
        ],
      },
    ],
  },
  {
    id: 6,
    title: 'ภารกิจที่ 6: ศูนย์ข้อมูลชุมชนอัจฉริยะ',
    subtitle: 'คุ้มกันระบบ IoT และกล้องวงจรปิด',
    location: 'ศูนย์ Smart City ตำบลคลองมดแดง',
    story: 'อุปกรณ์กล้องวงจรปิดและระบบเซ็นเซอร์น้ำท่วมอัจฉริยะกำลังถูกแฮกเกอร์โจมตีด้วยไวรัสแบบผสมผสาน! ต้องวางแนวป้องกันหลายชั้นเพื่อปกป้องความปลอดภัยของชุมชน',
    initialBandwidth: 450,
    targetUnit: 'ม.3 หน่วย 2 / ม.3 หน่วย 3',
    briefing: {
      question: 'สัญลักษณ์แม่กุญแจสีเขียวหรือ "HTTPS" บนแถบที่อยู่ของเว็บบราวเซอร์ บ่งบอกถึงสิ่งใด?',
      options: [
        'เว็บไซต์นี้เล่นเกมได้ฟรีตลอดชีพ',
        'การเชื่อมต่อระหว่างเรากับเซิร์ฟเวอร์มีการเข้ารหัสลับ ป้องกันการแอบดักดูข้อมูลกลางทาง',
        'เว็บไซต์นี้เป็นของราชการเท่านั้น',
        'เครื่องคอมพิวเตอร์ไม่มีวันติดไวรัส',
      ],
      correctIndex: 1,
      explanation: 'HTTPS มีการเข้ารหัสผ่านโปรโตคอล SSL/TLS ทำให้คนกลางไม่สามารถแอบอ่านหรือแก้ไขข้อความ ข้อมูลรหัสผ่าน หรือบัตรเครดิตของเราได้',
      bonusBandwidth: 150,
    },
    pathPoints: [
      { x: 30, y: 100 },
      { x: 260, y: 100 },
      { x: 260, y: 260 },
      { x: 140, y: 260 },
      { x: 140, y: 400 },
      { x: 500, y: 400 },
      { x: 500, y: 200 },
      { x: 670, y: 200 },
    ],
    mapNodes: [
      { x: 140, y: 180 },
      { x: 200, y: 330 },
      { x: 340, y: 180 },
      { x: 340, y: 330 },
      { x: 420, y: 280 },
      { x: 580, y: 120 },
      { x: 580, y: 280 },
    ],
    waves: [
      {
        threats: [
          { type: 'malware', count: 8, intervalSeconds: 1.2 },
          { type: 'phishing', count: 8, intervalSeconds: 1.0 },
        ],
      },
      {
        threats: [
          { type: 'ransomware', count: 4, intervalSeconds: 2.8 },
          { type: 'spyware', count: 6, intervalSeconds: 1.4 },
        ],
      },
      {
        threats: [
          { type: 'ddos', count: 25, intervalSeconds: 0.4 },
          { type: 'phishing', count: 10, intervalSeconds: 0.8 },
        ],
      },
      {
        threats: [
          { type: 'ransomware', count: 6, intervalSeconds: 2.2 },
          { type: 'ddos', count: 30, intervalSeconds: 0.35 },
        ],
      },
      {
        threats: [
          { type: 'spyware', count: 8, intervalSeconds: 1.1 },
          { type: 'ransomware', count: 8, intervalSeconds: 2.0 },
          { type: 'ddos', count: 35, intervalSeconds: 0.3 },
        ],
      },
    ],
  },
  {
    id: 7,
    title: 'ภารกิจที่ 7: ระบบคลาวด์การศึกษา สพฐ.',
    subtitle: 'ยุทธศาสตร์ป้องกันแบบเจาะลึก (Defense in Depth)',
    location: 'OBEC Education Cloud Infrastructure',
    story: 'กลุ่มแฮกเกอร์ข้ามชาติเปิดฉากโจมตีระบบคลาวด์กลาง มีการใช้โทรจันร่วมกับแรนซัมแวร์สายพันธุ์ใหม่! ต้องใช้คลาวด์สำรองข้อมูลและป้อมระดับสูงสุด',
    initialBandwidth: 500,
    targetUnit: 'ม.3 หน่วย 3 / ม.3 หน่วย 4',
    briefing: {
      question: 'กฎการสำรองข้อมูล "3-2-1 Backup Rule" ที่เป็นมาตรฐานสากล หมายถึงข้อใด?',
      options: [
        'เก็บข้อมูลไว้ 3 ไฟล์ บนแฟลชไดรฟ์อันเดียวกัน และทำภายใน 1 นาที',
        'เก็บข้อมูล 3 ชุด บนสื่อบันทึกต่างกัน 2 แบบ และมี 1 ชุดเก็บไว้ภายนอกสถานที่ (เช่น บน Cloud)',
        'พิมพ์งานออกมา 3 แผ่น ใส่ซอง 2 ชั้น และส่งทางไปรษณีย์ 1 รอบ',
        'สำรองข้อมูลเฉพาะวันที่ 3 เดือน 2 ของทุกปี',
      ],
      correctIndex: 1,
      explanation: 'กฎ 3-2-1 คือหลักการสากล: ข้อมูล 3 ชุด, สื่อบันทึก 2 ชนิด (เช่น Hard Drive + SSD), และ 1 ชุดอยู่นอกสถานที่ (Off-site/Cloud) เพื่อรับมือกรณีไฟไหม้หรือไวรัสล็อกเครื่อง',
      bonusBandwidth: 160,
    },
    pathPoints: [
      { x: 30, y: 220 },
      { x: 160, y: 220 },
      { x: 160, y: 80 },
      { x: 360, y: 80 },
      { x: 360, y: 380 },
      { x: 520, y: 380 },
      { x: 520, y: 220 },
      { x: 670, y: 220 },
    ],
    mapNodes: [
      { x: 80, y: 140 },
      { x: 240, y: 160 },
      { x: 280, y: 280 },
      { x: 440, y: 160 },
      { x: 440, y: 300 },
      { x: 600, y: 140 },
      { x: 600, y: 300 },
    ],
    waves: [
      {
        threats: [
          { type: 'ransomware', count: 4, intervalSeconds: 2.5 },
          { type: 'spyware', count: 6, intervalSeconds: 1.2 },
        ],
      },
      {
        threats: [
          { type: 'ddos', count: 30, intervalSeconds: 0.4 },
          { type: 'phishing', count: 12, intervalSeconds: 0.8 },
        ],
      },
      {
        threats: [
          { type: 'ransomware', count: 6, intervalSeconds: 2.0 },
          { type: 'spyware', count: 8, intervalSeconds: 1.0 },
        ],
      },
      {
        threats: [
          { type: 'ddos', count: 40, intervalSeconds: 0.3 },
          { type: 'ransomware', count: 6, intervalSeconds: 1.8 },
        ],
      },
      {
        threats: [
          { type: 'phishing', count: 15, intervalSeconds: 0.7 },
          { type: 'spyware', count: 10, intervalSeconds: 0.9 },
          { type: 'ransomware', count: 8, intervalSeconds: 1.6 },
        ],
      },
      {
        threats: [
          { type: 'ransomware', count: 10, intervalSeconds: 1.5 },
          { type: 'ddos', count: 50, intervalSeconds: 0.25 },
        ],
      },
    ],
  },
  {
    id: 8,
    title: 'ภารกิจที่ 8: มหาศึกสงครามไซเบอร์',
    subtitle: 'ต่อต้านการโจมตีช่องโหว่ Zero-Day ขั้นวิกฤติ',
    location: 'ศูนย์บัญชาการความมั่นคงปลอดภัยไซเบอร์แห่งชาติ',
    story: 'ภัยคุกคามระดับสูงสุด! มีการระดมโจมตีด้วยมัลแวร์สายพันธุ์ไม่เคยพบมาก่อน (Zero-Day Exploits) และบอสแรนซัมแวร์ยักษ์ จงใช้ความรู้ทั้งหมดวางระบบป้องกันให้ไร้จุดอ่อน!',
    initialBandwidth: 550,
    targetUnit: 'ม.3 หน่วย 3 / ม.3 หน่วย 4',
    briefing: {
      question: 'คำว่า "Zero-Day Vulnerability" ในวงการความปลอดภัยไซเบอร์ มีความหมายว่าอย่างไร?',
      options: [
        'ช่องโหว่ที่เกิดขึ้นในวันที่ศูนย์ของเดือน',
        'ช่องโหว่ที่ผู้พัฒนายังไม่รู้ หรือยังไม่มีแพตช์แก้ไข ทำให้มีเวลาตั้งรับ "ศูนย์วัน"',
        'ไวรัสที่จะหายไปเองภายในเวลาไม่เกิน 0 วัน',
        'ระบบความปลอดภัยที่มีระดับศูนย์ ไม่สามารถใช้งานได้',
      ],
      correctIndex: 1,
      explanation: 'Zero-Day คือช่องโหว่ใหม่เอี่ยมที่ผู้สร้างซอฟต์แวร์ยังไม่เคยรู้ ทำให้ยังไม่มีแพตช์ซ่อมแซม ถือเป็นภัยคุกคามที่อันตรายที่สุดในโลกไซเบอร์',
      bonusBandwidth: 180,
    },
    pathPoints: [
      { x: 30, y: 160 },
      { x: 180, y: 160 },
      { x: 180, y: 360 },
      { x: 340, y: 360 },
      { x: 340, y: 80 },
      { x: 500, y: 80 },
      { x: 500, y: 280 },
      { x: 670, y: 280 },
    ],
    mapNodes: [
      { x: 100, y: 90 },
      { x: 100, y: 260 },
      { x: 260, y: 260 },
      { x: 260, y: 420 },
      { x: 420, y: 180 },
      { x: 420, y: 340 },
      { x: 580, y: 180 },
      { x: 580, y: 380 },
    ],
    waves: [
      {
        threats: [
          { type: 'malware', count: 12, intervalSeconds: 0.9 },
          { type: 'phishing', count: 10, intervalSeconds: 0.8 },
        ],
      },
      {
        threats: [
          { type: 'spyware', count: 10, intervalSeconds: 1.0 },
          { type: 'ransomware', count: 6, intervalSeconds: 2.0 },
        ],
      },
      {
        threats: [
          { type: 'ddos', count: 40, intervalSeconds: 0.3 },
          { type: 'ransomware', count: 8, intervalSeconds: 1.6 },
        ],
      },
      {
        threats: [
          { type: 'phishing', count: 18, intervalSeconds: 0.6 },
          { type: 'spyware', count: 12, intervalSeconds: 0.8 },
          { type: 'ransomware', count: 8, intervalSeconds: 1.5 },
        ],
      },
      {
        threats: [
          { type: 'ddos', count: 50, intervalSeconds: 0.25 },
          { type: 'ransomware', count: 12, intervalSeconds: 1.4 },
        ],
      },
      {
        threats: [
          { type: 'ransomware', count: 15, intervalSeconds: 1.2 },
          { type: 'spyware', count: 15, intervalSeconds: 0.8 },
          { type: 'ddos', count: 60, intervalSeconds: 0.2 },
        ],
      },
    ],
  },
];
