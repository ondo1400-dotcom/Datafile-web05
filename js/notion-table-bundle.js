(() => {
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
  var import_react8 = __toESM(__require("react"));
  var import_client = __require("react-dom/client");

  // src/NotionTable.jsx
  var import_react7 = __toESM(__require("react"));

  // src/ui.jsx
  var import_react = __toESM(__require("react"));
  function cn(...args) {
    return args.filter(Boolean).join(" ");
  }
  function Badge({ className, variant = "outline", children, ...props }) {
    const base = "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors";
    const variants = {
      default: "border-transparent bg-slate-900 text-white",
      secondary: "border-transparent bg-slate-100 text-slate-900",
      destructive: "border-transparent bg-red-500 text-white",
      outline: ""
    };
    return /* @__PURE__ */ import_react.default.createElement("div", { className: cn(base, variants[variant], className), ...props }, children);
  }
  function Button({ className, variant = "default", size = "default", children, ...props }) {
    const base = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";
    const variants = {
      default: "bg-slate-900 text-white shadow hover:bg-slate-800",
      outline: "border border-slate-200 bg-white shadow-sm hover:bg-slate-50",
      ghost: "hover:bg-slate-100 hover:text-slate-900"
    };
    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      icon: "h-8 w-8"
    };
    return /* @__PURE__ */ import_react.default.createElement("button", { className: cn(base, variants[variant], sizes[size], className), ...props }, children);
  }
  function Checkbox({ checked, onCheckedChange, className, ...props }) {
    return /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        type: "button",
        role: "checkbox",
        "aria-checked": !!checked,
        onClick: () => onCheckedChange && onCheckedChange(!checked),
        className: cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-slate-300 shadow-sm focus-visible:outline-none disabled:opacity-50",
          checked ? "bg-slate-900 border-slate-900 text-white" : "bg-white",
          className
        ),
        ...props
      },
      checked && /* @__PURE__ */ import_react.default.createElement("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round", className: "mx-auto" }, /* @__PURE__ */ import_react.default.createElement("polyline", { points: "20 6 9 17 4 12" }))
    );
  }
  function Input({ className, ...props }) {
    return /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        className: cn(
          "flex h-8 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 disabled:opacity-50",
          className
        ),
        ...props
      }
    );
  }
  function ScrollArea({ children, className, style, ...props }) {
    return /* @__PURE__ */ import_react.default.createElement("div", { className: cn("overflow-auto", className), style, ...props }, children);
  }
  var Table = import_react.default.forwardRef(({ className, style, ...props }, ref) => /* @__PURE__ */ import_react.default.createElement("div", { className: "relative w-full overflow-auto notion-table-scroll max-h-[calc(100vh-410px)]" }, /* @__PURE__ */ import_react.default.createElement("table", { ref, className: cn("notion-table min-w-full caption-bottom text-[13px]", className), style, ...props })));
  function TableHeader({ className, ...props }) {
    return /* @__PURE__ */ import_react.default.createElement("thead", { className, ...props });
  }
  function TableBody({ className, ...props }) {
    return /* @__PURE__ */ import_react.default.createElement("tbody", { className, ...props });
  }
  function TableRow({ className, ...props }) {
    return /* @__PURE__ */ import_react.default.createElement("tr", { className: cn("transition-colors duration-100", className), ...props });
  }
  function TableHead({ className, style, ...props }) {
    return /* @__PURE__ */ import_react.default.createElement("th", { className: cn("h-[38px] px-3.5 text-left align-middle text-[11px] font-semibold text-warm-500 tracking-wide", className), style, ...props });
  }
  function TableCell({ className, style, ...props }) {
    return /* @__PURE__ */ import_react.default.createElement("td", { className: cn("px-3 py-2.5 align-middle", className), style, ...props });
  }

  // src/Popover.jsx
  var import_react2 = __toESM(__require("react"));
  function Popover({ open: controlledOpen, onOpenChange, children }) {
    const [internalOpen, setInternalOpen] = (0, import_react2.useState)(false);
    const isControlled = controlledOpen !== void 0;
    const isOpen = isControlled ? controlledOpen : internalOpen;
    const containerRef = (0, import_react2.useRef)(null);
    const setOpen = (0, import_react2.useCallback)((val) => {
      if (isControlled) {
        onOpenChange && onOpenChange(val);
      } else {
        setInternalOpen(val);
      }
    }, [isControlled, onOpenChange]);
    (0, import_react2.useEffect)(() => {
      if (!isOpen) return;
      function handleClick(e) {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          setOpen(false);
        }
      }
      function handleEsc(e) {
        if (e.key === "Escape") setOpen(false);
      }
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleEsc);
      return () => {
        document.removeEventListener("mousedown", handleClick);
        document.removeEventListener("keydown", handleEsc);
      };
    }, [isOpen, setOpen]);
    const childArray = import_react2.default.Children.toArray(children);
    const trigger = childArray.find((c) => c.type === PopoverTrigger);
    const content = childArray.find((c) => c.type === PopoverContent);
    return /* @__PURE__ */ import_react2.default.createElement("div", { ref: containerRef, style: { position: "relative", display: "inline-block" } }, trigger && import_react2.default.cloneElement(trigger, { _isOpen: isOpen, _toggle: () => setOpen(!isOpen) }), isOpen && content);
  }
  function PopoverTrigger({ children, asChild, _isOpen, _toggle }) {
    if (asChild && import_react2.default.isValidElement(children)) {
      return import_react2.default.cloneElement(children, {
        onClick: (e) => {
          _toggle();
          children.props.onClick && children.props.onClick(e);
        }
      });
    }
    return /* @__PURE__ */ import_react2.default.createElement("button", { type: "button", onClick: _toggle }, children);
  }
  function PopoverContent({ children, align = "start", className, style: styleProp }) {
    return /* @__PURE__ */ import_react2.default.createElement(
      "div",
      {
        className: cn("absolute z-50 rounded-xl border border-slate-200 bg-white p-3 shadow-lg", className),
        style: {
          top: "calc(100% + 4px)",
          [align === "end" ? "right" : "left"]: 0,
          ...styleProp
        }
      },
      children
    );
  }

  // src/Icons.jsx
  var import_react3 = __toESM(__require("react"));
  function Icon({ size = 16, children, className, ...props }) {
    return /* @__PURE__ */ import_react3.default.createElement(
      "svg",
      {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className,
        ...props
      },
      children
    );
  }
  function SearchIcon(p) {
    return /* @__PURE__ */ import_react3.default.createElement(Icon, { ...p }, /* @__PURE__ */ import_react3.default.createElement("circle", { cx: "11", cy: "11", r: "8" }), /* @__PURE__ */ import_react3.default.createElement("path", { d: "M21 21l-4.35-4.35" }));
  }
  function FilterIcon(p) {
    return /* @__PURE__ */ import_react3.default.createElement(Icon, { ...p }, /* @__PURE__ */ import_react3.default.createElement("polygon", { points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" }));
  }
  function Columns3Icon(p) {
    return /* @__PURE__ */ import_react3.default.createElement(Icon, { ...p }, /* @__PURE__ */ import_react3.default.createElement("rect", { x: "2", y: "3", width: "20", height: "18", rx: "2" }), /* @__PURE__ */ import_react3.default.createElement("path", { d: "M9 3v18" }), /* @__PURE__ */ import_react3.default.createElement("path", { d: "M15 3v18" }));
  }
  function ChevronLeftIcon(p) {
    return /* @__PURE__ */ import_react3.default.createElement(Icon, { ...p }, /* @__PURE__ */ import_react3.default.createElement("path", { d: "M15 18l-6-6 6-6" }));
  }
  function ChevronRightIcon(p) {
    return /* @__PURE__ */ import_react3.default.createElement(Icon, { ...p }, /* @__PURE__ */ import_react3.default.createElement("path", { d: "M9 18l6-6-6-6" }));
  }
  function PinIcon(p) {
    return /* @__PURE__ */ import_react3.default.createElement(Icon, { ...p }, /* @__PURE__ */ import_react3.default.createElement("path", { d: "M12 17v5" }), /* @__PURE__ */ import_react3.default.createElement("path", { d: "M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V16h14v-.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v5.76z" }));
  }
  function ArrowUpIcon(p) {
    return /* @__PURE__ */ import_react3.default.createElement(Icon, { ...p }, /* @__PURE__ */ import_react3.default.createElement("path", { d: "M12 19V5" }), /* @__PURE__ */ import_react3.default.createElement("path", { d: "M5 12l7-7 7 7" }));
  }
  function ArrowDownIcon(p) {
    return /* @__PURE__ */ import_react3.default.createElement(Icon, { ...p }, /* @__PURE__ */ import_react3.default.createElement("path", { d: "M12 5v14" }), /* @__PURE__ */ import_react3.default.createElement("path", { d: "M19 12l-7 7-7-7" }));
  }
  function HelpCircleIcon(p) {
    return /* @__PURE__ */ import_react3.default.createElement(Icon, { ...p }, /* @__PURE__ */ import_react3.default.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ import_react3.default.createElement("path", { d: "M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" }), /* @__PURE__ */ import_react3.default.createElement("path", { d: "M12 17h.01" }));
  }
  function RefreshCwIcon(p) {
    return /* @__PURE__ */ import_react3.default.createElement(Icon, { ...p }, /* @__PURE__ */ import_react3.default.createElement("polyline", { points: "23 4 23 10 17 10" }), /* @__PURE__ */ import_react3.default.createElement("polyline", { points: "1 20 1 14 7 14" }), /* @__PURE__ */ import_react3.default.createElement("path", { d: "M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" }));
  }
  function DocIcon(p) {
    return /* @__PURE__ */ import_react3.default.createElement(Icon, { ...p }, /* @__PURE__ */ import_react3.default.createElement("path", { d: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" }), /* @__PURE__ */ import_react3.default.createElement("polyline", { points: "14 2 14 8 20 8" }));
  }

  // src/InlineEditCell.jsx
  var import_react6 = __toESM(__require("react"));

  // src/StageBadge.jsx
  var import_react4 = __toESM(__require("react"));

  // src/columnConfig.js
  var BOARD_COLUMNS = [
    { key: "\uB2E8\uACC4", label: "\uB2E8\uACC4", type: "select", width: 72, readonly: true, badgeType: "stage" },
    { key: "\uC2E4\uC801\uC9C0\uC5ED", label: "\uC9C0\uC5ED", type: "select", width: 72, badgeType: "region" },
    { key: "\uBAA9\uD45C\uAC1C\uAC15(\uC5F0\uB3C4/\uC6D4)", label: "\uBAA9\uD45C\uAC1C\uAC15", type: "text", width: 90, readonly: true },
    { key: "\uBAA9\uD45C\uC13C\uD130", label: "\uBAA9\uD45C\uC13C\uD130", type: "select", width: 90 },
    { key: "\uC12D\uC678\uC720\uD615", label: "\uC12D\uC678\uC720\uD615", type: "select", width: 100 },
    { key: "\uC12D\uC678\uC790", label: "\uC12D\uC678\uC790", type: "text", width: 90, readonly: true },
    { key: "\uC778\uB3C4\uC790", label: "\uC778\uB3C4\uC790", type: "text", width: 90, readonly: true },
    { key: "\uAD50\uC0AC", label: "\uAD50\uC0AC", type: "text", width: 90 },
    { key: "\uC12C\uAE40\uC774", label: "\uC12C\uAE40\uC774", type: "text", width: 90 },
    { key: "\uCD5C\uADFC\uB9CC\uB0A8\uC77C", label: "\uCD5C\uADFC\uB9CC\uB0A8\uC77C", type: "date", width: 110 },
    { key: "\uCD5C\uADFC\uB9CC\uB0A8\uACB0\uACFC", label: "\uCD5C\uADFC\uB9CC\uB0A8\uACB0\uACFC", type: "select", width: 110, badgeType: "meeting" },
    { key: "\uB2E4\uC74C\uB9CC\uB0A8\uC77C", label: "\uB2E4\uC74C\uB9CC\uB0A8\uC77C", type: "date", width: 110 },
    { key: "\uB2E4\uC74C\uB9CC\uB0A8\uC2DC\uAC04", label: "\uB2E4\uC74C\uB9CC\uB0A8\uC2DC\uAC04", type: "time", width: 100 },
    { key: "\uB2E4\uC74C\uB9CC\uB0A8\uD655\uD2F0\uD604\uD669", label: "\uD655\uD2F0\uD604\uD669", type: "select", width: 100 },
    { key: "__review", label: "\uC2EC\uC758", type: "review", width: 100 },
    { key: "2\uCC28\uC5F0\uACB0\uC720\uD615", label: "2\uCC28\uC5F0\uACB0\uC720\uD615", type: "text", width: 110 },
    { key: "\uD569\uC790\uCCB4\uD06C\uB9AC\uC2A4\uD2B8", label: "\uD569\uC790\uCCB4\uD06C\uB9AC\uC2A4\uD2B8", type: "checklist", width: 130 },
    { key: "\uCD9C\uC0DD\uC5F0\uB3C4", label: "\uCD9C\uC0DD\uB144\uB3C4", type: "number", width: 90 },
    { key: "\uC0AC\uB294\uACF3", label: "\uC0AC\uB294\uACF3", type: "text", width: 110 },
    { key: "\uD558\uB294\uC77C", label: "\uD558\uB294\uC77C", type: "text", width: 110 },
    { key: "\uC885\uAD50", label: "\uC885\uAD50", type: "select", width: 80 },
    { key: "\uC2E0\uC559\uB144\uC218", label: "\uC2E0\uC559\uB144\uC218", type: "text", width: 80 },
    { key: "\uB530\uAE30\uCCB4\uD06C\uB9AC\uC2A4\uD2B8", label: "\uB530\uAE30\uCCB4\uD06C\uB9AC\uC2A4\uD2B8", type: "checklist", width: 130 },
    { key: "\uB530\uAE30\uC8FC\uAC04\uD69F\uC218", label: "\uB530\uAE30\uC8FC\uAC04\uD69F\uC218", type: "select", width: 110 },
    { key: "\uACE0\uC815\uC694\uC77C", label: "\uACE0\uC815\uC694\uC77C", type: "dayselect", width: 110 },
    { key: "\uB530\uAE30\uAE30\uAC04", label: "\uB530\uAE30\uAE30\uAC04", type: "text", width: 90 },
    { key: "\uB530\uAE30\uC720\uD615", label: "\uB530\uAE30\uC720\uD615", type: "select", width: 90 },
    { key: "\uB530\uAE30\uB2E8\uACC4", label: "\uB530\uAE30\uB2E8\uACC4", type: "select", width: 90 },
    { key: "\uB9C8\uD314\uC218\uAC15\uBC88\uD638", label: "\uB9C8\uD314\uC218\uAC15\uBC88\uD638", type: "text", width: 110 },
    { key: "\uC13C\uD130\uCCB4\uD06C\uB9AC\uC2A4\uD2B8", label: "\uC13C\uD130\uCCB4\uD06C\uB9AC\uC2A4\uD2B8", type: "checklist", width: 130 }
  ];
  var DB_COLUMNS = [
    { key: "\uAD6C\uBD84", label: "\uB2E8\uACC4", type: "select", width: 80, readonly: true, badgeType: "stage" },
    { key: "\uC2E4\uC801\uC9C0\uC5ED", label: "\uC9C0\uC5ED", type: "select", width: 80, badgeType: "region" },
    { key: "\uBAA9\uD45C\uAC1C\uAC15(\uC5F0\uB3C4/\uC6D4)", label: "\uBAA9\uD45C\uAC1C\uAC15", type: "text", width: 90, readonly: true },
    { key: "\uBAA9\uD45C\uC13C\uD130", label: "\uBAA9\uD45C\uC13C\uD130", type: "select", width: 90 },
    { key: "\uC12D\uC678\uC720\uD615", label: "\uC12D\uC678\uC720\uD615", type: "select", width: 80 },
    { key: "\uC12D\uC678\uC790", label: "\uC12D\uC678\uC790", type: "text", width: 80, readonly: true },
    { key: "\uC778\uB3C4\uC790", label: "\uC778\uB3C4\uC790", type: "text", width: 80, readonly: true },
    { key: "TM\uD604\uC7AC\uC0C1\uD0DC", label: "TM\uD604\uC7AC\uC0C1\uD0DC", type: "select", width: 150, badgeType: "tm_status" },
    { key: "TM\uD604\uD669", label: "TM\uD604\uD669", type: "textarea", width: 220 },
    { key: "\uC131\uBCC4", label: "\uC131\uBCC4", type: "select", width: 64, badgeType: "gender" },
    { key: "\uB098\uC774", label: "\uB098\uC774", type: "number", width: 64 },
    { key: "\uC804\uD654\uBC88\uD638", label: "\uC804\uD654\uBC88\uD638", type: "text", width: 140 },
    { key: "\uCD9C\uC0DD\uC5F0\uB3C4", label: "\uCD9C\uC0DD\uB144\uB3C4", type: "number", width: 90 },
    { key: "\uC0AC\uB294\uACF3", label: "\uC0AC\uB294\uACF3", type: "text", width: 110 },
    { key: "\uD558\uB294\uC77C", label: "\uD558\uB294\uC77C", type: "text", width: 110 },
    { key: "\uC885\uAD50", label: "\uC885\uAD50", type: "text", width: 80 },
    { key: "\uC2E0\uC559\uB144\uC218", label: "\uC2E0\uC559\uB144\uC218", type: "text", width: 80 }
  ];
  var REGION_COLORS = {
    "\uC0C1\uC554": { bg: "#D9D9D9", c: "#000" },
    "\uBA85\uB3D9": { bg: "#EB7000", c: "#000" },
    "\uB300\uD559": { bg: "#00E823", c: "#000" },
    "\uD654\uC815": { bg: "#00E6F6", c: "#000" },
    "\uC0C8\uC18C\uB9DD": { bg: "#F8E33F", c: "#000" },
    "\uC0C8\uC2E0\uC790": { bg: "#C0E8FF", c: "#000" },
    "\uC644\uC131": { bg: "#EF00D2", c: "#000" }
  };
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
  var STAGE_ORDER = ["\uCC3E\uAE30", "\uD569\uC790", "\uC721\uB530\uAE30", "\uC601\uB530\uAE30", "\uBCF5\uC74C\uBC29", "\uC13C\uD655", "\uC218\uC2E0"];
  var REGION_ORDER = ["\uD654\uC815", "\uB300\uD559", "\uC0C1\uC554", "\uBA85\uB3D9", "\uC0C8\uC18C\uB9DD", "\uC0C8\uC2E0\uC790", "\uC644\uC131"];
  function getColumnLabel(columns, key) {
    const col = columns.find((c) => c.key === key);
    return col ? col.label : key;
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
    return `nt_prefs_${tableType}_v2`;
  }
  function formatDateShort(d) {
    if (!d) return "";
    const s = String(d).split("T")[0];
    const parts = s.split("-");
    if (parts.length >= 3) return `${parseInt(parts[1])}\uC6D4 ${parseInt(parts[2])}\uC77C`;
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    return `${date.getMonth() + 1}\uC6D4 ${date.getDate()}\uC77C`;
  }

  // src/StageBadge.jsx
  var STAGE_STYLES = {
    DB: "border-stone-200 bg-stone-50 text-stone-500",
    TM: "border-blue-200 bg-blue-50 text-blue-600",
    "\uC900\uBE44\uD569": "border-violet-200 bg-violet-50 text-violet-600",
    "\uC911\uC7A5\uAE30": "border-purple-200 bg-purple-50 text-purple-600",
    "\uCC3E\uAE30": "border-teal-200 bg-teal-50 text-teal-700",
    "\uC778\uD130\uBDF0": "border-orange-200 bg-orange-50 text-orange-600",
    "\uD569\uC790": "border-yellow-200 bg-yellow-50 text-yellow-700",
    "\uC721\uB530\uAE30": "border-green-200 bg-green-50 text-green-600",
    "\uC601\uB530\uAE30": "border-cyan-200 bg-cyan-50 text-cyan-600",
    "\uBCF5\uC74C\uBC29": "border-pink-200 bg-pink-50 text-pink-600",
    "\uC13C\uD655": "border-violet-200 bg-violet-50 text-violet-600",
    "\uC13C\uB4F1": "border-violet-200 bg-violet-50 text-violet-600",
    "\uC218\uC2E0": "border-purple-200 bg-purple-50 text-purple-600"
  };
  var STAGE_DOTS = {
    DB: "bg-stone-400",
    TM: "bg-blue-400",
    "\uC900\uBE44\uD569": "bg-violet-500",
    "\uC911\uC7A5\uAE30": "bg-purple-500",
    "\uCC3E\uAE30": "bg-teal-400",
    "\uC778\uD130\uBDF0": "bg-orange-400",
    "\uD569\uC790": "bg-yellow-400",
    "\uC721\uB530\uAE30": "bg-green-500",
    "\uC601\uB530\uAE30": "bg-cyan-500",
    "\uBCF5\uC74C\uBC29": "bg-pink-500",
    "\uC13C\uD655": "bg-violet-500",
    "\uC13C\uB4F1": "bg-violet-500",
    "\uC218\uC2E0": "bg-purple-500"
  };
  var TM_STYLES = {
    "\uBC88\uD638\uB2E4\uB984": "border-slate-200 bg-slate-50 text-slate-400",
    "\uCC29\uC2E0\uC804\uD658": "border-slate-200 bg-slate-50 text-slate-400",
    "\uB098\uC774\uBE44\uD569": "border-red-100 bg-red-50 text-red-400",
    "\uD658\uACBD\uBE44\uD569": "border-red-100 bg-red-50 text-red-400",
    "\uAC70\uB9AC\uBE44\uD569": "border-red-100 bg-red-50 text-red-400",
    "\uC778\uC131\uBE44\uD569": "border-red-100 bg-red-50 text-red-400",
    "\uCC45\uC790\uAC70\uC808": "border-rose-100 bg-rose-50 text-rose-400",
    "\uCEE8\uC124\uD305\uAC70\uC808": "border-rose-100 bg-rose-50 text-rose-400",
    "\uC911\uBCF5": "border-slate-200 bg-slate-50 text-slate-400",
    "\uCC28\uB2E8": "border-slate-200 bg-slate-50 text-slate-400",
    "\uBD80\uC7AC": "border-yellow-200 bg-yellow-50 text-yellow-600",
    "\uCCAB\uC778\uC0AC(\uC548\uC77D\uC539)": "border-yellow-200 bg-yellow-50 text-yellow-600",
    "\uCCAB\uC778\uC0AC(\uC77D\uC539)": "border-amber-200 bg-amber-50 text-amber-600",
    "\uACE0\uBBFC\uD30C\uC545(\uBA48\uCDA4)": "border-lime-200 bg-lime-50 text-lime-600",
    "\uCE74\uD1A1\uC911": "border-green-200 bg-green-50 text-green-600",
    "\uCC45\uC790\uC804\uB2EC": "border-emerald-200 bg-emerald-50 text-emerald-600",
    "\uC804\uD654\uC608\uC57D": "border-teal-200 bg-teal-50 text-teal-600",
    "\uB9CC\uB0A8\uC7A1\uD798": "border-blue-200 bg-blue-50 text-blue-600",
    "\uC900\uBE44\uD569": "border-violet-200 bg-violet-50 text-violet-600",
    "\uC911\uC7A5\uAE30": "border-purple-200 bg-purple-50 text-purple-600"
  };
  var TM_DOTS = {
    "\uBC88\uD638\uB2E4\uB984": "bg-slate-300",
    "\uCC29\uC2E0\uC804\uD658": "bg-slate-300",
    "\uB098\uC774\uBE44\uD569": "bg-red-300",
    "\uD658\uACBD\uBE44\uD569": "bg-red-300",
    "\uAC70\uB9AC\uBE44\uD569": "bg-red-300",
    "\uC778\uC131\uBE44\uD569": "bg-red-300",
    "\uCC45\uC790\uAC70\uC808": "bg-rose-300",
    "\uCEE8\uC124\uD305\uAC70\uC808": "bg-rose-300",
    "\uC911\uBCF5": "bg-slate-300",
    "\uCC28\uB2E8": "bg-slate-300",
    "\uBD80\uC7AC": "bg-yellow-400",
    "\uCCAB\uC778\uC0AC(\uC548\uC77D\uC539)": "bg-yellow-400",
    "\uCCAB\uC778\uC0AC(\uC77D\uC539)": "bg-amber-400",
    "\uACE0\uBBFC\uD30C\uC545(\uBA48\uCDA4)": "bg-lime-500",
    "\uCE74\uD1A1\uC911": "bg-green-500",
    "\uCC45\uC790\uC804\uB2EC": "bg-emerald-500",
    "\uC804\uD654\uC608\uC57D": "bg-teal-500",
    "\uB9CC\uB0A8\uC7A1\uD798": "bg-blue-500",
    "\uC900\uBE44\uD569": "bg-violet-500",
    "\uC911\uC7A5\uAE30": "bg-purple-500"
  };
  var GENDER_STYLES = { "\uB0A8": "border-blue-200 bg-blue-50 text-blue-600", "\uC5EC": "border-pink-200 bg-pink-50 text-pink-600" };
  var GENDER_DOTS = { "\uB0A8": "bg-blue-500", "\uC5EC": "bg-pink-500" };
  var MEETING_STYLES = { "\uC88B\uC74C": "border-green-200 bg-green-50 text-green-600", "\uBCF4\uD1B5": "border-yellow-200 bg-yellow-50 text-yellow-600", "\uBD80\uC815\uC801": "border-red-200 bg-red-50 text-red-600" };
  var MEETING_DOTS = { "\uC88B\uC74C": "bg-green-500", "\uBCF4\uD1B5": "bg-yellow-400", "\uBD80\uC815\uC801": "bg-red-500" };
  var TYPE_MAP = {
    stage: { styles: STAGE_STYLES, dots: STAGE_DOTS },
    tm_status: { styles: TM_STYLES, dots: TM_DOTS },
    gender: { styles: GENDER_STYLES, dots: GENDER_DOTS },
    meeting: { styles: MEETING_STYLES, dots: MEETING_DOTS }
  };
  function StageBadge({ value, type }) {
    if (!value) return /* @__PURE__ */ import_react4.default.createElement("span", { className: "text-slate-300 text-xs" }, "\u2014");
    if (type === "region") {
      const colors = REGION_COLORS[value];
      if (colors) {
        return /* @__PURE__ */ import_react4.default.createElement(
          "span",
          {
            className: "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
            style: { backgroundColor: colors.bg, color: colors.c }
          },
          value
        );
      }
      return /* @__PURE__ */ import_react4.default.createElement("span", { className: "text-xs" }, value);
    }
    const map = TYPE_MAP[type];
    if (!map) return /* @__PURE__ */ import_react4.default.createElement("span", { className: "text-xs" }, value);
    const s = map.styles[value] || "border-slate-200 bg-slate-50 text-slate-500";
    const d = map.dots[value] || "bg-slate-300";
    return /* @__PURE__ */ import_react4.default.createElement(Badge, { className: cn("gap-1.5 text-[11.5px] font-medium", s) }, /* @__PURE__ */ import_react4.default.createElement("span", { className: cn("h-1.5 w-1.5 shrink-0 rounded-full", d) }), value);
  }

  // src/ColoredSelect.jsx
  var import_react5 = __toESM(__require("react"));
  var import_react_dom = __toESM(__require("react-dom"));
  function ColoredSelect({ value, onChange, onBlur, groups, options, placeholder = "\u2014 \uC120\uD0DD \u2014", className, autoFocus = false }) {
    const [open, setOpen] = (0, import_react5.useState)(autoFocus);
    const containerRef = (0, import_react5.useRef)(null);
    const listRef = (0, import_react5.useRef)(null);
    const [dropdownStyle, setDropdownStyle] = (0, import_react5.useState)({});
    (0, import_react5.useEffect)(() => {
      function handleClickOutside(e) {
        if (containerRef.current && !containerRef.current.contains(e.target) && listRef.current && !listRef.current.contains(e.target)) {
          setOpen(false);
          onBlur && onBlur();
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onBlur]);
    (0, import_react5.useEffect)(() => {
      if (open && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropUp = spaceBelow < 220 && rect.top > 220;
        setDropdownStyle({
          left: rect.left,
          width: Math.max(rect.width, 180),
          ...dropUp ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }
        });
      }
      if (open && listRef.current) {
        const active = listRef.current.querySelector("[data-active='true']");
        if (active) active.scrollIntoView({ block: "nearest" });
      }
    }, [open]);
    function handleSelect(val) {
      onChange(val);
      setOpen(false);
      onBlur && onBlur();
    }
    const selectedOption = findOption(value, groups, options);
    const listContent = /* @__PURE__ */ import_react5.default.createElement(
      "div",
      {
        ref: listRef,
        className: "fixed z-[9999] max-h-52 min-w-[180px] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl",
        style: dropdownStyle
      },
      /* @__PURE__ */ import_react5.default.createElement(
        "button",
        {
          type: "button",
          onClick: () => handleSelect(""),
          className: "flex w-full items-center px-2.5 py-1.5 text-[12px] text-slate-400 hover:bg-slate-50 transition-colors"
        },
        placeholder
      ),
      groups ? groups.map((group) => /* @__PURE__ */ import_react5.default.createElement("div", { key: group.label }, /* @__PURE__ */ import_react5.default.createElement(
        "div",
        {
          className: "sticky top-0 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
          style: { color: group.labelColor || "#94a3b8" }
        },
        group.label
      ), group.options.map((opt) => {
        const o = typeof opt === "string" ? { value: opt } : opt;
        return /* @__PURE__ */ import_react5.default.createElement(
          "button",
          {
            key: o.value,
            type: "button",
            "data-active": o.value === value,
            onClick: () => handleSelect(o.value),
            className: cn(
              "flex w-full items-center gap-2 px-2.5 py-1.5 text-[12px] transition-colors",
              o.value === value ? "bg-blue-50 font-medium" : "hover:bg-slate-50"
            )
          },
          o.dotColor && /* @__PURE__ */ import_react5.default.createElement("span", { className: "h-2 w-2 shrink-0 rounded-full", style: { backgroundColor: o.dotColor } }),
          /* @__PURE__ */ import_react5.default.createElement("span", { style: { color: o.textColor } }, o.label || o.value)
        );
      }))) : options ? options.map((opt) => {
        const o = typeof opt === "string" ? { value: opt } : opt;
        return /* @__PURE__ */ import_react5.default.createElement(
          "button",
          {
            key: o.value,
            type: "button",
            "data-active": o.value === value,
            onClick: () => handleSelect(o.value),
            className: cn(
              "flex w-full items-center gap-2 px-2.5 py-1.5 text-[12px] transition-colors",
              o.value === value ? "bg-blue-50 font-medium" : "hover:bg-slate-50"
            )
          },
          o.dotColor && /* @__PURE__ */ import_react5.default.createElement("span", { className: "h-2 w-2 shrink-0 rounded-full", style: { backgroundColor: o.dotColor } }),
          /* @__PURE__ */ import_react5.default.createElement("span", { style: { color: o.textColor } }, o.label || o.value)
        );
      }) : null
    );
    return /* @__PURE__ */ import_react5.default.createElement("div", { ref: containerRef, className: cn("relative", className) }, /* @__PURE__ */ import_react5.default.createElement(
      "button",
      {
        type: "button",
        onClick: () => setOpen(!open),
        className: "flex w-full items-center gap-1.5 rounded-md border border-blue-300 bg-white px-2 py-1 text-left text-[12px] outline-none focus:ring-2 focus:ring-blue-200 transition-shadow"
      },
      selectedOption ? /* @__PURE__ */ import_react5.default.createElement("span", { className: "flex items-center gap-1.5 truncate" }, selectedOption.dotColor && /* @__PURE__ */ import_react5.default.createElement("span", { className: "h-2 w-2 shrink-0 rounded-full", style: { backgroundColor: selectedOption.dotColor } }), /* @__PURE__ */ import_react5.default.createElement("span", { style: { color: selectedOption.textColor } }, selectedOption.label || selectedOption.value)) : /* @__PURE__ */ import_react5.default.createElement("span", { className: "text-slate-400" }, placeholder),
      /* @__PURE__ */ import_react5.default.createElement("svg", { className: "ml-auto h-3 w-3 shrink-0 text-slate-400", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ import_react5.default.createElement("path", { d: "M6 9l6 6 6-6" }))
    ), open && import_react_dom.default.createPortal(listContent, document.body));
  }
  function findOption(value, groups, options) {
    if (!value) return null;
    if (groups) {
      for (const g of groups) {
        for (const opt of g.options) {
          const o = typeof opt === "string" ? { value: opt } : opt;
          if (o.value === value) return o;
        }
      }
    }
    if (options) {
      for (const opt of options) {
        const o = typeof opt === "string" ? { value: opt } : opt;
        if (o.value === value) return o;
      }
    }
    return null;
  }

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
  var TM_STATUS_DONE = ["\uB9CC\uB0A8\uC7A1\uD798", "\uC900\uBE44\uD569", "\uC911\uC7A5\uAE30"];
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
  var TM_TEXT_COLORS = {
    "\uBC88\uD638\uB2E4\uB984": "#9ca3af",
    "\uCC29\uC2E0\uC804\uD658": "#9ca3af",
    "\uB098\uC774\uBE44\uD569": "#ef4444",
    "\uD658\uACBD\uBE44\uD569": "#ef4444",
    "\uAC70\uB9AC\uBE44\uD569": "#ef4444",
    "\uC778\uC131\uBE44\uD569": "#ef4444",
    "\uCC45\uC790\uAC70\uC808": "#f43f5e",
    "\uCEE8\uC124\uD305\uAC70\uC808": "#f43f5e",
    "\uC911\uBCF5": "#9ca3af",
    "\uCC28\uB2E8": "#9ca3af",
    "\uBD80\uC7AC": "#ca8a04",
    "\uCCAB\uC778\uC0AC(\uC548\uC77D\uC539)": "#ca8a04",
    "\uCCAB\uC778\uC0AC(\uC77D\uC539)": "#d97706",
    "\uACE0\uBBFC\uD30C\uC545(\uBA48\uCDA4)": "#65a30d",
    "\uCE74\uD1A1\uC911": "#16a34a",
    "\uCC45\uC790\uC804\uB2EC": "#059669",
    "\uC804\uD654\uC608\uC57D": "#0d9488",
    "\uB9CC\uB0A8\uC7A1\uD798": "#2563eb",
    "\uC900\uBE44\uD569": "#7c3aed",
    "\uC911\uC7A5\uAE30": "#9333ea"
  };
  function getTmStatusGroups() {
    return [
      {
        label: "\uC9C4\uD589\uBD88\uAC00",
        labelColor: "#ef4444",
        options: TM_STATUS_BLOCKED.map((v) => ({ value: v, dotColor: TM_DOT_COLORS[v], textColor: TM_TEXT_COLORS[v] }))
      },
      {
        label: "\uC2DC\uB3C4\uAC00\uB2A5",
        labelColor: "#ca8a04",
        options: TM_STATUS_TRYING.map((v) => ({ value: v, dotColor: TM_DOT_COLORS[v], textColor: TM_TEXT_COLORS[v] }))
      },
      {
        label: "\uC12D\uC678\uC644\uB8CC",
        labelColor: "#7c3aed",
        options: TM_STATUS_DONE.map((v) => ({ value: v, dotColor: TM_DOT_COLORS[v], textColor: TM_TEXT_COLORS[v] }))
      }
    ];
  }
  var TM_STATUS_GROUPS = [
    { label: "\uC9C4\uD589\uBD88\uAC00", labelColor: "#ef4444", options: TM_STATUS_BLOCKED },
    { label: "\uC2DC\uB3C4\uAC00\uB2A5", labelColor: "#ca8a04", options: TM_STATUS_TRYING },
    { label: "\uC12D\uC678\uC644\uB8CC", labelColor: "#7c3aed", options: TM_STATUS_DONE }
  ];
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
    "\uB2E8\uACC4": ["\uCC3E\uAE30", "\uD569\uC790", "\uC721\uB530\uAE30", "\uC601\uB530\uAE30", "\uBCF5\uC74C\uBC29", "\uC13C\uD655", "\uC218\uC2E0"],
    "\uCEE8\uC124\uD305\uC720\uBB34": ["\uCEE8\uC124\uD305", "\uC778\uD130\uBDF0"]
  };
  function getSelectOptions(key, dynamicOptions) {
    if (dynamicOptions && dynamicOptions[key]) return dynamicOptions[key];
    return DEFAULT_SELECT_OPTIONS[key] || [];
  }

  // src/InlineEditCell.jsx
  function InlineEditCell({
    rowId,
    field,
    value,
    columnDef = {},
    selectOptions = [],
    tmStatusGroups = [],
    onSaved,
    badgeType
  }) {
    const [isEditing, setIsEditing] = (0, import_react6.useState)(false);
    const [editValue, setEditValue] = (0, import_react6.useState)(value);
    const [isSaving, setIsSaving] = (0, import_react6.useState)(false);
    (0, import_react6.useEffect)(() => {
      setEditValue(value);
    }, [value]);
    const { type = "text", readonly = false } = columnDef;
    if (readonly) return /* @__PURE__ */ import_react6.default.createElement(DisplayValue, { value, type, badgeType });
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
      if (e.key === "Enter" && type !== "textarea") handleSave(editValue);
    };
    if (!isEditing) {
      return /* @__PURE__ */ import_react6.default.createElement("div", { onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react6.default.createElement(
        "button",
        {
          onClick: () => {
            setEditValue(value);
            setIsEditing(true);
          },
          title: "\uD074\uB9AD\uD558\uC5EC \uC218\uC815",
          className: "group/cell flex w-full cursor-pointer items-center rounded px-1 py-0.5 text-left hover:bg-blue-50/30 transition-colors"
        },
        /* @__PURE__ */ import_react6.default.createElement(DisplayValue, { value, type, badgeType }),
        /* @__PURE__ */ import_react6.default.createElement("span", { className: "shrink-0 ml-1 w-3 text-center text-[10px] text-blue-400 opacity-0 group-hover/cell:opacity-100 transition-opacity" }, "\u270E")
      ), isSaving && /* @__PURE__ */ import_react6.default.createElement("div", { className: "mt-0.5 text-[10px] text-slate-400" }, "\uC800\uC7A5\uC911..."));
    }
    const inputCls = "rounded-md border border-blue-300 bg-white px-2 py-1 text-[12px] outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 w-full transition-shadow";
    if (field === "TM\uD604\uC7AC\uC0C1\uD0DC") {
      return /* @__PURE__ */ import_react6.default.createElement("div", { className: "min-w-[100px]", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react6.default.createElement(
        ColoredSelect,
        {
          value: editValue || "",
          onChange: (v) => {
            setEditValue(v);
            handleSave(v || null);
          },
          onBlur: handleCancel,
          groups: getTmStatusGroups(),
          autoFocus: true
        }
      ), isSaving && /* @__PURE__ */ import_react6.default.createElement("div", { className: "mt-0.5 text-[10px] text-slate-400" }, "\uC800\uC7A5\uC911..."));
    }
    if (type === "select") {
      return /* @__PURE__ */ import_react6.default.createElement("div", { onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react6.default.createElement(
        "select",
        {
          className: inputCls,
          value: editValue || "",
          onChange: (e) => handleSave(e.target.value || null),
          onBlur: handleCancel,
          onKeyDown: handleKeyDown,
          autoFocus: true
        },
        /* @__PURE__ */ import_react6.default.createElement("option", { value: "" }, "\u2014 \uC120\uD0DD \u2014"),
        selectOptions.map((opt) => /* @__PURE__ */ import_react6.default.createElement("option", { key: opt, value: opt }, opt))
      ));
    }
    if (type === "date") {
      return /* @__PURE__ */ import_react6.default.createElement("div", { onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react6.default.createElement(
        "input",
        {
          type: "date",
          className: inputCls,
          value: editValue ? new Date(editValue).toISOString().split("T")[0] : "",
          onChange: (e) => setEditValue(e.target.value),
          onBlur: () => handleSave(editValue ? new Date(editValue).toISOString() : null),
          onKeyDown: handleKeyDown,
          autoFocus: true
        }
      ));
    }
    if (type === "time") {
      return /* @__PURE__ */ import_react6.default.createElement("div", { onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react6.default.createElement(
        "input",
        {
          type: "time",
          className: inputCls,
          value: editValue || "",
          onChange: (e) => setEditValue(e.target.value),
          onBlur: () => handleSave(editValue || null),
          onKeyDown: handleKeyDown,
          autoFocus: true
        }
      ));
    }
    if (type === "number") {
      return /* @__PURE__ */ import_react6.default.createElement("div", { onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react6.default.createElement(
        "input",
        {
          type: "number",
          className: inputCls,
          value: editValue || "",
          onChange: (e) => setEditValue(e.target.value ? parseInt(e.target.value) : null),
          onBlur: () => handleSave(editValue != null ? editValue : null),
          onKeyDown: handleKeyDown,
          autoFocus: true
        }
      ));
    }
    if (type === "textarea") {
      return /* @__PURE__ */ import_react6.default.createElement("div", { className: "min-w-[100px]", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react6.default.createElement(
        "textarea",
        {
          className: inputCls + " resize-none",
          value: editValue || "",
          rows: 2,
          onChange: (e) => setEditValue(e.target.value),
          onKeyDown: handleKeyDown,
          autoFocus: true
        }
      ), /* @__PURE__ */ import_react6.default.createElement("div", { className: "flex gap-1 mt-1" }, /* @__PURE__ */ import_react6.default.createElement(
        "button",
        {
          onClick: () => handleSave(editValue || null),
          disabled: isSaving,
          className: "rounded-md bg-blue-500 px-2 py-0.5 text-xs text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
        },
        isSaving ? "\uC800\uC7A5\uC911" : "\uC800\uC7A5"
      ), /* @__PURE__ */ import_react6.default.createElement(
        "button",
        {
          onClick: handleCancel,
          className: "rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100 transition-colors"
        },
        "\uCDE8\uC18C"
      )));
    }
    if (type === "dayselect") {
      const daysArray = Array.isArray(editValue) ? editValue : [];
      return /* @__PURE__ */ import_react6.default.createElement("div", { onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "flex gap-1 flex-wrap" }, DAYS_OF_WEEK.map((day) => /* @__PURE__ */ import_react6.default.createElement("label", { key: day, className: "flex items-center gap-1 text-[11px] cursor-pointer" }, /* @__PURE__ */ import_react6.default.createElement(
        "input",
        {
          type: "checkbox",
          checked: daysArray.includes(day),
          onChange: (e) => setEditValue(e.target.checked ? [...daysArray, day] : daysArray.filter((d) => d !== day))
        }
      ), day))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "flex gap-1 mt-1" }, /* @__PURE__ */ import_react6.default.createElement("button", { onClick: () => handleSave(editValue), className: "rounded-md bg-blue-500 px-2 py-0.5 text-xs text-white hover:bg-blue-600" }, "\uC800\uC7A5"), /* @__PURE__ */ import_react6.default.createElement("button", { onClick: handleCancel, className: "rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100" }, "\uCDE8\uC18C")));
    }
    return /* @__PURE__ */ import_react6.default.createElement("div", { onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react6.default.createElement(
      "input",
      {
        type: "text",
        className: inputCls,
        value: editValue || "",
        onChange: (e) => setEditValue(e.target.value),
        onBlur: () => handleSave(editValue || null),
        onKeyDown: handleKeyDown,
        autoFocus: true
      }
    ), isSaving && /* @__PURE__ */ import_react6.default.createElement("div", { className: "mt-0.5 text-[10px] text-slate-400" }, "\uC800\uC7A5\uC911..."));
  }
  function DisplayValue({ value, type, badgeType }) {
    if (value == null || value === "") return /* @__PURE__ */ import_react6.default.createElement("span", { className: "text-slate-200 text-[12px]" }, "\u2014");
    if (badgeType) return /* @__PURE__ */ import_react6.default.createElement(StageBadge, { value: String(value), type: badgeType });
    if (type === "date") return /* @__PURE__ */ import_react6.default.createElement("span", { className: "text-[11px] text-slate-500 whitespace-nowrap" }, formatDateShort(value));
    if (type === "time") {
      const s = String(value);
      const tIdx = s.indexOf("T");
      const hhmm = tIdx !== -1 ? s.slice(tIdx + 1, tIdx + 6) : s.match(/\d{1,2}:\d{2}/)?.[0] || s.slice(0, 5);
      return /* @__PURE__ */ import_react6.default.createElement("span", { className: "text-[11px] text-slate-500 whitespace-nowrap" }, hhmm);
    }
    if (type === "number") return /* @__PURE__ */ import_react6.default.createElement("span", { className: "text-[12px] tabular-nums" }, value);
    if (type === "dayselect" && Array.isArray(value)) return /* @__PURE__ */ import_react6.default.createElement("span", { className: "text-[12px]" }, value.join(""));
    if (type === "checklist" && Array.isArray(value)) return /* @__PURE__ */ import_react6.default.createElement("span", { className: "text-[12px]" }, value.length > 0 ? `${value.length}\uAC1C` : "\u2014");
    return /* @__PURE__ */ import_react6.default.createElement("span", { className: "text-[12px] text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis" }, String(value));
  }
  async function saveField(rowId, field, value) {
    if (typeof window.USE_SAMPLE !== "undefined" && window.USE_SAMPLE) {
      const row = (window.STATE?.dbFindings || []).find((r) => r.id === rowId || r.__rowIndex === rowId);
      if (row) row[field] = value;
      return;
    }
    const updateObj = {};
    updateObj[field] = value || null;
    const { error } = await window.SUPA.from("db_findings").update(updateObj).eq("id", rowId);
    if (error) throw new Error(error.message);
  }

  // src/NotionTable.jsx
  function matchesFilterPattern(value, pattern) {
    if (!pattern) return true;
    const lv = value.toLowerCase();
    const orGroups = pattern.split("|").map((s) => s.trim()).filter(Boolean);
    if (orGroups.length === 0) return true;
    return orGroups.some((group) => {
      const andTerms = group.split("&").map((s) => s.trim()).filter(Boolean);
      return andTerms.every((term) => lv.includes(term.toLowerCase()));
    });
  }
  function getPageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [1];
    if (current > 3) pages.push("dots");
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push("dots");
    pages.push(total);
    return pages;
  }
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
    const allKeys = columns.map((c) => c.key);
    const storageKey = getStorageKey(tableType);
    const loadPrefs = () => {
      try {
        const r = localStorage.getItem(storageKey);
        return r ? JSON.parse(r) : null;
      } catch {
        return null;
      }
    };
    const [visibleColumns, setVisibleColumns] = (0, import_react7.useState)(() => {
      const p = loadPrefs();
      return p?.visibleColumns?.filter((k) => allKeys.includes(k)) || [...allKeys];
    });
    const [columnOrder, setColumnOrder] = (0, import_react7.useState)(() => {
      const p = loadPrefs();
      const saved = p?.columnOrder?.filter((k) => allKeys.includes(k)) || [];
      const miss = allKeys.filter((k) => !saved.includes(k));
      return saved.length > 0 ? [...saved, ...miss] : [...allKeys];
    });
    const [frozenCount, setFrozenCount] = (0, import_react7.useState)(() => loadPrefs()?.frozenCount || 0);
    const [colWidths, setColWidths] = (0, import_react7.useState)(() => loadPrefs()?.colWidths || {});
    const [sortKeys, setSortKeys] = (0, import_react7.useState)([]);
    const [filters, setFilters] = (0, import_react7.useState)({});
    const [activeFilterCol, setActiveFilterCol] = (0, import_react7.useState)(null);
    const [headerMenuCol, setHeaderMenuCol] = (0, import_react7.useState)(null);
    const [currentPage, setCurrentPage] = (0, import_react7.useState)(1);
    const [searchQuery, setSearchQuery] = (0, import_react7.useState)("");
    const [debouncedSearch, setDebouncedSearch] = (0, import_react7.useState)("");
    const searchTimerRef = (0, import_react7.useRef)(null);
    const [dragCol, setDragCol] = (0, import_react7.useState)(null);
    const [dragOverCol, setDragOverCol] = (0, import_react7.useState)(null);
    const tableRef = (0, import_react7.useRef)(null);
    const handleSearchChange = (0, import_react7.useCallback)((value) => {
      setSearchQuery(value);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        setDebouncedSearch(value);
        setCurrentPage(1);
      }, 300);
    }, []);
    const getEffectiveWidth = (0, import_react7.useCallback)((key) => colWidths[key] || columns.find((c) => c.key === key)?.width || 100, [colWidths, columns]);
    (0, import_react7.useEffect)(() => {
      localStorage.setItem(storageKey, JSON.stringify({ visibleColumns, columnOrder, frozenCount, colWidths }));
    }, [visibleColumns, columnOrder, frozenCount, colWidths, storageKey]);
    const toggleColumn = (0, import_react7.useCallback)((col) => setVisibleColumns((prev) => prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]), []);
    const showAllColumns = (0, import_react7.useCallback)(() => setVisibleColumns([...allKeys]), [allKeys]);
    const resetColumns = (0, import_react7.useCallback)(() => {
      setVisibleColumns([...allKeys]);
      setColumnOrder([...allKeys]);
    }, [allKeys]);
    const clearSort = (0, import_react7.useCallback)(() => setSortKeys([]), []);
    const handleSortDirection = (0, import_react7.useCallback)((col, dir) => {
      setSortKeys((prev) => {
        const filtered = prev.filter((s) => s.key !== col);
        return [...filtered, { key: col, dir }];
      });
    }, []);
    const clearSortForCol = (0, import_react7.useCallback)((col) => setSortKeys((prev) => prev.filter((s) => s.key !== col)), []);
    const addFilter = (0, import_react7.useCallback)((col) => {
      const colDef = columns.find((c) => c.key === col);
      const opts = getSelectOptions(col, dynamicSelectOptions);
      let type = "text";
      if (opts.length > 0 || colDef?.type === "select") type = "select";
      else if (colDef?.type === "date") type = "date";
      else if (colDef?.type === "number") type = "number";
      setFilters((prev) => ({ ...prev, [col]: { type, textValue: "", selectedValues: [], dateFrom: "", dateTo: "" } }));
      setActiveFilterCol(col);
    }, [columns, dynamicSelectOptions]);
    const removeFilter = (0, import_react7.useCallback)((col) => {
      setFilters((prev) => {
        const n = { ...prev };
        delete n[col];
        return n;
      });
      if (activeFilterCol === col) setActiveFilterCol(null);
    }, [activeFilterCol]);
    const updateFilter = (0, import_react7.useCallback)((col, u) => setFilters((prev) => ({ ...prev, [col]: { ...prev[col], ...u } })), []);
    const handleDragStart = (0, import_react7.useCallback)((col) => setDragCol(col), []);
    const handleDragOver = (0, import_react7.useCallback)((e, col) => {
      e.preventDefault();
      setDragOverCol(col);
    }, []);
    const handleDrop = (0, import_react7.useCallback)((tc) => {
      if (!dragCol || dragCol === tc) {
        setDragCol(null);
        setDragOverCol(null);
        return;
      }
      setColumnOrder((prev) => {
        const a = [...prev];
        const fi = a.indexOf(dragCol);
        const ti = a.indexOf(tc);
        if (fi === -1 || ti === -1) return prev;
        a.splice(fi, 1);
        a.splice(ti, 0, dragCol);
        return a;
      });
      setDragCol(null);
      setDragOverCol(null);
    }, [dragCol]);
    const displayColumns = (0, import_react7.useMemo)(() => columnOrder.filter((c) => visibleColumns.includes(c)), [columnOrder, visibleColumns]);
    const safeFrozen = Math.min(frozenCount, displayColumns.length);
    const totalTableWidth = (0, import_react7.useMemo)(() => displayColumns.reduce((s, col) => s + getEffectiveWidth(col), 0), [displayColumns, getEffectiveWidth]);
    const frozenOffsets = (0, import_react7.useMemo)(() => {
      const offsets = [];
      let acc = 0;
      for (const col of displayColumns) {
        offsets.push(acc);
        acc += getEffectiveWidth(col);
      }
      return offsets;
    }, [displayColumns, getEffectiveWidth]);
    const filteredData = (0, import_react7.useMemo)(() => {
      let r = [...data];
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        r = r.filter((row) => searchFields.some((f) => {
          const v = row[f];
          return v && String(v).toLowerCase().includes(q);
        }));
      }
      Object.entries(filters).forEach(([col, f]) => {
        r = r.filter((row) => {
          const raw = row[col];
          const v = raw == null ? "" : String(raw);
          switch (f.type) {
            case "text":
              if (f.emptyOnly) return v === "";
              return matchesFilterPattern(v, f.textValue || "");
            case "select":
              return !f.selectedValues?.length || f.selectedValues.includes(v);
            case "date": {
              const d = v.split("T")[0];
              if (f.dateFrom && d < f.dateFrom) return false;
              if (f.dateTo && d > f.dateTo) return false;
              return true;
            }
            case "number": {
              const n = parseFloat(v);
              if (isNaN(n)) return !f.numberMin && !f.numberMax;
              if (f.numberMin != null && n < f.numberMin) return false;
              if (f.numberMax != null && n > f.numberMax) return false;
              return true;
            }
            default:
              return true;
          }
        });
      });
      return r;
    }, [data, debouncedSearch, filters, searchFields]);
    const sortedData = (0, import_react7.useMemo)(() => {
      if (sortKeys.length === 0) return filteredData;
      return [...filteredData].sort((a, b) => {
        for (const { key, dir } of sortKeys) {
          const av = a[key], bv = b[key];
          if (av == null) {
            if (bv != null) return 1;
            continue;
          }
          if (bv == null) return -1;
          if (["\uB2E8\uACC4", "\uAD6C\uBD84", "\uC2E4\uC801\uC9C0\uC5ED"].includes(key)) {
            const ai = getCustomSortIndex(columns, key, String(av));
            const bi = getCustomSortIndex(columns, key, String(bv));
            if (ai !== bi) return dir === "asc" ? ai - bi : bi - ai;
            continue;
          }
          const colDef = columns.find((c2) => c2.key === key);
          if (colDef?.type === "number") {
            const an = parseFloat(av) || 0, bn = parseFloat(bv) || 0;
            if (an !== bn) return dir === "asc" ? an - bn : bn - an;
            continue;
          }
          const c = String(av).localeCompare(String(bv), "ko");
          if (c !== 0) return dir === "asc" ? c : -c;
        }
        return 0;
      });
    }, [filteredData, sortKeys, columns]);
    const activeFilterCount = Object.keys(filters).length;
    const hasQuickFilter = debouncedSearch !== "" || activeFilterCount > 0;
    const filteredCount = filteredData.length;
    const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedData = sortedData.slice((safePage - 1) * pageSize, safePage * pageSize);
    const fromIdx = filteredCount > 0 ? (safePage - 1) * pageSize + 1 : 0;
    const toIdx = Math.min(safePage * pageSize, filteredCount);
    const empty = /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-warm-300" }, "\u2014");
    function renderCell(col, value, row) {
      if (col.type === "review") return renderReviewCell2 ? renderReviewCell2(row) : empty;
      if (col.badgeType && col.readonly) return value ? /* @__PURE__ */ import_react7.default.createElement(StageBadge, { value: String(value), type: col.badgeType }) : empty;
      if (col.badgeType && !col.readonly) {
        return /* @__PURE__ */ import_react7.default.createElement(
          InlineEditCell,
          {
            rowId: row.id || row.__rowIndex,
            field: col.key,
            value,
            columnDef: col,
            selectOptions: getSelectOptions(col.key, dynamicSelectOptions),
            tmStatusGroups,
            onSaved: onFieldSaved,
            badgeType: col.badgeType
          }
        );
      }
      if (col.readonly) {
        if (!value && value !== 0) return empty;
        if (col.type === "date") return /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-[11px] text-slate-500 whitespace-nowrap" }, formatDateShort(value));
        return /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-[12px] text-slate-700" }, String(value));
      }
      if (col.type === "checklist") {
        return Array.isArray(value) && value.length > 0 ? /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-[12px]" }, value.length, "\uAC1C") : empty;
      }
      return /* @__PURE__ */ import_react7.default.createElement(
        InlineEditCell,
        {
          rowId: row.id || row.__rowIndex,
          field: col.key,
          value,
          columnDef: col,
          selectOptions: getSelectOptions(col.key, dynamicSelectOptions),
          tmStatusGroups,
          onSaved: onFieldSaved
        }
      );
    }
    function getUniqueValues(col) {
      const s = /* @__PURE__ */ new Set();
      data.forEach((r) => {
        const v = r[col];
        if (v != null && v !== "") s.add(String(v));
      });
      return Array.from(s).sort((a, b) => a.localeCompare(b, "ko"));
    }
    return /* @__PURE__ */ import_react7.default.createElement("div", { className: "space-y-1.5" }, statsCards && /* @__PURE__ */ import_react7.default.createElement("div", { style: { marginBottom: "12px" } }, statsCards), /* @__PURE__ */ import_react7.default.createElement("div", { className: "relative" }, /* @__PURE__ */ import_react7.default.createElement(SearchIcon, { size: 15, className: "absolute left-3 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none" }), /* @__PURE__ */ import_react7.default.createElement(
      "input",
      {
        type: "text",
        value: searchQuery,
        onChange: (e) => handleSearchChange(e.target.value),
        placeholder: "\uC774\uB984, \uC804\uD654\uBC88\uD638\uB85C \uAC80\uC0C9...",
        className: "db-search-input"
      }
    )), /* @__PURE__ */ import_react7.default.createElement("div", { className: "flex flex-wrap items-center gap-2 rounded-t-xl bg-[#FAFAF9] border border-[#DDD8D3] border-b-0 px-3 py-2 -mb-2.5" }, /* @__PURE__ */ import_react7.default.createElement(Popover, null, /* @__PURE__ */ import_react7.default.createElement(PopoverTrigger, { asChild: true }, /* @__PURE__ */ import_react7.default.createElement(Button, { variant: "ghost", size: "sm", className: "gap-1.5 text-warm-600 hover:text-warm-800 hover:bg-warm-100" }, /* @__PURE__ */ import_react7.default.createElement(FilterIcon, { size: 14 }), /* @__PURE__ */ import_react7.default.createElement("span", { className: "font-medium" }, "\uD544\uD130"), activeFilterCount > 0 && /* @__PURE__ */ import_react7.default.createElement("span", { className: "flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#BB2720] text-[10px] font-bold text-white" }, activeFilterCount))), /* @__PURE__ */ import_react7.default.createElement(PopoverContent, { align: "start", className: "w-56 p-1.5", style: { maxHeight: 280 } }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "mb-1 px-2 py-1 text-[11px] font-semibold text-slate-400" }, "\uD544\uD130 \uCD94\uAC00"), /* @__PURE__ */ import_react7.default.createElement(ScrollArea, { style: { height: Math.min(220, allKeys.length * 30) } }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "space-y-0.5" }, columnOrder.map((col) => /* @__PURE__ */ import_react7.default.createElement(
      "button",
      {
        key: col,
        onClick: () => addFilter(col),
        disabled: !!filters[col],
        className: "w-full rounded-md px-2.5 py-1.5 text-left text-[12px] text-slate-600 hover:bg-blue-50 hover:text-blue-700 disabled:text-slate-300 transition-colors"
      },
      getColumnLabel(columns, col)
    )))))), sortKeys.map((s, i) => /* @__PURE__ */ import_react7.default.createElement(Badge, { key: s.key, variant: "secondary", className: "gap-1 py-1 text-[11px] font-normal bg-warm-100 text-warm-700" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "flex h-3.5 w-3.5 items-center justify-center rounded-full bg-warm-300 text-[8px] font-bold text-white" }, i + 1), getColumnLabel(columns, s.key), " ", /* @__PURE__ */ import_react7.default.createElement("span", { className: "font-semibold text-[#BB2720]" }, s.dir === "asc" ? "\u2191" : "\u2193"), /* @__PURE__ */ import_react7.default.createElement("button", { onClick: () => setSortKeys((prev) => prev.filter((_, j) => j !== i)), className: "ml-0.5 rounded-full hover:bg-warm-200 h-3.5 w-3.5 flex items-center justify-center text-warm-400 hover:text-warm-600 text-[10px]" }, "\xD7"))), sortKeys.length > 1 && /* @__PURE__ */ import_react7.default.createElement("button", { onClick: clearSort, className: "text-[10px] text-warm-400 hover:text-warm-600" }, "\uC815\uB82C \uCD08\uAE30\uD654"), Object.keys(filters).map((col) => /* @__PURE__ */ import_react7.default.createElement(Badge, { key: col, className: "gap-1.5 py-1 border-[#FDDCDA] bg-[#FEF2F1] text-[#BB2720] text-[11px] font-normal" }, /* @__PURE__ */ import_react7.default.createElement("button", { onClick: () => setActiveFilterCol(activeFilterCol === col ? null : col), className: "hover:underline font-medium" }, getColumnLabel(columns, col)), /* @__PURE__ */ import_react7.default.createElement("button", { onClick: () => removeFilter(col), className: "rounded-full h-3.5 w-3.5 flex items-center justify-center text-[#BB2720]/60 hover:text-[#BB2720] text-[10px]" }, "\xD7"))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "flex-1" }), /* @__PURE__ */ import_react7.default.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ import_react7.default.createElement(Popover, null, /* @__PURE__ */ import_react7.default.createElement(PopoverTrigger, { asChild: true }, /* @__PURE__ */ import_react7.default.createElement(Button, { variant: "ghost", size: "sm", className: "gap-1.5 text-warm-600 hover:text-warm-800 hover:bg-warm-100" }, /* @__PURE__ */ import_react7.default.createElement(PinIcon, { size: 14 }), /* @__PURE__ */ import_react7.default.createElement("span", { className: "font-medium" }, "\uACE0\uC815"), safeFrozen > 0 && /* @__PURE__ */ import_react7.default.createElement("span", { className: "flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#BB2720] text-[10px] font-bold text-white" }, safeFrozen))), /* @__PURE__ */ import_react7.default.createElement(PopoverContent, { align: "end", className: "w-48 p-1.5", style: { maxHeight: 280 } }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "mb-1 flex items-center justify-between px-2 py-1" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-[11px] font-semibold text-warm-500" }, "\uD2C0\uACE0\uC815"), safeFrozen > 0 && /* @__PURE__ */ import_react7.default.createElement("button", { onClick: () => setFrozenCount(0), className: "text-[11px] text-[#BB2720] hover:text-[#9B201A] font-medium" }, "\uD574\uC81C")), /* @__PURE__ */ import_react7.default.createElement(ScrollArea, { style: { height: Math.min(220, displayColumns.length * 28) } }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "space-y-0.5" }, displayColumns.slice(0, 10).map((col, i) => /* @__PURE__ */ import_react7.default.createElement(
      "button",
      {
        key: col,
        onClick: () => setFrozenCount(frozenCount === i + 1 ? 0 : i + 1),
        className: cn(
          "w-full rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors",
          i < safeFrozen ? "bg-[#FEF2F1] text-[#BB2720] font-medium" : "text-warm-600 hover:bg-warm-50"
        )
      },
      getColumnLabel(columns, col)
    )))))), /* @__PURE__ */ import_react7.default.createElement(Popover, null, /* @__PURE__ */ import_react7.default.createElement(PopoverTrigger, { asChild: true }, /* @__PURE__ */ import_react7.default.createElement(Button, { variant: "ghost", size: "sm", className: "gap-1.5 text-warm-600 hover:text-warm-800 hover:bg-warm-100" }, /* @__PURE__ */ import_react7.default.createElement(Columns3Icon, { size: 14 }), /* @__PURE__ */ import_react7.default.createElement("span", { className: "font-medium" }, "\uC5F4 \uC124\uC815"))), /* @__PURE__ */ import_react7.default.createElement(PopoverContent, { align: "end", className: "w-56 p-1.5", style: { maxHeight: 280 } }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "mb-1 flex items-center justify-between px-2 py-1" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-[11px] font-semibold text-warm-500" }, "\uD45C\uC2DC \uCEEC\uB7FC (", visibleColumns.length, "/", allKeys.length, ")"), /* @__PURE__ */ import_react7.default.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ import_react7.default.createElement("button", { onClick: showAllColumns, className: "text-[11px] text-[#BB2720] hover:text-[#9B201A] font-medium" }, "\uC804\uCCB4"), /* @__PURE__ */ import_react7.default.createElement("button", { onClick: resetColumns, className: "text-[11px] text-[#BB2720] hover:text-[#9B201A] font-medium" }, "\uCD08\uAE30\uD654"))), /* @__PURE__ */ import_react7.default.createElement(ScrollArea, { style: { height: Math.min(220, allKeys.length * 28) } }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "space-y-0.5" }, columnOrder.map((col) => /* @__PURE__ */ import_react7.default.createElement("label", { key: col, className: "flex items-center gap-2.5 rounded-md px-2.5 py-1 text-[12px] text-warm-600 hover:bg-warm-50 cursor-pointer" }, /* @__PURE__ */ import_react7.default.createElement(Checkbox, { checked: visibleColumns.includes(col), onCheckedChange: () => toggleColumn(col), className: "h-3.5 w-3.5" }), getColumnLabel(columns, col))))))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "h-4 w-px bg-warm-300" }), /* @__PURE__ */ import_react7.default.createElement(
      Button,
      {
        variant: "ghost",
        size: "sm",
        className: "gap-1.5 text-warm-600 hover:text-warm-800 hover:bg-warm-100",
        onClick: onRefresh,
        title: "\uC0C8\uB85C\uACE0\uCE68"
      },
      /* @__PURE__ */ import_react7.default.createElement(RefreshCwIcon, { size: 14 })
    ), /* @__PURE__ */ import_react7.default.createElement("div", { className: "h-4 w-px bg-warm-300" }), /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-[12px] font-medium text-warm-500 tabular-nums" }, hasQuickFilter ? /* @__PURE__ */ import_react7.default.createElement(import_react7.default.Fragment, null, /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-[#BB2720] font-semibold" }, filteredCount.toLocaleString()), /* @__PURE__ */ import_react7.default.createElement("span", { className: "font-normal" }, " / "), data.length.toLocaleString(), /* @__PURE__ */ import_react7.default.createElement("span", { className: "font-normal" }, "\uAC74")) : /* @__PURE__ */ import_react7.default.createElement(import_react7.default.Fragment, null, data.length.toLocaleString(), /* @__PURE__ */ import_react7.default.createElement("span", { className: "font-normal" }, "\uAC74"))))), activeFilterCol && filters[activeFilterCol] && /* @__PURE__ */ import_react7.default.createElement("div", { className: "rounded-xl border border-[#DDD8D3] bg-white px-4 py-3" }, /* @__PURE__ */ import_react7.default.createElement(
      FilterEditor,
      {
        col: activeFilterCol,
        filter: filters[activeFilterCol],
        data,
        columns,
        dynamicSelectOptions,
        getUniqueValues,
        onUpdate: (u) => updateFilter(activeFilterCol, u),
        onClose: () => setActiveFilterCol(null),
        onRemove: () => removeFilter(activeFilterCol)
      }
    )), /* @__PURE__ */ import_react7.default.createElement("div", { className: "rounded-b-xl border border-[#DDD8D3] bg-white shadow-sm overflow-hidden" }, /* @__PURE__ */ import_react7.default.createElement(Table, { ref: tableRef, style: { width: Math.max(totalTableWidth, 0), minWidth: "100%" } }, /* @__PURE__ */ import_react7.default.createElement("colgroup", null, displayColumns.map((col) => /* @__PURE__ */ import_react7.default.createElement("col", { key: col, style: { width: getEffectiveWidth(col) } }))), /* @__PURE__ */ import_react7.default.createElement(TableHeader, null, /* @__PURE__ */ import_react7.default.createElement(TableRow, null, displayColumns.map((col, colIdx) => {
      const si = sortKeys.findIndex((s) => s.key === col);
      const isSorted = si !== -1;
      const isColFrozen = colIdx < safeFrozen;
      return /* @__PURE__ */ import_react7.default.createElement(
        TableHead,
        {
          key: col,
          draggable: true,
          onDragStart: () => handleDragStart(col),
          onDragOver: (e) => handleDragOver(e, col),
          onDrop: () => handleDrop(col),
          onDragEnd: () => {
            setDragCol(null);
            setDragOverCol(null);
          },
          style: colIdx < safeFrozen ? { left: frozenOffsets[colIdx], zIndex: 30 } : void 0,
          className: cn(
            "relative select-none transition-colors",
            dragOverCol === col && "!border-l-2 !border-[#BB2720]",
            dragCol === col && "opacity-30",
            isSorted && "!text-warm-800",
            colIdx < safeFrozen && "frozen-col",
            colIdx === safeFrozen - 1 && "frozen-col-last"
          )
        },
        /* @__PURE__ */ import_react7.default.createElement(Popover, { open: headerMenuCol === col, onOpenChange: (open) => setHeaderMenuCol(open ? col : null) }, /* @__PURE__ */ import_react7.default.createElement(PopoverTrigger, { asChild: true }, /* @__PURE__ */ import_react7.default.createElement("button", { type: "button", className: "flex items-center gap-1 truncate w-full text-left outline-none cursor-pointer hover:text-warm-800" }, /* @__PURE__ */ import_react7.default.createElement("span", null, getColumnLabel(columns, col)), isSorted && /* @__PURE__ */ import_react7.default.createElement("span", { className: "flex items-center gap-0.5 shrink-0" }, sortKeys.length > 1 && /* @__PURE__ */ import_react7.default.createElement("span", { className: "flex h-3.5 w-3.5 items-center justify-center rounded-full bg-warm-400 text-[7px] font-bold text-white" }, si + 1), /* @__PURE__ */ import_react7.default.createElement("span", { className: "flex h-4 w-4 items-center justify-center rounded bg-[#FEF2F1] text-[#BB2720] text-[9px] font-bold" }, sortKeys[si].dir === "asc" ? "\u2191" : "\u2193")), !!filters[col] && /* @__PURE__ */ import_react7.default.createElement("span", { className: "h-1.5 w-1.5 rounded-full bg-[#BB2720] shrink-0" }))), /* @__PURE__ */ import_react7.default.createElement(PopoverContent, { align: "start", className: "w-44 p-1" }, /* @__PURE__ */ import_react7.default.createElement(
          "button",
          {
            onClick: () => {
              handleSortDirection(col, "asc");
              setHeaderMenuCol(null);
            },
            className: cn(
              "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors",
              isSorted && sortKeys[si].dir === "asc" ? "bg-warm-100 text-warm-800 font-medium" : "text-warm-600 hover:bg-warm-50"
            )
          },
          /* @__PURE__ */ import_react7.default.createElement(ArrowUpIcon, { size: 13 }),
          " \uC624\uB984\uCC28\uC21C \uC815\uB82C"
        ), /* @__PURE__ */ import_react7.default.createElement(
          "button",
          {
            onClick: () => {
              handleSortDirection(col, "desc");
              setHeaderMenuCol(null);
            },
            className: cn(
              "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors",
              isSorted && sortKeys[si].dir === "desc" ? "bg-warm-100 text-warm-800 font-medium" : "text-warm-600 hover:bg-warm-50"
            )
          },
          /* @__PURE__ */ import_react7.default.createElement(ArrowDownIcon, { size: 13 }),
          " \uB0B4\uB9BC\uCC28\uC21C \uC815\uB82C"
        ), isSorted && /* @__PURE__ */ import_react7.default.createElement(
          "button",
          {
            onClick: () => {
              clearSortForCol(col);
              setHeaderMenuCol(null);
            },
            className: "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-[#BB2720] hover:bg-red-50 transition-colors"
          },
          "\uC815\uB82C \uD574\uC81C"
        ), /* @__PURE__ */ import_react7.default.createElement("div", { className: "my-1 h-px bg-warm-200" }), /* @__PURE__ */ import_react7.default.createElement(
          "button",
          {
            onClick: () => {
              if (!filters[col]) addFilter(col);
              else setActiveFilterCol(col);
              setHeaderMenuCol(null);
            },
            className: cn(
              "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors",
              filters[col] ? "bg-red-50 text-[#BB2720] font-medium" : "text-warm-600 hover:bg-warm-50"
            )
          },
          /* @__PURE__ */ import_react7.default.createElement(FilterIcon, { size: 13 }),
          " ",
          filters[col] ? "\uD544\uD130 \uD3B8\uC9D1" : "\uD544\uD130 \uCD94\uAC00"
        ), /* @__PURE__ */ import_react7.default.createElement("div", { className: "my-1 h-px bg-warm-200" }), /* @__PURE__ */ import_react7.default.createElement(
          "button",
          {
            onClick: () => {
              setFrozenCount(isColFrozen ? 0 : colIdx + 1);
              setHeaderMenuCol(null);
            },
            className: cn(
              "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors",
              isColFrozen ? "bg-warm-100 text-warm-800 font-medium" : "text-warm-600 hover:bg-warm-50"
            )
          },
          /* @__PURE__ */ import_react7.default.createElement(PinIcon, { size: 13 }),
          " ",
          isColFrozen ? "\uACE0\uC815 \uD574\uC81C" : "\uC5EC\uAE30\uAE4C\uC9C0 \uACE0\uC815"
        ))),
        /* @__PURE__ */ import_react7.default.createElement(
          "div",
          {
            className: "absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-[#BB2720]/30 z-10",
            onPointerDown: (e) => {
              e.preventDefault();
              e.stopPropagation();
              const startX = e.clientX;
              const startWidth = getEffectiveWidth(col);
              const onMove = (ev) => setColWidths((prev) => ({ ...prev, [col]: Math.max(40, startWidth + ev.clientX - startX) }));
              const onUp = () => {
                document.removeEventListener("pointermove", onMove);
                document.removeEventListener("pointerup", onUp);
              };
              document.addEventListener("pointermove", onMove);
              document.addEventListener("pointerup", onUp);
            }
          }
        )
      );
    }))), /* @__PURE__ */ import_react7.default.createElement(TableBody, null, paginatedData.map((row, rowIdx) => /* @__PURE__ */ import_react7.default.createElement(
      TableRow,
      {
        key: row.id || row.__rowIndex || rowIdx,
        className: "group cursor-pointer",
        onClick: () => onRowClick && onRowClick(row)
      },
      displayColumns.map((col, colIdx) => {
        const colDef = columns.find((c) => c.key === col);
        const wrapCols = ["TM\uD604\uD669", "\uBE44\uACE0"];
        const cellCls = wrapCols.includes(col) ? "cell-wrap" : "";
        const frozen = colIdx < safeFrozen;
        return /* @__PURE__ */ import_react7.default.createElement(
          TableCell,
          {
            key: col,
            style: frozen ? { position: "sticky", left: frozenOffsets[colIdx], zIndex: 10 } : void 0,
            className: cn(cellCls, frozen && "frozen-col", colIdx === safeFrozen - 1 && "frozen-col-last")
          },
          colDef ? renderCell(colDef, row[col], row) : empty
        );
      })
    )), paginatedData.length < 5 && Array.from({ length: 5 - paginatedData.length }).map((_, i) => /* @__PURE__ */ import_react7.default.createElement(TableRow, { key: `empty-${i}`, className: "pointer-events-none" }, /* @__PURE__ */ import_react7.default.createElement(TableCell, { colSpan: displayColumns.length, className: "h-[41px]" }, paginatedData.length === 0 && i === 2 && /* @__PURE__ */ import_react7.default.createElement("div", { className: "flex items-center justify-center gap-2 text-warm-400" }, /* @__PURE__ */ import_react7.default.createElement(DocIcon, { size: 20, className: "text-warm-300" }), /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-sm" }, "\uD45C\uC2DC\uD560 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4")))))))), totalPages > 1 && /* @__PURE__ */ import_react7.default.createElement("div", { className: "flex items-center justify-between rounded-xl bg-white border border-[#DDD8D3] px-4 py-2.5 shadow-sm" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-[12.5px] text-warm-500 tabular-nums" }, /* @__PURE__ */ import_react7.default.createElement("strong", { className: "text-warm-700 font-semibold" }, fromIdx, "\u2013", toIdx), " / ", filteredCount.toLocaleString(), "\uAC74"), /* @__PURE__ */ import_react7.default.createElement("div", { className: "flex items-center gap-1" }, /* @__PURE__ */ import_react7.default.createElement(
      "button",
      {
        disabled: safePage <= 1,
        onClick: () => setCurrentPage(safePage - 1),
        className: "page-num-btn gap-1 px-3 font-medium"
      },
      /* @__PURE__ */ import_react7.default.createElement(ChevronLeftIcon, { size: 14 }),
      " \uC774\uC804"
    ), getPageNumbers(safePage, totalPages).map(
      (p, i) => p === "dots" ? /* @__PURE__ */ import_react7.default.createElement("span", { key: `dots-${i}`, className: "px-0.5 text-warm-400 text-xs" }, "\xB7\xB7\xB7") : /* @__PURE__ */ import_react7.default.createElement(
        "button",
        {
          key: p,
          onClick: () => setCurrentPage(p),
          className: cn("page-num-btn", safePage === p && "page-num-active")
        },
        p
      )
    ), /* @__PURE__ */ import_react7.default.createElement(
      "button",
      {
        disabled: safePage >= totalPages,
        onClick: () => setCurrentPage(safePage + 1),
        className: "page-num-btn gap-1 px-3 font-medium"
      },
      "\uB2E4\uC74C ",
      /* @__PURE__ */ import_react7.default.createElement(ChevronRightIcon, { size: 14 })
    ))));
  }
  function FilterEditor({ col, filter, data, columns, dynamicSelectOptions, getUniqueValues, onUpdate, onClose, onRemove }) {
    const label = getColumnLabel(columns, col);
    if (filter.type === "text") {
      return /* @__PURE__ */ import_react7.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-xs font-medium text-slate-600" }, label), /* @__PURE__ */ import_react7.default.createElement("label", { className: cn(
        "flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] cursor-pointer border transition-colors",
        filter.emptyOnly ? "border-blue-300 bg-blue-50 text-blue-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"
      ) }, /* @__PURE__ */ import_react7.default.createElement(Checkbox, { checked: !!filter.emptyOnly, onCheckedChange: (v) => onUpdate({ emptyOnly: !!v, textValue: "" }), className: "h-3 w-3 shrink-0" }), "\uBBF8\uC785\uB825\uB9CC"), !filter.emptyOnly && /* @__PURE__ */ import_react7.default.createElement(import_react7.default.Fragment, null, /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-[10px] text-slate-300" }, "\uD3EC\uD568"), /* @__PURE__ */ import_react7.default.createElement(Input, { value: filter.textValue || "", onChange: (e) => onUpdate({ textValue: e.target.value }), placeholder: "\uD64D\uAE38\uB3D9|\uAE40\uC54C\uACE1", className: "flex-1 h-7 text-xs", autoFocus: true }), /* @__PURE__ */ import_react7.default.createElement(Popover, null, /* @__PURE__ */ import_react7.default.createElement(PopoverTrigger, { asChild: true }, /* @__PURE__ */ import_react7.default.createElement("button", { type: "button", className: "shrink-0 rounded-full p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" }, /* @__PURE__ */ import_react7.default.createElement(HelpCircleIcon, { size: 14 }))), /* @__PURE__ */ import_react7.default.createElement(PopoverContent, { align: "end", className: "w-56 p-3 text-[11px] text-slate-600 space-y-1.5" }, /* @__PURE__ */ import_react7.default.createElement("p", { className: "font-semibold text-slate-800 text-[12px]" }, "\uBCF5\uD569 \uD544\uD130 \uC0AC\uC6A9\uBC95"), /* @__PURE__ */ import_react7.default.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ import_react7.default.createElement("p", null, /* @__PURE__ */ import_react7.default.createElement("code", { className: "rounded bg-slate-100 px-1 py-0.5 text-[10px] font-mono text-[#BB2720]" }, "|"), " OR \u2014 \uD558\uB098\uB77C\uB3C4 \uD3EC\uD568"), /* @__PURE__ */ import_react7.default.createElement("p", { className: "pl-3 text-slate-400" }, "\uC608: ", /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-slate-600" }, "\uD64D\uAE38\uB3D9|\uAE40\uC54C\uACE1")), /* @__PURE__ */ import_react7.default.createElement("p", null, /* @__PURE__ */ import_react7.default.createElement("code", { className: "rounded bg-slate-100 px-1 py-0.5 text-[10px] font-mono text-[#BB2720]" }, "&"), " AND \u2014 \uBAA8\uB450 \uD3EC\uD568"), /* @__PURE__ */ import_react7.default.createElement("p", { className: "pl-3 text-slate-400" }, "\uC608: ", /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-slate-600" }, "\uC11C\uC6B8&\uB300\uD559\uC0DD")))))), /* @__PURE__ */ import_react7.default.createElement(Button, { variant: "ghost", size: "sm", onClick: onRemove, className: "h-6 px-2 text-[11px] text-slate-400 hover:text-red-500" }, "\uC0AD\uC81C"), /* @__PURE__ */ import_react7.default.createElement(Button, { variant: "ghost", size: "sm", onClick: onClose, className: "h-6 px-2 text-[11px] text-slate-400" }, "\uB2EB\uAE30"));
    }
    if (filter.type === "select") {
      const opts = getSelectOptions(col, dynamicSelectOptions);
      const baseOptions = opts.length > 0 ? opts : getUniqueValues(col);
      const allOptions = ["", ...baseOptions];
      const selected = filter.selectedValues || [];
      const toggle = (v) => onUpdate({ selectedValues: selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v] });
      return /* @__PURE__ */ import_react7.default.createElement("div", null, /* @__PURE__ */ import_react7.default.createElement("div", { className: "mb-2 flex items-center justify-between" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-xs font-medium text-slate-600" }, label, " ", /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-slate-300 font-normal" }, "(", selected.length, "/", allOptions.length, ")")), /* @__PURE__ */ import_react7.default.createElement("div", { className: "flex gap-1" }, /* @__PURE__ */ import_react7.default.createElement(Button, { variant: "ghost", size: "sm", onClick: () => onUpdate({ selectedValues: [...allOptions] }), className: "h-6 px-2 text-[11px] text-blue-500" }, "\uC804\uCCB4\uC120\uD0DD"), /* @__PURE__ */ import_react7.default.createElement(Button, { variant: "ghost", size: "sm", onClick: () => onUpdate({ selectedValues: [] }), className: "h-6 px-2 text-[11px] text-slate-400" }, "\uD574\uC81C"), /* @__PURE__ */ import_react7.default.createElement(Button, { variant: "ghost", size: "sm", onClick: onRemove, className: "h-6 px-2 text-[11px] text-slate-400 hover:text-red-500" }, "\uC0AD\uC81C"), /* @__PURE__ */ import_react7.default.createElement(Button, { variant: "ghost", size: "sm", onClick: onClose, className: "h-6 px-2 text-[11px] text-slate-400" }, "\uB2EB\uAE30"))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1 max-h-32 overflow-y-auto" }, allOptions.map((opt) => /* @__PURE__ */ import_react7.default.createElement("label", { key: opt || "__empty__", className: cn(
        "flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] cursor-pointer border transition-colors truncate",
        selected.includes(opt) ? "border-blue-300 bg-blue-50 text-blue-600" : "border-slate-100 text-slate-500 hover:bg-slate-50"
      ) }, /* @__PURE__ */ import_react7.default.createElement(Checkbox, { checked: selected.includes(opt), onCheckedChange: () => toggle(opt), className: "h-3 w-3 shrink-0" }), /* @__PURE__ */ import_react7.default.createElement("span", { className: "truncate" }, opt || "(\uBBF8\uC785\uB825)")))));
    }
    if (filter.type === "date") {
      return /* @__PURE__ */ import_react7.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-xs font-medium text-slate-600" }, label), /* @__PURE__ */ import_react7.default.createElement(Input, { type: "date", value: filter.dateFrom || "", onChange: (e) => onUpdate({ dateFrom: e.target.value }), className: "h-7 text-xs w-auto" }), /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-[10px] text-slate-300" }, "~"), /* @__PURE__ */ import_react7.default.createElement(Input, { type: "date", value: filter.dateTo || "", onChange: (e) => onUpdate({ dateTo: e.target.value }), className: "h-7 text-xs w-auto" }), /* @__PURE__ */ import_react7.default.createElement(Button, { variant: "ghost", size: "sm", onClick: onRemove, className: "h-6 px-2 text-[11px] text-slate-400 hover:text-red-500" }, "\uC0AD\uC81C"), /* @__PURE__ */ import_react7.default.createElement(Button, { variant: "ghost", size: "sm", onClick: onClose, className: "h-6 px-2 text-[11px] text-slate-400" }, "\uB2EB\uAE30"));
    }
    if (filter.type === "number") {
      return /* @__PURE__ */ import_react7.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-xs font-medium text-slate-600" }, label), /* @__PURE__ */ import_react7.default.createElement(Input, { type: "number", value: filter.numberMin ?? "", onChange: (e) => onUpdate({ numberMin: e.target.value ? Number(e.target.value) : void 0 }), placeholder: "\uCD5C\uC18C", className: "h-7 text-xs w-20" }), /* @__PURE__ */ import_react7.default.createElement("span", { className: "text-[10px] text-slate-300" }, "~"), /* @__PURE__ */ import_react7.default.createElement(Input, { type: "number", value: filter.numberMax ?? "", onChange: (e) => onUpdate({ numberMax: e.target.value ? Number(e.target.value) : void 0 }), placeholder: "\uCD5C\uB300", className: "h-7 text-xs w-20" }), /* @__PURE__ */ import_react7.default.createElement(Button, { variant: "ghost", size: "sm", onClick: onRemove, className: "h-6 px-2 text-[11px] text-slate-400 hover:text-red-500" }, "\uC0AD\uC81C"), /* @__PURE__ */ import_react7.default.createElement(Button, { variant: "ghost", size: "sm", onClick: onClose, className: "h-6 px-2 text-[11px] text-slate-400" }, "\uB2EB\uAE30"));
    }
    return null;
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
      return import_react8.default.createElement("span", { className: "nt-review-badge", style: { background: "#dcfce7", color: "#166534" } }, "\uC804\uC1A1\uC644\uB8CC");
    }
    if (row["\uC2EC\uC758\uC2B9\uC778\uC5EC\uBD80"] === "Y") {
      return import_react8.default.createElement("span", { className: "nt-review-badge", style: { background: "#e0e7ff", color: "#3730a3" } }, "\uC2B9\uC778\uC644\uB8CC");
    }
    if (row["\uC2EC\uC758\uC694\uCCAD\uC5EC\uBD80"] === "Y") {
      return import_react8.default.createElement("span", { className: "nt-review-badge", style: { background: "#fef3c7", color: "#92400e" } }, "\uC2EC\uC758\uB300\uAE30");
    }
    return import_react8.default.createElement("button", {
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
    return import_react8.default.createElement(
      "div",
      { className: "nt-stats" },
      import_react8.default.createElement(
        "div",
        { className: "nt-stat-card" },
        import_react8.default.createElement("div", { className: "nt-stat-label" }, "DB"),
        import_react8.default.createElement("div", { className: "nt-stat-value" }, dbCount)
      ),
      import_react8.default.createElement(
        "div",
        { className: "nt-stat-card" },
        import_react8.default.createElement("div", { className: "nt-stat-label" }, "\uCC3E\uAE30"),
        import_react8.default.createElement("div", { className: "nt-stat-value" }, findCount)
      ),
      import_react8.default.createElement(
        "div",
        { className: "nt-stat-card" },
        import_react8.default.createElement("div", { className: "nt-stat-label" }, "\uC804\uC1A1\uC644\uB8CC"),
        import_react8.default.createElement("div", { className: "nt-stat-value" }, sentCount)
      )
    );
  }
  function mountDbTable(containerId, data, options = {}) {
    const root = getOrCreateRoot(containerId);
    if (!root) return;
    const dynamicOptions = window.STATE?.dropdownOptions || {};
    root.render(
      import_react8.default.createElement(NotionTable, {
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
      import_react8.default.createElement(NotionTable, {
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
