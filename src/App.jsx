import {
  ArrowUpRight,
  AtSign,
  BookUser,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Copy,
  Database,
  Download,
  Edit3,
  FileDown,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  METHOD_TYPES,
  SAMPLE_CONTACTS,
  contactMatchesSearch,
  createContact,
  createEmptyMethod,
  createId,
  formatUpdatedAt,
  getAvatarPalette,
  getInitials,
  getMethodLabel,
} from "./lib/contacts";
import {
  downloadExcelTemplate,
  exportContactsToExcel,
  importContactsFromExcel,
} from "./lib/excel";

const STORAGE_KEY = "linkbook.contacts.v1";

const METHOD_ICONS = {
  phone: Phone,
  email: Mail,
  social: AtSign,
  address: MapPin,
  other: MessageCircle,
};

function loadContacts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return SAMPLE_CONTACTS;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : SAMPLE_CONTACTS;
  } catch {
    return SAMPLE_CONTACTS;
  }
}

function Avatar({ name, size = "medium", className = "" }) {
  const palette = getAvatarPalette(name);
  return (
    <span
      className={`avatar avatar--${size} ${className}`}
      style={{
        "--avatar-bg": palette.background,
        "--avatar-color": palette.color,
      }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}

function EmptyState({ searching, onAdd }) {
  return (
    <div className="empty-state">
      <span className="empty-state__art">
        {searching ? <Search size={28} /> : <BookUser size={30} />}
      </span>
      <h3>{searching ? "没有找到匹配的联系人" : "这里还没有联系人"}</h3>
      <p>
        {searching
          ? "试试姓名、公司或任意联系方式关键词。"
          : "创建第一条联系人，把重要的人和联系方式集中管理。"}
      </p>
      {!searching && (
        <button className="button button--primary" onClick={onAdd}>
          <Plus size={17} />
          新建联系人
        </button>
      )}
    </div>
  );
}

function MethodIcon({ type, size = 18 }) {
  const Icon = METHOD_ICONS[type] || MessageCircle;
  return <Icon size={size} />;
}

function Sidebar({
  contacts,
  view,
  setView,
  onAdd,
  open,
  onClose,
}) {
  const favorites = contacts.filter((contact) => contact.favorite).length;
  const companyCounts = contacts.reduce((counts, contact) => {
    const company = contact.company.trim();
    if (company) counts.set(company, (counts.get(company) || 0) + 1);
    return counts;
  }, new Map());
  const companies = [...companyCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const selectView = (nextView) => {
    setView(nextView);
    onClose();
  };

  return (
    <>
      <div
        className={`sidebar-scrim ${open ? "is-visible" : ""}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="brand">
          <span className="brand__mark">
            <BookUser size={22} strokeWidth={2.2} />
          </span>
          <span>
            <strong>Linkbook</strong>
            <small>你的智能通讯录</small>
          </span>
          <button
            className="icon-button sidebar__close"
            aria-label="关闭菜单"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <button className="button button--primary sidebar__add" onClick={onAdd}>
          <Plus size={18} />
          新建联系人
        </button>

        <nav className="nav-section" aria-label="通讯录视图">
          <p className="nav-section__label">通讯录</p>
          <button
            className={`nav-item ${view === "all" ? "is-active" : ""}`}
            onClick={() => selectView("all")}
          >
            <Users size={18} />
            <span>全部联系人</span>
            <b>{contacts.length}</b>
          </button>
          <button
            className={`nav-item ${view === "favorites" ? "is-active" : ""}`}
            onClick={() => selectView("favorites")}
          >
            <Star size={18} />
            <span>我的收藏</span>
            <b>{favorites}</b>
          </button>
        </nav>

        {companies.length > 0 && (
          <nav className="nav-section nav-section--groups" aria-label="公司分组">
            <p className="nav-section__label">公司分组</p>
            {companies.map(([company, count]) => (
              <button
                key={company}
                className={`nav-item nav-item--group ${
                  view === `company:${company}` ? "is-active" : ""
                }`}
                onClick={() => selectView(`company:${company}`)}
                title={company}
              >
                <span className="company-dot">
                  {company.slice(0, 1).toUpperCase()}
                </span>
                <span>{company}</span>
                <b>{count}</b>
              </button>
            ))}
          </nav>
        )}

        <div className="sidebar__tip">
          <span className="sidebar__tip-icon">
            <Sparkles size={17} />
          </span>
          <div>
            <strong>数据已自动保存</strong>
            <p>可随时导出 Excel 进行备份或迁移。</p>
          </div>
        </div>

        <div className="sidebar__profile">
          <span className="profile-avatar">林</span>
          <span>
            <strong>林同学</strong>
            <small>本地通讯录</small>
          </span>
          <ChevronRight size={17} />
        </div>
      </aside>
    </>
  );
}

function ContactCard({ contact, selected, onSelect, onToggleFavorite }) {
  return (
    <article
      className={`contact-card ${selected ? "is-selected" : ""}`}
      onClick={() => onSelect(contact.id)}
      tabIndex={0}
      role="button"
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(contact.id);
        }
      }}
      aria-label={`查看联系人 ${contact.name}`}
    >
      <div className="contact-card__top">
        <Avatar name={contact.name} size="large" />
        <button
          className={`favorite-button ${contact.favorite ? "is-active" : ""}`}
          aria-label={contact.favorite ? "取消收藏" : "收藏联系人"}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(contact.id);
          }}
        >
          <Star size={18} fill={contact.favorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="contact-card__identity">
        <h3>{contact.name}</h3>
        <p>
          {contact.title || "联系人"}
          {contact.company ? ` · ${contact.company}` : ""}
        </p>
      </div>

      <div className="contact-card__methods">
        {contact.methods.slice(0, 3).map((method) => (
          <span key={method.id} className="method-chip" title={method.value}>
            <MethodIcon type={method.type} size={13} />
            <span>{method.value}</span>
          </span>
        ))}
        {contact.methods.length > 3 && (
          <span className="method-chip method-chip--more">
            +{contact.methods.length - 3}
          </span>
        )}
      </div>

      <div className="contact-card__footer">
        <span>
          <Clock3 size={13} />
          {formatUpdatedAt(contact.updatedAt)}
        </span>
        <span className="card-arrow">
          <ArrowUpRight size={16} />
        </span>
      </div>
    </article>
  );
}

function DetailPanel({ contact, onClose, onEdit, onDelete, onToggleFavorite, onCopy }) {
  if (!contact) {
    return (
      <aside className="detail-panel detail-panel--empty">
        <span className="detail-panel__empty-icon">
          <CircleUserRound size={30} />
        </span>
        <h3>联系人详情</h3>
        <p>从左侧选择一位联系人，查看完整信息和多种联系方式。</p>
      </aside>
    );
  }

  return (
    <aside className="detail-panel">
      <div className="detail-panel__actions">
        <button
          className={`favorite-button ${contact.favorite ? "is-active" : ""}`}
          aria-label={contact.favorite ? "取消收藏" : "收藏联系人"}
          onClick={() => onToggleFavorite(contact.id)}
        >
          <Star size={19} fill={contact.favorite ? "currentColor" : "none"} />
        </button>
        <button className="icon-button" onClick={() => onEdit(contact)}>
          <Edit3 size={18} />
          <span className="sr-only">编辑联系人</span>
        </button>
        <button
          className="icon-button icon-button--danger"
          onClick={() => onDelete(contact)}
        >
          <Trash2 size={18} />
          <span className="sr-only">删除联系人</span>
        </button>
        <button
          className="icon-button detail-panel__close"
          onClick={onClose}
          aria-label="关闭详情"
        >
          <X size={19} />
        </button>
      </div>

      <div className="profile-hero">
        <Avatar name={contact.name} size="xl" />
        <h2>{contact.name}</h2>
        <p>{contact.title || "联系人"}</p>
        {contact.company && (
          <span className="company-badge">
            <Building2 size={14} />
            {contact.company}
          </span>
        )}
      </div>

      <section className="detail-section">
        <div className="detail-section__title">
          <h3>联系方式</h3>
          <span>{contact.methods.length} 项</span>
        </div>
        <div className="method-list">
          {contact.methods.map((method) => {
            const isPhone = method.type === "phone";
            const isEmail = method.type === "email";
            const href = isPhone
              ? `tel:${method.value.replace(/[^\d+]/g, "")}`
              : isEmail
                ? `mailto:${method.value}`
                : undefined;

            return (
              <div className="method-row" key={method.id}>
                <span className={`method-row__icon method-row__icon--${method.type}`}>
                  <MethodIcon type={method.type} />
                </span>
                <span className="method-row__body">
                  <small>{getMethodLabel(method.type)}</small>
                  {href ? (
                    <a href={href}>{method.value}</a>
                  ) : (
                    <strong>{method.value}</strong>
                  )}
                </span>
                <button
                  className="icon-button method-row__copy"
                  aria-label={`复制${getMethodLabel(method.type)}`}
                  onClick={() => onCopy(method.value)}
                >
                  <Copy size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="detail-section">
        <div className="detail-section__title">
          <h3>备注</h3>
        </div>
        <div className={`contact-note ${contact.note ? "" : "is-empty"}`}>
          {contact.note || "还没有添加备注。"}
        </div>
      </section>

      <section className="detail-section detail-section--meta">
        <div>
          <span>
            <Clock3 size={14} />
            最近更新
          </span>
          <strong>{formatUpdatedAt(contact.updatedAt)}</strong>
        </div>
        <div>
          <span>
            <Star size={14} />
            收藏状态
          </span>
          <strong>{contact.favorite ? "已加入收藏" : "未收藏"}</strong>
        </div>
      </section>

      <button className="button button--secondary detail-edit" onClick={() => onEdit(contact)}>
        <Edit3 size={16} />
        编辑联系人信息
      </button>
    </aside>
  );
}

function ContactEditor({ initialContact, onCancel, onSave }) {
  const [form, setForm] = useState(() => ({
    ...initialContact,
    methods: initialContact.methods.map((method) => ({ ...method })),
  }));
  const [error, setError] = useState("");
  const nameInputRef = useRef(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateMethod = (id, field, value) => {
    setForm((current) => ({
      ...current,
      methods: current.methods.map((method) =>
        method.id === id ? { ...method, [field]: value } : method,
      ),
    }));
  };

  const removeMethod = (id) => {
    setForm((current) => ({
      ...current,
      methods:
        current.methods.length === 1
          ? current.methods
          : current.methods.filter((method) => method.id !== id),
    }));
  };

  const addMethod = () => {
    setForm((current) => ({
      ...current,
      methods: [
        ...current.methods,
        {
          ...createEmptyMethod(),
          type: "social",
        },
      ],
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("请填写联系人姓名。");
      nameInputRef.current?.focus();
      return;
    }

    const methods = form.methods
      .map((method) => ({ ...method, value: method.value.trim() }))
      .filter((method) => method.value);
    if (!methods.length) {
      setError("请至少填写一项联系方式。");
      return;
    }

    onSave({
      ...form,
      name: form.name.trim(),
      company: form.company.trim(),
      title: form.title.trim(),
      note: form.note.trim(),
      methods,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <div
        className="editor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              {initialContact.name ? "编辑资料" : "新联系人"}
            </span>
            <h2 id="editor-title">
              {initialContact.name ? "更新联系人" : "添加到通讯录"}
            </h2>
          </div>
          <button className="icon-button" onClick={onCancel} aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="editor-preview">
            <Avatar name={form.name || "新"} size="large" />
            <div>
              <strong>{form.name || "联系人姓名"}</strong>
              <p>
                {[form.title, form.company].filter(Boolean).join(" · ") ||
                  "填写基本资料，建立完整联系人卡片"}
              </p>
            </div>
            <label className="favorite-toggle">
              <input
                type="checkbox"
                name="favorite"
                checked={form.favorite}
                onChange={(event) =>
                  updateField("favorite", event.target.checked)
                }
              />
              <span>
                <Star size={16} fill={form.favorite ? "currentColor" : "none"} />
                收藏
              </span>
            </label>
          </div>

          <div className="form-section">
            <h3>基本资料</h3>
            <div className="form-grid">
              <label className="field">
                <span>姓名 *</span>
                <input
                  ref={nameInputRef}
                  name="name"
                  value={form.name}
                  onChange={(event) => {
                    updateField("name", event.target.value);
                    setError("");
                  }}
                  placeholder="例如：林知夏"
                  maxLength={40}
                />
              </label>
              <label className="field">
                <span>公司 / 组织</span>
                <div className="input-with-icon">
                  <Building2 size={16} />
                  <input
                    name="company"
                    value={form.company}
                    onChange={(event) =>
                      updateField("company", event.target.value)
                    }
                    placeholder="所在公司"
                    maxLength={60}
                  />
                </div>
              </label>
              <label className="field field--full">
                <span>职位</span>
                <div className="input-with-icon">
                  <BriefcaseBusiness size={16} />
                  <input
                    name="title"
                    value={form.title}
                    onChange={(event) =>
                      updateField("title", event.target.value)
                    }
                    placeholder="例如：产品经理"
                    maxLength={60}
                  />
                </div>
              </label>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section__heading">
              <div>
                <h3>联系方式</h3>
                <p>同一联系人可保存电话、邮箱、社交媒体和地址。</p>
              </div>
              <button
                className="button button--text"
                type="button"
                onClick={addMethod}
              >
                <Plus size={16} />
                添加一项
              </button>
            </div>

            <div className="method-editor-list">
              {form.methods.map((method, index) => (
                <div className="method-editor-row" key={method.id}>
                  <span className="method-editor-row__index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <select
                    name="methodType"
                    aria-label={`联系方式 ${index + 1} 类型`}
                    value={method.type}
                    onChange={(event) =>
                      updateMethod(method.id, "type", event.target.value)
                    }
                  >
                    {METHOD_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <input
                    name="methodValue"
                    aria-label={`联系方式 ${index + 1} 内容`}
                    value={method.value}
                    onChange={(event) =>
                      updateMethod(method.id, "value", event.target.value)
                    }
                    placeholder={
                      method.type === "phone"
                        ? "输入电话号码"
                        : method.type === "email"
                          ? "name@example.com"
                          : method.type === "social"
                            ? "账号或用户名"
                            : method.type === "address"
                              ? "输入详细地址"
                              : "输入联系方式"
                    }
                    maxLength={120}
                  />
                  <button
                    type="button"
                    className="icon-button method-editor-row__remove"
                    onClick={() => removeMethod(method.id)}
                    disabled={form.methods.length === 1}
                    aria-label="删除此联系方式"
                  >
                    <X size={17} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-section">
            <label className="field field--full">
              <span>备注</span>
              <textarea
                name="note"
                value={form.note}
                onChange={(event) => updateField("note", event.target.value)}
                placeholder="记录沟通偏好、合作事项或其他补充信息..."
                rows={3}
                maxLength={300}
              />
              <small className="field__counter">{form.note.length}/300</small>
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-footer">
            <button
              className="button button--ghost"
              type="button"
              onClick={onCancel}
            >
              取消
            </button>
            <button className="button button--primary" type="submit">
              <Check size={17} />
              {initialContact.name ? "保存修改" : "创建联系人"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteDialog({ contact, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="confirm-dialog__icon">
          <Trash2 size={23} />
        </span>
        <h2 id="delete-title">删除“{contact.name}”？</h2>
        <p>联系人信息和全部联系方式将从当前通讯录中移除，此操作无法撤销。</p>
        <div className="confirm-dialog__actions">
          <button className="button button--ghost" onClick={onCancel}>
            取消
          </button>
          <button className="button button--danger" onClick={onConfirm}>
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message }) {
  return (
    <div className={`toast ${message ? "is-visible" : ""}`} role="status">
      <span>
        <Check size={15} />
      </span>
      {message}
    </div>
  );
}

export default function App() {
  const [contacts, setContacts] = useState(loadContacts);
  const [view, setView] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(() =>
    window.matchMedia("(min-width: 1081px)").matches
      ? SAMPLE_CONTACTS[0].id
      : null,
  );
  const [editorContact, setEditorContact] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === "Escape") {
        setEditorContact(null);
        setDeleteTarget(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filteredContacts = useMemo(() => {
    return contacts
      .filter((contact) => {
        if (view === "favorites" && !contact.favorite) return false;
        if (
          view.startsWith("company:") &&
          contact.company !== view.slice("company:".length)
        ) {
          return false;
        }
        return contactMatchesSearch(contact, searchQuery);
      })
      .sort((a, b) => {
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
  }, [contacts, searchQuery, view]);

  const selectedContact =
    contacts.find((contact) => contact.id === selectedId) || null;
  const favoriteCount = contacts.filter((contact) => contact.favorite).length;
  const methodCount = contacts.reduce(
    (total, contact) => total + contact.methods.length,
    0,
  );
  const companyCount = new Set(
    contacts.map((contact) => contact.company).filter(Boolean),
  ).size;

  const viewTitle =
    view === "favorites"
      ? "我的收藏"
      : view.startsWith("company:")
        ? view.slice("company:".length)
        : "全部联系人";

  const notify = (message) => setToast(message);

  const openNewContact = () => {
    setSidebarOpen(false);
    setEditorContact(createContact());
  };

  const saveContact = (contact) => {
    const exists = contacts.some((item) => item.id === contact.id);
    setContacts((current) =>
      exists
        ? current.map((item) => (item.id === contact.id ? contact : item))
        : [contact, ...current],
    );
    setSelectedId(contact.id);
    setEditorContact(null);
    notify(exists ? "联系人资料已更新" : "联系人已添加");
  };

  const toggleFavorite = (id) => {
    setContacts((current) =>
      current.map((contact) =>
        contact.id === id
          ? {
              ...contact,
              favorite: !contact.favorite,
              updatedAt: new Date().toISOString(),
            }
          : contact,
      ),
    );
    const currentFavorite = contacts.find((contact) => contact.id === id)?.favorite;
    notify(currentFavorite ? "已取消收藏" : "已加入收藏");
  };

  const deleteContact = () => {
    if (!deleteTarget) return;
    setContacts((current) =>
      current.filter((contact) => contact.id !== deleteTarget.id),
    );
    if (selectedId === deleteTarget.id) setSelectedId(null);
    setDeleteTarget(null);
    notify("联系人已删除");
  };

  const copyValue = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      notify("已复制到剪贴板");
    } catch {
      const helper = document.createElement("textarea");
      helper.value = value;
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
      notify("已复制到剪贴板");
    }
  };

  const handleExport = () => {
    if (!contacts.length) {
      notify("通讯录为空，暂无内容可导出");
      return;
    }
    exportContactsToExcel(contacts);
    notify(`已导出 ${contacts.length} 位联系人`);
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImporting(true);
    try {
      const result = await importContactsFromExcel(file, contacts);
      if (result.contacts.length) {
        setContacts((current) => [...result.contacts, ...current]);
        setSelectedId(result.contacts[0].id);
        setView("all");
        setSearchQuery("");
      }

      const skipped = result.skippedRows + result.duplicateRows;
      notify(
        `成功导入 ${result.contacts.length} 位联系人${
          skipped ? `，跳过 ${skipped} 行` : ""
        }`,
      );
    } catch (error) {
      notify(error.message || "导入失败，请检查 Excel 格式");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        contacts={contacts}
        view={view}
        setView={setView}
        onAdd={openNewContact}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="打开菜单"
          >
            <Menu size={21} />
          </button>

          <div className="search-box">
            <Search size={18} />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索姓名、公司或联系方式"
              aria-label="搜索联系人"
            />
            {searchQuery ? (
              <button
                className="search-box__clear"
                onClick={() => setSearchQuery("")}
                aria-label="清除搜索"
              >
                <X size={15} />
              </button>
            ) : (
              <kbd>Ctrl K</kbd>
            )}
          </div>

          <div className="topbar__actions">
            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
            />
            <button
              className="button button--soft topbar-action topbar-action--template"
              onClick={downloadExcelTemplate}
              title="下载标准导入模板"
            >
              <FileDown size={17} />
              <span>下载模板</span>
            </button>
            <button
              className="button button--soft topbar-action topbar-action--import"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              <Upload size={17} />
              <span>{importing ? "导入中..." : "导入 Excel"}</span>
            </button>
            <button
              className="button button--soft topbar-action topbar-action--export"
              onClick={handleExport}
            >
              <Download size={17} />
              <span>导出 Excel</span>
            </button>
            <button className="button button--primary topbar-add" onClick={openNewContact}>
              <Plus size={18} />
              <span>新建联系人</span>
            </button>
          </div>
        </header>

        <div className="content-scroll">
          <section className="page-heading">
            <div>
              <span className="eyebrow">
                <Database size={13} />
                个人通讯录
              </span>
              <h1>{viewTitle}</h1>
              <p>
                {searchQuery
                  ? `正在搜索“${searchQuery}”`
                  : "让重要的人脉和联系方式，随时触手可及。"}
              </p>
            </div>
            <span className="page-heading__date">
              <Clock3 size={14} />
              {new Intl.DateTimeFormat("zh-CN", {
                month: "long",
                day: "numeric",
                weekday: "short",
              }).format(new Date())}
            </span>
          </section>

          <section className="stats-row" aria-label="通讯录统计">
            <div className="stat-card">
              <span className="stat-card__icon stat-card__icon--green">
                <Users size={18} />
              </span>
              <span>
                <small>联系人</small>
                <strong>{contacts.length}</strong>
              </span>
              <i>人</i>
            </div>
            <div className="stat-card">
              <span className="stat-card__icon stat-card__icon--amber">
                <Star size={18} />
              </span>
              <span>
                <small>已收藏</small>
                <strong>{favoriteCount}</strong>
              </span>
              <i>位</i>
            </div>
            <div className="stat-card">
              <span className="stat-card__icon stat-card__icon--blue">
                <Phone size={18} />
              </span>
              <span>
                <small>联系方式</small>
                <strong>{methodCount}</strong>
              </span>
              <i>项</i>
            </div>
            <div className="stat-card">
              <span className="stat-card__icon stat-card__icon--violet">
                <Building2 size={18} />
              </span>
              <span>
                <small>公司分组</small>
                <strong>{companyCount}</strong>
              </span>
              <i>组</i>
            </div>
          </section>

          <div className="section-title">
            <div>
              <h2>{searchQuery ? "搜索结果" : "联系人"}</h2>
              <span>{filteredContacts.length} 位</span>
            </div>
            <button
              className="button button--text mobile-add"
              onClick={openNewContact}
            >
              <Plus size={16} />
              新建
            </button>
          </div>

          {filteredContacts.length ? (
            <section className="contact-grid">
              {filteredContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  selected={selectedId === contact.id}
                  onSelect={(id) => setSelectedId(id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
              <button className="new-contact-card" onClick={openNewContact}>
                <span>
                  <Plus size={22} />
                </span>
                <strong>添加新联系人</strong>
                <small>记录新的联系与多种联系方式</small>
              </button>
            </section>
          ) : (
            <EmptyState
              searching={Boolean(searchQuery)}
              onAdd={openNewContact}
            />
          )}
        </div>
      </main>

      <DetailPanel
        contact={selectedContact}
        onClose={() => setSelectedId(null)}
        onEdit={setEditorContact}
        onDelete={setDeleteTarget}
        onToggleFavorite={toggleFavorite}
        onCopy={copyValue}
      />

      {editorContact && (
        <ContactEditor
          initialContact={editorContact}
          onCancel={() => setEditorContact(null)}
          onSave={saveContact}
        />
      )}

      {deleteTarget && (
        <DeleteDialog
          contact={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={deleteContact}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}
