// ข้อมูลสื่อการสอนและใบงานวิทยาการคำนวณ 409 รายการจาก Google Sheets ครูคอม
// อ้างอิง: https://docs.google.com/spreadsheets/d/1F5hAIvdYPK9AsLMdMIFl3HuTI1LsPLWKkITrNDg-Rx8/edit?gid=0#gid=0

export type KruComCategory = 
  | 'coding' 
  | 'cyber-safety' 
  | 'hardware' 
  | 'office-tools' 
  | 'data-detective' 
  | 'ai-tech' 
  | 'general';

export interface KruComSheetItem {
  id: string;
  folder: string;
  title: string;
  cleanTitle: string;
  category: KruComCategory;
  targetLevel: string;
  url: string;
}

export const KRU_COM_CATEGORIES: { key: KruComCategory; name: string; icon: string; desc: string }[] = [
  { key: 'coding', name: 'โค้ดดิ้ง & ผังงาน', icon: '🚀', desc: 'Unplugged Coding, Scratch, Python, Flowchart และหุ่นยนต์' },
  { key: 'cyber-safety', name: 'ความปลอดภัยไซเบอร์ & กฎหมาย', icon: '🛡️', desc: 'พ.ร.บ.คอมพิวเตอร์, Cyberbullying, รหัสผ่าน และรู้ทันมิจฉาชีพ' },
  { key: 'hardware', name: 'ฮาร์ดแวร์ & ระบบคอมพิวเตอร์', icon: '🖥️', desc: 'อุปกรณ์คอมพิวเตอร์, แป้นพิมพ์, เม้าส์, CPU และการดูแลรักษา' },
  { key: 'office-tools', name: 'โปรแกรมประยุกต์ & ไฟล์', icon: '💼', desc: 'Microsoft Word, Excel, PowerPoint, Paint และการจัดหมวดหมู่ไฟล์' },
  { key: 'data-detective', name: 'การสืบค้น & วิเคราะห์ข้อมูล', icon: '🔍', desc: 'ประเมินความน่าเชื่อถือ, ข่าวปลอม, ประเภทข้อมูล และแหล่งข้อมูล' },
  { key: 'ai-tech', name: 'AI & นวัตกรรมเทคโนโลยี', icon: '🤖', desc: 'ทักษะยุค AI, วิวัฒนาการเทคโนโลยี และการใช้ AI อย่างปลอดภัย' },
  { key: 'general', name: 'ใบงาน & กิจกรรมรวม', icon: '📚', desc: 'ข้อสอบและสื่อการสอนบูรณาการวิทยาการคำนวณ' },
];

export const kruComSheetItems: KruComSheetItem[] = [
  {
    "id": "krucom-001",
    "folder": "391 บอร์ดคำศัพท์ คอมพิวเตอร์พื้นฐาน",
    "title": "บอร์ดคำศัพท์ คอมพิวเตอร์พื้นฐาน แนวนอน.pdf",
    "cleanTitle": "บอร์ดคำศัพท์ คอมพิวเตอร์พื้นฐาน",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1GwJqC2BHpwoX5jvwdlz7le6czTJE7W4q/view?usp=drivesdk"
  },
  {
    "id": "krucom-002",
    "folder": "391 บอร์ดคำศัพท์ คอมพิวเตอร์พื้นฐาน",
    "title": "บอร์ดคำศัพท์ คอมพิวเตอร์พื้นฐาน.pdf",
    "cleanTitle": "บอร์ดคำศัพท์ คอมพิวเตอร์พื้นฐาน",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ptNFDh5iGIbvFKRuge2Mq0uQGBIfT8xX/view?usp=drivesdk"
  },
  {
    "id": "krucom-003",
    "folder": "390 ใบงาน MS-word",
    "title": "ใบงาน Microsoft Word ป.4-6 .pdf",
    "cleanTitle": "ใบงาน MS-word",
    "category": "office-tools",
    "targetLevel": "ป.4-6",
    "url": "https://drive.google.com/file/d/1Q3ZqQKXFlnbzYrN-92w8ppGOIwym67vm/view?usp=drivesdk"
  },
  {
    "id": "krucom-004",
    "folder": "389 บอร์ดเกม พรบ.คอมพิวเตอร์",
    "title": "พรบ.คอม.pdf",
    "cleanTitle": "บอร์ดเกม พรบ.คอมพิวเตอร์",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1QZoWDDbYQa4K3uEnYTY-Gcbjopkdxb0B/view?usp=drivesdk"
  },
  {
    "id": "krucom-005",
    "folder": "388 ประเภทข้อมูล",
    "title": "ดีไซน์ที่ยังไม่ได้ตั้งชื่อ.pdf",
    "cleanTitle": "ประเภทข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1-EcsmW4852FZ6YA_0fHuBYxwx0geDWJG/view?usp=drivesdk"
  },
  {
    "id": "krucom-006",
    "folder": "387 การจัดหมวดหมู่ไฟล์",
    "title": "การจัดหมวดหมู่ไฟล์.pdf",
    "cleanTitle": "การจัดหมวดหมู่ไฟล์",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1FF3MF5-n74MhZpGJF2FxwGCQKuvuPqup/view?usp=drivesdk"
  },
  {
    "id": "krucom-007",
    "folder": "386 ใบงาน Scratch ป.4-6",
    "title": "เฉลย ใบงาน Scratch ป.4-6.pdf",
    "cleanTitle": "ใบงาน Scratch ป.4-6",
    "category": "coding",
    "targetLevel": "ป.4-6",
    "url": "https://drive.google.com/file/d/1QNGbrEofFwo-uRLq7AiohLx-F_RBhYzW/view?usp=drivesdk"
  },
  {
    "id": "krucom-008",
    "folder": "386 ใบงาน Scratch ป.4-6",
    "title": "ใบงาน Scratch ป.4-6.pdf",
    "cleanTitle": "ใบงาน Scratch ป.4-6",
    "category": "coding",
    "targetLevel": "ป.4-6",
    "url": "https://drive.google.com/file/d/1_av49Ir9i1ePTeJTZEElq215Qsyia4w4/view?usp=drivesdk"
  },
  {
    "id": "krucom-009",
    "folder": "385 ชิ้นงานประเภทของข้อมูล",
    "title": "ชิ้นงานประเภทของข้อมูล.pdf",
    "cleanTitle": "ชิ้นงานประเภทของข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1NRfLbWlhb2xY9OoIH7wOdoLorz5oi74E/view?usp=drivesdk"
  },
  {
    "id": "krucom-010",
    "folder": "383 ประเภทของข้อมูล",
    "title": "ชิ้นงานประเภทของข้อมูล.pdf",
    "cleanTitle": "ประเภทของข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/10BTm8aXQs-Gr4KHw9Zh0JyRuCXzFZKrA/view?usp=drivesdk"
  },
  {
    "id": "krucom-011",
    "folder": "381 บอร์ดเกม CYBER BULLYING",
    "title": "CYBER BULLying.pdf",
    "cleanTitle": "บอร์ดเกม CYBER BULLYING",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Kr6YGjpmNsu9KI3W5QBc4RfzBaaGO2W9/view?usp=drivesdk"
  },
  {
    "id": "krucom-012",
    "folder": "380 วิวัฒนาการของเทคโนโลยี",
    "title": "โทรศัพท์บ้านแบบหมุน  Rotary Dial Phone.pdf",
    "cleanTitle": "วิวัฒนาการของเทคโนโลยี",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1wDZg_zLPjcXq6UCFUSrfMMSod--eMomH/view?usp=drivesdk"
  },
  {
    "id": "krucom-013",
    "folder": "379 ใบงานคอมพิวเตอร์",
    "title": "ใบงาน คอมพิวเตอร์.pdf",
    "cleanTitle": "ใบงานคอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1-rd0vco51FUp20bpadNmyP4E9AqBV7dR/view?usp=drivesdk"
  },
  {
    "id": "krucom-014",
    "folder": "378 กิจกรรมวิทย์พลัง 10 ป.4",
    "title": "วิทย์พลังสิบ ป.4.pdf",
    "cleanTitle": "กิจกรรมวิทย์พลัง 10 ป.4",
    "category": "general",
    "targetLevel": "ป.4-6",
    "url": "https://drive.google.com/file/d/1U_aDmPXWXgD1JW5b3sGik7ubCbY_6jgJ/view?usp=drivesdk"
  },
  {
    "id": "krucom-015",
    "folder": "377 ใบงาน การเขียนผังงานแบบมีเงื่อนไข",
    "title": "หุ่นยนต์เก็บขยะ.pdf",
    "cleanTitle": "ใบงาน การเขียนผังงานแบบมีเงื่อนไข",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1TTBxo0EwzSijIEv_M92ogL6WWX7InIN6/view?usp=drivesdk"
  },
  {
    "id": "krucom-016",
    "folder": "376 แพลตฟอร์มออนไลน์",
    "title": "แพลตฟอร์มออนไลน์.pdf",
    "cleanTitle": "แพลตฟอร์มออนไลน์",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/14G55lrnGOvtonSYlHL_Od3GA8eDPMZpl/view?usp=drivesdk"
  },
  {
    "id": "krucom-017",
    "folder": "375 เกม Digital Mission ภารกิจเด็กไอที",
    "title": "เกม Digital Mission ภารกิจเด็กไอที.pdf",
    "cleanTitle": "เกม Digital Mission ภารกิจเด็กไอที",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1bZiZdh6fxH24uk5-i8cyk1ynqh9LoPm2/view?usp=drivesdk"
  },
  {
    "id": "krucom-018",
    "folder": "374 สื่อแต่งบอร์ด แพลตฟอร์มออนไลน์ที่นักเรียนควรรู้จัก",
    "title": "สื่อแต่งบอร์ด แพลตฟอร์มออนไลน์ที่นักเรีย.pdf",
    "cleanTitle": "สื่อแต่งบอร์ด แพลตฟอร์มออนไลน์ที่นักเรียนควรรู้จัก",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/136YuFV7lOKHorhZ0pA7JkH35jdGa_Kht/view?usp=drivesdk"
  },
  {
    "id": "krucom-019",
    "folder": "373 สร้างรูปเรขาคณิต Scratch",
    "title": "สร้างรูปเรขาคณิต Scratch.pdf",
    "cleanTitle": "สร้างรูปเรขาคณิต Scratch",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1GhizaQrnJIpjyRWFW-1FGh7trJkITD1V/view?usp=drivesdk"
  },
  {
    "id": "krucom-020",
    "folder": "372 ใบงาน แนวคิดเชิงนามธรรม",
    "title": "ใบงาน แนวคิดเชิงนามธรรม.pdf",
    "cleanTitle": "ใบงาน แนวคิดเชิงนามธรรม",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ZSZZrviNHghcltWKHEnFGWFLxmT70CD4/view?usp=drivesdk"
  },
  {
    "id": "krucom-021",
    "folder": "371 แนวคิดเชิงนามธรรม",
    "title": "แนวคิดเชิงนามธรรม.pdf",
    "cleanTitle": "แนวคิดเชิงนามธรรม",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1DVHHnG9IPTZER86q4Np8yG6QkmXsRp6L/view?usp=drivesdk"
  },
  {
    "id": "krucom-022",
    "folder": "370 ใบงานฝึกคิดแบบอัลกอริทึม (Algorithmic Thinking)",
    "title": "ใบงานฝึกคิดแบบอัลกอริทึม (Algorithmic Thinking).pdf",
    "cleanTitle": "ใบงานฝึกคิดแบบอัลกอริทึม (Algorithmic Thinking)",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/18s_Daet922ZbdYpddHJLodsnVNdfq8xP/view?usp=drivesdk"
  },
  {
    "id": "krucom-023",
    "folder": "369 บอร์ดความรู้เทคโนโลยี กับวันวิทยาศาสตร์",
    "title": "บอร์ดความรู้เทคโนโลยี กับวันวิทยาศาสตร์.pdf",
    "cleanTitle": "บอร์ดความรู้เทคโนโลยี กับวันวิทยาศาสตร์",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1PyClX-8PYA6FI02qq_YIeLBX55KQ9lwB/view?usp=drivesdk"
  },
  {
    "id": "krucom-024",
    "folder": "368 โปรแกรมสัญลักษณ์ เดินทางไปหาแม่",
    "title": "โปรแกรมสัญลักษณ์ เดินทางไปหาแม่ (แนวทางเฉลย).pdf",
    "cleanTitle": "โปรแกรมสัญลักษณ์ เดินทางไปหาแม่",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1m5lTvh6K0SwYDUyd83MeAkQGxtFJAFq_/view?usp=drivesdk"
  },
  {
    "id": "krucom-025",
    "folder": "368 โปรแกรมสัญลักษณ์ เดินทางไปหาแม่",
    "title": "โปรแกรมสัญลักษณ์ เดินทางไปหาแม่.pdf",
    "cleanTitle": "โปรแกรมสัญลักษณ์ เดินทางไปหาแม่",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1KM16ws4zwzYAcjNviZZxGStiChjv-SrN/view?usp=drivesdk"
  },
  {
    "id": "krucom-026",
    "folder": "367 ใบงานวิทยาการคำนวณ ป.3",
    "title": "ใบงานวิทยาการคำนวณ ป.3.pdf",
    "cleanTitle": "ใบงานวิทยาการคำนวณ ป.3",
    "category": "general",
    "targetLevel": "ป.1-3",
    "url": "https://drive.google.com/file/d/1MKMMjkY2j8OWQEX4dPXGBDZ6VE5nVHnX/view?usp=drivesdk"
  },
  {
    "id": "krucom-027",
    "folder": "360 ประเภทของข้อมูล",
    "title": "ประเภทของข้อมูล.pdf",
    "cleanTitle": "ประเภทของข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/14rNafef2ZCw-wv7pxK19vMYP9LdY5Y-2/view?usp=drivesdk"
  },
  {
    "id": "krucom-028",
    "folder": "359 จัดหมวดหมู่ไฟล์",
    "title": "จัดหมวดหมู่ไฟล์.pdf",
    "cleanTitle": "จัดหมวดหมู่ไฟล์",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1S-Vx9tmm8IF5o04H29IUaQWcmSrVugvL/view?usp=drivesdk"
  },
  {
    "id": "krucom-029",
    "folder": "358 สื่อความรู้เด็กดีในโลกออนไลน์",
    "title": "เด็กดีในโลกออนไลน์.pdf",
    "cleanTitle": "สื่อความรู้เด็กดีในโลกออนไลน์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Oo5EMtytocQP6JfiNptm15s86NAZQloB/view?usp=drivesdk"
  },
  {
    "id": "krucom-030",
    "folder": "357 สื่อความรู้ ซอฟต์แวร์",
    "title": "357 สื่อความรู้ ซอฟต์แวร์.pdf",
    "cleanTitle": "สื่อความรู้ ซอฟต์แวร์",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1aJPvLUnps8_oW6L8QsPh8v2Hz6Wagy5c/view?usp=drivesdk"
  },
  {
    "id": "krucom-031",
    "folder": "366 สื่อติดบอร์ด ฮาร์ดแวร์",
    "title": "สื่อติดบอร์ด ฮาร์ดแวร์.pdf",
    "cleanTitle": "สื่อติดบอร์ด ฮาร์ดแวร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1MdjYWAmIFCsHlldoRF_OB-H4JYQ7jldp/view?usp=drivesdk"
  },
  {
    "id": "krucom-032",
    "folder": "365 ใบงานฮาร์ดแวร์",
    "title": "หน้าปกใบงานฮาร์ดแวร์.pdf",
    "cleanTitle": "ใบงานฮาร์ดแวร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1KZegcU_LP88t66bC9ModTIOB6GpQCJOA/view?usp=drivesdk"
  },
  {
    "id": "krucom-033",
    "folder": "365 ใบงานฮาร์ดแวร์",
    "title": "ใบงานฮาร์ดแวร์.pdf",
    "cleanTitle": "ใบงานฮาร์ดแวร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1JJZ_VgZ0FlGmsAQpdi10aqOf46rVirta/view?usp=drivesdk"
  },
  {
    "id": "krucom-034",
    "folder": "364 ใบงานรู้จักสัญลักษณ์ผังงาน",
    "title": "ใบงานสัญลักษณ์ผังงาน.pdf",
    "cleanTitle": "ใบงานรู้จักสัญลักษณ์ผังงาน",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1wOQGWH7tqXfkHLe9WOJI-6nuHSq50EiM/view?usp=drivesdk"
  },
  {
    "id": "krucom-035",
    "folder": "363 สื่อติดบอร์ด ประเภทของไฟล์",
    "title": "ประเภทของไฟล์.pdf",
    "cleanTitle": "สื่อติดบอร์ด ประเภทของไฟล์",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1yPiDsdXetBRrItcngXucJHCsyTMkalxJ/view?usp=drivesdk"
  },
  {
    "id": "krucom-036",
    "folder": "362 ใบงานวิทยาการคำนวณ ป.2",
    "title": "ใบงานวิทยาการคำนวณ ป.2.pdf",
    "cleanTitle": "ใบงานวิทยาการคำนวณ ป.2",
    "category": "general",
    "targetLevel": "ป.1-3",
    "url": "https://drive.google.com/file/d/1EJBUgXVkt0-jcB9HxlzIfd9p1-SRMwd0/view?usp=drivesdk"
  },
  {
    "id": "krucom-037",
    "folder": "361 ใบงานวิทยาการคำนวณ ป.1",
    "title": "ใบงาน ป.1.pdf",
    "cleanTitle": "ใบงานวิทยาการคำนวณ ป.1",
    "category": "general",
    "targetLevel": "ป.1-3",
    "url": "https://drive.google.com/file/d/1OWRtjK9e3f7v2VJ8agBS4DZ58vxQINI8/view?usp=drivesdk"
  },
  {
    "id": "krucom-038",
    "folder": "360 ใบงานการเขียนผังงาน",
    "title": "ใบงานการเขียนผังงาน.pdf",
    "cleanTitle": "ใบงานการเขียนผังงาน",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/174Sop5pvgv6Yf4Vba2NkTVlvx1dIxSFC/view?usp=drivesdk"
  },
  {
    "id": "krucom-039",
    "folder": "359 สื่อติดบอร์ดออกแบบโปรแกรมผ่านการเขียนผังงาน",
    "title": "การออกแบบโปรแกรมผ่านการเขียนผังงาน.pdf",
    "cleanTitle": "สื่อติดบอร์ดออกแบบโปรแกรมผ่านการเขียนผังงาน",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ba6SuSkip7FUwxaw6tLQOVL_1_oK0RGF/view?usp=drivesdk"
  },
  {
    "id": "krucom-040",
    "folder": "358 ใบงานวิทยาการคำนวณ ป.6",
    "title": "ใบงานวิทยาการคำนวณ ป.6(เพิ่มสารบัญ).pdf",
    "cleanTitle": "ใบงานวิทยาการคำนวณ ป.6",
    "category": "general",
    "targetLevel": "ป.4-6",
    "url": "https://drive.google.com/file/d/1_8sDqfD8ZchiuDynIRlWxz_iVnJhbIPL/view?usp=drivesdk"
  },
  {
    "id": "krucom-041",
    "folder": "357 ใบงานวิทยาการคำนวณ ป.5",
    "title": "ใบงานวิทยาการคำนวณ ป.5.pdf",
    "cleanTitle": "ใบงานวิทยาการคำนวณ ป.5",
    "category": "general",
    "targetLevel": "ป.4-6",
    "url": "https://drive.google.com/file/d/12unN0I8hZ_I9fuO46sEYqmOMg6FQqR9A/view?usp=drivesdk"
  },
  {
    "id": "krucom-042",
    "folder": "356 ใบงานวิทยาการคำนวณ ป.4",
    "title": "ใบงานวิทยาการคำนวณ_ป4_เฉลยสีแดง.pdf",
    "cleanTitle": "ใบงานวิทยาการคำนวณ ป.4",
    "category": "general",
    "targetLevel": "ป.4-6",
    "url": "https://drive.google.com/file/d/1ZI4CseAqw-IVN6XVhamkXCO9YP3W7qMP/view?usp=drivesdk"
  },
  {
    "id": "krucom-043",
    "folder": "356 ใบงานวิทยาการคำนวณ ป.4",
    "title": "ใบงานวิทยาการคำนวณ ป.4.pdf",
    "cleanTitle": "ใบงานวิทยาการคำนวณ ป.4",
    "category": "general",
    "targetLevel": "ป.4-6",
    "url": "https://drive.google.com/file/d/1EBgah7k7BETHByvtgNqR4yjACA1YlXdr/view?usp=drivesdk"
  },
  {
    "id": "krucom-044",
    "folder": "354 สายคอมพิวเตอร์",
    "title": "ดีไซน์ที่ยังไม่ได้ตั้งชื่อ.pdf",
    "cleanTitle": "สายคอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Z9r34OFF357AxKtJfdhwnf1S56XXDYXa/view?usp=drivesdk"
  },
  {
    "id": "krucom-045",
    "folder": "353 ใบงานแหล่งข้อมูล",
    "title": "ใบงานแหล่งข้อมูล.pdf",
    "cleanTitle": "ใบงานแหล่งข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1QVxbaUSE1eUB7MixB_6-8D_02i73VP7p/view?usp=drivesdk"
  },
  {
    "id": "krucom-046",
    "folder": "355 E-mail คือ อะไร?",
    "title": "E-mail คือ อะไร.pdf",
    "cleanTitle": "E-mail คือ อะไร?",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/18xaTwXuoDQuyhHHvaOxPO4AaheIMOvhp/view?usp=drivesdk"
  },
  {
    "id": "krucom-047",
    "folder": "354 ใบงาน Power point",
    "title": "ใบงาน Power point.pdf",
    "cleanTitle": "ใบงาน Power point",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1XP3vN8Adt9FVn4ZKB5MF4gYugjJadd5r/view?usp=drivesdk"
  },
  {
    "id": "krucom-048",
    "folder": "353 รู้จักแป้นพิมพ์",
    "title": "รู้จักแป้นพิมพ์(แก้ไข Shift).pdf",
    "cleanTitle": "รู้จักแป้นพิมพ์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1yGboFIM9as9L6UKHCQbbGuI7AsZoU56p/view?usp=drivesdk"
  },
  {
    "id": "krucom-049",
    "folder": "353 รู้จักแป้นพิมพ์",
    "title": "รู้จักแป้นพิมพ์.pdf",
    "cleanTitle": "รู้จักแป้นพิมพ์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1pNaQyJ-tQfidRdhG2msoGUD6h70mi0ww/view?usp=drivesdk"
  },
  {
    "id": "krucom-050",
    "folder": "352 ใบงาน Excel",
    "title": "ใบงาน excel.pdf",
    "cleanTitle": "ใบงาน Excel",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1EoqXC3ACcIR0fcoWOFlHFfrJNSjPz7ao/view?usp=drivesdk"
  },
  {
    "id": "krucom-051",
    "folder": "351 ปุ่มสำคัญบนแป้นพิมพ์",
    "title": "ปุ่มสำคัญบนแป้นพิมพ์.pdf",
    "cleanTitle": "ปุ่มสำคัญบนแป้นพิมพ์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1HZpF5hhAIZkeNDK4ld8S8s4vI6u-SNMX/view?usp=drivesdk"
  },
  {
    "id": "krucom-052",
    "folder": "350 ใบงาน Microsoft Word",
    "title": "ใบงาน Microsoft Word.pdf",
    "cleanTitle": "ใบงาน Microsoft Word",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Foj0O2Nzbts7CsyqjIvlQOczD9JHROdR/view?usp=drivesdk"
  },
  {
    "id": "krucom-053",
    "folder": "349 หลักการตรวจสอบความน่าเชื่อถือของข้อมูล",
    "title": "หลักการตรวจสอบความน่าเชื่อถือของข้อมูล.pdf",
    "cleanTitle": "หลักการตรวจสอบความน่าเชื่อถือของข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1FDB4BLA3PR0h4MMdJd5sUYxA_36ffNKe/view?usp=drivesdk"
  },
  {
    "id": "krucom-054",
    "folder": "348 ใบงานการวิเคราะห์ปัญหา",
    "title": "ใบงานการวิเคราะห์ปัญหา.pdf",
    "cleanTitle": "ใบงานการวิเคราะห์ปัญหา",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/17_2dIOisJyYOMK-J-_g5v_bjSv2fULR_/view?usp=drivesdk"
  },
  {
    "id": "krucom-055",
    "folder": "347 เกมบันไดงู",
    "title": "เกมบันไดงู.pdf",
    "cleanTitle": "เกมบันไดงู",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/16eQwCjStnJa7CD21_Eo0Va2KxTq7DwZG/view?usp=drivesdk"
  },
  {
    "id": "krucom-056",
    "folder": "346 Uplug coding ล่าสมบัติอวกาศ",
    "title": "Uplug coding ล่าสมบัติอวกาศ.pdf",
    "cleanTitle": "Uplug coding ล่าสมบัติอวกาศ",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1l3SELv8y0GYcpM-nrubeguhvzNfeG2_R/view?usp=drivesdk"
  },
  {
    "id": "krucom-057",
    "folder": "345 มารยาทการใช้อินเทอร์เน็ต 10 ประการ",
    "title": "มายาทการใช้อินเทอร์เน็ต.pdf",
    "cleanTitle": "มารยาทการใช้อินเทอร์เน็ต 10 ประการ",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1w21iZdLe_6AvNy46qomqsS_jWhB8Uekq/view?usp=drivesdk"
  },
  {
    "id": "krucom-058",
    "folder": "344 ใบงานการดูแลรักษาคอมพิวเตอร์",
    "title": "ใบงานการดูแลรักษาคอมพิวเตอร์.pdf",
    "cleanTitle": "ใบงานการดูแลรักษาคอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1cUxttF917Oufv6vAPdpA9eeL36jtbJPu/view?usp=drivesdk"
  },
  {
    "id": "krucom-059",
    "folder": "343 ฮาร์ดแวร์ & ซอฟต์แวร์",
    "title": "ฮาร์ดแวร์ & ซอฟต์แวร์.pdf",
    "cleanTitle": "ฮาร์ดแวร์ & ซอฟต์แวร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1s85ydlvp0MSgkPZasznGWF5ARbgzi-nb/view?usp=drivesdk"
  },
  {
    "id": "krucom-060",
    "folder": "342 เอาตัวรอดจากแผ่นดินไหว",
    "title": "เอาตัวรอดจากแผ่นดินไหว.pdf",
    "cleanTitle": "เอาตัวรอดจากแผ่นดินไหว",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1pWMjezjr6hzVx2O2aMuT4JEX4QsaYaEI/view?usp=drivesdk"
  },
  {
    "id": "krucom-061",
    "folder": "341 ใบงาน เปรียบเทียบมนุษย์ กับคอมพิวเตอร์",
    "title": "C6704D61-BF9A-4C84-8BBC-898925B3B372.pdf",
    "cleanTitle": "ใบงาน เปรียบเทียบมนุษย์ กับคอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/15VzbnjEa4AGeUoBwWcdCgxGU1b9SHYg5/view?usp=drivesdk"
  },
  {
    "id": "krucom-062",
    "folder": "340 ใบงานการเรียงลำดับขั้นตอน",
    "title": "การเรียงลำดับขั้นตอน-2.pdf",
    "cleanTitle": "ใบงานการเรียงลำดับขั้นตอน",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Lkj2JcITifer793MV02rV0JssKNMCuIr/view?usp=drivesdk"
  },
  {
    "id": "krucom-063",
    "folder": "339 ประเภทคอมพิวเตอร์",
    "title": "ประเภทของคอมพิวเตอร์.pdf",
    "cleanTitle": "ประเภทคอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1uR2DNfflzXWcIMQAL1URJDKIMdtLB8iO/view?usp=drivesdk"
  },
  {
    "id": "krucom-064",
    "folder": "338 พ.ร.บ.คอมพิวเตอร์",
    "title": "พ.ร.บ. คอมพิวเตอร์.pdf",
    "cleanTitle": "พ.ร.บ.คอมพิวเตอร์",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/19DeMnsHCRLXyZ3NzEG0_MZ8eYBAHp6cy/view?usp=drivesdk"
  },
  {
    "id": "krucom-065",
    "folder": "337 ใบงานเหตุผลเชิงตรรกะ",
    "title": "ใบงานเหตุผลเชิงตรรกะ.pdf",
    "cleanTitle": "ใบงานเหตุผลเชิงตรรกะ",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1XOalo2Te4gMp6PPNjf6PDz_zCHdT8Bbd/view?usp=drivesdk"
  },
  {
    "id": "krucom-066",
    "folder": "336 สัญลักษณ์ผังงาน",
    "title": "สัญลักษณ์ผ้งงาน.pdf",
    "cleanTitle": "สัญลักษณ์ผังงาน",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1dEMREmIRL5RUxmMefa-JuXlIzn2vMaQg/view?usp=drivesdk"
  },
  {
    "id": "krucom-067",
    "folder": "335 การค้นหาข้อมูลและการใช้เทคโนโลยีสารสนเทศ",
    "title": "การค้นหาข้อมูลและการใช้เทคโนโลยีสารสนเทศ.pdf",
    "cleanTitle": "การค้นหาข้อมูลและการใช้เทคโนโลยีสารสนเทศ",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1xHaC4tvoHgDQhzJmkv7DrmMneUZRmI9D/view?usp=drivesdk"
  },
  {
    "id": "krucom-068",
    "folder": "334 ใบงานโปรแกรม paint",
    "title": "ใบงาน Paint.pdf",
    "cleanTitle": "ใบงานโปรแกรม paint",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1TBPwz6z0eJZKT-G1DO3NuRkv47kwCOAw/view?usp=drivesdk"
  },
  {
    "id": "krucom-069",
    "folder": "333 ทักษะสำคัญในยุค Ai",
    "title": "ทักษะสำคัญในยุค Ai.pdf",
    "cleanTitle": "ทักษะสำคัญในยุค Ai",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1jSGUz-yDBDwHNJkwI96uvA9-LtzrBKBM/view?usp=drivesdk"
  },
  {
    "id": "krucom-070",
    "folder": "332 เกมเศรษฐี Scratch",
    "title": "เกมเศรษฐี Scratch.pdf",
    "cleanTitle": "เกมเศรษฐี Scratch",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1s5WaKsCdrCnEIeFKS9IrnuEPOfSpQjlj/view?usp=drivesdk"
  },
  {
    "id": "krucom-071",
    "folder": "331 ส่วนประกอบโปรแกรม Microsoft excel",
    "title": "ส่วนประกอบ Excel.pdf",
    "cleanTitle": "ส่วนประกอบโปรแกรม Microsoft excel",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1qHjAznTrBt2vR0HYgItGPk4gKhusAGrx/view?usp=drivesdk"
  },
  {
    "id": "krucom-072",
    "folder": "330 ส่วนประกอบโปรแกรม Microsoft Powerpoint",
    "title": "ส่วนประกอบโปรแกรม Microsoft Powerpoint.pdf",
    "cleanTitle": "ส่วนประกอบโปรแกรม Microsoft Powerpoint",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Prf4gxysEl3G-kc7AzsyqfY84v1BbkiJ/view?usp=drivesdk"
  },
  {
    "id": "krucom-073",
    "folder": "329 ส่วนประกอบโปรแกรม Microsoft Word",
    "title": "ส่วนประกอบโปรแกรม Microsoft Word.pdf",
    "cleanTitle": "ส่วนประกอบโปรแกรม Microsoft Word",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1cklKYOIli3VivZ0QlqT_zpqnnSid88Ap/view?usp=drivesdk"
  },
  {
    "id": "krucom-074",
    "folder": "328 ส่วนประกอบโปรแกรม paint",
    "title": "ส่วนประกอบโปรแกรม paint.pdf",
    "cleanTitle": "ส่วนประกอบโปรแกรม paint",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1z8TS7dQp2SPI0m2aLIr27PhuS_kXmjdo/view?usp=drivesdk"
  },
  {
    "id": "krucom-075",
    "folder": "327 bingo อุปกรณ์คอมพิวเตอร์",
    "title": "bingo อุปกรณ์คอมพิวเตอร์.pdf",
    "cleanTitle": "bingo อุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/16C-yYc8h4T37S9NmGpzO1nxKWRu-ZWNg/view?usp=drivesdk"
  },
  {
    "id": "krucom-076",
    "folder": "326 คำศัพท์หมวดหมู่อินเทอร์เน็ตและโปรแกรม",
    "title": "คำศัพท์หมวดหมู่อินเทอร์เน็ตและโปรแกรม.pdf",
    "cleanTitle": "คำศัพท์หมวดหมู่อินเทอร์เน็ตและโปรแกรม",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/19t7NAyNJSCIg3WbaQtYA4ZW5gC4vAmj8/view?usp=drivesdk"
  },
  {
    "id": "krucom-077",
    "folder": "325 ขั้นตอนการปิดเครื่อง(shutdown)",
    "title": "ขั้นตอนการปิดเครื่อง(shutdown).pdf",
    "cleanTitle": "ขั้นตอนการปิดเครื่อง(shutdown)",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/12cUNpRwxRdBxO4-dcU3Rt0iPhuWLrXSH/view?usp=drivesdk"
  },
  {
    "id": "krucom-078",
    "folder": "324 การพิมพ์สัมผัส(Touch Typing)",
    "title": "การพิมพ์สัมผัส(Touch Typing).pdf",
    "cleanTitle": "การพิมพ์สัมผัส(Touch Typing)",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1HQDrX4GhjNcIzTL3TTudtzJK-Gjyw7sG/view?usp=drivesdk"
  },
  {
    "id": "krucom-079",
    "folder": "323 ใบงานคำศัพท์การสั่งงานและใช้งานคอมพิวเตอร์ 1",
    "title": "ใบงานคำศัพท์การสั่งงานและใช้งานคอมพิวเตอร์ 1.pdf",
    "cleanTitle": "ใบงานคำศัพท์การสั่งงานและใช้งานคอมพิวเตอร์ 1",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1tcTDb4EnhXPCgjw6GL1OJ7ePU8a9d2jc/view?usp=drivesdk"
  },
  {
    "id": "krucom-080",
    "folder": "322 คำศัพท์การสั่งงานและการใช้งานเบื้องต้น",
    "title": "คำศัพท์การสั่งงานและการใช้งานเบื้องต้น.pdf",
    "cleanTitle": "คำศัพท์การสั่งงานและการใช้งานเบื้องต้น",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1j7a88MvHMS9lk7ocR3DVN1A_3I3eV3Ao/view?usp=drivesdk"
  },
  {
    "id": "krucom-081",
    "folder": "321 ข้อปฏิบัติในการใช้ห้องปฏิบัติการคอมพิวเตอร์",
    "title": "ระเบียบการใช้ห้องคอม.pdf",
    "cleanTitle": "ข้อปฏิบัติในการใช้ห้องปฏิบัติการคอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1AX3dfQJP29zyjVMNa_-jVwLYk-XcTN4R/view?usp=drivesdk"
  },
  {
    "id": "krucom-082",
    "folder": "320 การดูแลรักษาอุปกรณ์คอมพิวเตอร์",
    "title": "การดูแลรักษาอุปกรณ์คอมพิวเตอร์.pdf",
    "cleanTitle": "การดูแลรักษาอุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ZoW5Xp6zzB1ZP2JvxiwQ4XhyKhznOO6a/view?usp=drivesdk"
  },
  {
    "id": "krucom-083",
    "folder": "319 ขั้นตอนการสร้างโฟลเดอร์",
    "title": "ขั้นตอนการสร้างโฟลเดอร์.pdf",
    "cleanTitle": "ขั้นตอนการสร้างโฟลเดอร์",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1tfFw2jioAnswhUVf0LykTArTBDS8jZVj/view?usp=drivesdk"
  },
  {
    "id": "krucom-084",
    "folder": "318 สื่อติดบอร์ดอุปกรณ์คอมพิวเตอร์",
    "title": "สื่อติดบอร์ดอุปกรณ์คอมพิวเตอร์.pdf",
    "cleanTitle": "สื่อติดบอร์ดอุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1s1K234hsQ47ldrdcaJaAzpEhVIOz_NXz/view?usp=drivesdk"
  },
  {
    "id": "krucom-085",
    "folder": "317 ภารกิจตามล่าค้นหาข้อมูล",
    "title": "ใช้อินเทอร์เน็ตค้นหาข้อมูล.pdf",
    "cleanTitle": "ภารกิจตามล่าค้นหาข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ZH7R2heko2QFkrREEFS6KAPGyne6s5-J/view?usp=drivesdk"
  },
  {
    "id": "krucom-086",
    "folder": "316 มารยาทการใช้สมารต์โฟน",
    "title": "เหตุผลเชิงตรรกะ.pdf",
    "cleanTitle": "มารยาทการใช้สมารต์โฟน",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1W859QrQjy46HlM9doxgk4uRlpFEucXQV/view?usp=drivesdk"
  },
  {
    "id": "krucom-087",
    "folder": "316 มารยาทการใช้สมารต์โฟน",
    "title": "มารยาทการใช้สมารต์โฟน.pdf",
    "cleanTitle": "มารยาทการใช้สมารต์โฟน",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1wyC404LvsMcCgK70C1hBZq1dWvcJ5xA3/view?usp=drivesdk"
  },
  {
    "id": "krucom-088",
    "folder": "315 เหตุผลเชิงตรรกะ",
    "title": "เหตุผลเชิงตรรกะ.pdf",
    "cleanTitle": "เหตุผลเชิงตรรกะ",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/13ZQGhFPXgfHyWoTP_9K7HjF1AuJTtaGH/view?usp=drivesdk"
  },
  {
    "id": "krucom-089",
    "folder": "314 ใบความรู้และใบงาน อัลกอริทึม",
    "title": "ห้องเรียนครูคอม.pdf",
    "cleanTitle": "ใบความรู้และใบงาน อัลกอริทึม",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ISJifmsz6owXdLYhm9yHqRCVm2YqIs4f/view?usp=drivesdk"
  },
  {
    "id": "krucom-090",
    "folder": "313 บุคคลสำคัญทางเทคโนโลยี",
    "title": "ห้องเรียนครูคอม.pdf",
    "cleanTitle": "บุคคลสำคัญทางเทคโนโลยี",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1IrJcFOAcbBCmmKkRvGeFSccZ2ePvGD8-/view?usp=drivesdk"
  },
  {
    "id": "krucom-091",
    "folder": "312 การคิดเชิงคำนวณเบื้องต้น",
    "title": "การคิดเชิงคำนวณเบื้องต้น.pdf",
    "cleanTitle": "การคิดเชิงคำนวณเบื้องต้น",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1YQKQN1nT93_axioHhJhZ6kjgMOFZv6gX/view?usp=drivesdk"
  },
  {
    "id": "krucom-092",
    "folder": "311 ใบความรู้-ใบงาน ส่วนประกอบคอมพิวเตอร์",
    "title": "ใบความรู้-ใบงาน ส่วนประกอบคอมพิวเตอร์.pdf",
    "cleanTitle": "ใบความรู้-ใบงาน ส่วนประกอบคอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1WFfmYxBaqz2JNmiwiJDEhOdChg12a8gJ/view?usp=drivesdk"
  },
  {
    "id": "krucom-093",
    "folder": "310 สองของคอมพิวเตอร์ CPU",
    "title": "ห้องเรียนครูคอม.pdf",
    "cleanTitle": "สองของคอมพิวเตอร์ CPU",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1DcVQUBjZKpknYlJPjXOEfA_gxg_879W8/view?usp=drivesdk"
  },
  {
    "id": "krucom-094",
    "folder": "309 ผจญภัยในโลกไซเบอร์",
    "title": "ผจญภัยในโลกไซเบอร์.pdf",
    "cleanTitle": "ผจญภัยในโลกไซเบอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1GgcY7ma0t9mmdsUkEQGRXs3SlAaf6ZEt/view?usp=drivesdk"
  },
  {
    "id": "krucom-095",
    "folder": "308   แบบบันทึกภาระงานนักเรียน",
    "title": "ภาระงานนักเรียน .pdf",
    "cleanTitle": "แบบบันทึกภาระงานนักเรียน",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1H__haEzJDvCrs7b0nEHNef18n_6fzEAb/view?usp=drivesdk"
  },
  {
    "id": "krucom-096",
    "folder": "307 สรุปเนื้อหา",
    "title": "สรุป ป.1.pdf",
    "cleanTitle": "สรุปเนื้อหา",
    "category": "general",
    "targetLevel": "ป.1-3",
    "url": "https://drive.google.com/file/d/1eqBrgM62UxKAwzLmVXrTfyh29suIgi2L/view?usp=drivesdk"
  },
  {
    "id": "krucom-097",
    "folder": "307 สรุปเนื้อหา",
    "title": "สรุปเนื้อหา ป.2.pdf",
    "cleanTitle": "สรุปเนื้อหา",
    "category": "general",
    "targetLevel": "ป.1-3",
    "url": "https://drive.google.com/file/d/1NCbdc1s4A4Cwn72cnroK0c5fkp8cqVT8/view?usp=drivesdk"
  },
  {
    "id": "krucom-098",
    "folder": "306 สายลับไอที…พิชิตภัยไซเบอร์",
    "title": "สายลับไอที…พิชิตภัยไซเบอร์.pdf",
    "cleanTitle": "สายลับไอที…พิชิตภัยไซเบอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1TxpSEAnMJtqOtk6k2nHnp7D5hv12J10M/view?usp=drivesdk"
  },
  {
    "id": "krucom-099",
    "folder": "305 การใช้งานพื้นฐาน office",
    "title": "การใช้งานพื้นฐาน office.pdf",
    "cleanTitle": "การใช้งานพื้นฐาน office",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1fVaBrIZXyfykMaREloklkQW6YSgZ7nI2/view?usp=drivesdk"
  },
  {
    "id": "krucom-100",
    "folder": "304 มารยาทการใช้เทคโนโลยีในการสื่อสาร",
    "title": "มารยาทในการติดต่อสื่อสารผ่านอินเทอร์เน็ต.pdf",
    "cleanTitle": "มารยาทการใช้เทคโนโลยีในการสื่อสาร",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/14lld8MfofWEB-YTduvSWWg9Pt6sO_0Zr/view?usp=drivesdk"
  },
  {
    "id": "krucom-101",
    "folder": "303 สำรวจเว็บไซต์",
    "title": "นักสำรวจเว็บไซต์.pdf",
    "cleanTitle": "สำรวจเว็บไซต์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1sh5U9KgECezS6FgIkmC_iU8QW9Jlk27k/view?usp=drivesdk"
  },
  {
    "id": "krucom-102",
    "folder": "302 การใช้อินเทอร์เน็ตอย่างปลอดภัย",
    "title": "การใช้อินเทอร์เน็ตอย่างปลอดภัย.pdf",
    "cleanTitle": "การใช้อินเทอร์เน็ตอย่างปลอดภัย",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1gIQDaur0uhOm3LtMwBDrPbXez4VCrhyE/view?usp=drivesdk"
  },
  {
    "id": "krucom-103",
    "folder": "301 รู้ทันโลกดิจิทัล",
    "title": "เพิ่มหัวเรื่องย่อย.pdf",
    "cleanTitle": "รู้ทันโลกดิจิทัล",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/11STUMfWiwCVrrGjYtYqg8GAxv5oVb5QK/view?usp=drivesdk"
  },
  {
    "id": "krucom-104",
    "folder": "300 การสืบค้นข้อมูล",
    "title": "ชื่อสถานที่ท่องเที่ยว.pdf",
    "cleanTitle": "การสืบค้นข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1i0cx2kCa_Oa_v0u3NODaUZ0i5YnjPOQN/view?usp=drivesdk"
  },
  {
    "id": "krucom-105",
    "folder": "299 คำศัพท์คอมพิวเตอร์ที่ควรรู้",
    "title": "คำศัพท์คอมพิวเตอร์พื้นฐานที่ควรรู้.pdf",
    "cleanTitle": "คำศัพท์คอมพิวเตอร์ที่ควรรู้",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1BQWTm9g_jpGNBLHBCJtAbwXC0aFpPSpD/view?usp=drivesdk"
  },
  {
    "id": "krucom-106",
    "folder": "298 ใบงานรวบรวมข้อมูล",
    "title": "ใบงาน  รวบรวมข้อมูล.pdf",
    "cleanTitle": "ใบงานรวบรวมข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1pI5TT-f9bv6v1xAy-Z20EGdaEx7qZe3l/view?usp=drivesdk"
  },
  {
    "id": "krucom-107",
    "folder": "297 อาชญากรรมทางอินเทอร์เน็ต",
    "title": "อาชญากรรมทางอินเทอร์เน็ต.pdf",
    "cleanTitle": "อาชญากรรมทางอินเทอร์เน็ต",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1iZeAyX_vsCu1FkQFvHKR0-WOQ65-b0IK/view?usp=drivesdk"
  },
  {
    "id": "krucom-108",
    "folder": "296 การเขียนสูตร Excel",
    "title": "การเขียนสูตร Excel.pdf",
    "cleanTitle": "การเขียนสูตร Excel",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1BlPYAEwErX-ist8YQ55KHtmoq72kA2UD/view?usp=drivesdk"
  },
  {
    "id": "krucom-109",
    "folder": "295 เทคโนโลยีในชีวิตประจำวัน",
    "title": "เทคโนโลยีในชีวิตประจำวัน.pdf",
    "cleanTitle": "เทคโนโลยีในชีวิตประจำวัน",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1T0y1WcTGVoUgvVASgKJpal0IclGdDXxu/view?usp=drivesdk"
  },
  {
    "id": "krucom-110",
    "folder": "294 แหล่งข้อมูล",
    "title": "ใบงานวิทยาการคำนวณ เรื่อง แหล่งข้อมู ป.5.pdf",
    "cleanTitle": "แหล่งข้อมูล",
    "category": "data-detective",
    "targetLevel": "ป.4-6",
    "url": "https://drive.google.com/file/d/1G-Cr7Fh2mmRzYLTno3aT40eUoG0vTkLP/view?usp=drivesdk"
  },
  {
    "id": "krucom-111",
    "folder": "293 ขั้นตอน การรวบรวม ข้อมูล",
    "title": "293 ขั้นตอน การรวบรวม ข้อมูล.pdf",
    "cleanTitle": "ขั้นตอน การรวบรวม ข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1zOYfCetkvJzrTCf7MlizTkVQFx9VBt3P/view?usp=drivesdk"
  },
  {
    "id": "krucom-112",
    "folder": "292 แหล่งข้อมูล",
    "title": "แหล่งข้อมูล.pdf",
    "cleanTitle": "แหล่งข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1y4ggPLWs2VV5qOrfV7040z8q5GKdxdh2/view?usp=drivesdk"
  },
  {
    "id": "krucom-113",
    "folder": "291 มารยาทและจริยธรรมในการใช้เทคโนโลยี",
    "title": "มารยาทและจริยธรรมในการใช้เทคโนโลยี.pdf",
    "cleanTitle": "มารยาทและจริยธรรมในการใช้เทคโนโลยี",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1WUoqbtLv86bkzRo7SndbFDsYMxAjVG9p/view?usp=drivesdk"
  },
  {
    "id": "krucom-114",
    "folder": "290 รู้เท่าทันภัยเทคโนโลยี",
    "title": "รู้เท่าทันภัยเทคโนโลยี.pdf",
    "cleanTitle": "รู้เท่าทันภัยเทคโนโลยี",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1lsEoXkSNhi1Ls_3WapJxm2vxIyiZcixy/view?usp=drivesdk"
  },
  {
    "id": "krucom-115",
    "folder": "289 ใบงาน เรื่อง รู้ทันอาชญากรรม ทางอินเทอร์เน็ต(Cybercrime)",
    "title": "ใบงาน เรื่อง รู้ทันอาชญากรรม ทางอินเทอร์เน็ต(Cybercrime).pdf",
    "cleanTitle": "ใบงาน เรื่อง รู้ทันอาชญากรรม ทางอินเทอร์เน็ต(Cybercrime)",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ufVrfGFWzcBqWR-RlcDvDR3lhvTDcP9E/view?usp=drivesdk"
  },
  {
    "id": "krucom-116",
    "folder": "288 ถอดรหัสเงื่อนไขในชีวิตจริง",
    "title": "คำชี้แจง  จงอ่านประโยคสถานการณ์ต่อไปนี้ แล้วแยกแยะว่าส่วนไหนคือ เงื่อนไข (เหตุ) และส่วนไทนคือ ผลลัพธ์ (การกระทำ) ลงในช่องว่างให้ถูกต๊อง.pdf",
    "cleanTitle": "ถอดรหัสเงื่อนไขในชีวิตจริง",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/13ZhPbBwrhUZK2Fg_UdwdHakSUCKQco1A/view?usp=drivesdk"
  },
  {
    "id": "krucom-117",
    "folder": "287 ใช่หรือมั่ว ชัวร์หรือไม่",
    "title": "จริงหรือมั่วชัวร์หรือไม่.pdf",
    "cleanTitle": "ใช่หรือมั่ว ชัวร์หรือไม่",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1o39eUQrN0YXowHj5YUI5GajSYqsWl0eR/view?usp=drivesdk"
  },
  {
    "id": "krucom-118",
    "folder": "286 นักสืบน้อย",
    "title": "ภารกิจยอดนักสืบข้อมูล.pdf",
    "cleanTitle": "นักสืบน้อย",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1LgdBdbg6x23_3aJ4WfYK4GyOwh1lYHdd/view?usp=drivesdk"
  },
  {
    "id": "krucom-119",
    "folder": "285 ภารกิจยอดนักสืบข้อมูล",
    "title": "ภารกิจยอดนักสืบข้อมูล.pdf",
    "cleanTitle": "ภารกิจยอดนักสืบข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1KTa6rQGEBKZLVjxnwlocue9L2kkOlZRn/view?usp=drivesdk"
  },
  {
    "id": "krucom-120",
    "folder": "284 ชิ้นงานคำถามคอมพิวเตอร์",
    "title": "คำถามคอมพิวเตอร์.pdf",
    "cleanTitle": "ชิ้นงานคำถามคอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1jty6cSOl3Qd2frnQ3akS-ommhYwinxP7/view?usp=drivesdk"
  },
  {
    "id": "krucom-121",
    "folder": "283 อุปกรณ์คอมพิวเตอร์ 2",
    "title": "ฟรีอุปกรณ์คอมพิวเตอร์.pdf",
    "cleanTitle": "อุปกรณ์คอมพิวเตอร์ 2",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/14ryCa3rh-6gCmPe9OGK7yBg1vyAvlKeq/view?usp=drivesdk"
  },
  {
    "id": "krucom-122",
    "folder": "282 โดเมนเนม  ความหน้าเชื่อถือของข้อมูล",
    "title": "โดเมนเนม  ความหน้าเชื่อถือของข้อมูล.pdf",
    "cleanTitle": "โดเมนเนม  ความหน้าเชื่อถือของข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1dvdE4ZU_s4k5kbRappglTe-3TDG5g9C3/view?usp=drivesdk"
  },
  {
    "id": "krucom-123",
    "folder": "281 ชิ้นงานScratch กับ โค้ดวาดรูปเรขาคณิต",
    "title": "ชิ้นงานScratch กับ โค้ดวาดรูปเรขาคณิต.pdf",
    "cleanTitle": "ชิ้นงานScratch กับ โค้ดวาดรูปเรขาคณิต",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/16x5SDG9H8rhCI2Or_HFymkBdGJO1-Dew/view?usp=drivesdk"
  },
  {
    "id": "krucom-124",
    "folder": "280 ใบงานการเขียนโปรแกรมเบื้องต้น",
    "title": "ใบงานการเขียนโปรแกรมเบื้องต้น ป.1-3.pdf",
    "cleanTitle": "ใบงานการเขียนโปรแกรมเบื้องต้น",
    "category": "general",
    "targetLevel": "ป.1-3",
    "url": "https://drive.google.com/file/d/1H93-ZuLB1DCqXgc5qDBbqsOnycZ1eXwP/view?usp=drivesdk"
  },
  {
    "id": "krucom-125",
    "folder": "279 การใช้คำในการค้นหาข้อมูล",
    "title": "การใช้คำในการค้นหาข้อมูล.pdf",
    "cleanTitle": "การใช้คำในการค้นหาข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1RNOJclHtUy78Ih8IMMH9rLcFsSOPW-gH/view?usp=drivesdk"
  },
  {
    "id": "krucom-126",
    "folder": "278    โยงเส้นจับคู่บล๊อกคำสั่ง Scratch",
    "title": "โยงเส้นจับคู่บล๊อกคำสั่ง .pdf",
    "cleanTitle": "โยงเส้นจับคู่บล๊อกคำสั่ง Scratch",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1R6mF3hr-hzgOW03vKlmNefklPOBYh1Vt/view?usp=drivesdk"
  },
  {
    "id": "krucom-127",
    "folder": "277 กฎระเบียบการใช้ห้องปฏิบัติการคอมพิวเตอร์ v2",
    "title": "กฎระเบียบการใช้ห้องปฏิบัติการคอมพิวเตอร์.pdf",
    "cleanTitle": "กฎระเบียบการใช้ห้องปฏิบัติการคอมพิวเตอร์ v2",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/12IZAMpSZRSEFZIOJHmsAJfKPAFv9ftc2/view?usp=drivesdk"
  },
  {
    "id": "krucom-128",
    "folder": "276 บอร์ดไวรัสคอมพิวเตอร์",
    "title": "ไวรัสคอมพิวเตอร์.pdf",
    "cleanTitle": "บอร์ดไวรัสคอมพิวเตอร์",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ISL1oo9xU1U3bUB9xvstRTkmpYLCImh4/view?usp=drivesdk"
  },
  {
    "id": "krucom-129",
    "folder": "275 กิจกรรมการค้นหาข้อมูล",
    "title": "กิจกรรมการค้นหาข้อมูล.pdf",
    "cleanTitle": "กิจกรรมการค้นหาข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1oM7Zsmb0EkRzqQ3eQTQGSKKs5g9xfS9G/view?usp=drivesdk"
  },
  {
    "id": "krucom-130",
    "folder": "274 สื่อติดบอร์ดการคิดเชิงคำนวณ",
    "title": "การย่อยปัญหา (Decomposition) การแบ่งปัญหาใหญ่ที่ซับซ้อนออกเป็นส่วนย่อย ๆ ให้ง่ายต่อการจัดการ.pdf.pdf",
    "cleanTitle": "สื่อติดบอร์ดการคิดเชิงคำนวณ",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1zIM_qZ8ntzBQDpNrr2z31Pp6DlGBr-Bp/view?usp=drivesdk"
  },
  {
    "id": "krucom-131",
    "folder": "273 ทักษะสำคัญ ในยุค AI",
    "title": "ทักษะสำคัญในยุค AI.pdf.pdf",
    "cleanTitle": "ทักษะสำคัญ ในยุค AI",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1K1zj8vcbmsVFxT2oppOAz9Rcxws6xUrn/view?usp=drivesdk"
  },
  {
    "id": "krucom-132",
    "folder": "272 สื่อบล๊อกคำสั่ง Scratch",
    "title": "สือบล๊อกคำสั่ง Scratch.pdf",
    "cleanTitle": "สื่อบล๊อกคำสั่ง Scratch",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1HfSOEfz0UhCwgHeKAA4my2lvXx9wcgj0/view?usp=drivesdk"
  },
  {
    "id": "krucom-133",
    "folder": "271 ประเภทของข้อมูล",
    "title": "สื่อประเภทของข้อมูล.pdf",
    "cleanTitle": "ประเภทของข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1dsrHyGBU7RMzbwimuOeE7BlfD64k3VhZ/view?usp=drivesdk"
  },
  {
    "id": "krucom-134",
    "folder": "270 ใบงานการเขียนผังงานโครงสร้างเรียงลำดับ",
    "title": "ใบงานการเขียนผังงานโครงสร้างเรียงลำดับ.pdf",
    "cleanTitle": "ใบงานการเขียนผังงานโครงสร้างเรียงลำดับ",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/13KwwtRMPruoJHgzTNo62-ru6cp2ucH3W/view?usp=drivesdk"
  },
  {
    "id": "krucom-135",
    "folder": "269 สัญลักษณ์ที่ใช้ในการเขียนผังงาน",
    "title": "ใบงานสัญลักษณ์ที่ใช้ในการเขียนผังงาน.pdf.pdf",
    "cleanTitle": "สัญลักษณ์ที่ใช้ในการเขียนผังงาน",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/16L_fk7aqeGxojmZP0BWR7ObPjfKuBnnx/view?usp=drivesdk"
  },
  {
    "id": "krucom-136",
    "folder": "268  ชิน้งาน microsoft word 17promax",
    "title": "การแทรกวัตถุใน Microsoft Word.pdf",
    "cleanTitle": "ชิน้งาน microsoft word 17promax",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1l_dHaoowhw62I3-fA76Q52FpgmXhecuM/view?usp=drivesdk"
  },
  {
    "id": "krucom-137",
    "folder": "267 Bingo Scratch",
    "title": "Bingo Scratch.pdf",
    "cleanTitle": "Bingo Scratch",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1O-7PYn3wjoNYxJlAZ3t-Vtq3gxrfRfo-/view?usp=drivesdk"
  },
  {
    "id": "krucom-138",
    "folder": "266 เซียมซี word",
    "title": "เซียมซีเวิร์ด.pdf",
    "cleanTitle": "เซียมซี word",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1-oHns5EclZXDDXdLBlQ35s9lIjhMyZHy/view?usp=drivesdk"
  },
  {
    "id": "krucom-139",
    "folder": "265 การ์ด ถาม-ตอบ E-mail",
    "title": "การ์ด ถาม-ตอบ E-mail.pdf.pdf",
    "cleanTitle": "การ์ด ถาม-ตอบ E-mail",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1FHKiIASb_NB9oCSzoWQBPBUC_AttF4ry/view?usp=drivesdk"
  },
  {
    "id": "krucom-140",
    "folder": "264 นักสืบไซเบอร์ ปกป้องตัวเอง",
    "title": "นักสืบไซเบอร์ ปกป้องตัวเอง.pdf",
    "cleanTitle": "นักสืบไซเบอร์ ปกป้องตัวเอง",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1H7qFiFShG-2RcPArBG1gc3zGPvlbG5Un/view?usp=drivesdk"
  },
  {
    "id": "krucom-141",
    "folder": "263 ใบงานการใช้อินเทอร์เน็ตอย่างปลอดภัย",
    "title": "การใช้อินเทอร์เน็ตอย่างปลอดภัย.pdf.pdf",
    "cleanTitle": "ใบงานการใช้อินเทอร์เน็ตอย่างปลอดภัย",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1pRCNPx7NW-eWGBbW51UCuY0Xa_TV31EJ/view?usp=drivesdk"
  },
  {
    "id": "krucom-142",
    "folder": "262 การ์ดคำสั่งเงื่อนไข",
    "title": "การ์ดคำสั่งเงื่อนไข.pdf",
    "cleanTitle": "การ์ดคำสั่งเงื่อนไข",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ABXnPKwISUz1xdkZ0A3I18CANEOA1T4z/view?usp=drivesdk"
  },
  {
    "id": "krucom-143",
    "folder": "260 แนวคิดเชิงนามธรรม Keep or Drop",
    "title": "แนวคิดเชิงนามธรรม Keep or Drop.pdf",
    "cleanTitle": "แนวคิดเชิงนามธรรม Keep or Drop",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/18Afk2VhikcQn-Rcvkecgl-ooUZ3wpmTT/view?usp=drivesdk"
  },
  {
    "id": "krucom-144",
    "folder": "261 ถ้า...แล้วจะเกิดอะไรนะ?",
    "title": "ถ้า...แล้วจะเกิดอะไรนะ.pdf",
    "cleanTitle": "ถ้า...แล้วจะเกิดอะไรนะ?",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/11oRadzUW27OE7VmSu8yzXWa3ZJ_Ba9dW/view?usp=drivesdk"
  },
  {
    "id": "krucom-145",
    "folder": "259 การประเมินความน่าเชื่อถือของข้อมูล",
    "title": "การประเมินความน่าเชื่อถือของข้อมูล.pdf",
    "cleanTitle": "การประเมินความน่าเชื่อถือของข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/141kWkviTHTgexSDghLuBsFQYsg_Wzlhl/view?usp=drivesdk"
  },
  {
    "id": "krucom-146",
    "folder": "258 ประเภทของไฟล์",
    "title": "ประเภทขอบไฟล์.pdf",
    "cleanTitle": "ประเภทของไฟล์",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1a0DRhBoNsEtzcu_pA-n-P_5-5e11WlFS/view?usp=drivesdk"
  },
  {
    "id": "krucom-147",
    "folder": "257 Ai กับการเลือกใช้",
    "title": "ใบงานAI กับการเลือกใช้ให้ปลอดภัย.pdf",
    "cleanTitle": "Ai กับการเลือกใช้",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1t64Xxzn-reLdf-toMjfw3NHeFwacLYpQ/view?usp=drivesdk"
  },
  {
    "id": "krucom-148",
    "folder": "256 ใบงาน ประโยชน์และโทษของ AI",
    "title": "ประโยชน์และโทษ AI.pdf.pdf",
    "cleanTitle": "ใบงาน ประโยชน์และโทษของ AI",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1wvLsXzY4hOeCrAr8cjo8yzLQRMY5nnji/view?usp=drivesdk"
  },
  {
    "id": "krucom-149",
    "folder": "255 ระบบคอมพิวเตอร์",
    "title": "ระบบคออมพิวเตอร์.pdf",
    "cleanTitle": "ระบบคอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1D3UcnUVA3GNhmZYZSU5I7cD82Ih6rOyp/view?usp=drivesdk"
  },
  {
    "id": "krucom-150",
    "folder": "254 นิทานอุปกรณ์คอมพิวเตอร์",
    "title": "นิทานอุปกรณ์คอมพิวเตอร์ .pdf",
    "cleanTitle": "นิทานอุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Tgdje14V63l0jHJvmvLRgRTnVF8S5Ynq/view?usp=drivesdk"
  },
  {
    "id": "krucom-151",
    "folder": "253   คำถาม สัญลักษณ์ผังงาน",
    "title": "รูปสัญลักษณ์.pdf",
    "cleanTitle": "คำถาม สัญลักษณ์ผังงาน",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1WIOozg-ET5FA9RP6OTE0gK5_IyPhy0kV/view?usp=drivesdk"
  },
  {
    "id": "krucom-152",
    "folder": "252 Ai ถ้าคิด",
    "title": "ฟรีเกม AI ท้าคิด.pdf.pdf",
    "cleanTitle": "Ai ถ้าคิด",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1v871E3UeTw3bQnpo_iyFnHtdZ_Ja86nW/view?usp=drivesdk"
  },
  {
    "id": "krucom-153",
    "folder": "252 Ai ถ้าคิด",
    "title": "AI ท้าคิด.pdf.pdf",
    "cleanTitle": "Ai ถ้าคิด",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1mxOy06CY7P4Y-W4kdLXg8u8M1NyzBk1M/view?usp=drivesdk"
  },
  {
    "id": "krucom-154",
    "folder": "251 การเรียงลำดับขั้น",
    "title": "การเรียงลำดับขั้นตอน.pdf",
    "cleanTitle": "การเรียงลำดับขั้น",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Uzg-zohB6XUmWraGC5lYFxwuEFnYFGch/view?usp=drivesdk"
  },
  {
    "id": "krucom-155",
    "folder": "250 หน้าที่ของปุ่มบนคีย์บอร์ด",
    "title": "หน้าที่ของปุ่ม.pdf",
    "cleanTitle": "หน้าที่ของปุ่มบนคีย์บอร์ด",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1WqMkehXpu3KijtkHkCvsz57yBltnLYZq/view?usp=drivesdk"
  },
  {
    "id": "krucom-156",
    "folder": "249 สื่อรู้เท่าทันภัยแผงบนอินเทอร์เน็ต",
    "title": "สื่อรู้เท่าทันภัยแผงบนอินเทอร์เน็ต.pdf",
    "cleanTitle": "สื่อรู้เท่าทันภัยแผงบนอินเทอร์เน็ต",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Yqh-2ODF1nLIk8_mgTi0Pbq7las_Kcxc/view?usp=drivesdk"
  },
  {
    "id": "krucom-157",
    "folder": "248 โทษของ AI",
    "title": "แบบฝึกหัดเรื่อง โทษของ AI.pdf",
    "cleanTitle": "โทษของ AI",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1w_pq0pf9xYhAlqt4Nhu_EOXlL03kCQtt/view?usp=drivesdk"
  },
  {
    "id": "krucom-158",
    "folder": "247 Ai ในชีวิตประจำวัน",
    "title": "AI ในชีวิตประจำวัน.pdf",
    "cleanTitle": "Ai ในชีวิตประจำวัน",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1yEfkTwbw3leWLfgoR3z9LTI2gRFwip9Y/view?usp=drivesdk"
  },
  {
    "id": "krucom-159",
    "folder": "246 Paint",
    "title": "paint.pdf",
    "cleanTitle": "Paint",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1kFB5zfTDGuQSxQzZNZbwGgLaH37b5Z-Z/view?usp=drivesdk"
  },
  {
    "id": "krucom-160",
    "folder": "245 สื่อติดบอร์ด AI",
    "title": "AI คืออะไร.pdf",
    "cleanTitle": "สื่อติดบอร์ด AI",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1fIqW5bZMVK4O-jMgDIK4JtzviSRazVvy/view?usp=drivesdk"
  },
  {
    "id": "krucom-161",
    "folder": "244 เมาส์ คือ ?",
    "title": "เมาส์ คือ .pdf.pdf",
    "cleanTitle": "เมาส์ คือ ?",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1mP26Kkxcc9xqCPJLpGsrJZcsjTKit0CW/view?usp=drivesdk"
  },
  {
    "id": "krucom-162",
    "folder": "243 โปรแกรมสำนักงาน",
    "title": "เพิ่มหัวเรื่องย่อย.pdf.pdf",
    "cleanTitle": "โปรแกรมสำนักงาน",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1XpJ8c_69hQXa2l66sEfrBGPGRMFJi4aj/view?usp=drivesdk"
  },
  {
    "id": "krucom-163",
    "folder": "242 ความปลอดภัยในการใช้คอมพิวเตอร์",
    "title": "4394601F-C693-425F-ADD7-1180864A5613.pdf",
    "cleanTitle": "ความปลอดภัยในการใช้คอมพิวเตอร์",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1nmu1osHMf10JwDZCNKYu7tt4MeyhalWQ/view?usp=drivesdk"
  },
  {
    "id": "krucom-164",
    "folder": "241 อุปกรณ์คอมพิวเตอร์",
    "title": "จอภาพ.pdf",
    "cleanTitle": "อุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1YIYhusQDNTdc9qH2JjAOKj0cvgAakCNE/view?usp=drivesdk"
  },
  {
    "id": "krucom-165",
    "folder": "240 ข้อตกลงในการใช้ห้องคอมพิวเตอร์",
    "title": "ป้ายข้อตกลงในการใช้ห้องคอมพิวเตอร์.pdf",
    "cleanTitle": "ข้อตกลงในการใช้ห้องคอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1f8clk5z9tpecoAiftBG6dv6MCvKlDqak/view?usp=drivesdk"
  },
  {
    "id": "krucom-166",
    "folder": "239 บอร์ดแผ่นดินไหว",
    "title": "แผ่นดืนไหว.pdf.pdf",
    "cleanTitle": "บอร์ดแผ่นดินไหว",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ethP01uiGeJficISe1aO6I7aBvvdDjQr/view?usp=drivesdk"
  },
  {
    "id": "krucom-167",
    "folder": "238 AI",
    "title": "AI.pdf",
    "cleanTitle": "AI",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1pqPniY1K08d10-MpSju4vpNOhhZBMlYX/view?usp=drivesdk"
  },
  {
    "id": "krucom-168",
    "folder": "237 ปะเภทของเว็บไซต์",
    "title": "ประเภทของเว็บไซต์.pdf.pdf",
    "cleanTitle": "ปะเภทของเว็บไซต์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1jFv8Bw-HhJ9LP5fTivHq78_RUyyq8E_L/view?usp=drivesdk"
  },
  {
    "id": "krucom-169",
    "folder": "236 ปาลูกโป่งซอฟต์แวร์",
    "title": "ปาโป่ง (1).pdf",
    "cleanTitle": "ปาลูกโป่งซอฟต์แวร์",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1BCiFBqHgUCbgF6W_ET6HBIScUyw3vYPh/view?usp=drivesdk"
  },
  {
    "id": "krucom-170",
    "folder": "235 ชิ้นงานการเรียงลำดับอัลกอริทึม",
    "title": "การเรียงลำดับ.pdf",
    "cleanTitle": "ชิ้นงานการเรียงลำดับอัลกอริทึม",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1MrUbFCm_Qa9Iv6mjqTjWgBNMDC-xVVhi/view?usp=drivesdk"
  },
  {
    "id": "krucom-171",
    "folder": "233 ปกป้องข้อมูลส่วนตัว",
    "title": "ปกป้องข้อมูลส่วนตัว.pdf.pdf",
    "cleanTitle": "ปกป้องข้อมูลส่วนตัว",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1djGKiXsx1zSNZM_UTQFmtt9Gl9LJtiRm/view?usp=drivesdk"
  },
  {
    "id": "krucom-172",
    "folder": "232 AI ทำอะไรได้บ้าง",
    "title": "AI ทำอะไรได้บ้าง.pdf",
    "cleanTitle": "AI ทำอะไรได้บ้าง",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ZNJplbvNe-_OesdM3u9padz7402wYM0Q/view?usp=drivesdk"
  },
  {
    "id": "krucom-173",
    "folder": "231 การใช้งานและการดูแลรักษาอุปกรณ์คอมพิวเตอร์",
    "title": "การใช้งานและการดูแลรักษาอุปกรณ์คอมพิวเตอร์.pdf",
    "cleanTitle": "การใช้งานและการดูแลรักษาอุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1hpbRCfVpv6KmRypZV1i7P2XCZ8AMdy2-/view?usp=drivesdk"
  },
  {
    "id": "krucom-174",
    "folder": "230 ใบงานหน้าที่ของอุปกรณ์คอมพิวเตอร์พื้นฐาน",
    "title": "ใบงานหน้าที่ของอุปกรณ์คอมพิวเตอร์พื้นฐาน.pdf.pdf",
    "cleanTitle": "ใบงานหน้าที่ของอุปกรณ์คอมพิวเตอร์พื้นฐาน",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1zcZenmtrBcl598Lb4g_wAvdV-4CyNRSy/view?usp=drivesdk"
  },
  {
    "id": "krucom-175",
    "folder": "229 ใบงานเทคโนโลยีในชีวิตประจำวัน",
    "title": "ใบงานเทคโนโลยีในชีวิตประจำวัน.pdf",
    "cleanTitle": "ใบงานเทคโนโลยีในชีวิตประจำวัน",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1l72lp_i1uiJTzC9W6qdb6XkHWXPFwi6b/view?usp=drivesdk"
  },
  {
    "id": "krucom-176",
    "folder": "228 การค้นหาข้อมูล PM2.5",
    "title": "การค้นหาข้อมูล PM2.5.pdf.pdf",
    "cleanTitle": "การค้นหาข้อมูล PM2.5",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1sUmpQGo0GHk9zOtnuECHmi4dSWXqIIwe/view?usp=drivesdk"
  },
  {
    "id": "krucom-177",
    "folder": "227 หน้าที่อุปกรณ์คอมพิวเตอร์",
    "title": "หน้าที่อุปกรณ์คอมพิวเตอร์.pdf",
    "cleanTitle": "หน้าที่อุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/17BnfE2iViZoDdb8fwoGQv79RiWg6lBLu/view?usp=drivesdk"
  },
  {
    "id": "krucom-178",
    "folder": "226 วิวัฒนาการคอมพิวเตอร์",
    "title": "วิวัฒนาการคอมพิวเตอร์.pdf.pdf",
    "cleanTitle": "วิวัฒนาการคอมพิวเตอร์",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1dMZTPVy1j7r2uIhL5DgJaPgqG0YPWBzY/view?usp=drivesdk"
  },
  {
    "id": "krucom-179",
    "folder": "225 ✅ใช้ หรือ❌ ไม่ใช้ ยังไงดี",
    "title": "ใช้หรือไม่ใช้ยังไงดี.pdf",
    "cleanTitle": "✅ใช้ หรือ❌ ไม่ใช้ ยังไงดี",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1c5UgsBgPvUn6RZdhMSQNLPBseU8vAp-j/view?usp=drivesdk"
  },
  {
    "id": "krucom-180",
    "folder": "224 อั่งเป่าอุปกรณ์คอมพิวเตอร์",
    "title": "อั่งเปา.pdf.pdf",
    "cleanTitle": "อั่งเป่าอุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1GoggPrNhXHrK1w15kXbKQzRF2wxvdP2h/view?usp=drivesdk"
  },
  {
    "id": "krucom-181",
    "folder": "223 เรียนรู้โปรแกรมการนำเสนอผลงาน",
    "title": "เรียนรู้โปรแกรมการนำเสนอผลงาน.pdf",
    "cleanTitle": "เรียนรู้โปรแกรมการนำเสนอผลงาน",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ppQj7-yH7Vvr5FEREEElkFnpmW6s22q7/view?usp=drivesdk"
  },
  {
    "id": "krucom-182",
    "folder": "222 ส่วนประกอบของโปรแกรม PPT",
    "title": "ส่วนประกอบของโปรแกรม PPT.pdf",
    "cleanTitle": "ส่วนประกอบของโปรแกรม PPT",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1UE3CFIWbnZCBUzHX0-DINGXw0PbqUtHF/view?usp=drivesdk"
  },
  {
    "id": "krucom-183",
    "folder": "221 การแก้ปัญหาด้วยเหตุผล",
    "title": "การแก้ปัญหาด้วยเหตุผล (1).pdf",
    "cleanTitle": "การแก้ปัญหาด้วยเหตุผล",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1PF3aeBxIyCJDn52_qVZ23g0uKkac2d-Y/view?usp=drivesdk"
  },
  {
    "id": "krucom-184",
    "folder": "220 ใบงาน การใช้งานโปรแกรม Microsoft Word",
    "title": "การใช้งานโปรแกรม Microsoft Word.pdf.pdf",
    "cleanTitle": "ใบงาน การใช้งานโปรแกรม Microsoft Word",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1lH0RjrrfXlZJhoICsQy-UqZdfpyvzOj6/view?usp=drivesdk"
  },
  {
    "id": "krucom-185",
    "folder": "219 ใบงาน ความเข้าใจเกี่ยวกับอัลกอริทึม",
    "title": "ความเข้าใจเกี่ยวกับอัลกอริทึม.pdf",
    "cleanTitle": "ใบงาน ความเข้าใจเกี่ยวกับอัลกอริทึม",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1X1qEdnOM_WN7RaVCNU0Y48jlz-VcwvQd/view?usp=drivesdk"
  },
  {
    "id": "krucom-186",
    "folder": "218 การดูแลรักษาอุปกรณ์เทคโนโลยี",
    "title": "แบตเตอรีที่รัก.pdf",
    "cleanTitle": "การดูแลรักษาอุปกรณ์เทคโนโลยี",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1G3_ylemd6ZmIO0wmyG7StF6Zhbqoi-mK/view?usp=drivesdk"
  },
  {
    "id": "krucom-187",
    "folder": "218 การดูแลรักษาอุปกรณ์เทคโนโลยี",
    "title": "การดูแลรักษาอุปกรณ์เทคโนโลยี.pdf",
    "cleanTitle": "การดูแลรักษาอุปกรณ์เทคโนโลยี",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/13o86q0sYLhgBJ19dMGkWrB4w_UWgpxVG/view?usp=drivesdk"
  },
  {
    "id": "krucom-188",
    "folder": "217 การดูแลรักษาอุปกรณ์คอมพิวเตอร์",
    "title": "การดูแลรักษาอุปกรณ์คอมพิวเตอร์.pdf",
    "cleanTitle": "การดูแลรักษาอุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1NpzOhe9wlGLWxxpoZpfL6p4B2G57ZQId/view?usp=drivesdk"
  },
  {
    "id": "krucom-189",
    "folder": "216 ข้อมูลที่เปิดเผยได้:ไม่ได้",
    "title": "ข้อมูลที่เปิดเผยได้:ไม่ได้.pdf",
    "cleanTitle": "ข้อมูลที่เปิดเผยได้:ไม่ได้",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/12Coq69b0JgKtw-BBeMzFDv_bM1HjwQZ1/view?usp=drivesdk"
  },
  {
    "id": "krucom-190",
    "folder": "215 การออกแบบโปรแกรมด้วยการเขียนผังงาน",
    "title": "การออกแบบโปรแกรมด้วยการเขียนผังงาน.pdf",
    "cleanTitle": "การออกแบบโปรแกรมด้วยการเขียนผังงาน",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1b6ltI9gxuN9GcTSUViHRVVOMyFRoQuAe/view?usp=drivesdk"
  },
  {
    "id": "krucom-191",
    "folder": "214 การค้นหาข้อมูลขั้นสูง",
    "title": "การค้นหาข้อมูลขั้นสูง.pdf",
    "cleanTitle": "การค้นหาข้อมูลขั้นสูง",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1jWnJFhEGdxh8biGfl-LMRxxR5oH1H882/view?usp=drivesdk"
  },
  {
    "id": "krucom-192",
    "folder": "213 ถอดรหัสภาพ",
    "title": "ถอดรหัสภาพ.pdf",
    "cleanTitle": "ถอดรหัสภาพ",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1E4-iYyySwFlFgp6d7CcLwCC4hDxxDFkx/view?usp=drivesdk"
  },
  {
    "id": "krucom-193",
    "folder": "212 Bingo Flow Chart",
    "title": "Bingo Flow Chart.pdf",
    "cleanTitle": "Bingo Flow Chart",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Ys_c7O7M9JIDk2cSGSQ20rOt6Ayr2gGJ/view?usp=drivesdk"
  },
  {
    "id": "krucom-194",
    "folder": "211 การ์ดปริศนา อุปกรณ์คอมพิวเตอร์",
    "title": "อุปกรณ์พื้นฐานคอมพิวเตอร์.pdf.pdf",
    "cleanTitle": "การ์ดปริศนา อุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/19duFXpZGUEQxdHfEPBdkcbxShRa5HO-_/view?usp=drivesdk"
  },
  {
    "id": "krucom-195",
    "folder": "210 Cyber Crime & Cyberbullying",
    "title": "เพิ่มหัวเรื่องย่อย.pdf",
    "cleanTitle": "Cyber Crime & Cyberbullying",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Ci9IKoQNKsywTTZraqGNrDHwPoERvr7Y/view?usp=drivesdk"
  },
  {
    "id": "krucom-196",
    "folder": "209 ฮาร์ดแวร์แฮปปี้แลนด์",
    "title": "ฮาร์ดแวร์แฮปปี้แลนด์.pdf",
    "cleanTitle": "ฮาร์ดแวร์แฮปปี้แลนด์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1yMO0xq3g5weo5AMQJlRY9-Wvk51XOe7m/view?usp=drivesdk"
  },
  {
    "id": "krucom-197",
    "folder": "208 บอร์ดเกมซอฟต์แวร์",
    "title": "บอร์ดเกมซอฟต์แวร์.pdf",
    "cleanTitle": "บอร์ดเกมซอฟต์แวร์",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1i880thwT37bPBG3f8YkLb7O3Z-tKmOOw/view?usp=drivesdk"
  },
  {
    "id": "krucom-198",
    "folder": "207 ใบกิจกรรมถอดรหัสลับ",
    "title": "ใบกิจกรรมถอดรหัสลับ.pdf.pdf",
    "cleanTitle": "ใบกิจกรรมถอดรหัสลับ",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1d3XRgqzks5ksXr9mox0crqvMdNPooY81/view?usp=drivesdk"
  },
  {
    "id": "krucom-199",
    "folder": "206 จับคู่ศัพท์ Excel",
    "title": "Microsoft Excel.pdf",
    "cleanTitle": "จับคู่ศัพท์ Excel",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ctjxHOtwbaCcx8Qn0XLQErIo39uLl2zR/view?usp=drivesdk"
  },
  {
    "id": "krucom-200",
    "folder": "205 ต้นคริสต์มาส อุปกรณ์คอมพิวเตอร์",
    "title": "ต้นคริสต์มาส อุปกรณ์คอมพิวเตอร์.pdf",
    "cleanTitle": "ต้นคริสต์มาส อุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1IXjCetVJ50T3d2ZbP2BzRV1760LjfHd5/view?usp=drivesdk"
  },
  {
    "id": "krucom-201",
    "folder": "204 ปริศนาอุปกรณ์คอมพิวเตอร์",
    "title": "ปริศนาอุปกรณ์คอมพิวเตอร์.pdf",
    "cleanTitle": "ปริศนาอุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1I7DinyMHTwoy52lX7voHTaDeyze9Ziwq/view?usp=drivesdk"
  },
  {
    "id": "krucom-202",
    "folder": "203 เกมส์จับคู่ Python",
    "title": "เกมส์จับคู่ Python.pdf",
    "cleanTitle": "เกมส์จับคู่ Python",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ybLdMjMqvJYO8Zzk2yq_veiqyfonf4Hp/view?usp=drivesdk"
  },
  {
    "id": "krucom-203",
    "folder": "156 การ์ดข้อมูลส่วนตัว",
    "title": "ข้อมูลส่วนตัว (1).pdf",
    "cleanTitle": "การ์ดข้อมูลส่วนตัว",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1YjNH1RE9qI3lpgfmlrH5qEx4Pdb2OaUw/view?usp=drivesdk"
  },
  {
    "id": "krucom-204",
    "folder": "202 สูตร Excel ที่ควรรู้",
    "title": "สูตร Excel ที่ควรรู้.pdf",
    "cleanTitle": "สูตร Excel ที่ควรรู้",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1tg1QYkmytNjwwhur-Ubqo-dfUDZD3nss/view?usp=drivesdk"
  },
  {
    "id": "krucom-205",
    "folder": "201 รูปทรงเรขาคณิต python",
    "title": "รูปทรงเรขาคณิต python.pdf",
    "cleanTitle": "รูปทรงเรขาคณิต python",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1poTHP19qCtmoI0m3GJGk3fYU9AN8whZF/view?usp=drivesdk"
  },
  {
    "id": "krucom-206",
    "folder": "200 องค์ประกอบ ของระบบคอมพิวเตอร์",
    "title": "องค์ประกอบ ของระบบคอมพิวเตอร์.pdf",
    "cleanTitle": "องค์ประกอบ ของระบบคอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1RY0K4RWCg2aweojoLEjTOWYZCAy6pIFZ/view?usp=drivesdk"
  },
  {
    "id": "krucom-207",
    "folder": "199 ส่วนประกอบ Excel",
    "title": "ส่วนประกอบ Excel.pdf",
    "cleanTitle": "ส่วนประกอบ Excel",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ZUyHVltKZEWXu-j2d7QHMkASOsFf6LDQ/view?usp=drivesdk"
  },
  {
    "id": "krucom-208",
    "folder": "198 ภาษาคอมพิวเตอร์",
    "title": "ภาษาซี.pdf.pdf",
    "cleanTitle": "ภาษาคอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1RrGrM77QkjAplPqzt1aHziAh6LFg65bt/view?usp=drivesdk"
  },
  {
    "id": "krucom-209",
    "folder": "197 ส่วนประกอบ Microsoft word",
    "title": "Microsoft word.pdf",
    "cleanTitle": "ส่วนประกอบ Microsoft word",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1TvtaPKiG6oGF_qobCD9B9EOn6W28H4jw/view?usp=drivesdk"
  },
  {
    "id": "krucom-210",
    "folder": "196 ภัยจากอินเทอร์เน็ต",
    "title": "ภัยจากอินเทอร์เน็ต.pdf",
    "cleanTitle": "ภัยจากอินเทอร์เน็ต",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1S28EAGlKapVd-20lXWbKrF2NBCHKqkL-/view?usp=drivesdk"
  },
  {
    "id": "krucom-211",
    "folder": "195 ข้อปฏิบัติ",
    "title": "เพิ่มหัวเรื่องย่อย.pdf.pdf",
    "cleanTitle": "ข้อปฏิบัติ",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1zIxscAS2bzHF_vdDoqZDk-lL_j9E13jR/view?usp=drivesdk"
  },
  {
    "id": "krucom-212",
    "folder": "194 หน่วยรับข้อมูล+ประมวผล+แสดงผล",
    "title": "หลักการทำงานของคอมพิวเตอร์.pdf.pdf",
    "cleanTitle": "หน่วยรับข้อมูล+ประมวผล+แสดงผล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ysR1vKT7XGrKL-BvgcEfvdQZOkoYOhsw/view?usp=drivesdk"
  },
  {
    "id": "krucom-213",
    "folder": "194 ศัพท์คอมพิวเตอร์",
    "title": "ศัพท์คอมพิวเตอร์.pdf",
    "cleanTitle": "ศัพท์คอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/17kDHYrjaTIKSoQuir6oxFqTgZ0dW_pHu/view?usp=drivesdk"
  },
  {
    "id": "krucom-214",
    "folder": "193 สื่อติดบอร์ด Flowchart",
    "title": "Flowchart.pdf",
    "cleanTitle": "สื่อติดบอร์ด Flowchart",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1WaYdDbf9sxJNqNCV7FH2nEzI3AB7MtEa/view?usp=drivesdk"
  },
  {
    "id": "krucom-215",
    "folder": "192 สื่อติดบอร์ด อุปกรณ์คอมพิวเตอร์",
    "title": "สื่อติดบอร์ด อุปกรณ์คอมพิวเตอร์.pdf.pdf",
    "cleanTitle": "สื่อติดบอร์ด อุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1EQeN9LD_LyC-pAqzmbkD78EZ3LedbPsq/view?usp=drivesdk"
  },
  {
    "id": "krucom-216",
    "folder": "191 บัญญัติ 10 ประการ ของการใช้อินเทอร์เน็ต",
    "title": "บัญญัติ 10 ประการ ของการใช้อินเทอร์เน็ต  (1).pdf",
    "cleanTitle": "บัญญัติ 10 ประการ ของการใช้อินเทอร์เน็ต",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1x_m-p6o96FMIk5pYN9crrKcZvvzUjFtV/view?usp=drivesdk"
  },
  {
    "id": "krucom-217",
    "folder": "191 บัญญัติ 10 ประการ ของการใช้อินเทอร์เน็ต",
    "title": "บัญญัติ 10 ประการ ของการใช้อินเทอร์เน็ต .pdf",
    "cleanTitle": "บัญญัติ 10 ประการ ของการใช้อินเทอร์เน็ต",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1J8Mzgr6KyxidITS8Y-5XFm6HOQ33FlPG/view?usp=drivesdk"
  },
  {
    "id": "krucom-218",
    "folder": "190 อัลกอริทึมลอยกระทง",
    "title": "อัลกอริทึมการทำกระทง.pdf.pdf",
    "cleanTitle": "อัลกอริทึมลอยกระทง",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1jx_VOPc_HintX5iinOgP9BGYC5betDuj/view?usp=drivesdk"
  },
  {
    "id": "krucom-219",
    "folder": "189 บอร์ด microsoft",
    "title": "บอร์ด Microsoft.pdf",
    "cleanTitle": "บอร์ด microsoft",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1zWPTFukNJmhWudi6ckVMpTz1nEHbj3KY/view?usp=drivesdk"
  },
  {
    "id": "krucom-220",
    "folder": "188 สลาก พรบ.คอมพิวเตอร์",
    "title": "พ.ร.บ. คอมพิวเตอร์.pdf",
    "cleanTitle": "สลาก พรบ.คอมพิวเตอร์",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1X1iN19Oa9veA_IyxubEsFQpCXS5myQpJ/view?usp=drivesdk"
  },
  {
    "id": "krucom-221",
    "folder": "187 โลกอุกรณ์คอมพิวเตอร์",
    "title": "โลกอุกรณ์คอมพิวเตอร์.pdf",
    "cleanTitle": "โลกอุกรณ์คอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1p-hhc-63ITXhEnYkZZS9_i7Ci9YArljd/view?usp=drivesdk"
  },
  {
    "id": "krucom-222",
    "folder": "186 ข้อมูลสารสนเทศ",
    "title": "ข้อมูลสารสนเทศ.pdf",
    "cleanTitle": "ข้อมูลสารสนเทศ",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1MPWKmCu0_hevSNN_7no_xR7yAUq1qOld/view?usp=drivesdk"
  },
  {
    "id": "krucom-223",
    "folder": "185 การสร้างโฟลเดอร์",
    "title": "การสร้าง.pdf.pdf",
    "cleanTitle": "การสร้างโฟลเดอร์",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1iTpW2IvJkOjaE2rvf_gpOBB7tVtCnzW4/view?usp=drivesdk"
  },
  {
    "id": "krucom-224",
    "folder": "184 โปรแกรมน่ารู้",
    "title": "โปรแกรมน่ารู้.pdf",
    "cleanTitle": "โปรแกรมน่ารู้",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1xJvNQh2xnEk4KAZPRqUfeOE_QT8N_Olz/view?usp=drivesdk"
  },
  {
    "id": "krucom-225",
    "folder": "183 การทำงานอุปกรณ์คอมพิวเตอร์",
    "title": "คอมพิวเตอร์.pdf",
    "cleanTitle": "การทำงานอุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1C8HnkwxQqdJtJOliVNSU0tdpFJ6TjtiM/view?usp=drivesdk"
  },
  {
    "id": "krucom-226",
    "folder": "182 การเปลี่ยนแปลงทางเทคโนโลยี",
    "title": "การเปลี่ยนแปลงทางเทคโนโลยี.pdf",
    "cleanTitle": "การเปลี่ยนแปลงทางเทคโนโลยี",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1vWpxy-wXCPp9lP1IyPBH8aO14i5Iv-oA/view?usp=drivesdk"
  },
  {
    "id": "krucom-227",
    "folder": "181 สื่อการสอน ลิขสิทธิ์/ไม่มีลิขสิทธิ์",
    "title": "ลิขสิทธิ์ไม่มีลิขสิทธิ์.pdf",
    "cleanTitle": "สื่อการสอน ลิขสิทธิ์/ไม่มีลิขสิทธิ์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1oyI7P0_3kDNy2vAtckgYB6Ksx7Se0jYE/view?usp=drivesdk"
  },
  {
    "id": "krucom-228",
    "folder": "180 ใบงานรวบรวมข้อมูล Excel",
    "title": "ใบงาน  รวบรวมข้อมูล.pdf",
    "cleanTitle": "ใบงานรวบรวมข้อมูล Excel",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ttfrdX1LqhsmfNzrxadcTPzRUGu02rY-/view?usp=drivesdk"
  },
  {
    "id": "krucom-229",
    "folder": "179 หน้าต่างโปรแกรม Microsoft Excel",
    "title": "excel.pdf",
    "cleanTitle": "หน้าต่างโปรแกรม Microsoft Excel",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1X3fRfhHm6vK3mVfL5_nhJm1wCXpFF41H/view?usp=drivesdk"
  },
  {
    "id": "krucom-230",
    "folder": "177 ข้อมูลที่อยู่รอบตัวเรา",
    "title": "ข้อมูลที่อยู่รอบตัวเรา (1).pdf",
    "cleanTitle": "ข้อมูลที่อยู่รอบตัวเรา",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1P6OXSjTrmlfl7AjmCDcs09hkv8tCI7n_/view?usp=drivesdk"
  },
  {
    "id": "krucom-231",
    "folder": "175 หลักการทำงานแบบวนซ้ำ",
    "title": "หลักการทำงานแบบวนซ้ำ (1).pdf",
    "cleanTitle": "หลักการทำงานแบบวนซ้ำ",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/12hgJykCxj7UkqJz9GQvM3wp2MBk68pDt/view?usp=drivesdk"
  },
  {
    "id": "krucom-232",
    "folder": "175 หลักการทำงานแบบวนซ้ำ",
    "title": "หลักการทำงานแบบวนซ้ำ.pdf",
    "cleanTitle": "หลักการทำงานแบบวนซ้ำ",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1g85sp-ysoZW-jeekhV8yLs1r6jOUS7aa/view?usp=drivesdk"
  },
  {
    "id": "krucom-233",
    "folder": "174 อัลกอริทึม(Algorithm) MS",
    "title": "อัลกอริทึม(Algorithm) MS.pdf",
    "cleanTitle": "อัลกอริทึม(Algorithm) MS",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1lqCG904QKgawrVQAnmqcxFibRH1SiCmJ/view?usp=drivesdk"
  },
  {
    "id": "krucom-234",
    "folder": "173 ภัยจากอินเทอร์เน็ต",
    "title": "ภัยจากอินเทอร์เน็ต (1).pdf",
    "cleanTitle": "ภัยจากอินเทอร์เน็ต",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/15PXmIK-O-3I9IuXW5GtQbhhqVNFb8VE7/view?usp=drivesdk"
  },
  {
    "id": "krucom-235",
    "folder": "172 สร้างเกมค้างคาวกินกล้วย",
    "title": "ค้างคาว.pdf",
    "cleanTitle": "สร้างเกมค้างคาวกินกล้วย",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1MIBPoCxrRO-Oy7azXG8IRCmaezYSDSUI/view?usp=drivesdk"
  },
  {
    "id": "krucom-236",
    "folder": "170 โปรแกรมซื้อของ",
    "title": "โปรแกรมซื้อของ.pdf",
    "cleanTitle": "โปรแกรมซื้อของ",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/17UwC_5fOKY7yyv9ZL4-yYghIMMyXKG8D/view?usp=drivesdk"
  },
  {
    "id": "krucom-237",
    "folder": "171 Input or Output",
    "title": "Input or Output .pdf",
    "cleanTitle": "Input or Output",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/11GijDnWUiQJEdz0PeCrCf9gpEEWmewM5/view?usp=drivesdk"
  },
  {
    "id": "krucom-238",
    "folder": "169 ใบงานจัดหมวดหมู่ไฟล์",
    "title": "Text.pdf.pdf",
    "cleanTitle": "ใบงานจัดหมวดหมู่ไฟล์",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1oKfsvfVFyp3_4YGqZafu-Ix7pHlWfNQx/view?usp=drivesdk"
  },
  {
    "id": "krucom-239",
    "folder": "168 อัลกอริทึม วงจรชีวิตของสัตว์",
    "title": "อัลกอริทึม วงจรชีวิตสัตว์.pdf",
    "cleanTitle": "อัลกอริทึม วงจรชีวิตของสัตว์",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1IhE7-L1rDCcrRet-VG5osOM19s-aZvlG/view?usp=drivesdk"
  },
  {
    "id": "krucom-240",
    "folder": "167 อัลกอริทึมกิจวัตรประจำวัน",
    "title": "อัลกอริทึมกิจวัตประจำวัน.pdf",
    "cleanTitle": "อัลกอริทึมกิจวัตรประจำวัน",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/10y87Jl2j6wYivkQi1ZFlGvNkKhr13S-1/view?usp=drivesdk"
  },
  {
    "id": "krucom-241",
    "folder": "166 โปรแกรมจัดกระเป๋า",
    "title": "ตารางโปรแกรมจัดกระเป๋า.pdf",
    "cleanTitle": "โปรแกรมจัดกระเป๋า",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Q0NDedNbT4ifWyL2bXGW06NUUF9oey-t/view?usp=drivesdk"
  },
  {
    "id": "krucom-242",
    "folder": "166 โปรแกรมจัดกระเป๋า",
    "title": "โรปแกรมจัดกระเป๋า.pdf",
    "cleanTitle": "โปรแกรมจัดกระเป๋า",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1jEh7d5CWRhc-B_5kK_Vn0iqfXY8KbCHK/view?usp=drivesdk"
  },
  {
    "id": "krucom-243",
    "folder": "165 ความหน้าเชื่อถือของแหล่งที่มา",
    "title": "ความหน้าเชื่อถือของแหล่งที่มา.pdf",
    "cleanTitle": "ความหน้าเชื่อถือของแหล่งที่มา",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1IWWOIiYKOWmxsXxzb8Q9ZQLwWToB6Tgd/view?usp=drivesdk"
  },
  {
    "id": "krucom-244",
    "folder": "163 แบบฝึกหัด Scratch",
    "title": "แบบฝึกหัด Scratch.pdf",
    "cleanTitle": "แบบฝึกหัด Scratch",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1qob44icTUjzkKvRO-O0N5hJQsbc4oJ9R/view?usp=drivesdk"
  },
  {
    "id": "krucom-245",
    "folder": "162 Unplug Coding",
    "title": "162 Unplug Coding.pdf",
    "cleanTitle": "Unplug Coding",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Ngs105Rbkp9iWzmrQnle8q8HW1vyhL97/view?usp=drivesdk"
  },
  {
    "id": "krucom-246",
    "folder": "161 บันไดงู เทคโนโลยีในชีวิตประจำวัน",
    "title": "เกมเศรษฐี.pdf.pdf",
    "cleanTitle": "บันไดงู เทคโนโลยีในชีวิตประจำวัน",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1_qMYPLpOjfbx_1e3eHCVK6oXySw-I6zC/view?usp=drivesdk"
  },
  {
    "id": "krucom-247",
    "folder": "160 วิธีการพิมพ์ตัวอักษร",
    "title": "Mengenal Energi Sains Flashcard Toska Ceria.pdf.pdf",
    "cleanTitle": "วิธีการพิมพ์ตัวอักษร",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/19t4p9zh-OAO70gLr8ZeC9WL8U-1DOkjF/view?usp=drivesdk"
  },
  {
    "id": "krucom-248",
    "folder": "159 Q&A Scratch",
    "title": "Q&ASCRATCH.pdf",
    "cleanTitle": "Q&A Scratch",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/17UQeGF18m7zLeuibDB4oo6gdVkogcCvK/view?usp=drivesdk"
  },
  {
    "id": "krucom-249",
    "folder": "158 สลากสัญลักษณ์ผังงาน",
    "title": "สลากสัญลักษณ์ผังงาน .pdf",
    "cleanTitle": "สลากสัญลักษณ์ผังงาน",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1B0mVq-Hv0p2pO-hXp3bKzdnrCXmNr4CL/view?usp=drivesdk"
  },
  {
    "id": "krucom-250",
    "folder": "157 การ์ดซอฟต์แวร์&ฮาร์ดแวร์",
    "title": "Sw&Hw.pdf.pdf",
    "cleanTitle": "การ์ดซอฟต์แวร์&ฮาร์ดแวร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/11NqFiPZRBnenxP76mLSfOay31Dmxltju/view?usp=drivesdk"
  },
  {
    "id": "krucom-251",
    "folder": "155 หวยคำถาม? เก็บคะแนนนักเรียน",
    "title": "หวยคำถาม เก็บคะแนนนักเรียน.pdf",
    "cleanTitle": "หวยคำถาม? เก็บคะแนนนักเรียน",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1hGcjWWAXsF-lR_21eXS8KwS14hWlTpLi/view?usp=drivesdk"
  },
  {
    "id": "krucom-252",
    "folder": "154 การจัดการไฟล์",
    "title": "การจัดการไฟล์.pdf.pdf",
    "cleanTitle": "การจัดการไฟล์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1y-u1Qh7rQcckZ_1uZfeolJcbp9KQjzfe/view?usp=drivesdk"
  },
  {
    "id": "krucom-253",
    "folder": "153 เกม Tetris",
    "title": "Tetris.pdf",
    "cleanTitle": "เกม Tetris",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ar-_Wysg7PXfifFY8m07FqKa-HN_3mIP/view?usp=drivesdk"
  },
  {
    "id": "krucom-254",
    "folder": "152 แสดงลำดับขั้นตอนการค้นหา และแก้ปัญหาอย่างง่าย",
    "title": "แสดงลำดับขั้นตอนการค้นหา และแก้ปัญหาอย่างง่าย.pdf",
    "cleanTitle": "แสดงลำดับขั้นตอนการค้นหา และแก้ปัญหาอย่างง่าย",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Doh1qdDL74v5s2KTTkcMa8VNQCyPLUcH/view?usp=drivesdk"
  },
  {
    "id": "krucom-255",
    "folder": "151 กล่องสุ่มวันแม่",
    "title": "Mother Day.pdf",
    "cleanTitle": "กล่องสุ่มวันแม่",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1RKxANMYBe5gx8v2TT1m4Dyblx5SB6Wl4/view?usp=drivesdk"
  },
  {
    "id": "krucom-256",
    "folder": "150 พฤติกรรมและอาการเสี่ยงต่อการเสพติดดิจิทัล",
    "title": "พฤติกรรมและอาการเสพติดดิจิทัล.pdf",
    "cleanTitle": "พฤติกรรมและอาการเสี่ยงต่อการเสพติดดิจิทัล",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/17JxTx1MWRm0BMgfd_txpUNVnsdnY6A6R/view?usp=drivesdk"
  },
  {
    "id": "krucom-257",
    "folder": "149 Labubu  การ์ดวันแม่",
    "title": "Labubu  การ์ดวันแม่.pdf",
    "cleanTitle": "Labubu  การ์ดวันแม่",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1lNsUOiU9BDVXJNQlgBgLw0eIrnnXswH1/view?usp=drivesdk"
  },
  {
    "id": "krucom-258",
    "folder": "148 ภัยจากอินเทอร์เน็ต",
    "title": "ภัยจากอินเทอร์เน็ต.pdf",
    "cleanTitle": "ภัยจากอินเทอร์เน็ต",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1CEVVLsOeOwxbobGCAmUzE8M_FPfSbJJy/view?usp=drivesdk"
  },
  {
    "id": "krucom-259",
    "folder": "147 ชิ้นงานสร้างสรรค์ Tetris",
    "title": "ชิ้นงานสร้างสรรค์ Tetris.pdf",
    "cleanTitle": "ชิ้นงานสร้างสรรค์ Tetris",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Q1YTdhKb2sJyIkm5iIkNL0DxaEsaMKnv/view?usp=drivesdk"
  },
  {
    "id": "krucom-260",
    "folder": "146 ถอดรหัสลับ",
    "title": "กิจกรรมถิดรหัสลับ.pdf",
    "cleanTitle": "ถอดรหัสลับ",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1gE1CRqgKSNq8WdpnqdgVJmz53VRrpsnc/view?usp=drivesdk"
  },
  {
    "id": "krucom-261",
    "folder": "145 พิกัดและการใช้คำสั่งเคลื่อนที่",
    "title": "พิกัดและการใช้คำสั่งเคลื่อนที่.pdf",
    "cleanTitle": "พิกัดและการใช้คำสั่งเคลื่อนที่",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ZG3TFHNiL6LQkw0UhMc_-axjDSf9vdaT/view?usp=drivesdk"
  },
  {
    "id": "krucom-262",
    "folder": "144 สูตรคูณตามสั่ง",
    "title": "สูตรคูณตามสั่ง.pdf.pdf",
    "cleanTitle": "สูตรคูณตามสั่ง",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Q-ImfGvvFfqi2bR5wZXuLIhrmYu6UFeF/view?usp=drivesdk"
  },
  {
    "id": "krucom-263",
    "folder": "143 เซียมซี Scratch",
    "title": "บล๊อกคำสั่ง scratch.pdf",
    "cleanTitle": "เซียมซี Scratch",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1MTGX_gwDf1LzQ6rnxNgjSg9xbRwoEYE3/view?usp=drivesdk"
  },
  {
    "id": "krucom-264",
    "folder": "143 เซียมซี Scratch",
    "title": "เซียมซี Scratch.pdf",
    "cleanTitle": "เซียมซี Scratch",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1lGpekHHyv7iKq-jyvMBucsrw-JljyOlW/view?usp=drivesdk"
  },
  {
    "id": "krucom-265",
    "folder": "142 อีเมล E-mail",
    "title": "ขาว-ดำ.pdf",
    "cleanTitle": "อีเมล E-mail",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1aN3G-EpThZ8Sg3VG0ZRAVr85AV0eTAsm/view?usp=drivesdk"
  },
  {
    "id": "krucom-266",
    "folder": "142 อีเมล E-mail",
    "title": "E-mail.pdf",
    "cleanTitle": "อีเมล E-mail",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/15vPDIT0iKejbE3WnCOBlA7N91Sr-bFiW/view?usp=drivesdk"
  },
  {
    "id": "krucom-267",
    "folder": "141 โดมิโน่อุปกรณ์คอมพิวเตอร์",
    "title": "โดมิโน่ อุปกรณ์คอมพิวเตอร์.pdf",
    "cleanTitle": "โดมิโน่อุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ToV3eiAv1pMw9q1SmbfncfL35zy4xFDX/view?usp=drivesdk"
  },
  {
    "id": "krucom-268",
    "folder": "140 เป่ายิ้งฉุบ",
    "title": "เป่ายิ้งฉุบ (1).pdf",
    "cleanTitle": "เป่ายิ้งฉุบ",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1TA4Y9DD3DuwoXExpebJtuZe0-GA9y_Yf/view?usp=drivesdk"
  },
  {
    "id": "krucom-269",
    "folder": "SS ใบงาน แจกฟรี",
    "title": "ใบงานแจกฟรี.pdf",
    "cleanTitle": "SS ใบงาน แจกฟรี",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1bgVj0knElLpgXBh3FqOprd491Cwllb4j/view?usp=drivesdk"
  },
  {
    "id": "krucom-270",
    "folder": "139 ซอฟต์แวร์ระบบ",
    "title": "ซอฟต์แวร์ระบบ",
    "cleanTitle": "ซอฟต์แวร์ระบบ",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1dk-9U9iQcI33WKMiAg8IwzI227yU_DDK/view?usp=drivesdk"
  },
  {
    "id": "krucom-271",
    "folder": "138 ใบงาน ตัวเลขที่หายไป",
    "title": "ใบงาน ตัวเลขที่หายไป .pdf",
    "cleanTitle": "ใบงาน ตัวเลขที่หายไป",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1P5TnfDrZ5Gw1_ffLsjlnr19nnxGsgki7/view?usp=drivesdk"
  },
  {
    "id": "krucom-272",
    "folder": "137 ใบงาน ปุ่ม Tilde(ไทด์)",
    "title": "ใบงาน.pdf.pdf",
    "cleanTitle": "ใบงาน ปุ่ม Tilde(ไทด์)",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1T563v0vewRoKNRgrOTOFesHkMLuPLFo7/view?usp=drivesdk"
  },
  {
    "id": "krucom-273",
    "folder": "136 การสืบค้นข้อมูล",
    "title": "การสืบค้นข้อมูล.pdf.pdf",
    "cleanTitle": "การสืบค้นข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1_Mc5238y5JuXIeGaudCbdNJ6VZz32qJn/view?usp=drivesdk"
  },
  {
    "id": "krucom-274",
    "folder": "135 สัญลักษณ์ Microsoft Word",
    "title": "Microsoft Word.pdf",
    "cleanTitle": "สัญลักษณ์ Microsoft Word",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/18j6u7tH65cQPl3KliavTnnixwkEWWJSE/view?usp=drivesdk"
  },
  {
    "id": "krucom-275",
    "folder": "134 หลักคำศัพท์เกี่ยวกับซอพต์แวร์",
    "title": "คำศัพท์.pdf",
    "cleanTitle": "หลักคำศัพท์เกี่ยวกับซอพต์แวร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1RAAv4ZPSJ-6QRWsNRP0Ai5lDjuTvjt1s/view?usp=drivesdk"
  },
  {
    "id": "krucom-276",
    "folder": "133 กล่อง Scratch พลิกได้",
    "title": "กล่อง Scratch พลิกได้.pdf",
    "cleanTitle": "กล่อง Scratch พลิกได้",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1fx7q-oL2ZFCd3iUEXJhw8jHFvtOMxcLd/view?usp=drivesdk"
  },
  {
    "id": "krucom-277",
    "folder": "132 ลูกเต๋าจิ๊กซอว์ อุปกรณ์คอมพิวเตอร์",
    "title": "ลูกเต๋าจิ๊กซอว์ อุปกรณ์คอมพิวเตอร์.pdf",
    "cleanTitle": "ลูกเต๋าจิ๊กซอว์ อุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1dcssr3VfGTZE5iQBDpX1UIuWU_awBNXg/view?usp=drivesdk"
  },
  {
    "id": "krucom-278",
    "folder": "131 Uno ผังงาน",
    "title": "เริ่มต้นสิ้นสุด.pdf.pdf",
    "cleanTitle": "Uno ผังงาน",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1yRWNmHwqJEjApeKxJJvsq3VbhDGqGZa6/view?usp=drivesdk"
  },
  {
    "id": "krucom-279",
    "folder": "130 ปิงโก microsoft word",
    "title": "bingo word.pdf",
    "cleanTitle": "ปิงโก microsoft word",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/10UyB_gcdT98g4Gutezgp51GuAHBzO2tm/view?usp=drivesdk"
  },
  {
    "id": "krucom-280",
    "folder": "129 ใช้งานอินเทอร์เน็ต อย่างมีมารยาท",
    "title": "ใช้งานอินเทอร์เน็ต อย่างมีมารยาท.pdf",
    "cleanTitle": "ใช้งานอินเทอร์เน็ต อย่างมีมารยาท",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Mc12JsE4aIDzrkO4_1Tfa4EGn36pEhzR/view?usp=drivesdk"
  },
  {
    "id": "krucom-281",
    "folder": "128 การเขียนโปรแกรมแบบวนซ้ำ",
    "title": "การเขียนโปรแกรมแบบวนซ้ำ (1).pdf",
    "cleanTitle": "การเขียนโปรแกรมแบบวนซ้ำ",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ipLy-YAvAlV_zlFyeFW9PiBGlj7acZZd/view?usp=drivesdk"
  },
  {
    "id": "krucom-282",
    "folder": "127 เกมการสอน What I AM Coding",
    "title": "ผังเกมส์.pdf",
    "cleanTitle": "เกมการสอน What I AM Coding",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1OX1SmUBYP0oBN7C3aO8Shwbr0Ycms65e/view?usp=drivesdk"
  },
  {
    "id": "krucom-283",
    "folder": "126 ภาษาคอมพิวเตอร์",
    "title": "ภาษาคอมพิวเตอร์.pdf",
    "cleanTitle": "ภาษาคอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1nn1ooND4FNujj6fypPUlzdfkL9VaVySt/view?usp=drivesdk"
  },
  {
    "id": "krucom-284",
    "folder": "125 กิจกรรม what I am?",
    "title": "ใบงาน.pdf",
    "cleanTitle": "กิจกรรม what I am?",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/19m_WXdNCg4t3LG88_nAp8-Dela6eFyMC/view?usp=drivesdk"
  },
  {
    "id": "krucom-285",
    "folder": "124 การแก้ปัญหา การตรวจสอบเงื่อนไข",
    "title": "การแก้ปัญหา.pdf",
    "cleanTitle": "การแก้ปัญหา การตรวจสอบเงื่อนไข",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1WhJYZEVbAtyhy47oPGfGX8uBfNnpP8nG/view?usp=drivesdk"
  },
  {
    "id": "krucom-286",
    "folder": "122 ลักษณะการใช้งาน",
    "title": "ลักษณะการใช้งาน (1).pdf",
    "cleanTitle": "ลักษณะการใช้งาน",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1HlNlV8nRwK3BF3ze7IvIS9eFJEAScztQ/view?usp=drivesdk"
  },
  {
    "id": "krucom-287",
    "folder": "121 คัมภีร์ Scratch",
    "title": "คัมภีร์ Scratch.pdf",
    "cleanTitle": "คัมภีร์ Scratch",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ZikHeHNOrBfYn2WYtnPrab0DiqOoKp9L/view?usp=drivesdk"
  },
  {
    "id": "krucom-288",
    "folder": "120 คีย์บอร์ด",
    "title": "220 คีย์บอร์ดA4.pdf",
    "cleanTitle": "คีย์บอร์ด",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1R66WyM5L6fjOL3vC_PCx4FJppfhz9atZ/view?usp=drivesdk"
  },
  {
    "id": "krucom-289",
    "folder": "120 คีย์บอร์ด",
    "title": "220 คีย์บอร์ด.pdf",
    "cleanTitle": "คีย์บอร์ด",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1szqIyHD0OSn0folFSiA9APx0KYHlwDjn/view?usp=drivesdk"
  },
  {
    "id": "krucom-290",
    "folder": "123 เดินตามเส้น เล่นตามสคริป",
    "title": "เดินตามเส้น เล่นตามสคริป.pdf",
    "cleanTitle": "เดินตามเส้น เล่นตามสคริป",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1rm_VCmK5IlQAdghLyFBoTSZLIJm-qR2H/view?usp=drivesdk"
  },
  {
    "id": "krucom-291",
    "folder": "118 ปริศนาของเล่น",
    "title": "ปริศนาของเล่น.pdf",
    "cleanTitle": "ปริศนาของเล่น",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1cEdF6_A_ZRG9o5LcuV_3OTFg_uLQMAIq/view?usp=drivesdk"
  },
  {
    "id": "krucom-292",
    "folder": "117 วิธีปกป้องสิทธิ์และเคารพสิทธิ",
    "title": "วิธีปกป้องสิทธิ์และเคารพสิทธิ.pdf",
    "cleanTitle": "วิธีปกป้องสิทธิ์และเคารพสิทธิ",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1OT_BaLnqCylE7bL3jfJqwav4NlkCmELJ/view?usp=drivesdk"
  },
  {
    "id": "krucom-293",
    "folder": "116 สื่อการสอนอัลกอริทึม",
    "title": "อัลกอริทึม การหุงข้าว.pdf",
    "cleanTitle": "สื่อการสอนอัลกอริทึม",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Knu_G-BrWbyrOoAUAENsf4ty-9VCSqdw/view?usp=drivesdk"
  },
  {
    "id": "krucom-294",
    "folder": "116 สื่อการสอนอัลกอริทึม",
    "title": "อัลกอริทึม การหุงข้าว.pdf",
    "cleanTitle": "สื่อการสอนอัลกอริทึม",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1rSnzozxKuq2EXnkUxBSmxLS1cBpgaJlR/view?usp=drivesdk"
  },
  {
    "id": "krucom-295",
    "folder": "115 สื่อการสอน cursors and Mouse",
    "title": "Cursors and Mouse.pdf",
    "cleanTitle": "สื่อการสอน cursors and Mouse",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Q_cSnwt7TwGKUuGwikxy1Aw8LTJ1JQmw/view?usp=drivesdk"
  },
  {
    "id": "krucom-296",
    "folder": "114 สื่อหลักศิลาอัลกอริทึม",
    "title": "อัลกอริทึม.pdf",
    "cleanTitle": "สื่อหลักศิลาอัลกอริทึม",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/19UfQ1XJ8_lP9_ykYRISJRUXBy9wq9g2A/view?usp=drivesdk"
  },
  {
    "id": "krucom-297",
    "folder": "113 ใบกิจกรรมสายลับนับจำนวน",
    "title": "สายลับนับจำนวน.pdf",
    "cleanTitle": "ใบกิจกรรมสายลับนับจำนวน",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/174q3YMUkoVW8MHc73Ei-p22STlOxFqpr/view?usp=drivesdk"
  },
  {
    "id": "krucom-298",
    "folder": "112 จับคู่สื่ออุปกรณ์คอมพิวเตอร์",
    "title": "จับคู่สื่ออุปกรณ์คอมพิวเตอร์.pdf",
    "cleanTitle": "จับคู่สื่ออุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/10yUm1L5Pd1gUwMd4XJpFYFpI9O30xdpz/view?usp=drivesdk"
  },
  {
    "id": "krucom-299",
    "folder": "108 การแก้ปัญหาอย่างเป็นขั้นตอน",
    "title": "การแก้ปัญหาอย่างเป็นขั้นตอน.pdf",
    "cleanTitle": "การแก้ปัญหาอย่างเป็นขั้นตอน",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1qmqXPXxY1_w5aRgqbx6PWyac_nRaT8rC/view?usp=drivesdk"
  },
  {
    "id": "krucom-300",
    "folder": "107 การใช้งานโปรแกรม Paint",
    "title": "paint.pdf.pdf",
    "cleanTitle": "การใช้งานโปรแกรม Paint",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1lXe-VV4kkSe1KxoZuu6aJbdCuhNteeaX/view?usp=drivesdk"
  },
  {
    "id": "krucom-301",
    "folder": "106 การใช้แป้นพิมพ์เบื้องต้น",
    "title": "การใช้แป้นพิมพ์.pdf",
    "cleanTitle": "การใช้แป้นพิมพ์เบื้องต้น",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1rBruqSODEL4cn-bl1HorpeK4Us9QZC-8/view?usp=drivesdk"
  },
  {
    "id": "krucom-302",
    "folder": "105 สื่อการใช้เมาส์",
    "title": "เมาส์.pdf",
    "cleanTitle": "สื่อการใช้เมาส์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1CwtEB5JpnNT49xSjBBSMwSAb8q269H5X/view?usp=drivesdk"
  },
  {
    "id": "krucom-303",
    "folder": "104 สไลด์สอน เรื่อง การใช้อุปกรณ์ เทคโนโลยี เบื้องต้น",
    "title": "การใช้อุปกรณ์ เทคโนโลยี เบื้องต้น.pdf",
    "cleanTitle": "สไลด์สอน เรื่อง การใช้อุปกรณ์ เทคโนโลยี เบื้องต้น",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1__PA3uNQww1B7Svmkw70KgkBkaAKedmx/view?usp=drivesdk"
  },
  {
    "id": "krucom-304",
    "folder": "103 ตารางเรียน",
    "title": "ตารางเรียน.pdf",
    "cleanTitle": "ตารางเรียน",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1XYTNQqZ3g4sEvPUbqLs4RL1LbeaOyEXH/view?usp=drivesdk"
  },
  {
    "id": "krucom-305",
    "folder": "101 สื่ออุปกรณ์คอมพิวเตอร์",
    "title": "อุปกรณ์คอมพิวเตอร์.pdf",
    "cleanTitle": "สื่ออุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/156zjbxAteRkTIMhXsQDuPz9FWGnTqYgH/view?usp=drivesdk"
  },
  {
    "id": "krucom-306",
    "folder": "100 การใช้เมาส์",
    "title": "การใช้เมาส์ (1).pdf",
    "cleanTitle": "การใช้เมาส์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1r2hItcPjOPssrh0C3fTn6fXpHuN2ZPjH/view?usp=drivesdk"
  },
  {
    "id": "krucom-307",
    "folder": "098 ตารางการใช้ห้องคอม",
    "title": "ตารางการใช้ห้องปฏิบัติการคอมพิวเตอร์.pdf",
    "cleanTitle": "ตารางการใช้ห้องคอม",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1PikZSq9QxtFbqfsieu3eVRrG5iRjVf0o/view?usp=drivesdk"
  },
  {
    "id": "krucom-308",
    "folder": "097 ไวนิลแต่งบานประตู 90x200 cm",
    "title": "90x200.pdf",
    "cleanTitle": "ไวนิลแต่งบานประตู 90x200 cm",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1AAigo-i3OIGt65DoX5zf0PFtsLpVnZX8/view?usp=drivesdk"
  },
  {
    "id": "krucom-309",
    "folder": "096 การสร้างการ์ตูนด้วย Scratch",
    "title": "การสร้างการ์นตูนด้วย Scratch.pdf",
    "cleanTitle": "การสร้างการ์ตูนด้วย Scratch",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/18GnE36CelsnOL1CXow2v3FEzXandjQEK/view?usp=drivesdk"
  },
  {
    "id": "krucom-310",
    "folder": "095 วิจัย-ความรู้พื้นฐานคอมพิวเตอร์",
    "title": "การ์ดทำนายฮาร์ดแวร์.pdf",
    "cleanTitle": "วิจัย-ความรู้พื้นฐานคอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1G9GTMGTutXGVinNxhVATpC-7FDLh1tg-/view?usp=drivesdk"
  },
  {
    "id": "krucom-311",
    "folder": "095 วิจัย-ความรู้พื้นฐานคอมพิวเตอร์",
    "title": "การ์ดทำนายซอฟต์แวร์.pdf",
    "cleanTitle": "วิจัย-ความรู้พื้นฐานคอมพิวเตอร์",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1DrGd54_l7kcY6Bs_WqajsJYkok0gQ_hH/view?usp=drivesdk"
  },
  {
    "id": "krucom-312",
    "folder": "094 ป้าย CCTV",
    "title": "CCTV.pdf",
    "cleanTitle": "ป้าย CCTV",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1-m7kvyZF5cVEuyxjcg8m0cmXIRgR-KkY/view?usp=drivesdk"
  },
  {
    "id": "krucom-313",
    "folder": "092  การ์ดทำนายฮาร์ดแวร์",
    "title": "_การ์ดทำนายฮาร์ดแวร์.pdf",
    "cleanTitle": "การ์ดทำนายฮาร์ดแวร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/148xhG1HfwmDCBwWZZ8Eh7oPAf8EtNTu1/view?usp=drivesdk"
  },
  {
    "id": "krucom-314",
    "folder": "091 การ์ดทำนายซอฟต์แวร์",
    "title": "การ์ดทำนาย.pdf",
    "cleanTitle": "การ์ดทำนายซอฟต์แวร์",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ecXQ_ecImMXXEl0FTB006dlk1TBOb09B/view?usp=drivesdk"
  },
  {
    "id": "krucom-315",
    "folder": "090 ลูกบอล 5 เหลี่ยม",
    "title": "สัญลักษณ์ผังงาน.pdf",
    "cleanTitle": "ลูกบอล 5 เหลี่ยม",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1u-eCT6jhVSK269L-WTRhQL6a_R4TGFgA/view?usp=drivesdk"
  },
  {
    "id": "krucom-316",
    "folder": "089 คีย์ลัด Ctrl+",
    "title": "คีย์ลัด.pdf",
    "cleanTitle": "คีย์ลัด Ctrl+",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1A7bkWCHYw4tajPwpKJexH2bWjTIO1PFT/view?usp=drivesdk"
  },
  {
    "id": "krucom-317",
    "folder": "088 พวงกุญแจ & สติ๊กเกอร์ ปัจฉิม",
    "title": "พวงกุญแจ congrat.pdf",
    "cleanTitle": "พวงกุญแจ & สติ๊กเกอร์ ปัจฉิม",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1wkio0-pjM282yNUgBwHmuMejx1xJ4bC1/view?usp=drivesdk"
  },
  {
    "id": "krucom-318",
    "folder": "087 ทิ้งท้ายก่อนจบ",
    "title": "ทิ้งท้ายก่อนจบ.pdf",
    "cleanTitle": "ทิ้งท้ายก่อนจบ",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1cdfSrEks_82hgajSM9rbDEC7ZCkF4QSo/view?usp=drivesdk"
  },
  {
    "id": "krucom-319",
    "folder": "086 สิ่งที่นักเรียนได้เรียนรู้จากการเรียนวิชาวิทยาการคำนวณ",
    "title": "สิ่งที่นักเรียน.pdf",
    "cleanTitle": "สิ่งที่นักเรียนได้เรียนรู้จากการเรียนวิชาวิทยาการคำนวณ",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1olCujZB48BKpqznGE8UNtKVx7__TdRmS/view?usp=drivesdk"
  },
  {
    "id": "krucom-320",
    "folder": "084 กรอบรูปปัจฉิม",
    "title": "กรอบรูป.pdf",
    "cleanTitle": "กรอบรูปปัจฉิม",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1NqwcfTUon3wP9tfOI8zKtBBZpt1m2wXo/view?usp=drivesdk"
  },
  {
    "id": "krucom-321",
    "folder": "083 Bingo อุปกรณ์คอมพิวเตอร์",
    "title": "BINGO.pdf",
    "cleanTitle": "Bingo อุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1PhXuk65KmG9C5MfrYAXoFlG-Rz8UknbU/view?usp=drivesdk"
  },
  {
    "id": "krucom-322",
    "folder": "082 คลาวด์คอมพิวติง (cloud computer)",
    "title": "คลาวด์คอมพิวติง (cloud computer).pdf",
    "cleanTitle": "คลาวด์คอมพิวติง (cloud computer)",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1VgqRBtCSntuV27xQoNGDl0JHSEP2OTE0/view?usp=drivesdk"
  },
  {
    "id": "krucom-323",
    "folder": "081 สรุปเนื้อหา ม.1-3",
    "title": "สรุปเนื้อหา ม.2.pdf",
    "cleanTitle": "สรุปเนื้อหา ม.1-3",
    "category": "general",
    "targetLevel": "ม.1-3",
    "url": "https://drive.google.com/file/d/1X-gRukqSqtTMt5TiGuSZRvk_f6CbY2dH/view?usp=drivesdk"
  },
  {
    "id": "krucom-324",
    "folder": "081 สรุปเนื้อหา ม.1-3",
    "title": "สรุปเนื้อหา ม.1.pdf",
    "cleanTitle": "สรุปเนื้อหา ม.1-3",
    "category": "general",
    "targetLevel": "ม.1-3",
    "url": "https://drive.google.com/file/d/1NwIAph6iec01kU7VT5Xe2MmuhV4-mQId/view?usp=drivesdk"
  },
  {
    "id": "krucom-325",
    "folder": "081 สรุปเนื้อหา ม.1-3",
    "title": "สรุปเนื้อหา ม.3.pdf",
    "cleanTitle": "สรุปเนื้อหา ม.1-3",
    "category": "general",
    "targetLevel": "ม.1-3",
    "url": "https://drive.google.com/file/d/1mAOfDHm1aqWz3BIe00w_6qc3b7Ju0ymD/view?usp=drivesdk"
  },
  {
    "id": "krucom-326",
    "folder": "079 Scratch รูปทรงเรขาคณิต",
    "title": "วาดรูปเรขาคณิต (1).pdf",
    "cleanTitle": "Scratch รูปทรงเรขาคณิต",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/14Ur6rQTV0Pyko-1rfludVk2zOBvDPHOt/view?usp=drivesdk"
  },
  {
    "id": "krucom-327",
    "folder": "078 วาดรูปทรงเรขาคณิต Scrath",
    "title": "วาดรูปเรขาคณิต.pdf",
    "cleanTitle": "วาดรูปทรงเรขาคณิต Scrath",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1tozP63l5fhWryho2mwUS6Na8l3_em6kq/view?usp=drivesdk"
  },
  {
    "id": "krucom-328",
    "folder": "077 ชุดฝึกประกอบคอมพิวเตอร์",
    "title": "ชุดฝึกประกอบคอมพิวเตอร์.pdf",
    "cleanTitle": "ชุดฝึกประกอบคอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/18avz3u1z2HVwM9eZ1-FS2O7T5NqRPWVQ/view?usp=drivesdk"
  },
  {
    "id": "krucom-329",
    "folder": "076 ใช้อินเทอร์เน็ตค้นหาข้อมูล",
    "title": "ใช้อินเทอร์เน็ตค้นหาความรู้.pdf",
    "cleanTitle": "ใช้อินเทอร์เน็ตค้นหาข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/19MqIxRH0hc5nlsklxh_RYGzNEXrIUvZM/view?usp=drivesdk"
  },
  {
    "id": "krucom-330",
    "folder": "075 เทคโนโลยีสมัยใหม่",
    "title": "เทคโนโลยีสมัยใหม่.pdf",
    "cleanTitle": "เทคโนโลยีสมัยใหม่",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1qQ3u-dVBBzh985cj15M9tdCf8D9XzINa/view?usp=drivesdk"
  },
  {
    "id": "krucom-331",
    "folder": "074 การสร้างรหัสผ่านให้ปลอดภัย",
    "title": "สื่อการตั้งรหัสผ่านให้ปลอดภัย.pdf",
    "cleanTitle": "การสร้างรหัสผ่านให้ปลอดภัย",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1yJAyMDR4ey50bb9PsSF3f913yNh3z24L/view?usp=drivesdk"
  },
  {
    "id": "krucom-332",
    "folder": "074 การสร้างรหัสผ่านให้ปลอดภัย",
    "title": "การตั้งรหัสผ่านให้ปลอดภัย.pdf",
    "cleanTitle": "การสร้างรหัสผ่านให้ปลอดภัย",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1PIVXJ4Ma75Ra9V6O-kLzesXNl1sisEn-/view?usp=drivesdk"
  },
  {
    "id": "krucom-333",
    "folder": "073 บอร์ด google app",
    "title": "google .pdf",
    "cleanTitle": "บอร์ด google app",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1T8L_W6y6p-DsjDUO14zmNOSyhZ5bsc4B/view?usp=drivesdk"
  },
  {
    "id": "krucom-334",
    "folder": "072 ป้ายปัจฉิม",
    "title": "จบแล้วvip.pdf",
    "cleanTitle": "ป้ายปัจฉิม",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/13M5R4awiS5EB16wf-jNN85b_BPGPyqMr/view?usp=drivesdk"
  },
  {
    "id": "krucom-335",
    "folder": "071 สไล์ด พรบ.คอมพิวเตอร์",
    "title": "พรบ.คอมพิวเตอร์ (1).pdf",
    "cleanTitle": "สไล์ด พรบ.คอมพิวเตอร์",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1T-6_Ww_QJDT6Z_FYhmpYQtVObJdw3Ypa/view?usp=drivesdk"
  },
  {
    "id": "krucom-336",
    "folder": "070 สื่อ google app for education",
    "title": "gg app.pdf",
    "cleanTitle": "สื่อ google app for education",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Pc6tWFcNeWuqrWjJs4tV5PhVzG4OPpcm/view?usp=drivesdk"
  },
  {
    "id": "krucom-337",
    "folder": "069 สาเหตุการเปลี่ยนแปลงของเทคโนโลยี",
    "title": "สาเหตุการเปลี่ยนแปลงของเทคโนโลยี .pdf",
    "cleanTitle": "สาเหตุการเปลี่ยนแปลงของเทคโนโลยี",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1WaJ1EExg1eYYd88IuBR7ac36Qd0Ufx0m/view?usp=drivesdk"
  },
  {
    "id": "krucom-338",
    "folder": "067 การละเมิดสิทธิหรือลิขสิทธิ",
    "title": "การละเมิดสิทธิหรือลิขสิทธิ.pdf",
    "cleanTitle": "การละเมิดสิทธิหรือลิขสิทธิ",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/17qzNGnF9ThVR4iNp1j4ABjvSP0a1r3ZT/view?usp=drivesdk"
  },
  {
    "id": "krucom-339",
    "folder": "066 จิ๊กชอว์จับคู่บล๊อกคำสั่ง",
    "title": "จิ๊กชอว์บล๊อกคำสั่ง.pdf",
    "cleanTitle": "จิ๊กชอว์จับคู่บล๊อกคำสั่ง",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1BLA-xn-RNExX0ams8SIeI_4PNrMRf2CR/view?usp=drivesdk"
  },
  {
    "id": "krucom-340",
    "folder": "065 หลักการทำงานของคอมพิวเตอร์",
    "title": "หลักการทำงานของคอมพิวเตอร์ (ขาวดำ).pdf",
    "cleanTitle": "หลักการทำงานของคอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1UpGIuqdJr8rWctbjP8IgIqT6yCOH3aa_/view?usp=drivesdk"
  },
  {
    "id": "krucom-341",
    "folder": "065 หลักการทำงานของคอมพิวเตอร์",
    "title": "หลักการทำงานของคอมพิวเตอร์.pdf",
    "cleanTitle": "หลักการทำงานของคอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Xsd3yWt0tgKJI7Ne6AshNDEgM-gLmV5G/view?usp=drivesdk"
  },
  {
    "id": "krucom-342",
    "folder": "064 ความรับผิดชอบต่อการใช้งานเทคโนโลยี",
    "title": "ความรับชอบต่อการใช้งาน เทคโนโลยี.pdf",
    "cleanTitle": "ความรับผิดชอบต่อการใช้งานเทคโนโลยี",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1jQCIs8zUBIslySTalrXU5evQZXM5iCqc/view?usp=drivesdk"
  },
  {
    "id": "krucom-343",
    "folder": "063 เครื่องมือช่าง",
    "title": "เครื่องมือช่าง.pdf",
    "cleanTitle": "เครื่องมือช่าง",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1-RYZwXKtFsrYPv8_jHiffQNiZS7JO8dE/view?usp=drivesdk"
  },
  {
    "id": "krucom-344",
    "folder": "062 คำสั่ง scratch",
    "title": "บล๊อกคำสั่ง Scratch ชิ้นงาน.pdf",
    "cleanTitle": "คำสั่ง scratch",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/18BxGCtWh0QxMk32xfZhSkDnuhRK8Ti_G/view?usp=drivesdk"
  },
  {
    "id": "krucom-345",
    "folder": "062 คำสั่ง scratch",
    "title": "บล๊อกคำสั่ง scratch.pdf",
    "cleanTitle": "คำสั่ง scratch",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/10vr4mMctlqt2PkLLH80LPbsKWYh3Yarc/view?usp=drivesdk"
  },
  {
    "id": "krucom-346",
    "folder": "061 สื่อติดบอร์ดสัญลักษณ์ผังงาน",
    "title": "สื่อติดบอร์ดสัญลักษณ์ผังงาน.pdf",
    "cleanTitle": "สื่อติดบอร์ดสัญลักษณ์ผังงาน",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1uQTittNJrEfyofTFnZ2E_okuxqiFzF7Z/view?usp=drivesdk"
  },
  {
    "id": "krucom-347",
    "folder": "060 ใบงานวิทยาการคำนวณ",
    "title": "ใบงาน วิทยาการคำนวณ ป.2.pdf",
    "cleanTitle": "ใบงานวิทยาการคำนวณ",
    "category": "general",
    "targetLevel": "ป.1-3",
    "url": "https://drive.google.com/file/d/1PWhJmFhSsDAh0nQjqFSjljiAU5gr_Z-M/view?usp=drivesdk"
  },
  {
    "id": "krucom-348",
    "folder": "060 ใบงานวิทยาการคำนวณ",
    "title": "ใบงานรายวิชาวิทยาการคำนวณ ป.6.pdf",
    "cleanTitle": "ใบงานวิทยาการคำนวณ",
    "category": "general",
    "targetLevel": "ป.4-6",
    "url": "https://drive.google.com/file/d/1urJ72y86tiLb6sVZTLeWddUt-somFMrv/view?usp=drivesdk"
  },
  {
    "id": "krucom-349",
    "folder": "060 ใบงานวิทยาการคำนวณ",
    "title": "ใบงาน วิทยาการคำนวณ ป.5.pdf",
    "cleanTitle": "ใบงานวิทยาการคำนวณ",
    "category": "general",
    "targetLevel": "ป.4-6",
    "url": "https://drive.google.com/file/d/1hm2xhlXBm9Frbzx5rgIRwg2qVyX5TL2Q/view?usp=drivesdk"
  },
  {
    "id": "krucom-350",
    "folder": "060 ใบงานวิทยาการคำนวณ",
    "title": "ใบงานรายวิชาวิทยาการคำนวณ ป.4.pdf",
    "cleanTitle": "ใบงานวิทยาการคำนวณ",
    "category": "general",
    "targetLevel": "ป.4-6",
    "url": "https://drive.google.com/file/d/1KbyfPbId2zXwJMiVamnR2iKft0WD4dbJ/view?usp=drivesdk"
  },
  {
    "id": "krucom-351",
    "folder": "060 ใบงานวิทยาการคำนวณ",
    "title": "ใบงานรายวิชาวิทยาการคำนวณ ป.3.pdf",
    "cleanTitle": "ใบงานวิทยาการคำนวณ",
    "category": "general",
    "targetLevel": "ป.1-3",
    "url": "https://drive.google.com/file/d/1Ezx2Od4qv3xBDzuIjWVE9b1HKHOeMv6I/view?usp=drivesdk"
  },
  {
    "id": "krucom-352",
    "folder": "059 บอร์ดข้อตกลงในห้องคอมพิวเตอร์",
    "title": "บอร์ดข้อตกลงในห้องคอมพิวเตอร์ A4.pdf",
    "cleanTitle": "บอร์ดข้อตกลงในห้องคอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1vvzN2wNJw428fyAz_9oD2Kw7oDguHSf4/view?usp=drivesdk"
  },
  {
    "id": "krucom-353",
    "folder": "059 บอร์ดข้อตกลงในห้องคอมพิวเตอร์",
    "title": "บอร์ดข้อตกลงในห้องคอมพิวเตอร์ A3.pdf",
    "cleanTitle": "บอร์ดข้อตกลงในห้องคอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1smx9F-4HMWca3OCcd5gmt0HKZsxaRuo7/view?usp=drivesdk"
  },
  {
    "id": "krucom-354",
    "folder": "058 แต่งบอร์ดห้องคอม",
    "title": "อุปกรณ์คอมพิวเตอร์.pdf",
    "cleanTitle": "แต่งบอร์ดห้องคอม",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1wqaeqGwIyHO9JIh6T7Mu8Y9WGNN7Gtih/view?usp=drivesdk"
  },
  {
    "id": "krucom-355",
    "folder": "057 เทคโนโลยีในชีวิตประจำวัน",
    "title": "เทคโนโลยีในชีวิตประจำวัน.pdf",
    "cleanTitle": "เทคโนโลยีในชีวิตประจำวัน",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1NzR3OlHEUgmUEv1BMe1YRXq17oOpAWVT/view?usp=drivesdk"
  },
  {
    "id": "krucom-356",
    "folder": "054 สัญลักษณ์ผังงาน",
    "title": "เริ่มต้นสิ้นสุด (3).pdf",
    "cleanTitle": "สัญลักษณ์ผังงาน",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1471SPtQhTRkoQoN4S5P4DGgZllpWw1qn/view?usp=drivesdk"
  },
  {
    "id": "krucom-357",
    "folder": "053 แบบฝึกหัด ป.1-3",
    "title": "แบบฝึกหัด ป.1-3.pdf",
    "cleanTitle": "แบบฝึกหัด ป.1-3",
    "category": "general",
    "targetLevel": "ป.1-3",
    "url": "https://drive.google.com/file/d/1isTp43-G7HNGuy1raQqkmeiunhWTzmr_/view?usp=drivesdk"
  },
  {
    "id": "krucom-358",
    "folder": "sss สรุปคำสั่ง scratch",
    "title": "สรุปคำสั่ง Scratch.pdf",
    "cleanTitle": "sss สรุปคำสั่ง scratch",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1mo4ZXCpzOjg7gJjZl5HpoRfYWYfrDIlZ/view?usp=drivesdk"
  },
  {
    "id": "krucom-359",
    "folder": "050 นาฬิกาอุปกรณ์คอมพิวเตอร์",
    "title": "อุปกรณ์คอมพิวเตอร์.pdf",
    "cleanTitle": "นาฬิกาอุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1eR2Ak66kfbgpLJ2K9DRkt8UoH2annDae/view?usp=drivesdk"
  },
  {
    "id": "krucom-360",
    "folder": "048 เครือข่ายอินเทอร์เน็ต",
    "title": "เครือข่ายอินเทอร์เน็ต.pdf",
    "cleanTitle": "เครือข่ายอินเทอร์เน็ต",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1YOGkaZT3-C6eRZ1z1VEnmsUsGFnRxbWJ/view?usp=drivesdk"
  },
  {
    "id": "krucom-361",
    "folder": "047 หน่วยของข้อมูล",
    "title": "หน่วยของข้อมูล.pdf",
    "cleanTitle": "หน่วยของข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1FnruZfm0bhP1wO2Poat1qeRSsz8O6dqE/view?usp=drivesdk"
  },
  {
    "id": "krucom-362",
    "folder": "046 ลักษณะของข้อมูลที่ดี",
    "title": "sever.pdf",
    "cleanTitle": "ลักษณะของข้อมูลที่ดี",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/10Haofhv4LuG9Vb91jN2gOPQdXsVknh1D/view?usp=drivesdk"
  },
  {
    "id": "krucom-363",
    "folder": "045 สัญญาอนุญาตครีเอทีฟคอมมอนส์",
    "title": "สัญญาอนุญาตครีเอทีฟคอมมอนส์ .pdf",
    "cleanTitle": "สัญญาอนุญาตครีเอทีฟคอมมอนส์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1k6VbLYa2yvVlXMgwrMwFBsdJnNNCfN6a/view?usp=drivesdk"
  },
  {
    "id": "krucom-364",
    "folder": "044 ข้อมูล",
    "title": "ข้อมูล.pdf",
    "cleanTitle": "ข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1wK8RVJKw-6JehOsN2lMty833l4M3xkPm/view?usp=drivesdk"
  },
  {
    "id": "krucom-365",
    "folder": "043 ประเภทของซอฟต์แวร์",
    "title": "ประเภทของซอฟต์แวร์.pdf",
    "cleanTitle": "ประเภทของซอฟต์แวร์",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1kWqBGWjRskzvLmOGNFHSWtkaEeIAB3wK/view?usp=drivesdk"
  },
  {
    "id": "krucom-366",
    "folder": "042 สื่อแขวนประเภทของไฟล์",
    "title": "สื่อแขวนประเภทของไฟล์.pdf",
    "cleanTitle": "สื่อแขวนประเภทของไฟล์",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1VSfAWCZWEOTGkB8PEV_Rp1C-Hq8GMNEJ/view?usp=drivesdk"
  },
  {
    "id": "krucom-367",
    "folder": "041 ระบบทางเทคโนโลยี",
    "title": "ระบบเทคโนโลยี2.pdf",
    "cleanTitle": "ระบบทางเทคโนโลยี",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ns6ItorKEbrvg7F-QMycFM53xON6m2te/view?usp=drivesdk"
  },
  {
    "id": "krucom-368",
    "folder": "041 ระบบทางเทคโนโลยี",
    "title": "ระบบเทคโนโลยี.pdf",
    "cleanTitle": "ระบบทางเทคโนโลยี",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1JqdCzyjZdLCblb3onKTHjEGreFQNcy6z/view?usp=drivesdk"
  },
  {
    "id": "krucom-369",
    "folder": "040 ลักษณะของเทคโนโลยี",
    "title": "ลักษณะของเทคโนโลยี.pdf",
    "cleanTitle": "ลักษณะของเทคโนโลยี",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ctWbZQ4bDIE_YGF0O4Bmuv_ZrR9n6TaN/view?usp=drivesdk"
  },
  {
    "id": "krucom-370",
    "folder": "039 ประโยชน์เทคโนโลยี",
    "title": "ประโยชน์เทคโนโลยี.pdf",
    "cleanTitle": "ประโยชน์เทคโนโลยี",
    "category": "ai-tech",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1--F7lKf_MfS3IhxKrOhNmZHAsJC0pqsS/view?usp=drivesdk"
  },
  {
    "id": "krucom-371",
    "folder": "038 ส่วนประกอบของอุปกรณ์คอมพิวเตอร์ in-out",
    "title": "ส่วนประกอบของอุปกรณ์คอมพิวเตอร์ in-out.pdf",
    "cleanTitle": "ส่วนประกอบของอุปกรณ์คอมพิวเตอร์ in-out",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1xTrDcThMPEa5awIDtI1ugX765DwRQcUN/view?usp=drivesdk"
  },
  {
    "id": "krucom-372",
    "folder": "038 ศัพท์คอมพิวเตอร์",
    "title": "ศัพท์คอมพิวเตอร์.pdf",
    "cleanTitle": "ศัพท์คอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1BlGsphU-M4dOG3CMEme9Szywoejm_qrT/view?usp=drivesdk"
  },
  {
    "id": "krucom-373",
    "folder": "022 ข้อสอบวิทยาการคำนวณ ป.1-6",
    "title": "แบบทดสอบ รายวิชาวิทยาการคำนวณ ป.3.pdf",
    "cleanTitle": "ข้อสอบวิทยาการคำนวณ ป.1-6",
    "category": "general",
    "targetLevel": "ป.1-3",
    "url": "https://drive.google.com/file/d/10MACg-o8nghq6GR8D7IqxiGwMKw2MwBT/view?usp=drivesdk"
  },
  {
    "id": "krucom-374",
    "folder": "022 ข้อสอบวิทยาการคำนวณ ป.1-6",
    "title": "แบบทดสอบ รายวิชาวิทยาการคำนวณ ป.1.pdf",
    "cleanTitle": "ข้อสอบวิทยาการคำนวณ ป.1-6",
    "category": "general",
    "targetLevel": "ป.1-3",
    "url": "https://drive.google.com/file/d/1TcnlxSnSOQJwQi_PqbaYwxhuhWpKPy1m/view?usp=drivesdk"
  },
  {
    "id": "krucom-375",
    "folder": "022 ข้อสอบวิทยาการคำนวณ ป.1-6",
    "title": "แบบทดสอบ รายวิชาวิทยาการคำนวณ ป.2",
    "cleanTitle": "ข้อสอบวิทยาการคำนวณ ป.1-6",
    "category": "general",
    "targetLevel": "ป.1-3",
    "url": "https://drive.google.com/file/d/1mHsS-L2yIEdIY5qIT2dkT9mqYT7r_P6q/view?usp=drivesdk"
  },
  {
    "id": "krucom-376",
    "folder": "022 ข้อสอบวิทยาการคำนวณ ป.1-6",
    "title": "แบบทดสอบ รายวิชาวิทยการคำนวณ ป.6.pdf",
    "cleanTitle": "ข้อสอบวิทยาการคำนวณ ป.1-6",
    "category": "general",
    "targetLevel": "ป.1-3",
    "url": "https://drive.google.com/file/d/1y_vMxQsIBjmOWuqifdGigcjvxKWiWzLh/view?usp=drivesdk"
  },
  {
    "id": "krucom-377",
    "folder": "022 ข้อสอบวิทยาการคำนวณ ป.1-6",
    "title": "แบบทดสอบ รายวิชาวิทยการคำนวณ ป.5.pdf",
    "cleanTitle": "ข้อสอบวิทยาการคำนวณ ป.1-6",
    "category": "general",
    "targetLevel": "ป.1-3",
    "url": "https://drive.google.com/file/d/1MpsG6iq43ub7gBnpvuHlPYwUIAZpLYfQ/view?usp=drivesdk"
  },
  {
    "id": "krucom-378",
    "folder": "022 ข้อสอบวิทยาการคำนวณ ป.1-6",
    "title": "แบบทดสอบ รายวิชาวิทยการคำนวณ ป.4.pdf",
    "cleanTitle": "ข้อสอบวิทยาการคำนวณ ป.1-6",
    "category": "general",
    "targetLevel": "ป.1-3",
    "url": "https://drive.google.com/file/d/1d_kk0EKHUZSFbKpMX66JIiEnrAeHR0v0/view?usp=drivesdk"
  },
  {
    "id": "krucom-379",
    "folder": "037 การแก้ไขระบบที่ติดไวรัสคอมพิวเตอร์",
    "title": "ป้องกันไวรัส (1).pdf",
    "cleanTitle": "การแก้ไขระบบที่ติดไวรัสคอมพิวเตอร์",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1UMsspoF5SM6EgFe3VE6nE0E8lRa6e75E/view?usp=drivesdk"
  },
  {
    "id": "krucom-380",
    "folder": "035 ไวรัสคอมพิวเตอร์",
    "title": "ไวรัสคอมพิวเตอร์ (computer virus) .pdf",
    "cleanTitle": "ไวรัสคอมพิวเตอร์",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/16S6wtL60UZ_eATQGJqpGZb7yS7owVUBb/view?usp=drivesdk"
  },
  {
    "id": "krucom-381",
    "folder": "034 ตั้งรหัสผ่านอย่างไรให้ปลอดภัย",
    "title": "รหัสผ่าน.pdf",
    "cleanTitle": "ตั้งรหัสผ่านอย่างไรให้ปลอดภัย",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1UjjPhnxLFMZSCcf9FLo-9Ks2BhfXwmc5/view?usp=drivesdk"
  },
  {
    "id": "krucom-382",
    "folder": "033 ร่องรอยดิจิทัล",
    "title": "ร่องรอยดิจิทัล.pdf",
    "cleanTitle": "ร่องรอยดิจิทัล",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1fTZ0pn22tAC8VlzmLKwcE2kHVm3O1d_g/view?usp=drivesdk"
  },
  {
    "id": "krucom-383",
    "folder": "032 ใบงานโปรแกรมแยกขยะ",
    "title": "Freeโปรแกรมแยกขยะ.pdf",
    "cleanTitle": "ใบงานโปรแกรมแยกขยะ",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1l-hP9YG5kUoKnutBS0Ys1z2afnvjJk-d/view?usp=drivesdk"
  },
  {
    "id": "krucom-384",
    "folder": "031 มารยาทในการใช้อินเทอร์เน็ต",
    "title": "มารยาทในการ.pdf",
    "cleanTitle": "มารยาทในการใช้อินเทอร์เน็ต",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1UdSFLFhrwvPfhf5uvZwFOhfHd1RXpFzY/view?usp=drivesdk"
  },
  {
    "id": "krucom-385",
    "folder": "030 พรบ.คอมพิวเตอร์",
    "title": "พรบ.คอมพิวเตอร์.pdf",
    "cleanTitle": "พรบ.คอมพิวเตอร์",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1nKPh9_M8h64DSqFGYMBsWzK77qRa3aIY/view?usp=drivesdk"
  },
  {
    "id": "krucom-386",
    "folder": "029 อัลกอริทึมลำดับการทำงาน",
    "title": "อัลกอริทึมลำดับการทำงาน.pdf",
    "cleanTitle": "อัลกอริทึมลำดับการทำงาน",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1sdkxi65dKHHZxsyAk5i9Kmikof0nBlmu/view?usp=drivesdk"
  },
  {
    "id": "krucom-387",
    "folder": "028 ประเภทของคอมพิวเตอร์",
    "title": "ประเภทของคอมพิวเตอร์.pdf",
    "cleanTitle": "ประเภทของคอมพิวเตอร์",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1BPKYl5xOfEBLoEknH18RSe5wa7zKh7sz/view?usp=drivesdk"
  },
  {
    "id": "krucom-388",
    "folder": "027 การใช้อินเทอร์เน็ตค้นหาข้อมูล",
    "title": "การใช้อินเทอร์เน็ตค้นหาข้อมูล.pdf",
    "cleanTitle": "การใช้อินเทอร์เน็ตค้นหาข้อมูล",
    "category": "data-detective",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1wFxvQQmpN6niS3rARjA7760bY0DC0luj/view?usp=drivesdk"
  },
  {
    "id": "krucom-389",
    "folder": "026 การใช้เทคโนโลยีอย่างปลอดภัย",
    "title": "026 การใช้เทคโนโลยีอย่างปลอดภัย.pdf",
    "cleanTitle": "การใช้เทคโนโลยีอย่างปลอดภัย",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/16FuLN-7Kq2gEU7mmaC-yU7egFdiY-k-Y/view?usp=drivesdk"
  },
  {
    "id": "krucom-390",
    "folder": "024 โปรแกรมจัดกระเป๋า",
    "title": "โปรแกรมจัดกระเป๋า.pdf",
    "cleanTitle": "โปรแกรมจัดกระเป๋า",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ovoWi4pWO29w93Rqmq644kaY-EsyBy6Y/view?usp=drivesdk"
  },
  {
    "id": "krucom-391",
    "folder": "023 พิกัดและคำสั่งในการเคลื่อนที่",
    "title": "พิกัดและคำสั่งในการเคลื่อนที่.pdf",
    "cleanTitle": "พิกัดและคำสั่งในการเคลื่อนที่",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1V523RvgtP8Ac5xNgw2s6Yy9WwW1xPG8f/view?usp=drivesdk"
  },
  {
    "id": "krucom-392",
    "folder": "020 ใบกิจกรรมโปรแกรมแยกขยะ",
    "title": "ใบงานโปรแกรมแยกขยะ.pdf",
    "cleanTitle": "ใบกิจกรรมโปรแกรมแยกขยะ",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1_dF6888bfz5TWDUIfqy6-XcIyW3akAV3/view?usp=drivesdk"
  },
  {
    "id": "krucom-393",
    "folder": "019 โปรแกรมแยกขยะ",
    "title": "โปรแกรมแยกขยะ.pdf",
    "cleanTitle": "โปรแกรมแยกขยะ",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1ie0UG97Th43BVrkAQzM0dB0COBet8h7o/view?usp=drivesdk"
  },
  {
    "id": "krucom-394",
    "folder": "017 เริ่มต้นใช้งาน Scratch",
    "title": "เริ่มต้นการใช้งาน Scratch.pdf",
    "cleanTitle": "เริ่มต้นใช้งาน Scratch",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1AM3BtM5H4UuvbYD9vc1uf57zwCF_pyXd/view?usp=drivesdk"
  },
  {
    "id": "krucom-395",
    "folder": "016 ชิ้นงานประเภทของไฟล์",
    "title": "ประเภทของไฟล์.pdf",
    "cleanTitle": "ชิ้นงานประเภทของไฟล์",
    "category": "office-tools",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1oLP9ue_DAyxZkBEse1udCR2PaxVFUBxb/view?usp=drivesdk"
  },
  {
    "id": "krucom-396",
    "folder": "015 กล่องนม Scratch",
    "title": "กล่องนม Scratch.pdf",
    "cleanTitle": "กล่องนม Scratch",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1L-Rm6PNFj4LSIhgJcisJ3p33Gn9YWLwG/view?usp=drivesdk"
  },
  {
    "id": "krucom-397",
    "folder": "015 กล่องนม Scratch",
    "title": "สำเนาของ SCRATCHแบบเติม.pdf",
    "cleanTitle": "กล่องนม Scratch",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1Dmj0cviYgHr1-TsqtUZx7jAJ3obcuDKP/view?usp=drivesdk"
  },
  {
    "id": "krucom-398",
    "folder": "012 ชิ้นงานอุปกรณ์เทคโนโลยีเบื้องต้น",
    "title": "ชิ้นงาน อุปกรณ์เทคโนโลยีเบื้องต้น.pdf",
    "cleanTitle": "ชิ้นงานอุปกรณ์เทคโนโลยีเบื้องต้น",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1iR67qsg80Nof0k7LLPzdvKEzwjQIk5Qr/view?usp=drivesdk"
  },
  {
    "id": "krucom-399",
    "folder": "013 กิจกรรมไปให้ถึงเป้าหมาย",
    "title": "ใบงานโค้ดดิ้ง.pdf",
    "cleanTitle": "กิจกรรมไปให้ถึงเป้าหมาย",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/15jxsVPuCT-TcciPk6VLNU2tt-ESwTTnM/view?usp=drivesdk"
  },
  {
    "id": "krucom-400",
    "folder": "011 สไลด์การสอน เรื่อง ผังงาน",
    "title": "การเขียนผังงาน (Flow chart).pdf",
    "cleanTitle": "สไลด์การสอน เรื่อง ผังงาน",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1khWnVetHg7sUJe_b6llsSKIFk0uHWCsI/view?usp=drivesdk"
  },
  {
    "id": "krucom-401",
    "folder": "009 Keyboard typing",
    "title": "2.pdf",
    "cleanTitle": "Keyboard typing",
    "category": "general",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1VUGDNCb4MeeZig435N2RmdGiVhBAHMKD/view?usp=drivesdk"
  },
  {
    "id": "krucom-402",
    "folder": "007 การรักษาข้อมูลส่วนตัว",
    "title": "ใบงานข้อมูลส่วนตัว.pdf",
    "cleanTitle": "การรักษาข้อมูลส่วนตัว",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1_hWhpRcjXYjgnF7l37J08z7n2UZRDYVz/view?usp=drivesdk"
  },
  {
    "id": "krucom-403",
    "folder": "007 การรักษาข้อมูลส่วนตัว",
    "title": "ใบงานข้อมูลส่วนตัว.pdf",
    "cleanTitle": "การรักษาข้อมูลส่วนตัว",
    "category": "cyber-safety",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1UZ_W-gpog_lWhlqliHDmQshlvKaRbHq0/view?usp=drivesdk"
  },
  {
    "id": "krucom-404",
    "folder": "006 การ์ดอุปกรณ์คอมพิวเตอร์ เบื้องต้น",
    "title": "อุปกรณ์คอมพิวเตอร์.pdf",
    "cleanTitle": "การ์ดอุปกรณ์คอมพิวเตอร์ เบื้องต้น",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1vXnAzvITFUQrIk38VdsfqodEujIBS4b0/view?usp=drivesdk"
  },
  {
    "id": "krucom-405",
    "folder": "005 โค้ดดิ้งแยกขยะ",
    "title": "โปรแกรมแยกขยะ.pdf",
    "cleanTitle": "โค้ดดิ้งแยกขยะ",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1_z12Io-9HMHtjLRm8jFih5hk4W_sDGnB/view?usp=drivesdk"
  },
  {
    "id": "krucom-406",
    "folder": "004  เกมส์ WHAT AM I CODING",
    "title": "What I am code (6).pdf",
    "cleanTitle": "เกมส์ WHAT AM I CODING",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/1mJ5_iqVvO39NxL4vo1KU1LHVghqywHQn/view?usp=drivesdk"
  },
  {
    "id": "krucom-407",
    "folder": "003 เกมโค้ดดิ้งตามล่าหาสมบัติแบบอันปลั๊กโค้ดดิ้ง(Unplugged Coding)",
    "title": "ตามล่าหาสมบัติ.pdf",
    "cleanTitle": "เกมโค้ดดิ้งตามล่าหาสมบัติแบบอันปลั๊กโค้ดดิ้ง(Unplugged Coding)",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/14NUa5H6ylQJv_S3kiDpiz8GdQjC31nj-/view?usp=drivesdk"
  },
  {
    "id": "krucom-408",
    "folder": "002 แว่นขยายสัญลักษณ์ผังงาน flowchart",
    "title": "แว่นขายผังงาน.pdf",
    "cleanTitle": "แว่นขยายสัญลักษณ์ผังงาน flowchart",
    "category": "coding",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/12nbsB-Fmjz6R6AS7g8vtWQHiBrGRYKPP/view?usp=drivesdk"
  },
  {
    "id": "krucom-409",
    "folder": "001 จิ๊กซอว์อุปกรณ์คอมพิวเตอร์",
    "title": "จิ๊กซอว์อุปกรณ์คอมพิวเตอร์.pdf",
    "cleanTitle": "จิ๊กซอว์อุปกรณ์คอมพิวเตอร์",
    "category": "hardware",
    "targetLevel": "ทุกระดับชั้น",
    "url": "https://drive.google.com/file/d/14KdeAUi77F_BQDV3uFU8b8d1G05nO399/view?usp=drivesdk"
  }
];
