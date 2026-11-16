import * as XLSX from "xlsx";
import {
  createContact,
  createId,
  getContactKey,
  normalizeMethodType,
} from "./contacts.js";

const FIXED_HEADERS = ["姓名", "公司", "职位", "是否收藏", "备注"];

function getHeaders(contactCount = 1) {
  const methodCount = Math.max(
    6,
    ...(Array.isArray(contactCount)
      ? contactCount.map((contact) => contact.methods.length)
      : [contactCount]),
  );
  const methodHeaders = Array.from({ length: methodCount }, (_, index) => [
    `联系方式${index + 1}-类型`,
    `联系方式${index + 1}-内容`,
  ]).flat();
  return [...FIXED_HEADERS, ...methodHeaders];
}

function createRows(contacts) {
  const headers = getHeaders(contacts);
  const rows = contacts.map((contact) => {
    const row = {
      姓名: contact.name,
      公司: contact.company,
      职位: contact.title,
      是否收藏: contact.favorite ? "是" : "否",
      备注: contact.note,
    };

    contact.methods.forEach((method, index) => {
      row[`联系方式${index + 1}-类型`] =
        method.type === "phone"
          ? "电话"
          : method.type === "email"
            ? "邮箱"
            : method.type === "social"
              ? "社交媒体"
              : method.type === "address"
                ? "地址"
                : "其他";
      row[`联系方式${index + 1}-内容`] = method.value;
    });

    return row;
  });

  return { headers, rows };
}

function writeWorkbook(contacts, fileName) {
  const { headers, rows } = createRows(contacts);
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
  worksheet["!cols"] = headers.map((header) => ({
    wch: header.startsWith("联系方式") ? 18 : header === "备注" ? 32 : 14,
  }));
  worksheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: Math.max(rows.length, 1), c: headers.length - 1 },
    }),
  };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "通讯录");
  XLSX.writeFile(workbook, fileName);
}

export function exportContactsToExcel(contacts) {
  const date = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll("/", "-");
  writeWorkbook(contacts, `Linkbook通讯录_${date}.xlsx`);
}

export function downloadExcelTemplate() {
  writeWorkbook(
    [
      {
        name: "示例联系人",
        company: "示例公司",
        title: "产品经理",
        favorite: true,
        note: "请删除示例行后填写真实数据",
        methods: [
          { type: "phone", value: "138 0000 0000" },
          { type: "email", value: "name@example.com" },
          { type: "social", value: "wechat_id" },
          { type: "address", value: "填写详细地址" },
        ],
      },
    ],
    "Linkbook导入模板.xlsx",
  );
}

function normalizeHeader(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function findValue(row, aliases) {
  const entries = Object.entries(row);
  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    const match = entries.find(
      ([header]) => normalizeHeader(header) === normalizedAlias,
    );
    if (match) return match[1];
  }
  return "";
}

function extractMethods(row) {
  const methods = [];

  Object.entries(row).forEach(([header, rawValue]) => {
    const normalizedHeader = normalizeHeader(header);
    const dynamicMatch = normalizedHeader.match(
      /^联系方式(\d+)类型$/,
    );
    if (dynamicMatch && rawValue) {
      const index = dynamicMatch[1];
      const content = Object.entries(row).find(
        ([candidate]) =>
          normalizeHeader(candidate) === normalizeHeader(`联系方式${index}-内容`),
      )?.[1];
      if (content) {
        methods.push({
          id: createId("method"),
          type: normalizeMethodType(rawValue),
          value: String(content).trim(),
        });
      }
      return;
    }

    const directTypeAliases = [
      ["电话", "phone"],
      ["手机", "phone"],
      ["手机号码", "phone"],
      ["邮箱", "email"],
      ["电子邮箱", "email"],
      ["社交媒体", "social"],
      ["微信", "social"],
      ["地址", "address"],
      ["其他联系方式", "other"],
    ];
    const directMatch = directTypeAliases.find(
      ([alias]) => normalizeHeader(alias) === normalizedHeader,
    );
    if (directMatch && rawValue) {
      methods.push({
        id: createId("method"),
        type: directMatch[1],
        value: String(rawValue).trim(),
      });
    }
  });

  const seen = new Set();
  return methods.filter((method) => {
    const key = `${method.type}:${method.value}`;
    if (!method.value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseFavorite(value) {
  return ["是", "true", "yes", "1", "收藏"].includes(
    String(value || "")
      .trim()
      .toLowerCase(),
  );
}

export async function importContactsFromExcel(file, existingContacts) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) {
    throw new Error("Excel 文件中没有可读取的工作表。");
  }

  const rows = XLSX.utils.sheet_to_json(firstSheet, {
    defval: "",
    raw: false,
  });
  if (!rows.length) {
    throw new Error("Excel 文件为空，或第一行不是表头。");
  }

  const existingKeys = new Set(existingContacts.map(getContactKey));
  const imported = [];
  let skippedRows = 0;
  let duplicateRows = 0;

  rows.forEach((row) => {
    const name = String(findValue(row, ["姓名", "name", "联系人姓名"])).trim();
    if (!name) {
      skippedRows += 1;
      return;
    }

    const contact = createContact({
      name,
      company: String(
        findValue(row, ["公司", "company", "单位", "组织"]),
      ).trim(),
      title: String(findValue(row, ["职位", "title", "role"])).trim(),
      favorite: parseFavorite(
        findValue(row, ["是否收藏", "收藏", "favorite"]),
      ),
      note: String(findValue(row, ["备注", "note", "notes"])).trim(),
      methods: extractMethods(row),
    });

    if (!contact.methods.length) {
      contact.methods = [
        {
          id: createId("method"),
          type: "other",
          value: "暂未填写联系方式",
        },
      ];
    }

    const key = getContactKey(contact);
    if (existingKeys.has(key)) {
      duplicateRows += 1;
      return;
    }

    imported.push(contact);
    existingKeys.add(key);
  });

  return {
    contacts: imported,
    skippedRows,
    duplicateRows,
  };
}
