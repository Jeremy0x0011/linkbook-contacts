import assert from "node:assert/strict";
import test from "node:test";
import * as XLSX from "xlsx";
import {
  contactMatchesSearch,
  createContact,
  getContactKey,
} from "../src/lib/contacts.js";
import { importContactsFromExcel } from "../src/lib/excel.js";

test("contact search checks profile and every method", () => {
  const contact = createContact({
    name: "测试联系人",
    company: "测试公司",
    methods: [
      { id: "phone", type: "phone", value: "13800000000" },
      { id: "email", type: "email", value: "test@example.com" },
    ],
  });

  assert.equal(contactMatchesSearch(contact, "测试公司"), true);
  assert.equal(contactMatchesSearch(contact, "test@example.com"), true);
  assert.equal(contactMatchesSearch(contact, "不存在"), false);
  assert.equal(getContactKey(contact), getContactKey(contact));
});

test("Excel import reads multiple methods and skips invalid or duplicate rows", async () => {
  const worksheet = XLSX.utils.json_to_sheet([
    {
      姓名: "导入联系人",
      公司: "导入公司",
      职位: "设计师",
      是否收藏: "是",
      备注: "测试备注",
      "联系方式1-类型": "电话",
      "联系方式1-内容": "13900000000",
      "联系方式2-类型": "邮箱",
      "联系方式2-内容": "import@example.com",
    },
    {
      姓名: "导入联系人",
      公司: "导入公司",
      职位: "设计师",
      是否收藏: "是",
      备注: "测试备注",
      "联系方式1-类型": "电话",
      "联系方式1-内容": "13900000000",
      "联系方式2-类型": "邮箱",
      "联系方式2-内容": "import@example.com",
    },
    {
      姓名: "",
      公司: "缺少姓名的行",
    },
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "通讯录");
  const binary = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  const blob = new Blob([binary]);

  const result = await importContactsFromExcel(
    {
      arrayBuffer: () => blob.arrayBuffer(),
    },
    [],
  );

  assert.equal(result.contacts.length, 1);
  assert.equal(result.duplicateRows, 1);
  assert.equal(result.skippedRows, 1);
  assert.equal(result.contacts[0].name, "导入联系人");
  assert.equal(result.contacts[0].favorite, true);
  assert.equal(result.contacts[0].methods.length, 2);
  assert.equal(result.contacts[0].methods[1].type, "email");
});
