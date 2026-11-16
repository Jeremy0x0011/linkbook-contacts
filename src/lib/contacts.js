export const METHOD_TYPES = [
  { value: "phone", label: "电话", shortLabel: "电话" },
  { value: "email", label: "邮箱", shortLabel: "邮箱" },
  { value: "social", label: "社交媒体", shortLabel: "社交" },
  { value: "address", label: "地址", shortLabel: "地址" },
  { value: "other", label: "其他", shortLabel: "其他" },
];

const AVATAR_PALETTES = [
  ["#dff6f1", "#17826f"],
  ["#e9e5ff", "#6750c9"],
  ["#ffe9df", "#b85c35"],
  ["#e6efff", "#3b6fc5"],
  ["#fff2cf", "#9a6913"],
  ["#f9e3ec", "#a33b66"],
];

export function createId(prefix = "contact") {
  const randomPart =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${randomPart}`;
}

export function getInitials(name = "") {
  const cleanName = name.trim();
  if (!cleanName) return "?";

  if (/[\u3400-\u9fff]/.test(cleanName)) {
    return cleanName.slice(0, 2);
  }

  return cleanName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function getAvatarPalette(name = "") {
  const hash = Array.from(name).reduce(
    (total, character) => total + character.codePointAt(0),
    0,
  );
  const [background, color] = AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
  return { background, color };
}

export function getMethodLabel(type) {
  return METHOD_TYPES.find((method) => method.value === type)?.label || "其他";
}

export function normalizeMethodType(type) {
  const normalized = String(type || "")
    .trim()
    .toLowerCase();
  const aliases = {
    电话: "phone",
    手机: "phone",
    手机号: "phone",
    手机号码: "phone",
    电话号码: "phone",
    phone: "phone",
    mobile: "phone",
    邮箱: "email",
    电子邮箱: "email",
    email: "email",
    邮件: "email",
    社交媒体: "social",
    微信: "social",
    qq: "social",
    social: "social",
    地址: "address",
    住址: "address",
    address: "address",
    其他: "other",
    other: "other",
  };
  return aliases[normalized] || "other";
}

export function createEmptyMethod() {
  return {
    id: createId("method"),
    type: "phone",
    value: "",
  };
}

export function createContact(overrides = {}) {
  return {
    id: createId(),
    name: "",
    company: "",
    title: "",
    note: "",
    favorite: false,
    methods: [createEmptyMethod()],
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function formatUpdatedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚更新";

  const difference = Date.now() - date.getTime();
  const minutes = Math.floor(difference / 60000);
  const hours = Math.floor(difference / 3600000);
  const days = Math.floor(difference / 86400000);

  if (minutes < 1) return "刚刚更新";
  if (minutes < 60) return `${minutes} 分钟前更新`;
  if (hours < 24) return `${hours} 小时前更新`;
  if (days < 7) return `${days} 天前更新`;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function contactMatchesSearch(contact, query) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return true;

  return [
    contact.name,
    contact.company,
    contact.title,
    contact.note,
    ...contact.methods.map((method) => method.value),
  ]
    .join(" ")
    .toLowerCase()
    .includes(keyword);
}

export function getContactKey(contact) {
  return [
    contact.name.trim().toLowerCase(),
    ...contact.methods
      .map((method) => `${method.type}:${method.value.trim().toLowerCase()}`)
      .sort(),
  ].join("|");
}

export const SAMPLE_CONTACTS = [
  {
    id: "sample-lin",
    name: "林知夏",
    company: "星野设计",
    title: "产品设计负责人",
    note: "负责新版品牌视觉与产品体验，项目沟通优先使用微信。",
    favorite: true,
    methods: [
      { id: "sample-lin-1", type: "phone", value: "138 0000 8821" },
      { id: "sample-lin-2", type: "email", value: "zhixia@xingye.design" },
      { id: "sample-lin-3", type: "social", value: "lin_zhixia" },
    ],
    updatedAt: new Date(Date.now() - 18 * 60000).toISOString(),
  },
  {
    id: "sample-zhou",
    name: "周屿",
    company: "远川科技",
    title: "前端工程师",
    note: "技术合作联系人，常驻杭州。",
    favorite: true,
    methods: [
      { id: "sample-zhou-1", type: "phone", value: "186 0000 3507" },
      { id: "sample-zhou-2", type: "email", value: "yu.zhou@yuanchuan.cn" },
    ],
    updatedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: "sample-chen",
    name: "陈默",
    company: "青禾咨询",
    title: "项目经理",
    note: "每周三下午同步项目进度。",
    favorite: false,
    methods: [
      { id: "sample-chen-1", type: "phone", value: "135 0000 6192" },
      { id: "sample-chen-2", type: "email", value: "chenmo@qinghe.com" },
      {
        id: "sample-chen-3",
        type: "address",
        value: "上海市徐汇区漕溪北路 88 号",
      },
    ],
    updatedAt: new Date(Date.now() - 26 * 3600000).toISOString(),
  },
  {
    id: "sample-xu",
    name: "许一诺",
    company: "南风资本",
    title: "投资经理",
    note: "初次见面于数字经济交流会。",
    favorite: false,
    methods: [
      { id: "sample-xu-1", type: "phone", value: "139 0000 2046" },
      { id: "sample-xu-2", type: "social", value: "yinuo_xu" },
    ],
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "sample-wang",
    name: "王若川",
    company: "自在工作室",
    title: "自由摄影师",
    note: "擅长纪实摄影，可承接品牌活动拍摄。",
    favorite: true,
    methods: [
      { id: "sample-wang-1", type: "phone", value: "137 0000 7734" },
      { id: "sample-wang-2", type: "email", value: "hello@zizai.photo" },
      { id: "sample-wang-3", type: "social", value: "ruochuan_photo" },
      {
        id: "sample-wang-4",
        type: "address",
        value: "厦门市思明区沙坡尾 12 号",
      },
    ],
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "sample-he",
    name: "何然",
    company: "启明教育",
    title: "内容运营",
    note: "负责课程内容与新媒体账号。",
    favorite: false,
    methods: [
      { id: "sample-he-1", type: "email", value: "heran@qiming.edu.cn" },
      { id: "sample-he-2", type: "social", value: "heran_content" },
    ],
    updatedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
];
