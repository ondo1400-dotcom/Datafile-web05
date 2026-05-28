var NotionTableApp = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/index.jsx
  var import_react4 = __toESM(__require("react"));
  var import_client = __require("react-dom/client");

  // src/NotionTable.jsx
  var import_react3 = __toESM(__require("react"));

  // src/Popover.jsx
  var import_react = __toESM(__require("react"));
  function Popover({ trigger, children, align = "start", open: controlledOpen, onOpenChange }) {
    const [internalOpen, setInternalOpen] = (0, import_react.useState)(false);
    const triggerRef = (0, import_react.useRef)(null);
    const popoverRef = (0, import_react.useRef)(null);
    const isOpen = controlledOpen !== void 0 ? controlledOpen : internalOpen;
    const setOpen = (newOpen) => {
      if (controlledOpen === void 0) {
        setInternalOpen(newOpen);
      }
      if (onOpenChange) {
        onOpenChange(newOpen);
      }
    };
    (0, import_react.useEffect)(() => {
      if (!isOpen) return;
      function handleClickOutside(e) {
        if (popoverRef.current && !popoverRef.current.contains(e.target) && triggerRef.current && !triggerRef.current.contains(e.target)) {
          setOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, setOpen]);
    (0, import_react.useEffect)(() => {
      if (!isOpen) return;
      function handleEscape(e) {
        if (e.key === "Escape") {
          setOpen(false);
        }
      }
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, setOpen]);
    return /* @__PURE__ */ import_react.default.createElement("div", { style: { position: "relative", display: "inline-block" } }, /* @__PURE__ */ import_react.default.createElement(
      "div",
      {
        ref: triggerRef,
        onClick: () => setOpen(!isOpen),
        role: "button"
      },
      typeof trigger === "function" ? trigger({ open: isOpen, setOpen }) : trigger
    ), isOpen && /* @__PURE__ */ import_react.default.createElement(
      "div",
      {
        ref: popoverRef,
        className: "nt-popover",
        style: {
          position: "absolute",
          top: "100%",
          [align === "end" ? "right" : "left"]: 0,
          marginTop: "4px",
          zIndex: 50
        }
      },
      children
    ));
  }

  // src/InlineEditCell.jsx
  var import_react2 = __toESM(__require("react"));

  // src/selectOptions.js
  var TM_STATUS_BLOCKED = [
    "\uBC88\uD638\uB2E4\uB984",
    "\uCC29\uC2E0\uC804\uD658",
    "\uB098\uC774\uBE44\uD569",
    "\uD658\uACBD\uBE44\uD569",
    "\uAC70\uB9AC\uBE44\uD569",
    "\uC778\uC131\uBE44\uD569",
    "\uCC45\uC790\uAC70\uC808",
    "\uCEE8\uC124\uD305\uAC70\uC808",
    "\uC911\uBCF5",
    "\uCC28\uB2E8"
  ];
  var TM_STATUS_TRYING = [
    "\uBD80\uC7AC",
    "\uCCAB\uC778\uC0AC(\uC548\uC77D\uC539)",
    "\uCCAB\uC778\uC0AC(\uC77D\uC539)",
    "\uACE0\uBBFC\uD30C\uC545(\uBA48\uCDA4)",
    "\uCE74\uD1A1\uC911",
    "\uCC45\uC790\uC804\uB2EC",
    "\uC804\uD654\uC608\uC57D"
  ];
  var TM_STATUS_DONE = [
    "\uB9CC\uB0A8\uC7A1\uD798",
    "\uC900\uBE44\uD569",
    "\uC911\uC7A5\uAE30"
  ];
  var TM_STATUS_GROUPS = [
    { label: "\uC9C4\uD589\uBD88\uAC00", labelColor: "#ef4444", options: TM_STATUS_BLOCKED },
    { label: "\uC2DC\uB3C4\uAC00\uB2A5", labelColor: "#ca8a04", options: TM_STATUS_TRYING },
    { label: "\uC12D\uC678\uC644\uB8CC", labelColor: "#7c3aed", options: TM_STATUS_DONE }
  ];
  var TM_DOT_COLORS = {
    "\uBC88\uD638\uB2E4\uB984": "#9ca3af",
    "\uCC29\uC2E0\uC804\uD658": "#9ca3af",
    "\uB098\uC774\uBE44\uD569": "#f87171",
    "\uD658\uACBD\uBE44\uD569": "#f87171",
    "\uAC70\uB9AC\uBE44\uD569": "#f87171",
    "\uC778\uC131\uBE44\uD569": "#f87171",
    "\uCC45\uC790\uAC70\uC808": "#fb7185",
    "\uCEE8\uC124\uD305\uAC70\uC808": "#fb7185",
    "\uC911\uBCF5": "#9ca3af",
    "\uCC28\uB2E8": "#9ca3af",
    "\uBD80\uC7AC": "#facc15",
    "\uCCAB\uC778\uC0AC(\uC548\uC77D\uC539)": "#facc15",
    "\uCCAB\uC778\uC0AC(\uC77D\uC539)": "#f59e0b",
    "\uACE0\uBBFC\uD30C\uC545(\uBA48\uCDA4)": "#84cc16",
    "\uCE74\uD1A1\uC911": "#22c55e",
    "\uCC45\uC790\uC804\uB2EC": "#10b981",
    "\uC804\uD654\uC608\uC57D": "#14b8a6",
    "\uB9CC\uB0A8\uC7A1\uD798": "#3b82f6",
    "\uC900\uBE44\uD569": "#8b5cf6",
    "\uC911\uC7A5\uAE30": "#a855f7"
  };
  var DAYS_OF_WEEK = ["\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0", "\uC77C"];
  var DEFAULT_SELECT_OPTIONS = {
    "\uC2E4\uC801\uC9C0\uC5ED": ["\uD654\uC815", "\uB300\uD559", "\uC0C1\uC554", "\uBA85\uB3D9", "\uC0C8\uC18C\uB9DD", "\uC0C8\uC2E0\uC790", "\uC644\uC131"],
    "\uBAA9\uD45C\uC13C\uD130": ["\uC11C\uC6B8\uC13C\uD130", "\uBD80\uC0B0\uC13C\uD130", "\uB300\uAD6C\uC13C\uD130", "\uAD11\uC8FC\uC13C\uD130", "\uB300\uC804\uC13C\uD130"],
    "\uC12D\uC678\uC720\uD615": ["\uC9C0\uC778", "\uC804\uB3C4", "\uC18C\uAC1C", "\uAE30\uD0C0"],
    "\uC885\uAD50": ["\uBB34\uAD50", "\uAE30\uB3C5\uAD50", "\uBD88\uAD50", "\uCC9C\uC8FC\uAD50", "\uAE30\uD0C0"],
    "\uCD5C\uADFC\uB9CC\uB0A8\uACB0\uACFC": ["\uC88B\uC74C", "\uBCF4\uD1B5", "\uBD80\uC815\uC801"],
    "\uB2E4\uC74C\uB9CC\uB0A8\uD655\uD2F0\uD604\uD669": ["\uD655\uC815", "\uC7A0\uC815", "\uBBF8\uC815"],
    "\uC131\uBCC4": ["\uB0A8", "\uC5EC"],
    "\uB530\uAE30\uC8FC\uAC04\uD69F\uC218": ["1\uD68C", "2\uD68C", "3\uD68C", "4\uD68C", "5\uD68C"],
    "\uB530\uAE30\uC720\uD615": [],
    "\uB530\uAE30\uB2E8\uACC4": [],
    "\uAD6C\uBD84": ["DB", "\uCC3E\uAE30"],
    "\uB2E8\uACC4": ["\uCC3E\uAE30", "\uD569\uC790", "\uC721\uB530\uAE30", "\uC601\uB530\uAE30", "\uBCF5\uC74C\uBC29", "\uC13C\uD655", "\uC218\uC2E0"]
  };
  function getSelectOptions(key, dynamicOptions) {
    if (dynamicOptions && dynamicOptions[key]) {
      return dynamicOptions[key];
    }
    return DEFAULT_SELECT_OPTIONS[key] || [];
  }
  function getTMDotColor(value) {
    return TM_DOT_COLORS[value] || "#d1d5db";
  }

  // src/InlineEditCell.jsx
  function InlineEditCell({
    rowId,
    field,
    value,
    columnDef = {},
    selectOptions = [],
    tmStatusGroups = [],
    onSaved
  }) {
    const [isEditing, setIsEditing] = (0, import_react2.useState)(false);
    const [editValue, setEditValue] = (0, import_react2.useState)(value);
    const [isSaving, setIsSaving] = (0, import_react2.useState)(false);
    const { type = "text", readonly = false } = columnDef;
    if (readonly) {
      return /* @__PURE__ */ import_react2.default.createElement("div", { className: "nt-edit-trigger" }, formatDisplay(value, type));
    }
    const handleSave = async (newValue) => {
      setIsSaving(true);
      try {
        await saveField(rowId, field, newValue);
        setIsEditing(false);
        if (onSaved) onSaved(rowId, field, newValue);
      } catch (error) {
        console.error("Save failed:", error);
      } finally {
        setIsSaving(false);
      }
    };
    const handleCancel = () => {
      setEditValue(value);
      setIsEditing(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleCancel();
      if (e.key === "Enter" && type !== "textarea") {
        handleSave(editValue);
      }
    };
    if (!isEditing) {
      return /* @__PURE__ */ import_react2.default.createElement(
        "div",
        {
          className: "nt-edit-trigger",
          onClick: () => {
            setEditValue(value);
            setIsEditing(true);
          }
        },
        field === "TM\uD604\uC7AC\uC0C1\uD0DC" && value && /* @__PURE__ */ import_react2.default.createElement(
          "span",
          {
            style: {
              display: "inline-block",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: getTMDotColor(value),
              marginRight: "6px"
            }
          }
        ),
        formatDisplay(value, type),
        !readonly && /* @__PURE__ */ import_react2.default.createElement("span", { className: "nt-edit-pencil" }, "\u270F\uFE0F")
      );
    }
    switch (type) {
      case "select":
        if (field === "TM\uD604\uC7AC\uC0C1\uD0DC" && tmStatusGroups.length > 0) {
          return /* @__PURE__ */ import_react2.default.createElement(
            "select",
            {
              className: "nt-edit-select",
              value: editValue || "",
              onChange: (e) => handleSave(e.target.value || null),
              onBlur: handleCancel,
              onKeyDown: handleKeyDown,
              autoFocus: true
            },
            /* @__PURE__ */ import_react2.default.createElement("option", { value: "" }, "\u2014 \uC120\uD0DD \u2014"),
            tmStatusGroups.map((group) => /* @__PURE__ */ import_react2.default.createElement("optgroup", { key: group.label, label: group.label }, group.options.map((opt) => /* @__PURE__ */ import_react2.default.createElement("option", { key: opt, value: opt }, opt))))
          );
        }
        return /* @__PURE__ */ import_react2.default.createElement(
          "select",
          {
            className: "nt-edit-select",
            value: editValue || "",
            onChange: (e) => handleSave(e.target.value || null),
            onBlur: handleCancel,
            onKeyDown: handleKeyDown,
            autoFocus: true
          },
          /* @__PURE__ */ import_react2.default.createElement("option", { value: "" }, "\u2014 \uC120\uD0DD \u2014"),
          selectOptions.map((opt) => /* @__PURE__ */ import_react2.default.createElement("option", { key: opt, value: opt }, opt))
        );
      case "date":
        return /* @__PURE__ */ import_react2.default.createElement(
          "input",
          {
            type: "date",
            className: "nt-edit-input",
            value: editValue ? new Date(editValue).toISOString().split("T")[0] : "",
            onChange: (e) => setEditValue(e.target.value),
            onBlur: () => handleSave(editValue ? new Date(editValue).toISOString() : null),
            onKeyDown: handleKeyDown,
            autoFocus: true
          }
        );
      case "time":
        return /* @__PURE__ */ import_react2.default.createElement(
          "input",
          {
            type: "time",
            className: "nt-edit-input",
            value: editValue || "",
            onChange: (e) => setEditValue(e.target.value),
            onBlur: () => handleSave(editValue || null),
            onKeyDown: handleKeyDown,
            autoFocus: true
          }
        );
      case "number":
        return /* @__PURE__ */ import_react2.default.createElement(
          "input",
          {
            type: "number",
            className: "nt-edit-input",
            value: editValue || "",
            onChange: (e) => setEditValue(e.target.value ? parseInt(e.target.value) : null),
            onBlur: () => handleSave(editValue !== null ? editValue : null),
            onKeyDown: handleKeyDown,
            autoFocus: true
          }
        );
      case "textarea":
        return /* @__PURE__ */ import_react2.default.createElement("div", null, /* @__PURE__ */ import_react2.default.createElement(
          "textarea",
          {
            className: "nt-edit-textarea",
            value: editValue || "",
            onChange: (e) => setEditValue(e.target.value),
            onKeyDown: handleKeyDown,
            autoFocus: true
          }
        ), /* @__PURE__ */ import_react2.default.createElement("div", { className: "nt-edit-actions" }, /* @__PURE__ */ import_react2.default.createElement(
          "button",
          {
            onClick: () => handleSave(editValue || null),
            disabled: isSaving
          },
          isSaving ? "\uC800\uC7A5\uC911..." : "\uC800\uC7A5"
        ), /* @__PURE__ */ import_react2.default.createElement("button", { onClick: handleCancel, disabled: isSaving }, "\uCDE8\uC18C")));
      case "dayselect":
        const daysArray = Array.isArray(editValue) ? editValue : [];
        return /* @__PURE__ */ import_react2.default.createElement("div", null, DAYS_OF_WEEK.map((day) => /* @__PURE__ */ import_react2.default.createElement("label", { key: day, className: "nt-filter-checkbox" }, /* @__PURE__ */ import_react2.default.createElement(
          "input",
          {
            type: "checkbox",
            checked: daysArray.includes(day),
            onChange: (e) => {
              const newDays = e.target.checked ? [...daysArray, day] : daysArray.filter((d) => d !== day);
              setEditValue(newDays);
            }
          }
        ), day)), /* @__PURE__ */ import_react2.default.createElement("div", { className: "nt-edit-actions" }, /* @__PURE__ */ import_react2.default.createElement("button", { onClick: () => handleSave(editValue) }, "\uC800\uC7A5"), /* @__PURE__ */ import_react2.default.createElement("button", { onClick: handleCancel }, "\uCDE8\uC18C")));
      case "checklist":
        return /* @__PURE__ */ import_react2.default.createElement("div", { className: "nt-edit-trigger" }, formatDisplay(value, type));
      case "review":
        return /* @__PURE__ */ import_react2.default.createElement("div", { className: "nt-edit-trigger" }, formatDisplay(value, type));
      default:
        return /* @__PURE__ */ import_react2.default.createElement(
          "input",
          {
            type: "text",
            className: "nt-edit-input",
            value: editValue || "",
            onChange: (e) => setEditValue(e.target.value),
            onBlur: () => handleSave(editValue || null),
            onKeyDown: handleKeyDown,
            autoFocus: true
          }
        );
    }
  }
  function formatDisplay(value, type) {
    if (value === null || value === void 0 || value === "") {
      return /* @__PURE__ */ import_react2.default.createElement("span", { style: { color: "#9ca3af" } }, "\u2014");
    }
    if (type === "date") {
      return new Date(value).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).replace(/\./g, "/").replace(/\/\s*$/, "");
    }
    if (type === "dayselect" && Array.isArray(value)) {
      return value.join("");
    }
    if (type === "checklist" && Array.isArray(value)) {
      return value.length > 0 ? `${value.length}\uAC1C` : "\u2014";
    }
    return String(value);
  }
  async function saveField(rowId, field, value) {
    if (typeof window.USE_SAMPLE !== "undefined" && window.USE_SAMPLE) {
      const row = (window.STATE?.dbFindings || []).find(
        (r) => r.id === rowId || r.__rowIndex === rowId
      );
      if (row) row[field] = value;
      return;
    }
    const updateObj = {};
    updateObj[field] = value || null;
    const { error } = await window.SUPA.from("db_findings").update(updateObj).eq("id", rowId);
    if (error) throw new Error(error.message);
  }

  // src/columnConfig.js
  var BOARD_COLUMNS = [
    { key: "\uB2E8\uACC4", label: "\uB2E8\uACC4", type: "select", width: 72, readonly: true },
    { key: "\uC2E4\uC801\uC9C0\uC5ED", label: "\uC9C0\uC5ED", type: "select", width: 72 },
    { key: "\uBAA9\uD45C\uAC1C\uAC15(\uC5F0\uB3C4/\uC6D4)", label: "\uBAA9\uD45C\uAC1C\uAC15", type: "text", width: 90, readonly: true },
    { key: "\uBAA9\uD45C\uC13C\uD130", label: "\uBAA9\uD45C\uC13C\uD130", type: "select", width: 90 },
    { key: "\uC12D\uC678\uC720\uD615", label: "\uC12D\uC678\uC720\uD615", type: "select", width: 80 },
    { key: "\uC12D\uC678\uC790", label: "\uC12D\uC678\uC790", type: "text", width: 80, readonly: true },
    { key: "\uC778\uB3C4\uC790", label: "\uC778\uB3C4\uC790", type: "text", width: 80, readonly: true },
    { key: "\uAD50\uC0AC", label: "\uAD50\uC0AC", type: "text", width: 80 },
    { key: "\uC12C\uAE40\uC774", label: "\uC12C\uAE40\uC774", type: "text", width: 80 },
    { key: "\uCD5C\uADFC\uB9CC\uB0A8\uC77C", label: "\uCD5C\uADFC\uB9CC\uB0A8\uC77C", type: "date", width: 100 },
    { key: "\uCD5C\uADFC\uB9CC\uB0A8\uACB0\uACFC", label: "\uCD5C\uADFC\uB9CC\uB0A8\uACB0\uACFC", type: "select", width: 100 },
    { key: "\uB2E4\uC74C\uB9CC\uB0A8\uC77C", label: "\uB2E4\uC74C\uB9CC\uB0A8\uC77C", type: "date", width: 100 },
    { key: "\uB2E4\uC74C\uB9CC\uB0A8\uC2DC\uAC04", label: "\uB2E4\uC74C\uB9CC\uB0A8\uC2DC\uAC04", type: "time", width: 90 },
    { key: "\uB2E4\uC74C\uB9CC\uB0A8\uD655\uD2F0\uD604\uD669", label: "\uD655\uD2F0\uD604\uD669", type: "select", width: 90 },
    { key: "__review", label: "\uC2EC\uC758", type: "review", width: 90 },
    { key: "2\uCC28\uC5F0\uACB0\uC720\uD615", label: "2\uCC28\uC5F0\uACB0\uC720\uD615", type: "text", width: 90 },
    { key: "\uD569\uC790\uCCB4\uD06C\uB9AC\uC2A4\uD2B8", label: "\uD569\uC790\uCCB4\uD06C\uB9AC\uC2A4\uD2B8", type: "checklist", width: 120 },
    { key: "\uCD9C\uC0DD\uC5F0\uB3C4", label: "\uCD9C\uC0DD\uB144\uB3C4", type: "number", width: 76 },
    { key: "\uC0AC\uB294\uACF3", label: "\uC0AC\uB294\uACF3", type: "text", width: 90 },
    { key: "\uD558\uB294\uC77C", label: "\uD558\uB294\uC77C", type: "text", width: 90 },
    { key: "\uC885\uAD50", label: "\uC885\uAD50", type: "select", width: 72 },
    { key: "\uC2E0\uC559\uB144\uC218", label: "\uC2E0\uC559\uB144\uC218", type: "text", width: 72 },
    { key: "\uB530\uAE30\uCCB4\uD06C\uB9AC\uC2A4\uD2B8", label: "\uB530\uAE30\uCCB4\uD06C\uB9AC\uC2A4\uD2B8", type: "checklist", width: 120 },
    { key: "\uB530\uAE30\uC8FC\uAC04\uD69F\uC218", label: "\uB530\uAE30\uC8FC\uAC04\uD69F\uC218", type: "select", width: 90 },
    { key: "\uACE0\uC815\uC694\uC77C", label: "\uACE0\uC815\uC694\uC77C", type: "dayselect", width: 100 },
    { key: "\uB530\uAE30\uAE30\uAC04", label: "\uB530\uAE30\uAE30\uAC04", type: "text", width: 80 },
    { key: "\uB530\uAE30\uC720\uD615", label: "\uB530\uAE30\uC720\uD615", type: "select", width: 80 },
    { key: "\uB530\uAE30\uB2E8\uACC4", label: "\uB530\uAE30\uB2E8\uACC4", type: "select", width: 80 },
    { key: "\uB9C8\uD314\uC218\uAC15\uBC88\uD638", label: "\uB9C8\uD314\uC218\uAC15\uBC88\uD638", type: "text", width: 90 },
    { key: "\uC13C\uD130\uCCB4\uD06C\uB9AC\uC2A4\uD2B8", label: "\uC13C\uD130\uCCB4\uD06C\uB9AC\uC2A4\uD2B8", type: "checklist", width: 120 }
  ];
  var DB_COLUMNS = [
    { key: "\uAD6C\uBD84", label: "\uB2E8\uACC4", type: "select", width: 72, readonly: true },
    { key: "\uC2E4\uC801\uC9C0\uC5ED", label: "\uC9C0\uC5ED", type: "select", width: 72 },
    { key: "\uBAA9\uD45C\uAC1C\uAC15(\uC5F0\uB3C4/\uC6D4)", label: "\uBAA9\uD45C\uAC1C\uAC15", type: "text", width: 90, readonly: true },
    { key: "\uBAA9\uD45C\uC13C\uD130", label: "\uBAA9\uD45C\uC13C\uD130", type: "select", width: 90 },
    { key: "\uC12D\uC678\uC720\uD615", label: "\uC12D\uC678\uC720\uD615", type: "select", width: 80 },
    { key: "\uC12D\uC678\uC790", label: "\uC12D\uC678\uC790", type: "text", width: 80, readonly: true },
    { key: "\uC778\uB3C4\uC790", label: "\uC778\uB3C4\uC790", type: "text", width: 80, readonly: true },
    { key: "TM\uD604\uC7AC\uC0C1\uD0DC", label: "TM\uD604\uC7AC\uC0C1\uD0DC", type: "select", width: 130 },
    { key: "TM\uD604\uD669", label: "TM\uD604\uD669", type: "textarea", width: 180 },
    { key: "\uC131\uBCC4", label: "\uC131\uBCC4", type: "select", width: 56 },
    { key: "\uC804\uD654\uBC88\uD638", label: "\uC804\uD654\uBC88\uD638", type: "text", width: 120 },
    { key: "\uCD9C\uC0DD\uC5F0\uB3C4", label: "\uCD9C\uC0DD\uB144\uB3C4", type: "number", width: 76 },
    { key: "\uC0AC\uB294\uACF3", label: "\uC0AC\uB294\uACF3", type: "text", width: 90 },
    { key: "\uD558\uB294\uC77C", label: "\uD558\uB294\uC77C", type: "text", width: 90 },
    { key: "\uC885\uAD50", label: "\uC885\uAD50", type: "text", width: 72 },
    { key: "\uC2E0\uC559\uB144\uC218", label: "\uC2E0\uC559\uB144\uC218", type: "text", width: 72 }
  ];
  var STAGE_ORDER = ["\uCC3E\uAE30", "\uD569\uC790", "\uC721\uB530\uAE30", "\uC601\uB530\uAE30", "\uBCF5\uC74C\uBC29", "\uC13C\uD655", "\uC218\uC2E0"];
  var STAGE_COLORS = {
    "\uCC3E\uAE30": { bg: "#e0f2fe", c: "#0369a1" },
    "\uD569\uC790": { bg: "#ede9fe", c: "#6d28d9" },
    "\uC721\uB530\uAE30": { bg: "#fffbeb", c: "#92400e" },
    "\uC601\uB530\uAE30": { bg: "#fff7ed", c: "#c2410c" },
    "\uBCF5\uC74C\uBC29": { bg: "#ecfdf5", c: "#065f46" },
    "\uC13C\uD655": { bg: "#eef2ff", c: "#3730a3" },
    "\uC218\uC2E0": { bg: "#FDE8FF", c: "#7B00A0" },
    "DB": { bg: "#f1f5f9", c: "#475569" }
  };
  var REGION_ORDER = ["\uD654\uC815", "\uB300\uD559", "\uC0C1\uC554", "\uBA85\uB3D9", "\uC0C8\uC18C\uB9DD", "\uC0C8\uC2E0\uC790", "\uC644\uC131"];
  var REGION_COLORS = {
    "\uC0C1\uC554": { bg: "#D9D9D9", c: "#000" },
    "\uBA85\uB3D9": { bg: "#EB7000", c: "#000" },
    "\uB300\uD559": { bg: "#00E823", c: "#000" },
    "\uD654\uC815": { bg: "#00E6F6", c: "#000" },
    "\uC0C8\uC18C\uB9DD": { bg: "#F8E33F", c: "#000" },
    "\uC0C8\uC2E0\uC790": { bg: "#C0E8FF", c: "#000" },
    "\uC644\uC131": { bg: "#EF00D2", c: "#000" }
  };
  function formatDateShort(d) {
    if (!d) return "";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}\uC6D4 ${day}\uC77C`;
  }
  function getCustomSortIndex(columns, key, value) {
    if (!value) return Infinity;
    if (["\uB2E8\uACC4", "\uAD6C\uBD84"].includes(key)) {
      const idx = STAGE_ORDER.indexOf(value);
      return idx !== -1 ? idx : Infinity;
    }
    if (key === "\uC2E4\uC801\uC9C0\uC5ED") {
      const idx = REGION_ORDER.indexOf(value);
      return idx !== -1 ? idx : Infinity;
    }
    return Infinity;
  }
  function getStorageKey(tableType) {
    return `nt_prefs_${tableType}_v1`;
  }

  // src/NotionTable.jsx
  function NotionTable({
    data = [],
    columns = [],
    tableType = "board",
    pageSize = 50,
    onFieldSaved,
    onRowClick,
    onRefresh,
    selectOptions: dynamicSelectOptions = {},
    tmStatusGroups = [],
    statsCards,
    renderReviewCell: renderReviewCell2,
    searchFields = []
  }) {
    const [searchTerm, setSearchTerm] = (0, import_react3.useState)("");
    const [filters, setFilters] = (0, import_react3.useState)({});
    const [sorts, setSorts] = (0, import_react3.useState)([]);
    const [visibleColumns, setVisibleColumns] = (0, import_react3.useState)(() => {
      const saved = localStorage.getItem(getStorageKey(tableType));
      if (saved) {
        const prefs = JSON.parse(saved);
        return prefs.visibleColumns || columns.map((c) => c.key);
      }
      return columns.map((c) => c.key);
    });
    const [columnOrder, setColumnOrder] = (0, import_react3.useState)(() => {
      const saved = localStorage.getItem(getStorageKey(tableType));
      if (saved) {
        const prefs = JSON.parse(saved);
        return prefs.columnOrder || columns.map((c) => c.key);
      }
      return columns.map((c) => c.key);
    });
    const [frozenCount, setFrozenCount] = (0, import_react3.useState)(() => {
      const saved = localStorage.getItem(getStorageKey(tableType));
      if (saved) {
        const prefs = JSON.parse(saved);
        return prefs.frozenCount || 0;
      }
      return 0;
    });
    const [colWidths, setColWidths] = (0, import_react3.useState)(() => {
      const saved = localStorage.getItem(getStorageKey(tableType));
      if (saved) {
        const prefs = JSON.parse(saved);
        return prefs.colWidths || {};
      }
      return {};
    });
    const [currentPage, setCurrentPage] = (0, import_react3.useState)(1);
    const [dragSourceKey, setDragSourceKey] = (0, import_react3.useState)(null);
    const [dragResizeCol, setDragResizeCol] = (0, import_react3.useState)(null);
    const [dragStartX, setDragStartX] = (0, import_react3.useState)(0);
    const savePrefs = () => {
      const prefs = {
        visibleColumns,
        columnOrder,
        frozenCount,
        colWidths
      };
      localStorage.setItem(getStorageKey(tableType), JSON.stringify(prefs));
    };
    (0, import_react3.useEffect)(() => {
      savePrefs();
    }, [visibleColumns, columnOrder, frozenCount, colWidths]);
    const filteredData = (0, import_react3.useMemo)(() => {
      let result = [...data];
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter((row) => {
          return searchFields.some((field) => {
            const val = row[field];
            return val && String(val).toLowerCase().includes(term);
          });
        });
      }
      Object.entries(filters).forEach(([field, filterObj]) => {
        if (!filterObj) return;
        result = applyFieldFilter(result, field, filterObj);
      });
      if (sorts.length > 0) {
        result = result.sort((a, b) => {
          for (const sort of sorts) {
            const colDef = columns.find((c) => c.key === sort.field);
            let aVal = a[sort.field];
            let bVal = b[sort.field];
            if (["\uB2E8\uACC4", "\uAD6C\uBD84", "\uC2E4\uC801\uC9C0\uC5ED"].includes(sort.field)) {
              const aIdx = getCustomSortIndex(columns, sort.field, aVal);
              const bIdx = getCustomSortIndex(columns, sort.field, bVal);
              if (aIdx !== bIdx) {
                return sort.dir === "asc" ? aIdx - bIdx : bIdx - aIdx;
              }
              continue;
            }
            if (aVal == null && bVal == null) continue;
            if (aVal == null) return sort.dir === "asc" ? 1 : -1;
            if (bVal == null) return sort.dir === "asc" ? -1 : 1;
            if (colDef?.type === "number") {
              aVal = parseFloat(aVal) || 0;
              bVal = parseFloat(bVal) || 0;
            } else if (colDef?.type === "date") {
              aVal = new Date(aVal).getTime();
              bVal = new Date(bVal).getTime();
            } else {
              aVal = String(aVal).toLowerCase();
              bVal = String(bVal).toLowerCase();
            }
            if (aVal !== bVal) {
              return sort.dir === "asc" ? aVal < bVal ? -1 : 1 : aVal > bVal ? -1 : 1;
            }
          }
          return 0;
        });
      }
      return result;
    }, [data, searchTerm, filters, sorts, searchFields, columns]);
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const paginatedData = filteredData.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
    const visibleCols = columnOrder.filter((key) => visibleColumns.includes(key)).map((key) => columns.find((c) => c.key === key)).filter(Boolean);
    const handleSort = (field, direction) => {
      if (!direction) {
        setSorts((prev) => prev.filter((s) => s.field !== field));
      } else {
        setSorts((prev) => {
          const existing = prev.find((s) => s.field === field);
          if (existing) {
            return prev.map(
              (s) => s.field === field ? { ...s, dir: direction } : s
            );
          }
          return [...prev, { field, dir: direction }];
        });
      }
    };
    const handleDragStart = (e, colKey) => {
      setDragSourceKey(colKey);
      e.dataTransfer.effectAllowed = "move";
    };
    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };
    const handleDrop = (e, targetKey) => {
      e.preventDefault();
      if (!dragSourceKey || dragSourceKey === targetKey) {
        setDragSourceKey(null);
        return;
      }
      const newOrder = [...columnOrder];
      const sourceIdx = newOrder.indexOf(dragSourceKey);
      const targetIdx = newOrder.indexOf(targetKey);
      [newOrder[sourceIdx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[sourceIdx]];
      setColumnOrder(newOrder);
      setDragSourceKey(null);
    };
    const handleResizeStart = (e, colKey) => {
      setDragResizeCol(colKey);
      setDragStartX(e.clientX);
      e.preventDefault();
    };
    (0, import_react3.useEffect)(() => {
      if (!dragResizeCol) return;
      const handleMouseMove = (e) => {
        const delta = e.clientX - dragStartX;
        setColWidths((prev) => {
          const col = columns.find((c) => c.key === dragResizeCol);
          const currentWidth = prev[dragResizeCol] || col?.width || 100;
          return {
            ...prev,
            [dragResizeCol]: Math.max(50, currentWidth + delta)
          };
        });
        setDragStartX(e.clientX);
      };
      const handleMouseUp = () => {
        setDragResizeCol(null);
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }, [dragResizeCol, dragStartX, columns]);
    return /* @__PURE__ */ import_react3.default.createElement("div", { className: "nt-wrapper" }, statsCards && /* @__PURE__ */ import_react3.default.createElement("div", { style: { marginBottom: "20px" } }, statsCards), /* @__PURE__ */ import_react3.default.createElement("div", { className: "nt-search-wrap" }, /* @__PURE__ */ import_react3.default.createElement("svg", { className: "nt-search-icon", width: "16", height: "16", viewBox: "0 0 16 16", fill: "none" }, /* @__PURE__ */ import_react3.default.createElement("circle", { cx: "6.5", cy: "6.5", r: "4.5", stroke: "currentColor", strokeWidth: "2" }), /* @__PURE__ */ import_react3.default.createElement("path", { d: "M10 10l4 4", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        className: "nt-search-input",
        type: "text",
        placeholder: "\uC774\uB984, \uC804\uD654\uBC88\uD638\uB85C \uAC80\uC0C9...",
        value: searchTerm,
        onChange: (e) => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }
      }
    )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "nt-toolbar" }, /* @__PURE__ */ import_react3.default.createElement("button", { className: "nt-toolbar-btn" }, /* @__PURE__ */ import_react3.default.createElement("span", null, "\uD544\uD130"), Object.keys(filters).some((k) => filters[k]) && /* @__PURE__ */ import_react3.default.createElement("span", { className: "nt-badge-filter-count" }, Object.keys(filters).filter((k) => filters[k]).length)), sorts.length > 0 && /* @__PURE__ */ import_react3.default.createElement("div", { style: { display: "flex", gap: "4px", marginLeft: "8px" } }, sorts.map((sort) => /* @__PURE__ */ import_react3.default.createElement("span", { key: sort.field, className: "nt-badge-sort" }, columns.find((c) => c.key === sort.field)?.label, sort.dir === "asc" ? " \u2191" : " \u2193", /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => handleSort(sort.field, null),
        style: {
          marginLeft: "4px",
          background: "none",
          border: "none",
          cursor: "pointer"
        }
      },
      "\xD7"
    )))), /* @__PURE__ */ import_react3.default.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ import_react3.default.createElement("button", { className: "nt-toolbar-btn" }, /* @__PURE__ */ import_react3.default.createElement("span", null, "\uACE0\uC815"), frozenCount > 0 && /* @__PURE__ */ import_react3.default.createElement("span", { className: "nt-badge-filter-count" }, frozenCount)), /* @__PURE__ */ import_react3.default.createElement(
      Popover,
      {
        trigger: /* @__PURE__ */ import_react3.default.createElement("button", { className: "nt-toolbar-btn" }, "\uC5F4 \uC124\uC815"),
        align: "end"
      },
      /* @__PURE__ */ import_react3.default.createElement("div", { style: { padding: "8px", minWidth: "200px" } }, /* @__PURE__ */ import_react3.default.createElement(
        "button",
        {
          onClick: () => setVisibleColumns(columns.map((c) => c.key)),
          style: { width: "100%", marginBottom: "4px" },
          className: "nt-popover-item"
        },
        "\uC804\uCCB4"
      ), /* @__PURE__ */ import_react3.default.createElement(
        "button",
        {
          onClick: () => setVisibleColumns(columns.slice(0, 5).map((c) => c.key)),
          style: { width: "100%", marginBottom: "8px" },
          className: "nt-popover-item"
        },
        "\uCD08\uAE30\uD654"
      ), /* @__PURE__ */ import_react3.default.createElement("div", { style: { borderTop: "1px solid #e5e7eb", marginBottom: "8px" } }), columns.map((col) => /* @__PURE__ */ import_react3.default.createElement("label", { key: col.key, className: "nt-filter-checkbox" }, /* @__PURE__ */ import_react3.default.createElement(
        "input",
        {
          type: "checkbox",
          checked: visibleColumns.includes(col.key),
          onChange: (e) => {
            if (e.target.checked) {
              setVisibleColumns((prev) => [...prev, col.key]);
            } else {
              setVisibleColumns((prev) => prev.filter((k) => k !== col.key));
            }
          }
        }
      ), col.label)))
    ), /* @__PURE__ */ import_react3.default.createElement("div", { className: "nt-toolbar-sep" }), /* @__PURE__ */ import_react3.default.createElement("button", { className: "nt-toolbar-btn", onClick: onRefresh }, /* @__PURE__ */ import_react3.default.createElement("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none" }, /* @__PURE__ */ import_react3.default.createElement(
      "path",
      {
        d: "M2 8a6 6 0 0 1 10.2-4.2M14 8a6 6 0 0 1-10.2 4.2",
        stroke: "currentColor",
        strokeWidth: "1.5",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }
    ))), /* @__PURE__ */ import_react3.default.createElement("span", { className: "nt-toolbar-count" }, filteredData.length, " / ", data.length)), Object.keys(filters).some((k) => filters[k]) && /* @__PURE__ */ import_react3.default.createElement("div", { className: "nt-filter-bar" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "nt-filter-label" }, "\uD544\uD130:"), /* @__PURE__ */ import_react3.default.createElement("div", { style: { flex: 1, display: "flex", gap: "4px", flexWrap: "wrap" } }, Object.entries(filters).filter(([_, f]) => f).map(([field, filterObj]) => /* @__PURE__ */ import_react3.default.createElement("span", { key: field, className: "nt-filter-chip" }, columns.find((c) => c.key === field)?.label, /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => {
          const newFilters = { ...filters };
          delete newFilters[field];
          setFilters(newFilters);
        },
        style: {
          marginLeft: "4px",
          background: "none",
          border: "none",
          cursor: "pointer"
        }
      },
      "\xD7"
    ))))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "nt-table-wrap" }, /* @__PURE__ */ import_react3.default.createElement("table", { className: "nt-table" }, /* @__PURE__ */ import_react3.default.createElement("thead", null, /* @__PURE__ */ import_react3.default.createElement("tr", null, visibleCols.map((col, idx) => {
      const width = colWidths[col.key] || col.width || 100;
      const isFrozen = idx < frozenCount;
      return /* @__PURE__ */ import_react3.default.createElement(
        "th",
        {
          key: col.key,
          draggable: true,
          onDragStart: (e) => handleDragStart(e, col.key),
          onDragOver: handleDragOver,
          onDrop: (e) => handleDrop(e, col.key),
          className: isFrozen ? "nt-frozen" : "",
          style: {
            width: `${width}px`,
            minWidth: `${width}px`,
            position: isFrozen ? "sticky" : void 0,
            left: isFrozen ? getLeftOffset(idx, colWidths, visibleCols) : void 0,
            backgroundColor: isFrozen ? "#f9fafb" : void 0,
            zIndex: isFrozen ? 10 : void 0,
            borderRight: isFrozen && idx === frozenCount - 1 ? "1px solid #e5e7eb" : void 0
          }
        },
        /* @__PURE__ */ import_react3.default.createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "grab"
            }
          },
          /* @__PURE__ */ import_react3.default.createElement(
            Popover,
            {
              trigger: /* @__PURE__ */ import_react3.default.createElement("div", { style: { flex: 1, cursor: "pointer" } }, col.label, sorts.some((s) => s.field === col.key) && /* @__PURE__ */ import_react3.default.createElement("span", { style: { marginLeft: "4px" } }, sorts.find((s) => s.field === col.key)?.dir === "asc" ? "\u2191" : "\u2193")),
              align: "start"
            },
            /* @__PURE__ */ import_react3.default.createElement("div", { style: { padding: "4px" } }, /* @__PURE__ */ import_react3.default.createElement(
              "button",
              {
                className: "nt-popover-item",
                onClick: () => handleSort(col.key, "asc")
              },
              "\uC624\uB984\uCC28\uC21C \uC815\uB82C"
            ), /* @__PURE__ */ import_react3.default.createElement(
              "button",
              {
                className: "nt-popover-item",
                onClick: () => handleSort(col.key, "desc")
              },
              "\uB0B4\uB9BC\uCC28\uC21C \uC815\uB82C"
            ), /* @__PURE__ */ import_react3.default.createElement(
              "button",
              {
                className: "nt-popover-item",
                onClick: () => handleSort(col.key, null)
              },
              "\uC815\uB82C \uD574\uC81C"
            ), /* @__PURE__ */ import_react3.default.createElement("div", { className: "nt-popover-divider" }), /* @__PURE__ */ import_react3.default.createElement(
              "button",
              {
                className: "nt-popover-item",
                onClick: () => {
                  const newFilters = { ...filters };
                  newFilters[col.key] = newFilters[col.key] || {};
                  setFilters(newFilters);
                }
              },
              "\uD544\uD130 \uCD94\uAC00/\uD3B8\uC9D1"
            ), /* @__PURE__ */ import_react3.default.createElement("div", { className: "nt-popover-divider" }), /* @__PURE__ */ import_react3.default.createElement(
              "button",
              {
                className: "nt-popover-item",
                onClick: () => {
                  const newFrozen = Math.min(frozenCount + 1, visibleCols.length);
                  if (idx < newFrozen) {
                    setFrozenCount(newFrozen);
                  }
                }
              },
              "\uC5EC\uAE30\uAE4C\uC9C0 \uACE0\uC815"
            ), /* @__PURE__ */ import_react3.default.createElement(
              "button",
              {
                className: "nt-popover-item",
                onClick: () => {
                  if (idx < frozenCount) {
                    setFrozenCount(Math.max(0, frozenCount - 1));
                  }
                }
              },
              "\uACE0\uC815 \uD574\uC81C"
            ))
          ),
          /* @__PURE__ */ import_react3.default.createElement(
            "div",
            {
              className: "nt-col-resize",
              onMouseDown: (e) => handleResizeStart(e, col.key),
              style: {
                width: "4px",
                height: "20px",
                cursor: "col-resize",
                marginLeft: "4px"
              }
            }
          )
        )
      );
    }))), /* @__PURE__ */ import_react3.default.createElement("tbody", null, paginatedData.length === 0 ? /* @__PURE__ */ import_react3.default.createElement("tr", null, /* @__PURE__ */ import_react3.default.createElement("td", { colSpan: visibleCols.length, className: "nt-empty" }, "\uD45C\uC2DC\uD560 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4")) : paginatedData.map((row, rowIdx) => /* @__PURE__ */ import_react3.default.createElement("tr", { key: row.id || rowIdx, onClick: () => onRowClick && onRowClick(row) }, visibleCols.map((col, colIdx) => {
      const isFrozen = colIdx < frozenCount;
      const cellValue = row[col.key];
      const selectOpts = getSelectOptions(col.key, dynamicSelectOptions);
      return /* @__PURE__ */ import_react3.default.createElement(
        "td",
        {
          key: col.key,
          className: isFrozen ? "nt-frozen" : "",
          style: {
            width: `${colWidths[col.key] || col.width || 100}px`,
            minWidth: `${colWidths[col.key] || col.width || 100}px`,
            position: isFrozen ? "sticky" : void 0,
            left: isFrozen ? getLeftOffset(colIdx, colWidths, visibleCols) : void 0,
            backgroundColor: isFrozen ? "#f9fafb" : void 0,
            zIndex: isFrozen ? 9 : void 0
          }
        },
        renderCell(col, cellValue, row, {
          rowId: row.id,
          onSaved: onFieldSaved,
          selectOptions: selectOpts,
          tmStatusGroups,
          renderReviewCell: renderReviewCell2
        })
      );
    })))))), totalPages > 1 && /* @__PURE__ */ import_react3.default.createElement("div", { className: "nt-pagination" }, /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        className: "nt-page-btn",
        onClick: () => setCurrentPage(Math.max(1, currentPage - 1)),
        disabled: currentPage === 1
      },
      "\uC774\uC804"
    ), Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
      let pageNum;
      if (totalPages <= 5) {
        pageNum = i + 1;
      } else if (currentPage <= 3) {
        pageNum = i + 1;
      } else if (currentPage >= totalPages - 2) {
        pageNum = totalPages - 4 + i;
      } else {
        pageNum = currentPage - 2 + i;
      }
      return /* @__PURE__ */ import_react3.default.createElement(
        "button",
        {
          key: pageNum,
          className: `nt-page-btn ${currentPage === pageNum ? "active" : ""}`,
          onClick: () => setCurrentPage(pageNum)
        },
        pageNum
      );
    }), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        className: "nt-page-btn",
        onClick: () => setCurrentPage(Math.min(totalPages, currentPage + 1)),
        disabled: currentPage === totalPages
      },
      "\uB2E4\uC74C"
    ), /* @__PURE__ */ import_react3.default.createElement("span", { className: "nt-page-info" }, (currentPage - 1) * pageSize + 1, "-", Math.min(currentPage * pageSize, filteredData.length), " / ", filteredData.length)));
  }
  function renderCell(col, value, row, { rowId, onSaved, selectOptions, tmStatusGroups, renderReviewCell: renderReviewCell2 }) {
    if (col.type === "review") {
      return renderReviewCell2 ? renderReviewCell2(row) : "\u2014";
    }
    if (col.type === "select" && (col.key === "\uB2E8\uACC4" || col.key === "\uAD6C\uBD84" || col.key === "\uC2E4\uC801\uC9C0\uC5ED")) {
      const colors = col.key === "\uC2E4\uC801\uC9C0\uC5ED" ? REGION_COLORS[value] : STAGE_COLORS[value];
      if (!value || !colors) {
        return /* @__PURE__ */ import_react3.default.createElement("span", { style: { color: "#9ca3af" } }, "\u2014");
      }
      return /* @__PURE__ */ import_react3.default.createElement("span", { className: "nt-stage-badge", style: { backgroundColor: colors.bg, color: colors.c } }, value);
    }
    if (col.readonly) {
      return value ? col.type === "date" ? formatDateShort(value) : String(value) : /* @__PURE__ */ import_react3.default.createElement("span", { style: { color: "#9ca3af" } }, "\u2014");
    }
    return /* @__PURE__ */ import_react3.default.createElement(
      InlineEditCell,
      {
        rowId,
        field: col.key,
        value,
        columnDef: col,
        selectOptions,
        tmStatusGroups,
        onSaved
      }
    );
  }
  function getLeftOffset(colIdx, colWidths, visibleCols) {
    let offset = 0;
    for (let i = 0; i < colIdx; i++) {
      offset += colWidths[visibleCols[i].key] || visibleCols[i].width || 100;
    }
    return offset;
  }
  function applyFieldFilter(data, field, filterObj) {
    if (!filterObj) return data;
    return data.filter((row) => {
      const val = row[field];
      if (val === null || val === void 0) return !filterObj.emptyOnly;
      return String(val).toLowerCase().includes(String(filterObj.value || "").toLowerCase());
    });
  }

  // src/index.jsx
  var roots = {};
  function getOrCreateRoot(containerId) {
    if (!roots[containerId]) {
      const el = document.getElementById(containerId);
      if (!el) return null;
      roots[containerId] = (0, import_client.createRoot)(el);
    }
    return roots[containerId];
  }
  function renderReviewCell(row) {
    const ri = row.__rowIndex ?? row.id;
    if (row["\uC804\uC1A1\uC644\uB8CC\uC5EC\uBD80"] === "Y") {
      return import_react4.default.createElement("span", { className: "nt-review-badge", style: { background: "#dcfce7", color: "#166534" } }, "\uC804\uC1A1\uC644\uB8CC");
    }
    if (row["\uC2EC\uC758\uC2B9\uC778\uC5EC\uBD80"] === "Y") {
      return import_react4.default.createElement("span", { className: "nt-review-badge", style: { background: "#e0e7ff", color: "#3730a3" } }, "\uC2B9\uC778\uC644\uB8CC");
    }
    if (row["\uC2EC\uC758\uC694\uCCAD\uC5EC\uBD80"] === "Y") {
      return import_react4.default.createElement("span", { className: "nt-review-badge", style: { background: "#fef3c7", color: "#92400e" } }, "\uC2EC\uC758\uB300\uAE30");
    }
    return import_react4.default.createElement("button", {
      className: "nt-review-btn",
      onClick: (e) => {
        e.stopPropagation();
        if (typeof window.openRequestReviewModal === "function") {
          window.openRequestReviewModal(ri, "db");
        }
      }
    }, "\uC2EC\uC758\uC694\uCCAD");
  }
  function handleFieldSaved(rowId, field, value) {
    const rows = window.STATE?.dbFindings || [];
    const row = rows.find((r) => (r.id || r.__rowIndex) === rowId);
    if (row) row[field] = value;
  }
  function renderStatsCards(data) {
    const dbCount = data.filter((r) => r["\uAD6C\uBD84"] === "DB").length;
    const findCount = data.filter((r) => r["\uAD6C\uBD84"] === "\uCC3E\uAE30").length;
    const sentCount = data.filter((r) => r["\uC804\uC1A1\uC644\uB8CC\uC5EC\uBD80"] === "Y").length;
    return import_react4.default.createElement(
      "div",
      { className: "nt-stats" },
      import_react4.default.createElement(
        "div",
        { className: "nt-stat-card" },
        import_react4.default.createElement("div", { className: "nt-stat-label" }, "DB"),
        import_react4.default.createElement("div", { className: "nt-stat-value" }, dbCount)
      ),
      import_react4.default.createElement(
        "div",
        { className: "nt-stat-card" },
        import_react4.default.createElement("div", { className: "nt-stat-label" }, "\uCC3E\uAE30"),
        import_react4.default.createElement("div", { className: "nt-stat-value" }, findCount)
      ),
      import_react4.default.createElement(
        "div",
        { className: "nt-stat-card" },
        import_react4.default.createElement("div", { className: "nt-stat-label" }, "\uC804\uC1A1\uC644\uB8CC"),
        import_react4.default.createElement("div", { className: "nt-stat-value" }, sentCount)
      )
    );
  }
  function mountDbTable(containerId, data, options = {}) {
    const root = getOrCreateRoot(containerId);
    if (!root) return;
    const dynamicOptions = window.STATE?.dropdownOptions || {};
    root.render(
      import_react4.default.createElement(NotionTable, {
        data: data || [],
        columns: DB_COLUMNS,
        tableType: "db",
        pageSize: 50,
        selectOptions: dynamicOptions,
        tmStatusGroups: TM_STATUS_GROUPS,
        searchFields: ["\uC12D\uC678\uC790", "\uC804\uD654\uBC88\uD638", "\uC778\uB3C4\uC790", "TM\uD604\uD669"],
        renderReviewCell: null,
        statsCards: renderStatsCards(data || []),
        onFieldSaved: handleFieldSaved,
        onRowClick: (row) => {
          if (typeof window.openDbDetail === "function") {
            window.openDbDetail(row.__rowIndex ?? row.id);
          }
        },
        onRefresh: options.onRefresh || null,
        ...options
      })
    );
  }
  function mountBoardTable(containerId, data, options = {}) {
    const root = getOrCreateRoot(containerId);
    if (!root) return;
    const dynamicOptions = window.STATE?.dropdownOptions || {};
    root.render(
      import_react4.default.createElement(NotionTable, {
        data: data || [],
        columns: BOARD_COLUMNS,
        tableType: "board",
        pageSize: 50,
        selectOptions: dynamicOptions,
        tmStatusGroups: null,
        searchFields: ["\uC12D\uC678\uC790", "\uC778\uB3C4\uC790", "\uAD50\uC0AC", "\uC12C\uAE40\uC774"],
        renderReviewCell,
        onFieldSaved: handleFieldSaved,
        onRowClick: (row) => {
          if (row._isDbFinding) {
            if (typeof window.openDbFindingDetail === "function") {
              window.openDbFindingDetail(row.__rowIndex ?? row.id, options.source || "adm-board");
            }
          } else {
            if (typeof window.openPersonDetail === "function") {
              window.openPersonDetail(row.__rowIndex ?? row.id, options.source || "adm-board");
            }
          }
        },
        onRefresh: options.onRefresh || null,
        ...options
      })
    );
  }
  function unmount(containerId) {
    if (roots[containerId]) {
      roots[containerId].unmount();
      delete roots[containerId];
    }
  }
  window.NotionTableApp = {
    mountDbTable,
    mountBoardTable,
    unmount,
    BOARD_COLUMNS,
    DB_COLUMNS,
    STAGE_COLORS
  };
})();
