import { useState, useEffect, useRef, useCallback } from "react";
import { dbRead, dbWrite, dbSafeWrite, dbListen } from "../../core/firebase.js";
import { obj2arr, genId } from "../../core/helpers.js";

// ── CSS matching standalone exactly ───────────────────────────────
const SL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Share+Tech+Mono&family=Barlow:wght@300;400;500;600&display=swap');
  .sl *,.sl *::before,.sl *::after{box-sizing:border-box;}
  .sl{--bg:#f0f2f5;--bg2:#ffffff;--bg3:#e8eaed;--panel:#ffffff;--border:#d1d5db;--border2:#b8bec8;--amber:#d97706;--amber-dim:#b45309;--red:#dc2626;--green:#16a34a;--text:#374151;--text-dim:#6b7280;--text-bright:#111827;background:var(--bg);color:var(--text);font-family:'Barlow',sans-serif;font-size:14px;display:flex;flex-direction:column;min-height:calc(100vh - 50px);}
  .sl .topbar{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid var(--border);flex-shrink:0;gap:12px;background:#fff;}
  .sl .topbar-brand{display:flex;align-items:baseline;gap:10px;}
  .sl .topbar-eyebrow{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:3px;color:var(--amber);text-transform:uppercase;}
  .sl .topbar-title{font-family:'Rajdhani',sans-serif;font-size:24px;font-weight:700;color:var(--text-bright);letter-spacing:1px;line-height:1;}
  .sl .topbar-title span{color:var(--amber);}
  .sl .topbar-stats{display:flex;gap:20px;}
  .sl .ts-val{font-family:'Rajdhani',sans-serif;font-size:17px;font-weight:700;color:var(--amber);line-height:1;}
  .sl .ts-lbl{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;}
  .sl .layout{display:flex;flex:1;overflow:hidden;min-height:0;}
  .sl .sidebar{width:230px;flex-shrink:0;border-right:1px solid var(--border);display:flex;flex-direction:column;background:#f8f9fa;overflow:hidden;}
  .sl .sidebar-hdr{padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
  .sl .sidebar-lbl{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;}
  .sl .sidebar-search{padding:7px 10px;flex-shrink:0;border-bottom:1px solid var(--border);}
  .sl .sidebar-search input{width:100%;background:#fff;border:1px solid var(--border);border-radius:4px;padding:5px 9px;color:var(--text-bright);font-family:'Barlow',sans-serif;font-size:13px;outline:none;}
  .sl .sidebar-search input:focus{border-color:var(--amber);}
  .sl .sidebar-list{overflow-y:auto;flex:1;padding:4px 0;}
  .sl .si{display:flex;align-items:center;gap:8px;padding:8px 14px;cursor:pointer;transition:background .12s;border-left:3px solid transparent;}
  .sl .si:hover{background:#eef0f3;}
  .sl .si.active{background:rgba(217,119,6,.1);border-left-color:var(--amber);}
  .sl .si-icon{font-size:14px;width:20px;text-align:center;flex-shrink:0;}
  .sl .si-info{flex:1;min-width:0;}
  .sl .si-name{font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;color:var(--text-bright);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2;}
  .sl .si.active .si-name{color:var(--amber);}
  .sl .si-sub{font-size:12px;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .sl .si-count{font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--text-dim);background:var(--bg3);padding:1px 5px;border-radius:10px;flex-shrink:0;}
  .sl .si.active .si-count{background:rgba(217,119,6,.15);color:var(--amber);}
  .sl .sidebar-div{height:1px;background:var(--border);margin:4px 0;}
  .sl .sidebar-add{margin:6px 10px 8px;padding:7px;border:1px dashed #b8bec8;border-radius:4px;background:none;color:var(--text-dim);font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:border-color .15s,color .15s;flex-shrink:0;}
  .sl .sidebar-add:hover{border-color:var(--amber);color:var(--amber);}
  .sl .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
  .sl .tab-bar{display:flex;border-bottom:1px solid var(--border);flex-shrink:0;background:#fff;overflow-x:auto;scrollbar-width:none;}
  .sl .tab-bar::-webkit-scrollbar{display:none;}
  .sl .tab-btn{padding:9px 16px;font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:600;color:var(--text-dim);cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s,border-color .15s;white-space:nowrap;}
  .sl .tab-btn:hover{color:var(--text);}
  .sl .tab-btn.active{color:var(--amber);border-bottom-color:var(--amber);}
  .sl .tab-badge{display:inline-block;background:var(--amber);color:#fff;font-size:9px;font-weight:700;padding:1px 5px;border-radius:8px;margin-left:4px;vertical-align:middle;}
  .sl .tab-badge.red{background:var(--red);}
  .sl .tab-badge.green{background:var(--green);}
  .sl .main-content{flex:1;overflow-y:auto;padding:22px;}
  .sl .overview-title{font-family:'Rajdhani',sans-serif;font-size:22px;font-weight:700;color:var(--text-bright);margin-bottom:4px;}
  .sl .overview-sub{font-size:13px;color:var(--text-dim);margin-bottom:16px;}
  .sl .summary-bar{display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;}
  .sl .summary-stat{background:var(--panel);border:1px solid var(--border);border-radius:4px;padding:10px 14px;flex:1;min-width:80px;}
  .sl .summary-stat-val{font-family:'Rajdhani',sans-serif;font-size:20px;font-weight:700;color:var(--amber);line-height:1;}
  .sl .summary-stat-lbl{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;margin-top:3px;}
  .sl .fleet-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;}
  .sl .vehicle-card{background:var(--panel);border:1px solid var(--border);border-radius:6px;padding:16px;cursor:pointer;transition:border-color .15s,transform .1s;position:relative;overflow:hidden;}
  .sl .vehicle-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--amber);opacity:0;transition:opacity .15s;}
  .sl .vehicle-card:hover{border-color:#9ca3af;transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.08);}
  .sl .vehicle-card:hover::before{opacity:1;}
  .sl .vc-type{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--amber);text-transform:uppercase;margin-bottom:4px;}
  .sl .vc-name{font-family:'Rajdhani',sans-serif;font-size:17px;font-weight:700;color:var(--text-bright);margin-bottom:2px;}
  .sl .vc-sub{font-size:12px;color:var(--text-dim);margin-bottom:10px;}
  .sl .vc-meta{display:flex;gap:12px;flex-wrap:wrap;}
  .sl .vc-stat-lbl{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--text-dim);font-family:'Share Tech Mono',monospace;}
  .sl .vc-stat-val{font-size:13px;font-weight:600;color:var(--text);}
  .sl .vc-last{margin-top:8px;font-size:11px;color:var(--text-dim);}
  .sl .vic{background:var(--panel);border:1px solid var(--border);border-radius:6px;margin-bottom:18px;overflow:hidden;}
  .sl .vic-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;border-bottom:1px solid var(--border);flex-wrap:wrap;}
  .sl .vic-identity{display:flex;align-items:center;gap:12px;}
  .sl .vic-icon{width:44px;height:44px;border-radius:6px;background:rgba(217,119,6,.1);border:1px solid rgba(217,119,6,.25);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;}
  .sl .vic-vname{font-family:'Rajdhani',sans-serif;font-size:20px;font-weight:700;color:var(--text-bright);line-height:1;margin-bottom:2px;}
  .sl .vic-badge{display:inline-block;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--amber-dim);background:rgba(217,119,6,.1);padding:2px 7px;border-radius:3px;}
  .sl .vic-actions{display:flex;gap:6px;flex-shrink:0;}
  .sl .vic-specs{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));}
  .sl .vic-spec{padding:10px 16px;border-right:1px solid var(--border);border-bottom:1px solid var(--border);}
  .sl .vic-spec-lbl{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-dim);margin-bottom:3px;}
  .sl .vic-spec-val{font-size:13px;font-weight:600;color:var(--text-bright);font-family:'Rajdhani',sans-serif;}
  .sl .vic-notes{padding:8px 16px;font-size:12px;color:var(--text-dim);font-style:italic;border-top:1px solid var(--border);}
  /* Todo */
  .sl .todo-item{display:flex;align-items:flex-start;gap:10px;padding:10px 14px;background:var(--panel);border:1px solid var(--border);border-left:3px solid var(--red);border-radius:6px;margin-bottom:6px;}
  .sl .todo-item.done{opacity:.65;}
  .sl .todo-item.pri-medium{border-left-color:var(--amber);}
  .sl .todo-item.pri-low{border-left-color:var(--green);}
  /* Service records */
  .sl .service-list{display:flex;flex-direction:column;gap:8px;}
  .sl .sr{background:var(--panel);border:1px solid var(--border);border-left:3px solid var(--amber-dim);border-radius:4px;padding:12px 16px;display:grid;grid-template-columns:50px 1fr auto;gap:12px;align-items:start;transition:border-color .15s;}
  .sl .sr:hover{border-left-color:var(--amber);}
  .sl .sr-day{font-family:'Rajdhani',sans-serif;font-size:22px;font-weight:700;color:var(--amber);line-height:1;text-align:center;}
  .sl .sr-mon{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--text-dim);text-transform:uppercase;text-align:center;}
  .sl .sr-yr{font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--text-dim);text-align:center;}
  .sl .sr-type{font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;color:var(--text-bright);margin-bottom:2px;}
  .sl .sr-notes{font-size:12px;color:var(--text-dim);line-height:1.4;margin-bottom:5px;}
  .sl .sr-tags{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:3px;}
  .sl .sr-tag{font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--text-dim);background:#e8eaed;padding:2px 6px;border-radius:3px;}
  .sl .sr-part{font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--amber-dim);background:rgba(180,83,9,.08);padding:2px 6px;border-radius:3px;border:1px solid rgba(180,83,9,.2);display:inline-block;margin:1px 2px 1px 0;}
  .sl .sr-right{display:flex;flex-direction:column;align-items:flex-end;gap:5px;}
  .sl .sr-cost{font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--green);}
  .sl .sr-inv-tag{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;background:rgba(22,163,74,.1);color:#16a34a;border:1px solid rgba(22,163,74,.25);padding:2px 6px;border-radius:10px;}
  .sl .invoice-bar{display:flex;align-items:center;justify-content:space-between;background:rgba(217,119,6,.08);border:1px solid rgba(217,119,6,.2);border-radius:6px;padding:10px 14px;margin-bottom:12px;flex-wrap:wrap;gap:8px;}
  .sl .invoice-bar-msg{font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:600;color:var(--amber-dim);}
  /* ORDER PARTS TABLE */
  .sl .po-add-bar{display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;margin-bottom:14px;padding:12px 14px;background:var(--panel);border:1px solid var(--border);border-radius:6px;}
  .sl .po-add-bar .form-group{margin:0;flex:1;min-width:100px;}
  .sl .po-filters{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;padding:10px 12px;background:var(--panel);border:1px solid var(--border);border-radius:6px;align-items:flex-end;position:sticky;top:0;z-index:10;}
  .sl .po-summary{display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap;}
  .sl .po-stat{background:var(--panel);border:1px solid var(--border);border-radius:6px;padding:8px 14px;min-width:80px;}
  .sl .po-stat-val{font-family:'Share Tech Mono',monospace;font-size:18px;font-weight:700;}
  .sl .po-stat-lbl{font-size:11px;color:var(--text-dim);margin-top:2px;}
  .sl .po-stat.needed .po-stat-val{color:var(--red);}
  .sl .po-stat.ordered .po-stat-val{color:var(--amber);}
  .sl .po-stat.received .po-stat-val{color:var(--green);}
  .sl .po-table-wrap{overflow-x:auto;background:var(--panel);border:1px solid var(--border);border-radius:6px;}
  .sl .po-table{width:100%;border-collapse:collapse;font-size:13px;}
  .sl .po-table th{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-dim);padding:8px 10px;text-align:left;border-bottom:2px solid var(--border);background:#f8f9fa;}
  .sl .po-table td{padding:10px 11px;border-bottom:1px solid var(--border);vertical-align:middle;}
  .sl .po-table tr:last-child td{border-bottom:none;}
  .sl .po-table tr:hover td{background:rgba(0,0,0,.02);}
  .sl .po-row-needed{background:#fff5f5;}
  .sl .po-row-ordered{background:#fffbeb;}
  .sl .po-row-received{background:#f0fdf4;}
  .sl .po-status-dot{width:10px;height:10px;border-radius:50%;display:inline-block;}
  .sl .po-status-dot.needed{background:var(--red);}
  .sl .po-status-dot.ordered{background:var(--amber);}
  .sl .po-status-dot.received{background:var(--green);}
  .sl .po-partnum{font-family:'Share Tech Mono',monospace;color:var(--amber-dim);}
  /* Invoice */
  .sl .inv-list{display:flex;flex-direction:column;gap:10px;}
  .sl .inv-card{background:var(--panel);border:1px solid var(--border);border-radius:6px;padding:14px 18px;}
  .sl .inv-num{font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--amber-dim);font-weight:700;}
  .sl .inv-customer{font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;color:var(--text-bright);}
  .sl .inv-status-badge{display:inline-block;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;text-transform:uppercase;padding:2px 8px;border-radius:10px;}
  .sl .inv-status-badge.draft{background:rgba(107,114,128,.12);color:#6b7280;}
  .sl .inv-status-badge.sent{background:rgba(217,119,6,.12);color:var(--amber-dim);}
  .sl .inv-status-badge.paid{background:rgba(22,163,74,.12);color:#16a34a;}
  /* Parts inv */
  .sl .inv-row{background:var(--panel);border:1px solid var(--border);border-radius:6px;padding:12px 14px;margin-bottom:8px;}
  .sl .inv-name{font-weight:700;font-size:14px;color:var(--text-bright);margin-bottom:2px;}
  .sl .inv-meta{font-size:12px;color:var(--text-dim);display:flex;gap:10px;flex-wrap:wrap;}
  .sl .inv-low{font-size:10px;font-weight:700;color:var(--red);background:rgba(220,38,38,.08);padding:2px 6px;border-radius:4px;}
  /* Vendor */
  .sl .vendor-card{background:var(--panel);border:1px solid var(--border);border-radius:6px;padding:14px 16px;margin-bottom:10px;}
  /* Hist */
  .sl .hist-row{background:var(--panel);border:1px solid var(--border);border-radius:6px;padding:10px 14px;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
  /* Admin */
  .sl .admin-sec{background:var(--panel);border:1px solid var(--border);border-radius:6px;margin-bottom:14px;overflow:hidden;}
  .sl .admin-sec-hdr{padding:12px 16px;border-bottom:1px solid var(--border);}
  .sl .admin-sec-title{font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;color:var(--text-bright);}
  .sl .admin-sec-body{padding:14px 16px;display:flex;flex-direction:column;gap:0;}
  .sl .toggle-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--bg3);}
  .sl .toggle-row:last-child{border-bottom:none;}
  .sl .toggle-name{font-size:13px;font-weight:600;color:var(--text-bright);}
  .sl .toggle-hint{font-size:12px;color:var(--text-dim);}
  .sl .toggle-sw{width:40px;height:22px;border-radius:11px;background:#d1d5db;cursor:pointer;position:relative;transition:background .2s;border:none;flex-shrink:0;}
  .sl .toggle-sw.on{background:var(--amber);}
  .sl .toggle-knob{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 1px 2px rgba(0,0,0,.2);}
  .sl .toggle-sw.on .toggle-knob{transform:translateX(18px);}
  /* Report */
  .sl .report-table{width:100%;border-collapse:collapse;font-size:13px;}
  .sl .report-table th{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-dim);padding:8px 10px;text-align:left;border-bottom:2px solid var(--border);background:#f8f9fa;}
  .sl .report-table td{padding:9px 10px;border-bottom:1px solid var(--border);color:var(--text);vertical-align:top;}
  .sl .report-table .td-vehicle{font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;color:var(--text-bright);}
  .sl .report-table .td-type{font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--amber);}
  .sl .report-table .td-cost{font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--green);text-align:right;}
  .sl .report-table .td-notes{font-size:12px;color:var(--text-dim);max-width:280px;}
  .sl .report-table .td-date{font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--text-dim);white-space:nowrap;}
  /* Bar chart */
  .sl .bar-row{margin-bottom:7px;}
  .sl .bar-lbl{display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px;}
  .sl .bar-bg{background:var(--bg3);border-radius:3px;height:8px;overflow:hidden;}
  .sl .bar-fill{height:100%;border-radius:3px;background:var(--amber);}
  /* Buttons */
  .sl .btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:4px;font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;letter-spacing:.5px;cursor:pointer;border:none;transition:background .15s;}
  .sl .btn-primary{background:var(--amber);color:#fff;}
  .sl .btn-primary:hover{background:#e58a00;}
  .sl .btn-ghost{background:#fff;color:var(--text);border:1px solid var(--border);box-shadow:0 1px 2px rgba(0,0,0,.05);}
  .sl .btn-ghost:hover{border-color:var(--amber);color:var(--amber);}
  .sl .btn-danger{background:rgba(220,38,38,.1);color:var(--red);border:1px solid rgba(220,38,38,.3);}
  .sl .btn-sm{padding:4px 9px;font-size:13px;}
  .sl .btn-xs{padding:2px 7px;font-size:11px;}
  /* Form */
  .sl .form-group{display:flex;flex-direction:column;gap:4px;}
  .sl .form-lbl{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--text-dim);}
  .sl .form-input,.sl .form-select,.sl .form-textarea{background:var(--bg3);border:1px solid var(--border2);border-radius:4px;padding:7px 10px;color:var(--text-bright);font-family:'Barlow',sans-serif;font-size:13px;outline:none;transition:border-color .15s;width:100%;}
  .sl .form-input:focus,.sl .form-select:focus,.sl .form-textarea:focus{border-color:var(--amber);}
  .sl .form-textarea{resize:vertical;min-height:70px;}
  /* Empty */
  .sl .empty{text-align:center;padding:50px 20px;color:var(--text-dim);}
  .sl .empty-icon{font-size:42px;margin-bottom:10px;}
  .sl .empty-title{font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:600;margin-bottom:5px;color:var(--text);}
  /* Modal */
  .sl .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;}
  .sl .modal{background:var(--bg2);border:1px solid var(--border2);border-radius:8px;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;}
  .sl .modal-hdr{padding:16px 20px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
  .sl .modal-title{font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:700;color:var(--text-bright);}
  .sl .modal-close{background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:18px;}
  .sl .modal-body{padding:16px 20px;display:flex;flex-direction:column;gap:12px;}
  .sl .modal-footer{padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px;}
  .sl .form-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .sl .form-full{grid-column:1/-1;}
  .sl .part-entry{display:grid;grid-template-columns:1fr 1fr 55px auto;gap:6px;align-items:center;margin-bottom:5px;}
  @media(max-width:640px){.sl .sidebar{width:190px;}.sl .sr{grid-template-columns:1fr auto;}.sl .sr-day,.sl .sr-mon,.sl .sr-yr{display:none;}.sl .form-row{grid-template-columns:1fr;}}
  @media(max-width:480px){.sl .sidebar{display:none;}.sl .main-content{padding:14px;}}
`;

// ── Constants ─────────────────────────────────────────────────────
const ICONS = {Truck:"🚛",Tractor:"🚜",Combine:"🌾","Grain Cart":"⚙️",Semi:"🚛",Trailer:"📦",Sprayer:"💧",Pickup:"🛻","ATV/UTV":"🏎️",Generator:"⚡",Other:"🔧"};
const SVC_TYPES = ["Oil Change","Filter Replacement","Tire Service","Brake Service","Hydraulic Service","Belt/Chain Replacement","Coolant Service","Fuel System","Battery/Electrical","Inspection","Repair","Other"];
const EQUIP_TYPES = ["Truck","Tractor","Combine","Grain Cart","Semi","Trailer","Sprayer","Pickup","ATV/UTV","Generator","Other"];
const PRI_COLOR = {high:"#dc2626",medium:"#d97706",low:"#16a34a"};
const sumCost = a=>(a||[]).reduce((s,r)=>s+(parseFloat(r.cost)||0),0);
const fmtDate = iso=>{const d=new Date(iso+"T00:00:00");return{day:d.getDate().toString().padStart(2,"0"),mon:d.toLocaleString("en",{month:"short"}).toUpperCase(),yr:d.getFullYear()};};
const pStatus = p=>p.received?"received":p.ordered?"ordered":"needed";
const today = ()=>new Date().toISOString().slice(0,10);
const nextInvNum = invs=>{const ns=invs.map(i=>parseInt((i.num||"").replace("INV-",""))||0);return"INV-"+String((ns.length?Math.max(...ns):0)+1).padStart(3,"0");};
const safeLoads = f=>(f&&f.loads)||[];

// ── Main ──────────────────────────────────────────────────────────
export default function ServiceLogModule({ tenantId, token, persist }) {
  const BASE = `tenants/${tenantId}/serviceLog`;

  const [D, setD] = useState({vehicles:[],records:[],customers:[],invoices:[],partsToOrder:[],partsInventory:[],vendors:[],orderHistory:[],settings:{features:{invoicing:true,partsInventory:true,orderParts:true}}});
  const [loading, setLoading] = useState(true);
  const [sync, setSync] = useState("idle");

  const [tab,      setTab]      = useState("fleet");
  const [selCustId,setSelCust]  = useState(null);
  const [selVehId, setSelVeh]   = useState(null);
  const [sbSearch, setSbSearch] = useState("");
  const [modal,    setModal]    = useState(null);
  const [editTarget,setEdit]    = useState(null);
  const [selRecIds,setSelRecs]  = useState(new Set());
  const [selPoIds, setSelPoIds] = useState(new Set());
  const [gsQuery,  setGsQ]      = useState("");
  const [poFilters,setPOF]      = useState({q:"",vendor:"",num:"",vehicle:"",status:""});
  const [invFilters,setInvF]    = useState({q:"",vendor:"",location:""});
  const [poNew,    setPoNew]    = useState({desc:"",num:"",vendor:"",qty:"1",vehicleId:""});
  const [reportFil,setRepFil]   = useState({dateFrom:"",dateTo:"",type:"",custId:""});

  useEffect(()=>{
    if(!tenantId) return;
    dbRead(BASE,token).then(d=>{
      if(d){ const m=migrate(d); setD(m); slSaveCache(d); }
    }).catch(()=>{
      const cached=slLoadCache();
      if(cached){ setD(migrate(cached)); setSync("offline"); }
    }).finally(()=>setLoading(false));
  },[tenantId,token]);

  const skipRef = useRef(false);

  useEffect(()=>{
    if(!tenantId) return;
    return dbListen(BASE,token,({path,data:d})=>{
      // Skip if we just saved (prevent our own write from overwriting optimistic state)
      if(skipRef.current) return;
      // Only process full-path updates, not partial sub-path updates
      if(path && path !== "/") return;
      if(d){ setD(migrate(d)); slSaveCache(d); }
    });
  },[tenantId,token]);

  // ── Retry queued saves ONLY on reconnect (never on mount — prevents stale overwrite) ──
  useEffect(()=>{
    const retry=async()=>{
      const q=slLoadQ();
      if(!q||!tenantId) return;
      // Safety: fetch current Firebase data first, only push if queue is newer
      try{
        const current = await dbRead(BASE,token).catch(()=>null);
        // If queue has more records/vehicles than current, it's genuinely newer
        const qVehicles = Object.keys(q.data.vehicles||{}).length;
        const fVehicles = Object.keys(current?.vehicles||{}).length;
        const qRecords  = Object.keys(q.data.records||{}).length;
        const fRecords  = Object.keys(current?.records||{}).length;
        // Only push queue if it has at least as much data as Firebase
        if(qVehicles < fVehicles || qRecords < fRecords){
          slClearQ(); // Queue is stale — discard it
          return;
        }
        setSync("saving");
        await dbSafeWrite(BASE,q.data,token);
        slClearQ(); setSync("saved");
      }catch(e){ setSync("queued"); }
      setTimeout(()=>setSync("idle"),2000);
    };
    window.addEventListener("online",retry);
    // Do NOT call retry() on mount — only on reconnect after going offline
    return ()=>window.removeEventListener("online",retry);
  },[tenantId,token]);

  const migrate=d=>({
    vehicles:  obj2arr(d.vehicles||{}).filter(Boolean),
    records:   obj2arr(d.records||{}).filter(Boolean),
    customers: (Array.isArray(d.customers)?d.customers:obj2arr(d.customers||{})).filter(Boolean),
    invoices:  obj2arr(d.invoices||{}).filter(Boolean),
    partsToOrder:    obj2arr(d.partsToOrder||{}).filter(Boolean),
    partsInventory:  obj2arr(d.partsInventory||{}).filter(Boolean),
    vendors:         obj2arr(d.vendors||{}).filter(Boolean),
    orderHistory:    obj2arr(d.orderHistory||{}).filter(Boolean),
    settings:{features:{invoicing:true,partsInventory:true,orderParts:true},...(d.settings||{})},
  });

  const SL_QUEUE_KEY = `sl_queue_${tenantId}`;
  const slSaveQ  = d=>{ try{ localStorage.setItem(SL_QUEUE_KEY,JSON.stringify({data:d,savedAt:Date.now()})); }catch(e){} };
  const slClearQ = ()=>{ try{ localStorage.removeItem(SL_QUEUE_KEY); }catch(e){} };

  const SL_CACHE_KEY = `sl_cache_${tenantId}`;
  const slSaveCache  = d=>{ try{ localStorage.setItem(SL_CACHE_KEY,JSON.stringify({...d,_at:Date.now()})); }catch(e){} };
  const slLoadCache  = ()=>{ try{ const r=localStorage.getItem(SL_CACHE_KEY); return r?JSON.parse(r):null; }catch(e){ return null; } };
  const slLoadQ  = ()=>{ try{ const r=localStorage.getItem(SL_QUEUE_KEY); return r?JSON.parse(r):null; }catch(e){ return null; } };

  const save=(updates)=>{
    const next={...D,...updates};
    // Safety guard: never write if we'd be wiping vehicles/records that exist in current D
    if(D.vehicles.length > 0 && (next.vehicles||[]).length === 0) { console.warn("ServiceLog save blocked: would wipe vehicles"); return; }
    if(D.records.length > 0 && (next.records||[]).length === 0) { console.warn("ServiceLog save blocked: would wipe records"); return; }
    setD(next);
    setSync("saving");
    skipRef.current = true;
    const payload={
      vehicles:  Object.fromEntries((next.vehicles||[]).map(v=>[v.id,v])),
      records:   Object.fromEntries((next.records||[]).map(r=>[r.id,r])),
      customers: next.customers||[],
      invoices:  Object.fromEntries((next.invoices||[]).map(i=>[i.id,i])),
      partsToOrder:   (next.partsToOrder||[]),
      partsInventory: Object.fromEntries((next.partsInventory||[]).map(p=>[p.id,p])),
      vendors:        Object.fromEntries((next.vendors||[]).map(v=>[v.id,v])),
      orderHistory:   Object.fromEntries((next.orderHistory||[]).map(h=>[h.id,h])),
      settings:       next.settings,
    };
    slSaveQ(payload);
    slSaveCache(payload);
    dbSafeWrite(BASE, payload, token)
      .then(()=>{ slClearQ(); setSync("saved"); })
      .catch(e=>{
        console.error("ServiceLog save error:", e.message);
        if(e.message.startsWith("BLOCKED")) {
          alert("⚠️ Save blocked: " + e.message + "\n\nYour data has NOT been modified in the database. Please refresh the page.");
          setSync("error");
        } else {
          setSync("queued");
        }
      })
      .finally(()=>setTimeout(()=>{ skipRef.current=false; setSync("idle"); },2000));
  };

  // ── Mutations ──────────────────────────────────────────────────
  const saveVehicle=f=>{let nv;if(editTarget){nv=D.vehicles.map(v=>v.id===editTarget.id?{...editTarget,...f}:v);}else{const x={id:genId(),todos:[],...f};nv=[...D.vehicles,x];setSelVeh(x.id);}save({vehicles:nv});setModal(null);setEdit(null);};
  const deleteVehicle=id=>{if(!confirm("Delete vehicle and all records?"))return;save({vehicles:D.vehicles.filter(v=>v.id!==id),records:D.records.filter(r=>r.vehicleId!==id)});if(selVehId===id)setSelVeh(null);};
  const saveRecord=f=>{let nv=D.vehicles;if(f.hours){const h=parseFloat(f.hours),v=D.vehicles.find(v=>v.id===selVehId);if(v&&h>(parseFloat(v.hours)||0))nv=D.vehicles.map(v=>v.id===selVehId?{...v,hours:String(h)}:v);}let nr;if(editTarget){nr=D.records.map(r=>r.id===editTarget.id?{...editTarget,...f}:r);}else{nr=[...D.records,{id:genId(),vehicleId:selVehId,...f}];}save({vehicles:nv,records:nr});setModal(null);setEdit(null);setSelRecs(new Set());};
  const deleteRecord=id=>{save({records:D.records.filter(r=>r.id!==id)});setSelRecs(s=>{const n=new Set(s);n.delete(id);return n;});};
  const saveCustomer=f=>{let nc;if(editTarget){nc=D.customers.map(c=>c.id===editTarget.id?{...editTarget,...f}:c);}else{const x={id:genId(),...f};nc=[...D.customers,x];setSelCust(x.id);}save({customers:nc});setModal(null);setEdit(null);};
  const deleteCustomer=id=>{if(!confirm("Delete customer?"))return;save({customers:D.customers.filter(c=>c.id!==id),vehicles:D.vehicles.map(v=>v.customerId===id?{...v,customerId:""}:v)});if(selCustId===id)setSelCust(null);};
  const toggleTodo=(vid,tid)=>save({vehicles:D.vehicles.map(v=>v.id===vid?{...v,todos:(v.todos||[]).map(t=>t.id===tid?{...t,done:!t.done}:t)}:v)});
  const saveTodo=(vid,f)=>{
    const todos=(D.vehicles.find(v=>v.id===vid)?.todos)||[];
    let newTodos;
    if(editTarget?.id&&!editTarget?.vehicleId){
      // editing existing todo
      newTodos=todos.map(t=>t.id===editTarget.id?{...t,...f}:t);
    } else {
      newTodos=[...todos,{id:genId(),done:false,...f}];
    }
    save({vehicles:D.vehicles.map(v=>v.id===vid?{...v,todos:newTodos}:v)});
    setModal(null);setEdit(null);
  };
  const deleteTodo=(vid,tid)=>save({vehicles:D.vehicles.map(v=>v.id===vid?{...v,todos:(v.todos||[]).filter(t=>t.id!==tid)}:v)});
  const savePart=f=>{let np;if(editTarget){np=D.partsToOrder.map(p=>p.id===editTarget.id?{...editTarget,...f}:p);}else{np=[...D.partsToOrder,{id:genId(),ordered:false,received:false,...f}];}save({partsToOrder:np});setModal(null);setEdit(null);};
  const quickAddPart=()=>{if(!poNew.desc.trim())return;const np=[{id:genId(),ordered:false,received:false,addedAt:Date.now(),...poNew},...D.partsToOrder];save({partsToOrder:np});setPoNew({desc:"",num:"",vendor:"",qty:"1",vehicleId:""});};
  const toggleOrdered=id=>{const np=D.partsToOrder.map(p=>p.id===id?{...p,ordered:!p.ordered||p.received,orderedDate:!p.ordered?today():p.orderedDate}:p);save({partsToOrder:np});};
  const toggleReceived=id=>{const p=D.partsToOrder.find(pp=>pp.id===id);if(!p)return;if(p.received){save({partsToOrder:D.partsToOrder.map(pp=>pp.id===id?{...pp,received:false}:pp)});return;}setEdit(p);setModal("receive");};
  const confirmReceive=(partId,f)=>{
    const p=D.partsToOrder.find(pp=>pp.id===partId); if(!p) return;
    const updatedPart={...p,received:true,ordered:true,unitCost:f.unitCost||p.unitCost,receivedLocation:f.location};
    const np=D.partsToOrder.map(pp=>pp.id===partId?updatedPart:pp);
    const nh=[...D.orderHistory,{id:genId(),desc:p.desc,num:p.num,vendor:p.vendor,qty:f.qty||p.qty||"1",unitCost:f.unitCost||p.unitCost,vehicleId:p.vehicleId,receivedDate:today(),location:f.location}];
    // Update parts inventory if linked, or offer to add
    let ni=D.partsInventory;
    if(p.invPartId){
      ni=ni.map(inv=>inv.id===p.invPartId?{...inv,qty:String((parseInt(inv.qty)||0)+(parseInt(f.qty)||1)),location:f.location||inv.location}:inv);
      save({partsToOrder:np,orderHistory:nh,partsInventory:ni});
    } else if(f.addToInventory){
      const newInv={id:genId(),name:p.desc||"",qty:String(parseInt(f.qty)||1),minQty:"",location:f.location||"",notes:"",partNumbers:p.num?[{id:genId(),num:p.num,vendor:p.vendor||"",unitCost:f.unitCost||""}]:[]};
      ni=[...ni,newInv];
      save({partsToOrder:np,orderHistory:nh,partsInventory:ni});
    } else {
      save({partsToOrder:np,orderHistory:nh});
    }
    setModal(null); setEdit(null);
  };
  const deletePart=id=>{save({partsToOrder:D.partsToOrder.filter(p=>p.id!==id)});};
  const archiveReceived=()=>{const rec=D.partsToOrder.filter(p=>p.received);if(!rec.length)return;const nh=[...D.orderHistory,...rec.map(p=>({id:genId(),desc:p.desc,num:p.num,vendor:p.vendor,qty:p.qty,unitCost:p.unitCost,vehicleId:p.vehicleId,receivedDate:today()}))];save({partsToOrder:D.partsToOrder.filter(p=>!p.received),orderHistory:nh});};
  const consolidateDupes=()=>{const map={};D.partsToOrder.forEach(p=>{const k=(p.desc||"").toLowerCase().trim()+"__"+(p.num||"").toLowerCase().trim();if(!map[k])map[k]=[];map[k].push(p);});const np=[];Object.values(map).forEach(group=>{if(group.length===1){np.push(group[0]);}else{const base={...group[0],qty:String(group.reduce((s,p)=>s+(parseInt(p.qty)||1),0))};np.push(base);}});save({partsToOrder:np});};

  const addPartsToService=(vehicleId,date,type,notes,tech,hours,partsArr)=>{
    let nv=D.vehicles;
    if(hours){const h=parseFloat(hours);const veh=D.vehicles.find(v=>v.id===vehicleId);if(veh&&h>(parseFloat(veh.hours)||0))nv=D.vehicles.map(v=>v.id===vehicleId?{...v,hours:String(h)}:v);}
    const totalCost=partsArr.reduce((s,p)=>s+(parseFloat(p.unitCost)||0)*(parseInt(p.qty)||1),0);
    const newRec={id:genId(),vehicleId,date,type:type||"Repair",notes,tech,hours,cost:String(totalCost.toFixed(2)),parts:partsArr.map(p=>({desc:p.desc||"",num:p.num||"",qty:p.qty||"1"}))};
    // Decrement inventory for parts linked via invPartId
    let ni=D.partsInventory;
    partsArr.forEach(p=>{if(p.invPartId){ni=ni.map(ip=>ip.id===p.invPartId?{...ip,qty:String(Math.max(0,(parseInt(ip.qty)||0)-(parseInt(p.qty)||1)))}:ip);}});
    // Auto-archive: move used parts from partsToOrder into orderHistory
    const usedIds=new Set(partsArr.map(p=>p.id).filter(Boolean));
    const usedOrderParts=D.partsToOrder.filter(p=>usedIds.has(p.id));
    const remainingOrders=D.partsToOrder.filter(p=>!usedIds.has(p.id));
    const newHistory=[...D.orderHistory,...usedOrderParts.map(p=>({
      id:genId(),desc:p.desc||"",num:p.num||"",vendor:p.vendor||"",
      qty:p.qty||"1",unitCost:p.unitCost||"",vehicleId:p.vehicleId,
      receivedDate:date,usedOnService:true,
    }))];
    save({vehicles:nv,records:[...D.records,newRec],partsInventory:ni,partsToOrder:remainingOrders,orderHistory:newHistory});
    setModal(null);setEdit(null);
  };

  const invQtyAdj=(id,delta)=>{const ni=D.partsInventory.map(p=>p.id===id?{...p,qty:String(Math.max(0,(parseInt(p.qty)||0)+delta))}:p);save({partsInventory:ni});};

  const printServiceHistory=(vid)=>{
    const v=D.vehicles.find(vv=>vv.id===vid); if(!v) return;
    const recs=D.records.filter(r=>r.vehicleId===vid).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
    const cust=D.customers.find(c=>c.id===v.customerId);
    const biz=D.settings?.businessName||"";
    const total=recs.reduce((s,r)=>s+(parseFloat(r.cost)||0),0);
    const w=window.open("","_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>Service History — ${v.name}</title><style>body{font-family:Arial,sans-serif;padding:24px;max-width:800px;margin:0 auto;}h1{font-size:22px;margin-bottom:4px;}h2{font-size:14px;font-weight:normal;color:#666;margin:0 0 20px;}table{width:100%;border-collapse:collapse;margin-top:16px;}th{background:#f0f0f0;text-align:left;padding:8px 10px;font-size:12px;border-bottom:2px solid #ccc;}td{padding:8px 10px;border-bottom:1px solid #e0e0e0;font-size:13px;vertical-align:top;}.cost{text-align:right;color:#2a5e2a;font-weight:bold;}.total{font-weight:bold;background:#f8f8f8;}@media print{button{display:none;}}</style></head><body>`);
    w.document.write(`<button onclick="window.print()" style="float:right;padding:6px 14px;background:#c07010;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;">🖨 Print</button>`);
    w.document.write(`<h1>${v.name}</h1><h2>${[v.year,v.make,v.model].filter(Boolean).join(" ")}${cust?" · "+cust.name:""}${biz?" — "+biz:""}</h2>`);
    w.document.write(`<div style="display:flex;gap:24px;margin-bottom:16px;font-size:13px;"><span><b>Records:</b> ${recs.length}</span><span><b>Total Cost:</b> $${total.toLocaleString()}</span>${v.hours?`<span><b>Hours/Miles:</b> ${Number(v.hours).toLocaleString()}</span>`:""}</div>`);
    w.document.write(`<table><thead><tr><th>Date</th><th>Service Type</th><th>Notes</th><th>Technician</th><th class="cost">Cost</th></tr></thead><tbody>`);
    recs.forEach(r=>{w.document.write(`<tr><td>${r.date}</td><td>${r.type||""}</td><td>${r.notes||""}</td><td>${r.tech||""}</td><td class="cost">${r.cost?"$"+Number(r.cost).toLocaleString():""}</td></tr>`);});
    w.document.write(`<tr class="total"><td colspan="4">Total</td><td class="cost">$${total.toLocaleString()}</td></tr>`);
    w.document.write(`</tbody></table></body></html>`);
    w.document.close();
  };
  const saveInvItem=f=>{let ni;if(editTarget){ni=D.partsInventory.map(p=>p.id===editTarget.id?{...editTarget,...f}:p);}else{ni=[...D.partsInventory,{id:genId(),partNumbers:[],...f}];}save({partsInventory:ni});setModal(null);setEdit(null);};
  const deleteInvItem=id=>save({partsInventory:D.partsInventory.filter(p=>p.id!==id)});
  const saveVendor=f=>{let nv;if(editTarget){nv=D.vendors.map(v=>v.id===editTarget.id?{...editTarget,...f}:v);}else{nv=[...D.vendors,{id:genId(),...f}];}save({vendors:nv});setModal(null);setEdit(null);};
  const deleteVendor=id=>{if(!confirm("Delete vendor?"))return;save({vendors:D.vendors.filter(v=>v.id!==id)});};
  const createInvoice=f=>{const recs=D.records.filter(r=>selRecIds.has(r.id));const inv={id:genId(),num:nextInvNum(D.invoices),date:f.date,custId:f.custId,businessName:f.businessName,records:recs.map(r=>r.id),laborCost:f.laborCost||"",laborDesc:f.laborDesc||"",status:"draft"};const nr=D.records.map(r=>selRecIds.has(r.id)?{...r,invoiced:true,invoiceId:inv.id}:r);save({invoices:[...D.invoices,inv],records:nr});setModal(null);setSelRecs(new Set());};
  const updateInvStatus=(id,status)=>save({invoices:D.invoices.map(i=>i.id===id?{...i,status}:i)});
  const deleteInvoice=id=>{if(!confirm("Delete invoice?"))return;const inv=D.invoices.find(i=>i.id===id);if(!inv)return;save({invoices:D.invoices.filter(i=>i.id!==id),records:D.records.map(r=>inv.records.includes(r.id)?{...r,invoiced:false,invoiceId:""}:r)});};
  const toggleFeature=k=>save({settings:{...D.settings,features:{...D.settings.features,[k]:!D.settings.features?.[k]}}});

  // ── Derived ────────────────────────────────────────────────────
  const selVeh  = D.vehicles.find(v=>v.id===selVehId)||null;
  const selCust = D.customers.find(c=>c.id===selCustId)||null;
  const vRecords= selVeh?D.records.filter(r=>r.vehicleId===selVeh.id).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))):[];
  const fVehicles=[...D.vehicles].filter(v=>!sbSearch||(v.name+v.make+v.model).toLowerCase().includes(sbSearch.toLowerCase())).sort((a,b)=>a.name.localeCompare(b.name));
  const neededCnt= D.partsToOrder.filter(p=>!p.ordered&&!p.received).length;
  const orderedCnt=D.partsToOrder.filter(p=>p.ordered&&!p.received).length;
  const openTodos=(D.vehicles||[]).reduce((s,v)=>s+(v.todos||[]).filter(t=>!t.done).length,0);
  const custName=id=>D.customers.find(c=>c.id===id)?.name||"";
  const vehName=id=>id==="__stock__"?"📦 For Stock":(D.vehicles.find(v=>v.id===id)?.name||"");
  const featOn=k=>D.settings.features?.[k]!==false;
  const filteredPO=[...D.partsToOrder].filter(p=>{
    if(poFilters.q&&!(p.desc+p.num+(p.vendor||"")).toLowerCase().includes(poFilters.q.toLowerCase()))return false;
    if(poFilters.vendor&&(p.vendor||"").toLowerCase()!==poFilters.vendor.toLowerCase())return false;
    if(poFilters.num&&(p.num||"").toLowerCase()!==poFilters.num.toLowerCase())return false;
    if(poFilters.vehicle&&p.vehicleId!==poFilters.vehicle)return false;
    if(poFilters.status==="needed"&&(p.ordered||p.received))return false;
    if(poFilters.status==="ordered"&&(!p.ordered||p.received))return false;
    if(poFilters.status==="received"&&!p.received)return false;
    return true;
  });

  const tabs=[
    {id:"fleet",label:"🚜 Fleet"},
    {id:"report",label:"📋 Report"},
    {id:"costs",label:"💰 Cost Analysis"},
    ...(featOn("invoicing")?[{id:"invoices",label:"🧾 Invoices"}]:[]),
    ...(featOn("orderParts")?[{id:"order",label:"🔩 Order Parts",badge:neededCnt>0?neededCnt:null,badgeClass:""}]:[]),
    ...(featOn("partsInventory")?[{id:"parts",label:"📦 Parts"}]:[]),
    {id:"vendors",label:"🏪 Vendors"},
    {id:"orderhistory",label:"✅ Order History"},
    {id:"todos",label:"☑️ To-Do",badge:openTodos>0?openTodos:null},
    {id:"search",label:"🔍 Search"},
    {id:"admin",label:"⚙️ Admin"},
  ];

  if(loading) return <div style={{padding:"60px",textAlign:"center",color:"#6b7280",fontFamily:"'Share Tech Mono',monospace"}}>LOADING SERVICE LOG...</div>;

  return (
    <>
      <style>{SL_CSS}</style>
      <div className="sl">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-brand">
            <div className="topbar-eyebrow">⚙ Fleet</div>
            <div className="topbar-title">SERVICE<span>LOG</span></div>
          </div>
          <div className="topbar-stats">
            <div><div className="ts-val">{D.vehicles.length}</div><div className="ts-lbl">Equipment</div></div>
            <div><div className="ts-val">{D.records.length}</div><div className="ts-lbl">Records</div></div>
            <div><div className="ts-val">${sumCost(D.records).toLocaleString()}</div><div className="ts-lbl">Total Spent</div></div>
          </div>
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap",alignItems:"center"}}>
            {sync==="queued"&&<span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:"9px",letterSpacing:"1px",background:"#fff0f0",color:"#dc2626",border:"1px solid #e0c0c0",borderRadius:"3px",padding:"2px 6px"}}>⚠ QUEUED</span>}
            {sync==="saving"&&<span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:"9px",letterSpacing:"1px",color:"#6b7280"}}>SAVING...</span>}
            {tab==="fleet"&&selVeh&&<button className="btn btn-primary btn-sm" onClick={()=>{setEdit(null);setModal("record");}}>+ Log Service</button>}
            {tab==="fleet"&&!selVeh&&<button className="btn btn-primary btn-sm" onClick={()=>{setEdit(null);setModal("vehicle");}}>+ Add Equipment</button>}
            {tab==="vendors"&&<button className="btn btn-primary btn-sm" onClick={()=>{setEdit(null);setModal("vendor");}}>+ Add Vendor</button>}
            {tab==="parts"&&<button className="btn btn-primary btn-sm" onClick={()=>{setEdit(null);setModal("invItem");}}>+ Add Item</button>}
            <button className="btn btn-ghost btn-sm" onClick={()=>setModal("importMaintenance")}>📥 Import Maintenance History</button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="tab-bar">
          {tabs.map(t=>(
            <button key={t.id} className={`tab-btn ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>
              {t.label}
              {t.badge&&<span className={`tab-badge ${t.badgeClass||""}`}>{t.badge}</span>}
            </button>
          ))}
        </div>

        <div className="layout">
          {/* Sidebar — fleet only */}
          {tab==="fleet"&&(
            <div className="sidebar">
              <div className="sidebar-hdr"><span className="sidebar-lbl">Customers</span><span style={{fontSize:11,color:"var(--text-dim)"}}>{D.customers.length}</span></div>
              <div className="sidebar-search"><input placeholder="Search equipment…" value={sbSearch} onChange={e=>setSbSearch(e.target.value)}/></div>
              <div className="sidebar-list">
                {[...D.customers].sort((a,b)=>a.name.localeCompare(b.name)).map(c=>{
                  const cvs=[...fVehicles.filter(v=>v.customerId===c.id)].sort((a,b)=>a.name.localeCompare(b.name));
                  const isOpen=selCustId===c.id||cvs.some(v=>v.id===selVehId);
                  return(<div key={c.id}>
                    <div className={`si ${selCustId===c.id&&!selVehId?"active":""}`} onClick={()=>{setSelCust(c.id);setSelVeh(null);}}>
                      <span className="si-icon">🏢</span>
                      <div className="si-info"><div className="si-name">{c.name}</div><div className="si-sub">{cvs.length} equipment</div></div>
                      <span className="si-count">{cvs.length}</span>
                    </div>
                    {isOpen&&cvs.map(v=>(
                      <div key={v.id} className={`si ${selVehId===v.id?"active":""}`} style={{paddingLeft:"26px"}} onClick={()=>{setSelVeh(v.id);setSelCust(c.id);}}>
                        <span className="si-icon" style={{fontSize:"12px"}}>{ICONS[v.type]||"🔧"}</span>
                        <div className="si-info"><div className="si-name" style={{fontSize:"12px"}}>{v.name}</div><div className="si-sub">{D.records.filter(r=>r.vehicleId===v.id).length} records</div></div>
                      </div>
                    ))}
                  </div>);
                })}
              </div>
              <button className="sidebar-add" onClick={()=>{setEdit(null);setModal("customer");}}>＋ Add Customer</button>
            </div>
          )}

          <div className="main">
            <div className="main-content">

              {/* ── FLEET ── */}
              {tab==="fleet"&&<FleetView D={D} selVeh={selVeh} selCust={selCust} selCustId={selCustId} setSelVeh={setSelVeh} setSelCust={setSelCust} vRecords={vRecords} selRecIds={selRecIds} setSelRecs={setSelRecs} setModal={setModal} setEdit={setEdit} deleteVehicle={deleteVehicle} deleteRecord={deleteRecord} toggleTodo={toggleTodo} deleteTodo={deleteTodo} custName={custName} ICONS={ICONS} printServiceHistory={printServiceHistory}/>}
              {tab==="report"&&<ReportView D={D} reportFil={reportFil} setRepFil={setRepFil} custName={custName} vehName={vehName}/>}
              {tab==="costs"&&<CostView D={D} custName={custName}/>}
              {tab==="invoices"&&<InvoicesView D={D} updateInvStatus={updateInvStatus} deleteInvoice={deleteInvoice} custName={custName}/>}
              {tab==="order"&&<OrderView D={D} filteredPO={filteredPO} poFilters={poFilters} setPOF={setPOF} poNew={poNew} setPoNew={setPoNew} quickAddPart={quickAddPart} toggleOrdered={toggleOrdered} toggleReceived={toggleReceived} deletePart={deletePart} archiveReceived={archiveReceived} consolidateDupes={consolidateDupes} selPoIds={selPoIds} setSelPoIds={setSelPoIds} setEdit={setEdit} setModal={setModal} vehName={vehName}/>}
              {tab==="parts"&&<PartsView D={D} invFilters={invFilters} setInvF={setInvF} deleteInvItem={deleteInvItem} setEdit={setEdit} setModal={setModal} invQtyAdj={invQtyAdj}/>}
              {tab==="vendors"&&<VendorsView D={D} deleteVendor={deleteVendor} setEdit={setEdit} setModal={setModal}/>}
              {tab==="orderhistory"&&<HistoryView D={D} vehName={vehName}/>}
              {tab==="todos"&&<TodosView D={D} toggleTodo={toggleTodo} deleteTodo={deleteTodo} setEdit={setEdit} setModal={setModal} setTab={setTab} setSelVeh={setSelVeh} setSelCust={setSelCust}/>}
              {tab==="search"&&<SearchView D={D} gsQuery={gsQuery} setGsQ={setGsQ} setSelVeh={setSelVeh} setSelCust={setSelCust} setTab={setTab}/>}
              {tab==="admin"&&<AdminView D={D} toggleFeature={toggleFeature}/>}

            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal==="vehicle"  &&<VehicleMo   initial={editTarget} customers={D.customers} onSave={saveVehicle}  onClose={()=>{setModal(null);setEdit(null);}}/>}
      {modal==="importMaintenance" && <ImportMaintenanceModal vehicles={D.vehicles} records={D.records} onImport={(newRecords)=>{save({records:[...D.records,...newRecords]});}} onRepair={(fixedRecords)=>{const byId=new Map(fixedRecords.map(r=>[r.id,r]));save({records:D.records.map(r=>byId.get(r.id)||r)});}} onClose={()=>setModal(null)}/>}
      {modal==="record"   &&<RecordMo    initial={editTarget} vehicleId={selVehId} partsToOrder={D.partsToOrder} onSave={saveRecord}   onClose={()=>{setModal(null);setEdit(null);}}/>}
      {modal==="customer" &&<CustomerMo  initial={editTarget} onSave={saveCustomer} onClose={()=>{setModal(null);setEdit(null);}}/>}
      {modal==="todo"     &&<TodoMo      vehicleId={editTarget?.vehicleId||selVehId} initial={editTarget} onSave={saveTodo} onClose={()=>{setModal(null);setEdit(null);}}/>}
      {modal==="part"     &&<PartMo      initial={editTarget} vehicles={D.vehicles} vendors={D.vendors} onSave={savePart} onClose={()=>{setModal(null);setEdit(null);}}/>}
      {modal==="invItem"  &&<InvItemMo   initial={editTarget} vehicles={D.vehicles} onSave={saveInvItem} onClose={()=>{setModal(null);setEdit(null);}}/>}
      {modal==="vendor"   &&<VendorMo    initial={editTarget} onSave={saveVendor}  onClose={()=>{setModal(null);setEdit(null);}}/>}
      {modal==="addToService"&&<AddToServiceMo parts={(editTarget||[]).map(id=>D.partsToOrder.find(p=>p.id===id)).filter(Boolean)} vehicles={D.vehicles} onSave={addPartsToService} onClose={()=>{setModal(null);setEdit(null);}}/>}
      {modal==="receive"  &&<ReceiveMo   part={editTarget} partsInventory={D.partsInventory} onSave={confirmReceive} onClose={()=>{setModal(null);setEdit(null);}}/>}
      {modal==="invoice"  &&<InvoiceMo   records={D.records.filter(r=>selRecIds.has(r.id))} customers={D.customers} settings={D.settings} selCustId={selCustId} vehicles={D.vehicles} nextNum={nextInvNum(D.invoices)} onSave={createInvoice} onClose={()=>setModal(null)}/>}
    </>
  );
}

// ── Fleet View ────────────────────────────────────────────────────
function FleetView({D,selVeh,selCust,selCustId,setSelVeh,setSelCust,vRecords,selRecIds,setSelRecs,setModal,setEdit,deleteVehicle,deleteRecord,toggleTodo,deleteTodo,custName,ICONS,printServiceHistory}){
  const [partsMenu, setPartsMenu] = useState(false);

  const partsSearchLinks = (v) => {
    if (!v?.model && !v?.make) return [];
    const q = [v.year, v.make, v.model].filter(Boolean).join(" ");
    const qEnc = encodeURIComponent(q + " parts");
    const modelEnc = encodeURIComponent(v.model || q);
    const makeL = (v.make||"").toLowerCase();
    const links = [
      { label:"Google", icon:"🔍", url:`https://www.google.com/search?q=${qEnc}` },
      { label:"Messick's", icon:"🚜", url:`https://www.messicks.com/search?term=${modelEnc}` },
      { label:"TractorJoe", icon:"🌾", url:`https://www.tractorjoe.com/search?searchterm=${modelEnc}` },
      { label:"Amazon", icon:"📦", url:`https://www.amazon.com/s?k=${qEnc}` },
    ];
    if (makeL.includes("john deere")||makeL.includes("deere"))
      links.splice(1,0,{ label:"John Deere Parts", icon:"🟡", url:`https://www.deere.com/en/parts-and-service/find-parts/parts-catalog/?modelNumber=${modelEnc}` });
    else if (makeL.includes("case")||makeL.includes("cnh"))
      links.splice(1,0,{ label:"Case IH Parts", icon:"🔴", url:`https://www.caseih.com/northamerica/en-us/parts-and-service/parts.html?search=${modelEnc}` });
    else if (makeL.includes("new holland"))
      links.splice(1,0,{ label:"New Holland Parts", icon:"🔵", url:`https://www.newholland.com/naen/en-us/parts-and-service.html?search=${modelEnc}` });
    else if (makeL.includes("kubota"))
      links.splice(1,0,{ label:"Kubota Parts", icon:"🟠", url:`https://www.kubotausa.com/parts-and-service?search=${modelEnc}` });
    else if (makeL.includes("cat")||makeL.includes("caterpillar"))
      links.splice(1,0,{ label:"Cat Parts", icon:"🟡", url:`https://parts.cat.com/en/catcorp?searchterm=${modelEnc}` });
    else if (makeL.includes("agco")||makeL.includes("massey"))
      links.splice(1,0,{ label:"AGCO Parts", icon:"⚙️", url:`https://www.agcoparts.com/parts/catalog?q=${modelEnc}` });
    return links;
  };
  if(!selCustId&&!selVeh) return (
    <div>
      <div className="overview-title">Fleet Overview</div>
      <div className="overview-sub">Select a customer from the sidebar or add new equipment.</div>
      <div className="summary-bar">
        <div className="summary-stat"><div className="summary-stat-val">{D.customers.length}</div><div className="summary-stat-lbl">Customers</div></div>
        <div className="summary-stat"><div className="summary-stat-val">{D.vehicles.length}</div><div className="summary-stat-lbl">Equipment</div></div>
        <div className="summary-stat"><div className="summary-stat-val">{D.records.length}</div><div className="summary-stat-lbl">Records</div></div>
        <div className="summary-stat"><div className="summary-stat-val">${sumCost(D.records).toLocaleString()}</div><div className="summary-stat-lbl">Total Spent</div></div>
      </div>
      <div className="fleet-grid">
        {[...D.customers].sort((a,b)=>a.name.localeCompare(b.name)).map(c=>{const cvs=D.vehicles.filter(v=>v.customerId===c.id);const cr=D.records.filter(r=>cvs.some(v=>v.id===r.vehicleId));return(<div key={c.id} className="vehicle-card" onClick={()=>{setSelCust(c.id);setSelVeh(null);}}>
          <div className="vc-type">🏢 Customer</div><div className="vc-name">{c.name}</div>
          {c.notes&&<div className="vc-sub">{c.notes}</div>}
          <div className="vc-meta"><div><div className="vc-stat-lbl">Equipment</div><div className="vc-stat-val">{cvs.length}</div></div><div><div className="vc-stat-lbl">Records</div><div className="vc-stat-val">{cr.length}</div></div><div><div className="vc-stat-lbl">Total Cost</div><div className="vc-stat-val">${sumCost(cr).toLocaleString()}</div></div></div>
        </div>);})}
      </div>
    </div>
  );

  if(selCust&&!selVeh){
    const cvs=[...D.vehicles.filter(v=>v.customerId===selCust.id)].sort((a,b)=>a.name.localeCompare(b.name));
    return(<div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"12px",flexWrap:"wrap",gap:"8px"}}>
        <div><div className="overview-title">{selCust.name}</div><div className="overview-sub">{cvs.length} equipment</div></div>
        <div style={{display:"flex",gap:"6px"}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>{setEdit(selCust);setModal("customer");}}>Edit Customer</button>
          <button className="btn btn-primary btn-sm" onClick={()=>{setEdit(null);setModal("vehicle");}}>+ Add Equipment</button>
        </div>
      </div>
      {(selCust.phone||selCust.email||selCust.businessName)&&(
        <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:"6px",padding:"10px 14px",marginBottom:"16px",display:"flex",gap:"16px",flexWrap:"wrap"}}>
          {selCust.businessName&&<span style={{fontSize:"12px"}}><strong>Business:</strong> {selCust.businessName}</span>}
          {selCust.phone&&<span style={{fontSize:"12px"}}><a href={`tel:${selCust.phone}`} style={{color:"var(--amber-dim)",textDecoration:"none"}}>📞 {selCust.phone}</a></span>}
          {selCust.email&&<span style={{fontSize:"12px"}}><a href={`mailto:${selCust.email}`} style={{color:"var(--amber-dim)",textDecoration:"none"}}>✉️ {selCust.email}</a></span>}
        </div>
      )}
      <div className="fleet-grid">
        {cvs.length===0&&<div className="empty" style={{gridColumn:"1/-1"}}><div className="empty-icon">🔧</div><div className="empty-title">No Equipment</div></div>}
        {cvs.map(v=>{const recs=D.records.filter(r=>r.vehicleId===v.id);return(<div key={v.id} className="vehicle-card" onClick={()=>setSelVeh(v.id)}>
          <div className="vc-type">{ICONS[v.type]} {v.type}</div><div className="vc-name">{v.name}</div>
          <div className="vc-sub">{[v.year,v.make,v.model].filter(Boolean).join(" · ")}</div>
          <div className="vc-meta"><div><div className="vc-stat-lbl">Records</div><div className="vc-stat-val">{recs.length}</div></div><div><div className="vc-stat-lbl">Cost</div><div className="vc-stat-val">${sumCost(recs).toLocaleString()}</div></div>{v.hours&&<div><div className="vc-stat-lbl">Hrs/Mi</div><div className="vc-stat-val">{Number(v.hours).toLocaleString()}</div></div>}</div>
          {recs[0]&&<div className="vc-last">Last: {recs[0].type} — {recs[0].date}</div>}
        </div>);})}
      </div>
    </div>);
  }

  if(selVeh){
    const openTodos=(selVeh.todos||[]).filter(t=>!t.done);
    const doneTodos=(selVeh.todos||[]).filter(t=>t.done);
    return(<div onClick={()=>setPartsMenu(false)}>
      <div className="vic">
        <div className="vic-top">
          <div className="vic-identity">
            <div className="vic-icon">{ICONS[selVeh.type]||"🔧"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div className="vic-vname">{selVeh.name}</div>
              <span className="vic-badge">{selVeh.type}</span>
              {custName&&<span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:"10px",color:"var(--text-dim)",marginLeft:"8px"}}>@ {custName}</span>}
            </div>
          </div>
          <div className="vic-actions">
            {(selVeh.make||selVeh.model)&&(
              <div style={{position:"relative"}}>
                <button className="btn btn-ghost btn-sm" onClick={e=>{e.stopPropagation();setPartsMenu(p=>!p);}}>🔍 Parts</button>
                {partsMenu&&(
                  <div style={{position:"absolute",top:"100%",right:0,zIndex:50,background:"var(--panel)",border:"1px solid var(--border)",borderRadius:"6px",boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:"200px",marginTop:"4px"}} onClick={e=>e.stopPropagation()}>
                    <div style={{padding:"8px 12px",fontSize:"10px",fontFamily:"'Share Tech Mono',monospace",letterSpacing:"1px",color:"var(--text-dim)",borderBottom:"1px solid var(--border)"}}>FIND PARTS FOR {[selVeh.year,selVeh.make,selVeh.model].filter(Boolean).join(" ").toUpperCase()}</div>
                    {partsSearchLinks(selVeh).map(l=>(
                      <a key={l.label} href={l.url} target="_blank" rel="noreferrer" onClick={()=>setPartsMenu(false)}
                        style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 14px",fontSize:"13px",color:"var(--text)",textDecoration:"none",borderBottom:"1px solid var(--border)",transition:"background .1s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="var(--bg3)"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <span style={{fontSize:"16px"}}>{l.icon}</span>
                        <span>{l.label}</span>
                        <span style={{marginLeft:"auto",fontSize:"10px",color:"var(--text-dim)"}}>↗</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button className="btn btn-ghost btn-sm" onClick={()=>{setEdit(selVeh);setModal("vehicle");}}>Edit</button>
            <button className="btn btn-ghost btn-sm" onClick={()=>printServiceHistory(selVeh.id)}>🖨 Print</button>
            <button className="btn btn-danger btn-sm" onClick={()=>deleteVehicle(selVeh.id)}>Delete</button>
          </div>
        </div>

        {/* Full vehicle info grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"8px 16px",padding:"12px 0",borderTop:"1px solid var(--border)",marginTop:"8px"}}>
          {selVeh.year&&<div><div className="vic-spec-lbl">Year</div><div className="vic-spec-val">{selVeh.year}</div></div>}
          {selVeh.make&&<div><div className="vic-spec-lbl">Make</div><div className="vic-spec-val">{selVeh.make}</div></div>}
          {selVeh.model&&<div><div className="vic-spec-lbl">Model</div><div className="vic-spec-val">{selVeh.model}</div></div>}
          {selVeh.engine&&<div><div className="vic-spec-lbl">Engine</div><div className="vic-spec-val">{selVeh.engine}</div></div>}
          {selVeh.hp&&<div><div className="vic-spec-lbl">HP</div><div className="vic-spec-val">{selVeh.hp}</div></div>}
          {selVeh.hours&&<div><div className="vic-spec-lbl">Hrs / Miles</div><div className="vic-spec-val">{Number(selVeh.hours).toLocaleString()}</div></div>}
          {selVeh.vin&&<div style={{gridColumn:"span 2"}}><div className="vic-spec-lbl">VIN / Serial</div><div className="vic-spec-val" style={{fontFamily:"'Share Tech Mono',monospace",letterSpacing:"0.08em",color:"var(--amber)"}}>{selVeh.vin}</div></div>}
          <div><div className="vic-spec-lbl">Records</div><div className="vic-spec-val">{vRecords.length}</div></div>
          <div><div className="vic-spec-lbl">Total Cost</div><div className="vic-spec-val" style={{color:"var(--green)"}}>${sumCost(vRecords).toLocaleString()}</div></div>
        </div>

        {selVeh.notes&&<div className="vic-notes">📝 {selVeh.notes}</div>}
      </div>

      {/* Todos */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
        <span style={{fontFamily:"'Rajdhani',sans-serif",fontSize:"15px",fontWeight:700,color:"var(--text-bright)"}}>
          ☑️ To-Do {openTodos.length>0&&<span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:"11px",padding:"2px 7px",borderRadius:"10px",background:"rgba(220,38,38,.1)",color:"#dc2626",marginLeft:"6px"}}>{openTodos.length} open</span>}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={()=>{setEdit({vehicleId:selVeh.id});setModal("todo");}}>+ Add</button>
      </div>
      {[...openTodos,...doneTodos].map(t=>(
        <div key={t.id} className={`todo-item ${t.done?"done":""} pri-${t.priority||"medium"}`}>
          <input type="checkbox" checked={t.done} onChange={()=>toggleTodo(selVeh.id,t.id)} style={{width:"16px",height:"16px",cursor:"pointer",accentColor:"#16a34a",marginTop:"2px",flexShrink:0}}/>
          <div style={{flex:1}}><div style={{fontSize:"14px",fontWeight:600,textDecoration:t.done?"line-through":"none",color:t.done?"var(--text-dim)":"var(--text-bright)"}}>{t.text}</div>{t.dueDate&&<div style={{fontSize:"11px",color:"var(--text-dim)",marginTop:"2px"}}>Due: {t.dueDate}</div>}</div>
          <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:"10px",letterSpacing:"1px",padding:"1px 6px",borderRadius:"3px",background:`${PRI_COLOR[t.priority||"medium"]}18`,color:PRI_COLOR[t.priority||"medium"],flexShrink:0}}>{t.priority||"medium"}</span>
          <button className="btn btn-ghost btn-sm" style={{padding:"2px 7px",fontSize:"11px"}} onClick={()=>{setEdit({...t,vehicleId:selVeh.id});setModal("todo");}}>Edit</button>
          <button className="btn btn-danger btn-xs" onClick={()=>deleteTodo(selVeh.id,t.id)}>✕</button>
        </div>
      ))}
      {(selVeh.todos||[]).length===0&&<p style={{fontSize:"12px",color:"var(--text-dim)",marginBottom:"12px"}}>No to-do items. Click "+ Add" to create one.</p>}

      {/* Invoice bar */}
      {selRecIds.size>0&&(
        <div className="invoice-bar">
          <span className="invoice-bar-msg">📋 {selRecIds.size} record{selRecIds.size>1?"s":""} selected for invoice</span>
          <div style={{display:"flex",gap:"6px"}}><button className="btn btn-ghost btn-sm" onClick={()=>setSelRecs(new Set())}>Clear</button><button className="btn btn-primary btn-sm" onClick={()=>setModal("invoice")}>Create Invoice</button></div>
        </div>
      )}

      {/* Records */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px",marginTop:"14px"}}>
        <span style={{fontFamily:"'Rajdhani',sans-serif",fontSize:"15px",fontWeight:700,color:"var(--text-bright)"}}>🔧 Service Records</span>
      </div>
      {vRecords.length===0?<div className="empty"><div className="empty-icon">🔧</div><div className="empty-title">No Service Records</div><div style={{fontSize:"13px"}}>Hit "+ Log Service" to add the first entry.</div></div>:(
        <div className="service-list">{vRecords.map(r=>{
          const d=fmtDate(r.date);
          const parts=(r.parts||[]);
          const inv=r.invoiced?D.invoices.find(i=>i.id===r.invoiceId):null;
          const checked=selRecIds.has(r.id);
          return(<div key={r.id} className="sr" style={{background:checked?"rgba(217,119,6,.04)":""}}>
            <div><div className="sr-day">{d.day}</div><div className="sr-mon">{d.mon}</div><div className="sr-yr">{d.yr}</div></div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"3px"}}>
                <input type="checkbox" checked={checked} onChange={()=>setSelRecs(s=>{const n=new Set(s);checked?n.delete(r.id):n.add(r.id);return n;})} style={{accentColor:"var(--amber)",cursor:"pointer"}}/>
                <div className="sr-type">{r.type}</div>
                {inv&&<span className="sr-inv-tag">INV {inv.num}</span>}
              </div>
              {r.notes&&<div className="sr-notes">{r.notes}</div>}
              <div className="sr-tags">{r.tech&&<span className="sr-tag">👤 {r.tech}</span>}{r.hours&&<span className="sr-tag">⏱ {Number(r.hours).toLocaleString()}</span>}</div>
              {parts.length>0&&<div style={{marginTop:"4px"}}>{parts.map((p,i)=><span key={i} className="sr-part">{[p.desc,p.num].filter(Boolean).join(" #")}{p.qty>1?` ×${p.qty}`:""}</span>)}</div>}
            </div>
            <div className="sr-right">
              <div className="sr-cost">{r.cost?`$${Number(r.cost).toLocaleString()}`:"—"}</div>
              <button className="btn btn-ghost btn-sm" onClick={()=>{setEdit(r);setModal("record");}}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={()=>deleteRecord(r.id)}>✕</button>
            </div>
          </div>);
        })}</div>
      )}
    </div>);
  }
  return null;
}

// ── Report View ───────────────────────────────────────────────────
function ReportView({D,reportFil,setRepFil,custName,vehName}){
  const recs=D.records||[];
  const vehs=D.vehicles||[];
  let filtered=recs;
  if(reportFil.dateFrom) filtered=filtered.filter(r=>r.date>=reportFil.dateFrom);
  if(reportFil.dateTo)   filtered=filtered.filter(r=>r.date<=reportFil.dateTo);
  if(reportFil.type)     filtered=filtered.filter(r=>r.type===reportFil.type);
  if(reportFil.custId){
    const cv=vehs.filter(v=>v.customerId===reportFil.custId).map(v=>v.id);
    filtered=filtered.filter(r=>cv.includes(r.vehicleId));
  }
  const totalCost=sumCost(filtered);
  const types=[...new Set(recs.map(r=>r.type).filter(Boolean))].sort();
  const recent30=recs.filter(r=>new Date(r.date)>=new Date(Date.now()-30*86400000)).length;
  const s=(k,v)=>setRepFil(p=>({...p,[k]:v}));
  return(<div>
    <div className="overview-title">Service Report</div>
    <div className="overview-sub">{recs.length} total records across {vehs.length} equipment</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"14px",padding:"10px 12px",background:"var(--panel)",border:"1px solid var(--border)",borderRadius:"6px",alignItems:"flex-end"}}>
      <div className="form-group" style={{flex:1,minWidth:"120px"}}><label className="form-lbl">From</label><input type="date" className="form-input" style={{padding:"5px 8px"}} value={reportFil.dateFrom} onChange={e=>s("dateFrom",e.target.value)}/></div>
      <div className="form-group" style={{flex:1,minWidth:"120px"}}><label className="form-lbl">To</label><input type="date" className="form-input" style={{padding:"5px 8px"}} value={reportFil.dateTo} onChange={e=>s("dateTo",e.target.value)}/></div>
      <div className="form-group" style={{flex:1,minWidth:"130px"}}><label className="form-lbl">Type</label><select className="form-select" style={{padding:"5px 8px"}} value={reportFil.type} onChange={e=>s("type",e.target.value)}><option value="">All Types</option>{types.map(t=><option key={t}>{t}</option>)}</select></div>
      <div className="form-group" style={{flex:1,minWidth:"130px"}}><label className="form-lbl">Customer</label><select className="form-select" style={{padding:"5px 8px"}} value={reportFil.custId} onChange={e=>s("custId",e.target.value)}><option value="">All Customers</option>{[...D.customers].sort((a,b)=>a.name.localeCompare(b.name)).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      {(reportFil.dateFrom||reportFil.dateTo||reportFil.type||reportFil.custId)&&<button className="btn btn-ghost btn-sm" onClick={()=>setRepFil({dateFrom:"",dateTo:"",type:"",custId:""})}>Clear</button>}
    </div>
    <div className="summary-bar">
      <div className="summary-stat"><div className="summary-stat-val">{filtered.length}</div><div className="summary-stat-lbl">Records</div></div>
      <div className="summary-stat"><div className="summary-stat-val">{recent30}</div><div className="summary-stat-lbl">Last 30 Days</div></div>
      <div className="summary-stat"><div className="summary-stat-val">${totalCost.toLocaleString()}</div><div className="summary-stat-lbl">Total Cost</div></div>
    </div>
    <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:"6px",overflow:"hidden"}}>
      <table className="report-table">
        <thead><tr><th>Date</th><th>Vehicle</th><th>Type</th><th>Notes</th><th style={{textAlign:"right"}}>Cost</th></tr></thead>
        <tbody>{filtered.sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))).map(r=>{const v=vehs.find(vv=>vv.id===r.vehicleId);return(<tr key={r.id}><td className="td-date">{r.date}</td><td className="td-vehicle">{v?.name||"?"}</td><td className="td-type">{r.type}</td><td className="td-notes">{r.notes?.slice(0,80)}</td><td className="td-cost">{r.cost?`$${Number(r.cost).toLocaleString()}`:"—"}</td></tr>);})}
        {filtered.length===0&&<tr><td colSpan={5} style={{textAlign:"center",padding:"30px",color:"var(--text-dim)"}}>No records match the filters</td></tr>}</tbody>
      </table>
    </div>
  </div>);
}

// ── Cost Analysis ──────────────────────────────────────────────────
function CostView({D,custName}){
  const vehs=D.vehicles||[];
  const recs=D.records||[];
  const grand=sumCost(recs);
  const vCosts=vehs.map(v=>{const vr=recs.filter(r=>r.vehicleId===v.id);return{v,total:sumCost(vr),cnt:vr.length};}).filter(x=>x.total>0||x.cnt>0).sort((a,b)=>b.total-a.total);
  const maxV=vCosts[0]?.total||1;
  const typeCosts={};recs.forEach(r=>{const t=r.type||"Other";typeCosts[t]=(typeCosts[t]||0)+(parseFloat(r.cost)||0);});
  const topTypes=Object.entries(typeCosts).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const maxT=topTypes[0]?.[1]||1;
  const yearCosts={};recs.forEach(r=>{const y=(r.date||"").slice(0,4);if(y>="2010")yearCosts[y]=(yearCosts[y]||0)+(parseFloat(r.cost)||0);});
  const years=Object.entries(yearCosts).sort((a,b)=>a[0].localeCompare(b[0]));
  const maxY=Math.max(...years.map(y=>y[1]),1);
  return(<div>
    <div className="overview-title">Cost Analysis</div><div className="overview-sub">${grand.toLocaleString(undefined,{minimumFractionDigits:2})} total</div>
    <div className="summary-bar">
      <div className="summary-stat"><div className="summary-stat-val">${grand.toLocaleString()}</div><div className="summary-stat-lbl">Grand Total</div></div>
      <div className="summary-stat"><div className="summary-stat-val">{recs.length}</div><div className="summary-stat-lbl">Records</div></div>
      <div className="summary-stat"><div className="summary-stat-val">${recs.length?Math.round(grand/recs.length).toLocaleString():"0"}</div><div className="summary-stat-lbl">Avg/Record</div></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
      <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:"6px",padding:"14px"}}>
        <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:"15px",fontWeight:700,marginBottom:"12px"}}>Cost by Type</div>
        {topTypes.map(([t,c])=>(<div key={t} className="bar-row"><div className="bar-lbl"><span>{t}</span><span style={{color:"var(--text-dim)"}}>${c.toLocaleString()}</span></div><div className="bar-bg"><div className="bar-fill" style={{width:`${(c/maxT)*100}%`}}/></div></div>))}
      </div>
      <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:"6px",padding:"14px"}}>
        <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:"15px",fontWeight:700,marginBottom:"12px"}}>Year over Year</div>
        {years.map(([yr,c])=>(<div key={yr} className="bar-row"><div className="bar-lbl"><span>{yr}</span><span style={{color:"var(--text-dim)"}}>${c.toLocaleString()}</span></div><div className="bar-bg"><div className="bar-fill" style={{width:`${(c/maxY)*100}%`}}/></div></div>))}
      </div>
    </div>
    <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:"6px",padding:"14px"}}>
      <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:"15px",fontWeight:700,marginBottom:"12px"}}>Cost by Equipment</div>
      {vCosts.slice(0,15).map(({v,total,cnt})=>(<div key={v.id} className="bar-row"><div className="bar-lbl"><span style={{fontSize:"12px"}}>{v.name}{custName(v.customerId)&&<span style={{color:"var(--text-dim)",fontSize:"11px"}}> · {custName(v.customerId)}</span>}</span><span style={{color:"var(--text-dim)"}}>${total.toLocaleString()} ({cnt})</span></div><div className="bar-bg"><div className="bar-fill" style={{width:`${(total/maxV)*100}%`}}/></div></div>))}
    </div>
  </div>);
}

// ── Invoices View ──────────────────────────────────────────────────
function InvoicesView({D,updateInvStatus,deleteInvoice,custName}){
  const invs=[...D.invoices].sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
  return(<div>
    <div className="overview-title">Invoices</div><div className="overview-sub">{invs.length} invoice{invs.length!==1?"s":""}</div>
    {invs.length===0&&<div className="empty"><div className="empty-icon">🧾</div><div className="empty-title">No Invoices Yet</div><div style={{fontSize:"13px"}}>Select service records in the Fleet tab and click Create Invoice.</div></div>}
    <div className="inv-list">{invs.map(inv=>{const cust=D.customers.find(c=>c.id===inv.custId);const recTotal=D.records.filter(r=>inv.records.includes(r.id)).reduce((s,r)=>s+(parseFloat(r.cost)||0),0);const total=recTotal+(parseFloat(inv.laborCost)||0);return(<div key={inv.id} className="inv-card">
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"12px",flexWrap:"wrap"}}>
        <div><div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"3px"}}><span className="inv-num">{inv.num}</span><span className={`inv-status-badge ${inv.status||"draft"}`}>{inv.status||"draft"}</span></div><div className="inv-customer">{cust?.name||"Unknown"}</div><div style={{fontSize:"12px",color:"var(--text-dim)",marginTop:"2px"}}>{inv.date} · {inv.records.length} record{inv.records.length!==1?"s":""}</div></div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:"18px",fontWeight:700,color:"var(--text-bright)",marginBottom:"6px"}}>${total.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
          <div style={{display:"flex",gap:"5px",flexWrap:"wrap",justifyContent:"flex-end"}}>
            {["draft","sent","paid"].map(s=>(<button key={s} className={`btn btn-sm ${inv.status===s?"btn-primary":"btn-ghost"}`} onClick={()=>updateInvStatus(inv.id,s)}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>))}
            <button className="btn btn-danger btn-sm" onClick={()=>deleteInvoice(inv.id)}>✕</button>
          </div>
        </div>
      </div>
    </div>);})}
  </div></div>);
}

// ── Order Parts View (TABLE layout matching standalone) ────────────
function OrderView({D,filteredPO,poFilters,setPOF,poNew,setPoNew,quickAddPart,toggleOrdered,toggleReceived,deletePart,archiveReceived,consolidateDupes,selPoIds,setSelPoIds,setEdit,setModal,vehName}){
  const needed=D.partsToOrder.filter(p=>!p.ordered&&!p.received).length;
  const ordered=D.partsToOrder.filter(p=>p.ordered&&!p.received).length;
  const received=D.partsToOrder.filter(p=>p.received).length;
  const allVendors=[...new Set(D.partsToOrder.map(p=>p.vendor).filter(Boolean))].sort();
  const allNums=[...new Set(D.partsToOrder.map(p=>p.num).filter(Boolean))].sort();
  const usedVehs=D.vehicles.filter(v=>D.partsToOrder.some(p=>p.vehicleId===v.id)).sort((a,b)=>a.name.localeCompare(b.name));
  const f=(k,v)=>setPOF(p=>({...p,[k]:v}));
  const pn=(k,v)=>setPoNew(p=>({...p,[k]:v}));

  const allSelected=filteredPO.length>0&&filteredPO.every(p=>selPoIds.has(p.id));
  const toggleAll=()=>{if(allSelected){const n=new Set(selPoIds);filteredPO.forEach(p=>n.delete(p.id));setSelPoIds(n);}else{const n=new Set(selPoIds);filteredPO.forEach(p=>n.add(p.id));setSelPoIds(n);}};

  return(<div>
    {/* Header */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px",flexWrap:"wrap",gap:"8px"}}>
      <div><div className="overview-title">Order Parts</div><div className="overview-sub">{needed} needed · {ordered} on order · {received} received</div></div>
      <div style={{display:"flex",gap:"6px",flexWrap:"wrap",alignItems:"center"}}>
        {selPoIds.size>0&&<><span style={{fontSize:"13px",color:"var(--text-dim)"}}>{selPoIds.size} selected</span><button className="btn btn-ghost btn-sm" onClick={()=>setSelPoIds(new Set())}>Clear</button><button className="btn btn-ghost btn-sm" style={{color:"#2563eb",borderColor:"rgba(37,99,235,.3)"}} onClick={()=>{setEdit([...selPoIds]);setModal("addToService");}}>→ Add to Service</button></>}
        <button className="btn btn-ghost btn-sm" onClick={toggleAll}>Select All</button>
        <button className="btn btn-ghost btn-sm" onClick={consolidateDupes}>Consolidate Dupes</button>
        <button className="btn btn-ghost btn-sm" onClick={archiveReceived}>Archive Received</button>
        <button className="btn btn-primary btn-sm" onClick={()=>{setEdit(null);setModal("part");}}>+ Add Part</button>
      </div>
    </div>

    {/* Summary stats */}
    <div className="po-summary">
      <div className="po-stat needed"><div className="po-stat-val">{needed}</div><div className="po-stat-lbl">Needed</div></div>
      <div className="po-stat ordered"><div className="po-stat-val">{ordered}</div><div className="po-stat-lbl">On Order</div></div>
      <div className="po-stat received"><div className="po-stat-val">{received}</div><div className="po-stat-lbl">Received</div></div>
    </div>

    {/* Quick-add bar */}
    <div className="po-add-bar">
      <div className="form-group" style={{flex:3,minWidth:"140px"}}><label className="form-lbl">Description</label><input className="form-input" style={{padding:"6px 8px"}} placeholder="Part description..." value={poNew.desc} onChange={e=>pn("desc",e.target.value)} onKeyDown={e=>e.key==="Enter"&&quickAddPart()}/></div>
      <div className="form-group" style={{flex:1,minWidth:"90px"}}><label className="form-lbl">Part #</label><input className="form-input" style={{padding:"6px 8px"}} placeholder="Part #" value={poNew.num} onChange={e=>pn("num",e.target.value)}/></div>
      <div className="form-group" style={{flex:1,minWidth:"90px"}}><label className="form-lbl">Vendor</label><input className="form-input" style={{padding:"6px 8px"}} list="vendor-list-po" placeholder="Vendor" value={poNew.vendor} onChange={e=>pn("vendor",e.target.value)}/><datalist id="vendor-list-po">{[...D.vendors].sort((a,b)=>a.name.localeCompare(b.name)).map(v=><option key={v.id} value={v.name}/>)}</datalist></div>
      <div className="form-group" style={{minWidth:"55px"}}><label className="form-lbl">Qty</label><input type="number" className="form-input" style={{padding:"6px 8px"}} min="1" value={poNew.qty} onChange={e=>pn("qty",e.target.value)}/></div>
      <div className="form-group" style={{flex:1,minWidth:"100px"}}><label className="form-lbl">Vehicle</label><select className="form-select" style={{padding:"6px 8px"}} value={poNew.vehicleId} onChange={e=>pn("vehicleId",e.target.value)}><option value="">For Stock</option><option value="__stock__">📦 For Stock</option>{[...D.vehicles].sort((a,b)=>a.name.localeCompare(b.name)).map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
      <button className="btn btn-primary" style={{alignSelf:"flex-end",padding:"6px 14px"}} onClick={quickAddPart}>+ Add</button>
    </div>

    {/* Filters */}
    <div className="po-filters">
      <div className="form-group" style={{flex:2,minWidth:"140px"}}><label className="form-lbl">Keyword</label><input className="form-input" style={{padding:"5px 8px"}} placeholder="Search parts..." value={poFilters.q} onChange={e=>f("q",e.target.value)}/></div>
      <div className="form-group" style={{flex:1,minWidth:"100px"}}><label className="form-lbl">Vendor</label><select className="form-select" style={{padding:"5px 8px"}} value={poFilters.vendor} onChange={e=>f("vendor",e.target.value)}><option value="">All Vendors</option>{allVendors.map(v=><option key={v}>{v}</option>)}</select></div>
      <div className="form-group" style={{flex:1,minWidth:"100px"}}><label className="form-lbl">Part #</label><select className="form-select" style={{padding:"5px 8px"}} value={poFilters.num} onChange={e=>f("num",e.target.value)}><option value="">All Part #s</option>{allNums.map(n=><option key={n}>{n}</option>)}</select></div>
      <div className="form-group" style={{flex:1,minWidth:"110px"}}><label className="form-lbl">Vehicle</label><select className="form-select" style={{padding:"5px 8px"}} value={poFilters.vehicle} onChange={e=>f("vehicle",e.target.value)}><option value="">All Vehicles</option>{usedVehs.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
      <div className="form-group" style={{flex:1,minWidth:"100px"}}><label className="form-lbl">Status</label><select className="form-select" style={{padding:"5px 8px"}} value={poFilters.status} onChange={e=>f("status",e.target.value)}><option value="">All Status</option><option value="needed">Needed</option><option value="ordered">Ordered</option><option value="received">Received</option></select></div>
      {(poFilters.q||poFilters.vendor||poFilters.num||poFilters.vehicle||poFilters.status)&&<button className="btn btn-ghost btn-sm" style={{alignSelf:"flex-end"}} onClick={()=>setPOF({q:"",vendor:"",num:"",vehicle:"",status:""})}>✕ Clear</button>}
    </div>

    {filteredPO.length===0&&<div className="empty"><div className="empty-icon">🔩</div><div className="empty-title">No Parts</div></div>}

    {/* Table */}
    {filteredPO.length>0&&(
      <div className="po-table-wrap">
        <table className="po-table">
          <thead><tr>
            <th style={{width:24}}></th>
            <th style={{width:32}}><input type="checkbox" checked={allSelected} onChange={toggleAll} style={{accentColor:"var(--amber)",cursor:"pointer"}}/></th>
            <th>Description</th><th>Part #</th><th>Vendor</th><th>Qty</th><th>Unit Cost</th><th>Vehicle</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>{filteredPO.map(p=>{
            const status=pStatus(p);
            const vn=p.vehicleId==="__stock__"?"📦 For Stock":vehName(p.vehicleId);
            return(<tr key={p.id} className={`po-row-${status}`}>
              <td><span className={`po-status-dot ${status}`}/></td>
              <td><input type="checkbox" checked={selPoIds.has(p.id)} onChange={()=>setSelPoIds(s=>{const n=new Set(s);s.has(p.id)?n.delete(p.id):n.add(p.id);return n;})} style={{accentColor:"var(--amber)",cursor:"pointer",width:"15px",height:"15px"}}/></td>
              <td style={{fontWeight:600}}>{p.desc||""}</td>
              <td className="po-partnum">{p.num||""}</td>
              <td>{p.vendor||""}</td>
              <td>{p.qty||"1"}</td>
              <td>{p.unitCost?`$${Number(p.unitCost).toFixed(2)}`:""}</td>
              <td style={{fontSize:"12px"}}>{vn}</td>
              <td>
                <div style={{display:"flex",gap:"5px",alignItems:"center",whiteSpace:"nowrap"}}>
                  <input type="checkbox" checked={p.ordered||p.received} disabled={p.received} onChange={()=>toggleOrdered(p.id)} style={{accentColor:"var(--amber)",cursor:"pointer"}}/><span style={{fontSize:"11px"}}>Ord</span>
                  <input type="checkbox" checked={p.received} onChange={()=>toggleReceived(p.id)} style={{accentColor:"var(--green)",cursor:"pointer"}}/><span style={{fontSize:"11px"}}>Recv</span>
                </div>
              </td>
              <td><div style={{display:"flex",gap:"4px",flexWrap:"nowrap"}}>
                <button className="btn btn-ghost btn-xs" style={{color:"#2563eb",borderColor:"rgba(37,99,235,.3)"}} title="Search price online" onClick={()=>{const q=encodeURIComponent([p.num,p.desc].filter(Boolean).join(' ')+'  price');window.open(`https://www.google.com/search?q=${q}`,'_blank');}} >💲</button>
                <button className="btn btn-ghost btn-xs" onClick={()=>{setEdit(p);setModal("part");}}>Edit</button>
                <button className="btn btn-danger btn-xs" onClick={()=>deletePart(p.id)}>✕</button>
              </div></td>
            </tr>);
          })}</tbody>
        </table>
      </div>
    )}
  </div>);
}

// ── Parts Inventory ────────────────────────────────────────────────
function PartsView({D,invFilters,setInvF,deleteInvItem,setEdit,setModal,invQtyAdj}){
  const inv=D.partsInventory||[];
  const filtered=inv.filter(p=>{if(invFilters.q&&!(p.name+(p.notes||"")+(p.partNumbers||[]).map(n=>n.num+(n.vendor||"")).join("")).toLowerCase().includes(invFilters.q.toLowerCase()))return false;if(invFilters.location&&(p.location||"").toLowerCase()!==invFilters.location.toLowerCase())return false;return true;}).sort((a,b)=>a.name.localeCompare(b.name));
  const lowStock=inv.filter(p=>p.qty!==""&&p.minQty!==""&&Number(p.qty)<=Number(p.minQty));
  return(<div>
    <div className="overview-title">Parts Inventory</div>
    <div className="overview-sub">{inv.length} item{inv.length!==1?"s":""}{lowStock.length>0&&<span style={{color:"var(--red)",fontWeight:600}}> · {lowStock.length} low stock</span>}</div>
    <div style={{display:"flex",gap:"8px",marginBottom:"12px",flexWrap:"wrap"}}>
      <input className="form-input" style={{flex:2,minWidth:"140px",padding:"6px 8px"}} placeholder="Search items, part #, vendor…" value={invFilters.q} onChange={e=>setInvF(f=>({...f,q:e.target.value}))}/>
      <select className="form-select" style={{flex:1,minWidth:"110px",padding:"6px 8px"}} value={invFilters.location} onChange={e=>setInvF(f=>({...f,location:e.target.value}))}><option value="">All Locations</option>{[...new Set(inv.map(p=>p.location).filter(Boolean))].sort().map(l=><option key={l}>{l}</option>)}</select>
      {(invFilters.q||invFilters.location)&&<button className="btn btn-ghost btn-sm" onClick={()=>setInvF({q:"",location:""})}>Clear</button>}
    </div>
    {filtered.length===0&&<div className="empty"><div className="empty-icon">📦</div><div className="empty-title">No Items</div></div>}
    {filtered.map(p=>{const isLow=p.qty!==""&&p.minQty!==""&&Number(p.qty)<=Number(p.minQty);return(<div key={p.id} className="inv-row">
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"10px"}}>
        <div style={{flex:1}}>
          <div className="inv-name">{p.name}{isLow&&<span className="inv-low" style={{marginLeft:"8px"}}>⚠ Low</span>}</div>
          <div className="inv-meta">{p.qty!==""&&<span style={{display:"flex",alignItems:"center",gap:"4px"}}>Qty: <button className="btn btn-ghost btn-xs" style={{padding:"1px 6px",lineHeight:1,fontSize:"14px"}} onClick={()=>invQtyAdj(p.id,-1)}>−</button><strong>{p.qty}</strong><button className="btn btn-ghost btn-xs" style={{padding:"1px 6px",lineHeight:1,fontSize:"14px"}} onClick={()=>invQtyAdj(p.id,1)}>+</button></span>}{p.minQty!==""&&<span>Min: {p.minQty}</span>}{p.location&&<span>📍 {p.location}</span>}</div>
          {(p.partNumbers||[]).map((n,i)=><div key={i} style={{fontSize:"11px",color:"var(--text-dim)",marginTop:"2px"}}>{n.vendor&&<span style={{fontWeight:600}}>{n.vendor}: </span>}<span style={{fontFamily:"'Share Tech Mono',monospace",color:"var(--amber-dim)"}}>{n.num}</span>{n.unitCost&&` · $${n.unitCost}`}</div>)}
          {p.notes&&<div style={{fontSize:"12px",color:"var(--text-dim)",fontStyle:"italic",marginTop:"4px"}}>{p.notes}</div>}
        </div>
        <div style={{display:"flex",gap:"5px"}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>{setEdit(p);setModal("invItem");}}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={()=>deleteInvItem(p.id)}>✕</button>
        </div>
      </div>
    </div>);})}
  </div>);
}

// ── Vendors ────────────────────────────────────────────────────────
function VendorsView({D,deleteVendor,setEdit,setModal}){
  return(<div>
    <div className="overview-title">Vendors</div><div className="overview-sub">{D.vendors.length} vendor{D.vendors.length!==1?"s":""}</div>
    {D.vendors.length===0&&<div className="empty"><div className="empty-icon">🏪</div><div className="empty-title">No Vendors Yet</div></div>}
    {D.vendors.map(v=>(
      <div key={v.id} className="vendor-card">
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:"8px"}}>
          <div>
            <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:"17px",fontWeight:700,color:"var(--text-bright)"}}>{v.name}</div>
            {v.contact&&<div style={{fontSize:"13px",color:"var(--text-dim)"}}>👤 {v.contact}</div>}
            {v.phone&&<div style={{fontSize:"13px"}}><a href={`tel:${v.phone}`} style={{color:"var(--amber-dim)",textDecoration:"none"}}>📞 {v.phone}</a></div>}
            {v.email&&<div style={{fontSize:"13px"}}><a href={`mailto:${v.email}`} style={{color:"var(--amber-dim)",textDecoration:"none"}}>✉️ {v.email}</a></div>}
            {v.notes&&<div style={{fontSize:"12px",color:"var(--text-dim)",fontStyle:"italic",marginTop:"5px"}}>{v.notes}</div>}
          </div>
          <div style={{display:"flex",gap:"6px"}}>
            <button className="btn btn-ghost btn-sm" onClick={()=>{setEdit(v);setModal("vendor");}}>Edit</button>
            <button className="btn btn-danger btn-sm" onClick={()=>deleteVendor(v.id)}>Delete</button>
          </div>
        </div>
        {D.partsToOrder.filter(p=>p.vendor===v.name&&!p.received).length>0&&(
          <div style={{marginTop:"8px",fontSize:"12px",fontFamily:"'Share Tech Mono',monospace",color:"var(--amber-dim)"}}>{D.partsToOrder.filter(p=>p.vendor===v.name&&!p.received).length} parts pending</div>
        )}
      </div>
    ))}
  </div>);
}

// ── Order History ──────────────────────────────────────────────────
function HistoryView({D,vehName}){
  const hist=[...D.orderHistory].sort((a,b)=>(b.receivedDate||"").localeCompare(a.receivedDate||""));
  return(<div>
    <div className="overview-title">Order History</div><div className="overview-sub">{hist.length} received item{hist.length!==1?"s":""}</div>
    {hist.length===0&&<div className="empty"><div className="empty-icon">✅</div><div className="empty-title">No Order History</div></div>}
    {hist.map(h=>(
      <div key={h.id} className="hist-row">
        <div><div style={{fontWeight:600,fontSize:"14px"}}>{h.desc||h.num||"Part"}</div><div style={{fontSize:"12px",color:"var(--text-dim)"}}>{[h.vendor,h.num?"#"+h.num:""].filter(Boolean).join(" · ")}{h.qty?` · Qty: ${h.qty}`:""}</div>{h.vehicleId&&<div style={{fontSize:"12px",color:"var(--text-dim)"}}>For: {vehName(h.vehicleId)}</div>}</div>
        <div style={{textAlign:"right"}}>{h.unitCost&&<div style={{fontFamily:"'Share Tech Mono',monospace",fontWeight:700,color:"var(--green)",fontSize:"13px"}}>${(parseFloat(h.unitCost)*(parseFloat(h.qty)||1)).toLocaleString()}</div>}<div style={{fontSize:"12px",color:"var(--text-dim)"}}>{h.receivedDate}</div></div>
      </div>
    ))}
  </div>);
}

// ── Todos ──────────────────────────────────────────────────────────
function TodosView({D,toggleTodo,deleteTodo,setEdit,setModal,setTab,setSelVeh,setSelCust}){
  const items=D.vehicles.flatMap(v=>(v.todos||[]).map(t=>({t,v})));
  const open=items.filter(i=>!i.t.done).sort((a,b)=>({high:0,medium:1,low:2}[a.t.priority||"medium"]||1)-({high:0,medium:1,low:2}[b.t.priority||"medium"]||1)||a.v.name.localeCompare(b.v.name));
  const done=items.filter(i=>i.t.done);

  const logServiceFromTodo=(v,t)=>{
    setSelVeh(v.id);
    setSelCust(v.customerId||null);
    setEdit({prefill:{notes:t.text,type:""}});
    setTab("fleet");
    setTimeout(()=>setModal("record"),50);
  };

  return(<div>
    <div className="overview-title">To-Do</div><div className="overview-sub">{open.length} open · {done.length} done</div>
    {items.length===0&&<div className="empty"><div className="empty-icon">☑️</div><div className="empty-title">No To-Do Items</div><div style={{fontSize:"13px"}}>Add to-do items on vehicles in the Fleet tab.</div></div>}
    {[...open,...done].map(({t,v})=>(
      <div key={t.id} className={`todo-item ${t.done?"done":""} pri-${t.priority||"medium"}`}>
        <input type="checkbox" checked={t.done} onChange={()=>toggleTodo(v.id,t.id)} style={{width:"16px",height:"16px",cursor:"pointer",accentColor:"#16a34a",marginTop:"2px",flexShrink:0}}/>
        <div style={{flex:1}}>
          <div style={{fontSize:"14px",fontWeight:600,textDecoration:t.done?"line-through":"none",color:t.done?"var(--text-dim)":"var(--text-bright)"}}>{t.text}</div>
          <div style={{fontSize:"12px",color:"var(--text-dim)",marginTop:"2px"}}>{v.name}{t.dueDate&&` · Due: ${t.dueDate}`}</div>
        </div>
        <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:"10px",letterSpacing:"1px",padding:"1px 6px",borderRadius:"3px",background:`${PRI_COLOR[t.priority||"medium"]}18`,color:PRI_COLOR[t.priority||"medium"],flexShrink:0}}>{t.priority||"medium"}</span>
        {!t.done&&<button className="btn btn-ghost btn-xs" style={{color:"#2563eb",borderColor:"rgba(37,99,235,.3)",whiteSpace:"nowrap"}} onClick={()=>logServiceFromTodo(v,t)}>→ Log Service</button>}
        <button className="btn btn-danger btn-xs" onClick={()=>deleteTodo(v.id,t.id)}>✕</button>
      </div>
    ))}
  </div>);
}

// ── Search ─────────────────────────────────────────────────────────
function SearchView({D,gsQuery,setGsQ,setSelVeh,setSelCust,setTab}){
  const q=gsQuery.toLowerCase().trim();
  const results=[];
  if(q.length>=2){
    D.records.filter(r=>(r.notes+r.type+(r.parts||[]).map(p=>p.desc+p.num).join("")).toLowerCase().includes(q)).slice(0,20).forEach(r=>{const v=D.vehicles.find(v=>v.id===r.vehicleId);results.push({type:"record",label:`${v?.name||"?"} — ${r.type} (${r.date})`,sub:r.notes?.slice(0,80),vid:r.vehicleId,custId:v?.customerId});});
    D.vehicles.filter(v=>(v.name+v.make+v.model+v.vin+(v.notes||"")).toLowerCase().includes(q)).slice(0,10).forEach(v=>results.push({type:"vehicle",label:v.name,sub:`${v.type}${v.year?" · "+v.year:""}`,vid:v.id,custId:v.customerId}));
    D.partsInventory.filter(p=>(p.name+(p.partNumbers||[]).map(n=>n.num+(n.vendor||"")).join("")).toLowerCase().includes(q)).slice(0,10).forEach(p=>results.push({type:"part",label:p.name,sub:`Qty: ${p.qty||"?"}${p.location?" · "+p.location:""}`}));
  }
  const typeStyle={record:{bg:"rgba(220,38,38,.1)",color:"#dc2626"},vehicle:{bg:"rgba(37,99,235,.1)",color:"#2563eb"},part:{bg:"rgba(22,163,74,.1)",color:"#16a34a"}};
  return(<div>
    <div className="overview-title" style={{marginBottom:"12px"}}>🔍 Search</div>
    <input className="form-input" style={{fontSize:"16px",padding:"12px 14px",marginBottom:"14px"}} placeholder="Search records, vehicles, parts…" value={gsQuery} onChange={e=>setGsQ(e.target.value)} autoFocus/>
    {q.length>=2&&<div className="overview-sub" style={{marginBottom:"10px"}}>{results.length} result{results.length!==1?"s":""} for "{q}"</div>}
    {results.map((r,i)=>(
      <div key={i} style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:"6px",padding:"10px 14px",marginBottom:"6px",cursor:r.vid?"pointer":"default"}} onClick={()=>{if(r.vid){setSelVeh(r.vid);if(r.custId)setSelCust(r.custId);setTab("fleet");}}}>
        <span style={{...typeStyle[r.type],fontFamily:"'Share Tech Mono',monospace",fontSize:"9px",letterSpacing:"1.5px",textTransform:"uppercase",padding:"2px 7px",borderRadius:"10px",display:"inline-block",marginBottom:"5px"}}>{r.type}</span>
        <div style={{fontWeight:600,fontSize:"14px",color:"var(--text-bright)"}}>{r.label}</div>
        {r.sub&&<div style={{fontSize:"12px",color:"var(--text-dim)",marginTop:"2px"}}>{r.sub}</div>}
      </div>
    ))}
  </div>);
}

// ── Admin ──────────────────────────────────────────────────────────
function AdminView({D,toggleFeature}){
  const feats=[["invoicing","Invoicing","Show the Invoices tab for creating customer invoices."],["partsInventory","Parts Inventory","Show the Parts tab for tracking on-hand stock."],["orderParts","Order Parts","Show the Order Parts tab for tracking parts to order."]];
  return(<div>
    <div className="overview-title" style={{marginBottom:"16px"}}>⚙ Admin</div>
    <div className="admin-sec">
      <div className="admin-sec-hdr"><div className="admin-sec-title">Features</div></div>
      <div className="admin-sec-body">
        {feats.map(([key,label,hint])=>(
          <div key={key} className="toggle-row">
            <div><div className="toggle-name">{label}</div><div className="toggle-hint">{hint}</div></div>
            <button className={`toggle-sw ${D.settings.features?.[key]!==false?"on":""}`} onClick={()=>toggleFeature(key)}><div className="toggle-knob"/></button>
          </div>
        ))}
      </div>
    </div>
    <div className="admin-sec">
      <div className="admin-sec-hdr"><div className="admin-sec-title">Stats</div></div>
      <div className="admin-sec-body" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
        {[["Customers",D.customers.length],["Equipment",D.vehicles.length],["Records",D.records.length],["Invoices",D.invoices.length],["Parts to Order",D.partsToOrder.length],["Parts Inventory",D.partsInventory.length]].map(([l,v])=>(
          <div key={l} style={{textAlign:"center",padding:"10px",background:"var(--bg)",borderRadius:"4px",border:"1px solid var(--border)"}}>
            <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:"20px",fontWeight:700,color:"var(--amber)"}}>{v}</div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:"10px",color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:"1px"}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  </div>);
}

// ── Modal helpers ─────────────────────────────────────────────────
function Mo({title,onClose,onSave,saveLabel,children,large}){
  return(<div className="sl"><div className="modal-overlay" onClick={onClose}><div className={`modal ${large?"":""}` } style={{maxWidth:large?"700px":"560px"}} onClick={e=>e.stopPropagation()}><div className="modal-hdr"><div className="modal-title">{title}</div><button className="modal-close" onClick={onClose}>✕</button></div><div className="modal-body">{children}</div><div className="modal-footer"><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={onSave}>{saveLabel||"Save"}</button></div></div></div></div>);
}
function Fg({label,full,children}){return(<div className={`form-group ${full?"form-full":""}`}><label className="form-lbl">{label}</label>{children}</div>);}
function Fi(props){return(<input className="form-input" {...props}/>);}
function Fs({children,...props}){return(<select className="form-select" {...props}>{children}</select>);}
function Fr({children}){return(<div className="form-row">{children}</div>);}

// ── Import Maintenance History (from an equipment maintenance workbook) ────
// Compares each sheet's parsed records against what's already logged for the
// matching equipment (by name) and adds only what's missing — including rows
// where the workbook's Date cell was blank and inherited (filled down) from
// the most recent dated row above it, which a naive per-row import would skip.
function ImportMaintenanceModal({ vehicles, records, onImport, onRepair, onClose }) {
  const [status, setStatus] = useState("idle"); // idle | loaded | done
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [repairStatus, setRepairStatus] = useState("idle"); // idle | done
  const isoDateRe = /^\d{4}-\d{2}-\d{2}$/;
  const badDateRecords = records.filter(r => typeof r.date !== "string" || !isoDateRe.test(r.date));
  const fixedRecords = badDateRecords.map(r => {
    const n = Number(r.date);
    const fixedDate = (Number.isFinite(n) && n > 1900 && n < 2100) ? `${Math.trunc(n)}-01-01` : "";
    const note = fixedDate ? " (year only in source — exact date unknown, using Jan 1)" : " (date was missing/unreadable in source — please set manually)";
    return { ...r, date: fixedDate, notes: (r.notes||"") + (fixedDate||!r.notes ? note : "") };
  });
  const confirmRepair = () => { onRepair(fixedRecords); setRepairStatus("done"); };

  const norm = s => (s||"").trim().toLowerCase();

  const inferType = (work) => {
    const w = work.toLowerCase();
    if (w.includes("oil")) return "Oil Change";
    if (w.includes("filter")) return "Filter Replacement";
    if (w.includes("tire")) return "Tire Service";
    if (w.includes("brake")) return "Brake Service";
    if (w.includes("belt") || w.includes("chain")) return "Belt/Chain Replacement";
    if (w.includes("coolant")) return "Coolant Service";
    if (w.includes("fuel")) return "Fuel System";
    if (w.includes("batter") || w.includes("electric")) return "Battery/Electrical";
    if (w.includes("grease") || w.includes("inspect")) return "Inspection";
    return "Repair";
  };

  const load = async () => {
    setError("");
    try {
      const resp = await fetch("/mattsonMaintenanceData.json");
      if (!resp.ok) throw new Error("Could not load /mattsonMaintenanceData.json");
      const data = await resp.json();

      const matched = [];
      const unmatched = [];
      const toAddAll = [];

      for (const [sheetName, sheet] of Object.entries(data)) {
        const veh = vehicles.find(v => norm(v.name) === norm(sheetName));
        if (!veh) { if ((sheet.records||[]).length) unmatched.push(sheetName); continue; }
        const existingKeys = new Set(
          records.filter(r => r.vehicleId === veh.id)
            .map(r => `${r.date||""}|${norm(r.notes||"")}`)
        );
        const toAdd = [];
        for (const rec of (sheet.records||[])) {
          // Defense in depth: only accept a real "YYYY-MM-DD" string. Anything else
          // (missing entirely, or some unparsable stray value) gets skipped rather
          // than risk saving a record whose date can crash the sort elsewhere.
          if (typeof rec.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(rec.date)) continue;
          // Match against the plain work description first (most forgiving), fall
          // back to nothing found = treat as new.
          const isDup = [...existingKeys].some(k => k.startsWith(`${rec.date}|`) && k.includes(norm(rec.work).slice(0,25)));
          if (isDup) continue;
          let notes = rec.parts ? `${rec.work} (Parts/Qty: ${rec.parts})` : rec.work;
          if (rec.dateYearOnly) notes += " (year only in source — exact date unknown, using Jan 1)";
          toAdd.push({
            id: genId(), vehicleId: veh.id, date: rec.date, type: inferType(rec.work),
            notes, cost: "", hours: rec.mileage != null ? String(rec.mileage) : "",
            tech: "", parts: [],
          });
        }
        if (toAdd.length) matched.push({ sheetName, vehicleName: veh.name, toAdd, alreadyHave: (sheet.records||[]).length - toAdd.length });
        toAddAll.push(...toAdd);
      }

      setPreview({ matched, unmatched, toAddAll });
      setStatus("loaded");
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmImport = () => {
    if (!preview) return;
    onImport(preview.toAddAll);
    setStatus("done");
  };

  return (<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
    <div style={{background:"#fff",borderRadius:"10px",padding:"24px",width:"600px",maxWidth:"100%",maxHeight:"85vh",overflowY:"auto"}}>
      <div style={{fontSize:"18px",fontWeight:700,marginBottom:"10px"}}>Import Maintenance History</div>
      {error && <div style={{color:"#dc2626",marginBottom:"10px"}}>Error: {error}</div>}
      {badDateRecords.length>0 && (
        <div style={{background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:"6px",padding:"10px",marginBottom:"14px"}}>
          <div style={{fontSize:"13px",color:"#9a3412",marginBottom:"6px"}}>
            {badDateRecords.length} already-logged record{badDateRecords.length!==1?"s":""} {badDateRecords.length!==1?"have":"has"} a date that
            isn't readable (e.g. a bare year was typed into the date field) — this is what was crashing the page
            when opened. Fix {badDateRecords.length===1?"it":"them"} now?
          </div>
          {repairStatus==="idle"
            ? <button onClick={confirmRepair} style={{padding:"7px 14px",background:"#c2410c",color:"#fff",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"13px"}}>Fix {badDateRecords.length} Record{badDateRecords.length!==1?"s":""}</button>
            : <div style={{color:"#16a34a",fontWeight:600,fontSize:"13px"}}>✓ Fixed.</div>}
        </div>
      )}
      {status==="idle" && !error && <div style={{color:"#666"}}>Loading…</div>}
      {status!=="idle" && preview && (<>
        <div style={{fontSize:"13px",color:"#555",marginBottom:"10px",lineHeight:1.5}}>
          Matched {preview.matched.length} piece{preview.matched.length!==1?"s":""} of equipment with new records to add
          ({preview.toAddAll.length} total) — including ones previously skipped because the workbook's date cell
          was blank (now filled in from the dated row above it).
        </div>
        <div style={{maxHeight:"280px",overflowY:"auto",border:"1px solid #eee",borderRadius:"6px",padding:"8px",marginBottom:"10px"}}>
          {preview.matched.length===0 && <div style={{color:"#888",fontSize:"12px"}}>Nothing new to add — everything matched is already logged.</div>}
          {preview.matched.map(m=>(
            <div key={m.sheetName} style={{padding:"6px 0",borderBottom:"1px solid #f0f0f0",fontSize:"13px"}}>
              <b>{m.vehicleName}</b>: +{m.toAdd.length} new record{m.toAdd.length!==1?"s":""} ({m.alreadyHave} already logged)
            </div>
          ))}
        </div>
        {preview.unmatched.length > 0 && (<div style={{fontSize:"12px",color:"#a06000",marginBottom:"10px",lineHeight:1.5}}>
          No matching equipment found for: {preview.unmatched.join(", ")}. Skipped — add equipment with a matching
          name first if you want that history imported too.
        </div>)}
        {status==="loaded" && <button onClick={confirmImport} disabled={preview.toAddAll.length===0} style={{padding:"10px 18px",background:preview.toAddAll.length?"#2563eb":"#ccc",color:"#fff",border:"none",borderRadius:"6px",cursor:preview.toAddAll.length?"pointer":"not-allowed"}}>Add {preview.toAddAll.length} Record{preview.toAddAll.length!==1?"s":""}</button>}
        {status==="done" && <div style={{color:"#16a34a",fontWeight:600}}>✓ Done — added {preview.toAddAll.length} records.</div>}
      </>)}
      <div style={{marginTop:"16px",textAlign:"right"}}>
        <button onClick={onClose} style={{padding:"8px 16px",background:"transparent",border:"1px solid #ccc",borderRadius:"6px",cursor:"pointer"}}>{status==="done"?"Close":"Cancel"}</button>
      </div>
    </div>
  </div>);
}

function VehicleMo({initial,customers,onSave,onClose}){
  const[f,setF]=useState({name:initial?.name||"",type:initial?.type||"Tractor",customerId:initial?.customerId||"",year:initial?.year||"",make:initial?.make||"",model:initial?.model||"",vin:initial?.vin||"",engine:initial?.engine||"",hp:initial?.hp||"",hours:initial?.hours||"",notes:initial?.notes||""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<Mo title={initial?"Edit Equipment":"Add Equipment"} onClose={onClose} onSave={()=>{if(!f.name.trim())return alert("Name required.");onSave(f);}} saveLabel={initial?"Save Changes":"Add Equipment"} large>
    <Fr><Fg label="Name *" full><Fi value={f.name} onChange={e=>s("name",e.target.value)} placeholder="e.g. JD 9620R"/></Fg></Fr>
    <Fr><Fg label="Type"><Fs value={f.type} onChange={e=>s("type",e.target.value)}>{["Truck","Tractor","Combine","Grain Cart","Semi","Trailer","Sprayer","Pickup","ATV/UTV","Generator","Other"].map(t=><option key={t}>{t}</option>)}</Fs></Fg><Fg label="Customer"><Fs value={f.customerId} onChange={e=>s("customerId",e.target.value)}><option value="">— No customer —</option>{[...customers].sort((a,b)=>a.name.localeCompare(b.name)).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Fs></Fg></Fr>
    <Fr><Fg label="Year"><Fi value={f.year} onChange={e=>s("year",e.target.value)} placeholder="2021"/></Fg><Fg label="Make"><Fi value={f.make} onChange={e=>s("make",e.target.value)} placeholder="John Deere"/></Fg><Fg label="Model"><Fi value={f.model} onChange={e=>s("model",e.target.value)}/></Fg><Fg label="VIN/Serial"><Fi value={f.vin} onChange={e=>s("vin",e.target.value)}/></Fg><Fg label="Engine"><Fi value={f.engine} onChange={e=>s("engine",e.target.value)} placeholder="C15 475"/></Fg><Fg label="HP"><Fi type="number" value={f.hp} onChange={e=>s("hp",e.target.value)}/></Fg><Fg label="Current Hrs/Miles"><Fi type="number" value={f.hours} onChange={e=>s("hours",e.target.value)}/></Fg></Fr>
    <Fg label="Notes" full><textarea className="form-textarea" value={f.notes} onChange={e=>s("notes",e.target.value)}/></Fg>
  </Mo>);
}

function RecordMo({initial,vehicleId,partsToOrder,onSave,onClose}){
  const prefill=initial?.prefill||{};
  const[f,setF]=useState({date:initial?.date||today(),type:initial?.type||prefill.type||"Oil Change",notes:initial?.notes||prefill.notes||"",cost:initial?.cost||"",hours:initial?.hours||"",tech:initial?.tech||"",parts:initial?.parts||[]});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const addP=()=>setF(p=>({...p,parts:[...p.parts,{id:genId(),desc:"",num:"",qty:"1"}]}));
  const updP=(i,k,v)=>setF(p=>({...p,parts:p.parts.map((pp,ii)=>ii===i?{...pp,[k]:v}:pp)}));
  const remP=i=>setF(p=>({...p,parts:p.parts.filter((_,ii)=>ii!==i)}));
  return(<Mo title={initial?"Edit Record":"Log Service"} onClose={onClose} onSave={()=>{if(!f.date||!f.type)return alert("Date and type required.");onSave(f);}} saveLabel={initial?"Save Changes":"Log Service"} large>
    <Fr><Fg label="Date *"><Fi type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></Fg><Fg label="Service Type *"><Fi list="svc-types" value={f.type} onChange={e=>s("type",e.target.value)}/><datalist id="svc-types">{["Oil Change","Filter Replacement","Tire Service","Brake Service","Hydraulic Service","Belt/Chain Replacement","Coolant Service","Fuel System","Battery/Electrical","Inspection","Repair","Other"].map(t=><option key={t} value={t}/>)}</datalist></Fg><Fg label="Cost ($)"><Fi type="number" step="0.01" value={f.cost} onChange={e=>s("cost",e.target.value)}/></Fg><Fg label="Hrs/Miles at Service"><Fi type="number" value={f.hours} onChange={e=>s("hours",e.target.value)}/></Fg></Fr>
    <Fg label="Performed By" full><Fi value={f.tech} onChange={e=>s("tech",e.target.value)} placeholder="Self, Dealer, Shop…"/></Fg>
    <Fg label="Notes" full><textarea className="form-textarea" value={f.notes} onChange={e=>s("notes",e.target.value)} placeholder="Work done, observations…"/></Fg>
    <div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"6px"}}><label className="form-lbl">Parts Used</label><button className="btn btn-ghost btn-xs" onClick={addP}>+ Add Part</button></div>
    {f.parts.map((p,i)=>(<div key={p.id||i} className="part-entry"><Fi placeholder="Description" value={p.desc} onChange={e=>updP(i,"desc",e.target.value)}/><Fi placeholder="Part #" value={p.num} onChange={e=>updP(i,"num",e.target.value)}/><Fi type="number" placeholder="Qty" value={p.qty} onChange={e=>updP(i,"qty",e.target.value)}/><button className="btn btn-danger btn-xs" onClick={()=>remP(i)}>✕</button></div>))}</div>
  </Mo>);
}

function CustomerMo({initial,onSave,onClose}){
  const[f,setF]=useState({name:initial?.name||"",businessName:initial?.businessName||"",contact:initial?.contact||"",phone:initial?.phone||"",email:initial?.email||"",address:initial?.address||"",notes:initial?.notes||""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<Mo title={initial?"Edit Customer":"Add Customer"} onClose={onClose} onSave={()=>{if(!f.name.trim())return alert("Name required.");onSave(f);}} saveLabel={initial?"Save Changes":"Add Customer"}>
    <Fg label="Customer Name *" full><Fi value={f.name} onChange={e=>s("name",e.target.value)} placeholder="e.g. Mattson Bros Inc."/></Fg>
    <Fr><Fg label="Business Name"><Fi value={f.businessName} onChange={e=>s("businessName",e.target.value)}/></Fg><Fg label="Contact Name"><Fi value={f.contact} onChange={e=>s("contact",e.target.value)}/></Fg><Fg label="Phone"><Fi type="tel" value={f.phone} onChange={e=>s("phone",e.target.value)}/></Fg><Fg label="Email"><Fi type="email" value={f.email} onChange={e=>s("email",e.target.value)}/></Fg></Fr>
    <Fg label="Notes" full><textarea className="form-textarea" style={{minHeight:"55px"}} value={f.notes} onChange={e=>s("notes",e.target.value)}/></Fg>
  </Mo>);
}

function TodoMo({vehicleId,initial,onSave,onClose}){
  const[f,setF]=useState({text:initial?.text||"",priority:initial?.priority||"medium",dueDate:initial?.dueDate||""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<Mo title={initial?"Edit To-Do":"Add To-Do"} onClose={onClose} onSave={()=>{if(!f.text.trim())return alert("Text required.");onSave(vehicleId,f);}} saveLabel={initial?"Save":"Add"}>
    <Fg label="Task *" full><Fi value={f.text} onChange={e=>s("text",e.target.value)} placeholder="What needs to be done?"/></Fg>
    <Fr><Fg label="Priority"><Fs value={f.priority} onChange={e=>s("priority",e.target.value)}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></Fs></Fg><Fg label="Due Date"><Fi type="date" value={f.dueDate} onChange={e=>s("dueDate",e.target.value)}/></Fg></Fr>
  </Mo>);
}

function PartMo({initial,vehicles,vendors,onSave,onClose}){
  const[f,setF]=useState({desc:initial?.desc||"",num:initial?.num||"",vendor:initial?.vendor||"",qty:initial?.qty||"1",unitCost:initial?.unitCost||"",vehicleId:initial?.vehicleId||"",notes:initial?.notes||""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<Mo title={initial?"Edit Part":"Add Part to Order"} onClose={onClose} onSave={()=>{if(!f.desc.trim())return alert("Description required.");onSave(f);}} saveLabel={initial?"Save":"Add Part"}>
    <Fg label="Description *" full><Fi value={f.desc} onChange={e=>s("desc",e.target.value)} placeholder="e.g. Oil Filter, Air Filter…"/></Fg>
    <Fr><Fg label="Part Number"><Fi value={f.num} onChange={e=>s("num",e.target.value)}/></Fg><Fg label="Vendor"><Fi list="vend-list-po" value={f.vendor} onChange={e=>s("vendor",e.target.value)}/><datalist id="vend-list-po">{[...vendors].sort((a,b)=>a.name.localeCompare(b.name)).map(v=><option key={v.id} value={v.name}/>)}</datalist></Fg><Fg label="Quantity"><Fi type="number" min="1" value={f.qty} onChange={e=>s("qty",e.target.value)}/></Fg><Fg label="Unit Cost ($)"><Fi type="number" step="0.01" value={f.unitCost} onChange={e=>s("unitCost",e.target.value)}/></Fg></Fr>
    <Fg label="For Vehicle" full><Fs value={f.vehicleId} onChange={e=>s("vehicleId",e.target.value)}><option value="">— For Stock —</option><option value="__stock__">📦 For Stock</option>{[...vehicles].sort((a,b)=>a.name.localeCompare(b.name)).map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</Fs></Fg>
    <Fg label="Notes" full><textarea className="form-textarea" style={{minHeight:"55px"}} value={f.notes} onChange={e=>s("notes",e.target.value)}/></Fg>
  </Mo>);
}

function InvItemMo({initial,vehicles,onSave,onClose}){
  const[f,setF]=useState({name:initial?.name||"",qty:initial?.qty||"",minQty:initial?.minQty||"",location:initial?.location||"",notes:initial?.notes||"",partNumbers:initial?.partNumbers||[]});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const addPN=()=>setF(p=>({...p,partNumbers:[...p.partNumbers,{id:genId(),num:"",vendor:"",unitCost:""}]}));
  const updPN=(i,k,v)=>setF(p=>({...p,partNumbers:p.partNumbers.map((n,ii)=>ii===i?{...n,[k]:v}:n)}));
  const remPN=i=>setF(p=>({...p,partNumbers:p.partNumbers.filter((_,ii)=>ii!==i)}));
  return(<Mo title={initial?"Edit Inventory Item":"Add Inventory Item"} onClose={onClose} onSave={()=>{if(!f.name.trim())return alert("Name required.");onSave(f);}} saveLabel={initial?"Save":"Add"} large>
    <Fg label="Part Name *" full><Fi value={f.name} onChange={e=>s("name",e.target.value)} placeholder="e.g. Oil Filter 15W-40"/></Fg>
    <Fr><Fg label="Qty on Hand"><Fi type="number" value={f.qty} onChange={e=>s("qty",e.target.value)}/></Fg><Fg label="Min Qty"><Fi type="number" value={f.minQty} onChange={e=>s("minQty",e.target.value)}/></Fg><Fg label="Storage Location"><Fi value={f.location} onChange={e=>s("location",e.target.value)} placeholder="Shop Shelf A"/></Fg></Fr>
    <div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"6px"}}><label className="form-lbl">Part Numbers / Vendors</label><button className="btn btn-ghost btn-xs" onClick={addPN}>+ Add</button></div>
    {f.partNumbers.map((n,i)=>(<div key={n.id||i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px auto",gap:"5px",marginBottom:"5px",alignItems:"center"}}><Fi placeholder="Part #" value={n.num} onChange={e=>updPN(i,"num",e.target.value)}/><Fi placeholder="Vendor" value={n.vendor} onChange={e=>updPN(i,"vendor",e.target.value)}/><Fi type="number" placeholder="Cost" value={n.unitCost} onChange={e=>updPN(i,"unitCost",e.target.value)}/><button className="btn btn-danger btn-xs" onClick={()=>remPN(i)}>✕</button></div>))}</div>
    <Fg label="Notes" full><textarea className="form-textarea" style={{minHeight:"55px"}} value={f.notes} onChange={e=>s("notes",e.target.value)}/></Fg>
  </Mo>);
}

function VendorMo({initial,onSave,onClose}){
  const[f,setF]=useState({name:initial?.name||"",contact:initial?.contact||"",phone:initial?.phone||"",email:initial?.email||"",notes:initial?.notes||""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<Mo title={initial?"Edit Vendor":"Add Vendor"} onClose={onClose} onSave={()=>{if(!f.name.trim())return alert("Name required.");onSave(f);}} saveLabel={initial?"Save":"Add Vendor"}>
    <Fg label="Vendor Name *" full><Fi value={f.name} onChange={e=>s("name",e.target.value)} placeholder="e.g. Brandt Tractor, NAPA"/></Fg>
    <Fr><Fg label="Contact Name"><Fi value={f.contact} onChange={e=>s("contact",e.target.value)}/></Fg><Fg label="Phone"><Fi type="tel" value={f.phone} onChange={e=>s("phone",e.target.value)}/></Fg><Fg label="Email"><Fi type="email" value={f.email} onChange={e=>s("email",e.target.value)}/></Fg></Fr>
    <Fg label="Notes" full><textarea className="form-textarea" style={{minHeight:"55px"}} value={f.notes} onChange={e=>s("notes",e.target.value)}/></Fg>
  </Mo>);
}

function InvoiceMo({records,customers,settings,selCustId,vehicles,nextNum,onSave,onClose}){
  const[f,setF]=useState({date:today(),custId:selCustId||"",businessName:settings?.businessName||"",laborCost:"",laborDesc:""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const recTotal=sumCost(records);
  const total=recTotal+(parseFloat(f.laborCost)||0);
  return(<Mo title={`Create Invoice ${nextNum}`} onClose={onClose} onSave={()=>{if(!f.custId)return alert("Select a customer.");onSave(f);}} saveLabel="Create Invoice" large>
    <Fr><Fg label="Business Name"><Fi value={f.businessName} onChange={e=>s("businessName",e.target.value)} placeholder="Your business name"/></Fg><Fg label="Invoice Date"><Fi type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></Fg></Fr>
    <Fg label="Customer *" full><Fs value={f.custId} onChange={e=>s("custId",e.target.value)}><option value="">— Select customer —</option>{[...customers].sort((a,b)=>a.name.localeCompare(b.name)).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Fs></Fg>
    <div style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:"4px",padding:"10px 12px",fontSize:"13px"}}>
      <div style={{fontWeight:700,marginBottom:"6px"}}>Service Records ({records.length})</div>
      {records.map(r=>{const v=vehicles.find(vv=>vv.id===r.vehicleId);return(<div key={r.id} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid var(--border)"}}><div><span style={{fontWeight:600}}>{r.type}</span><span style={{color:"var(--text-dim)",fontSize:"12px"}}> · {v?.name||""} · {r.date}</span></div><span style={{fontFamily:"'Share Tech Mono',monospace",color:"var(--green)"}}>${parseFloat(r.cost||0).toLocaleString()}</span></div>);})}
    </div>
    <Fr><Fg label="Labour Cost ($)"><Fi type="number" step="0.01" value={f.laborCost} onChange={e=>s("laborCost",e.target.value)} placeholder="0.00"/></Fg><Fg label="Labour Description"><Fi value={f.laborDesc} onChange={e=>s("laborDesc",e.target.value)} placeholder="e.g. Shop labour"/></Fg></Fr>
    <div style={{textAlign:"right",fontFamily:"'Share Tech Mono',monospace",fontSize:"17px",fontWeight:700}}>Total: ${total.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
  </Mo>);
}

// ── Receive Part Modal ────────────────────────────────────────────
function ReceiveMo({part,partsInventory,onSave,onClose}){
  const existingLocs=[...new Set((partsInventory||[]).map(p=>p.location).filter(Boolean))].sort();
  const[f,setF]=useState({unitCost:part?.unitCost||"",qty:part?.qty||"1",location:part?.receivedLocation||"",addToInventory:!part?.invPartId});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<div className="sl"><div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}>
    <div className="modal-hdr"><div className="modal-title">Receive Part</div><button className="modal-close" onClick={onClose}>✕</button></div>
    <div className="modal-body">
      {/* Part summary */}
      <div style={{padding:"10px 12px",background:"var(--bg3)",borderRadius:"4px",marginBottom:"4px"}}>
        {part?.desc&&<div style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:"16px"}}>{part.desc}</div>}
        {part?.num&&<div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:"12px",color:"var(--amber-dim)"}}>{part.num}</div>}
        {part?.vendor&&<div style={{fontSize:"13px",color:"var(--text-dim)"}}>{part.vendor}</div>}
      </div>
      <div className="form-row">
        <Fg label="Unit Cost ($)"><Fi type="number" step="0.01" placeholder="$0.00" value={f.unitCost} onChange={e=>s("unitCost",e.target.value)}/></Fg>
        <Fg label="Qty Received"><Fi type="number" min="1" value={f.qty} onChange={e=>s("qty",e.target.value)}/></Fg>
      </div>
      <Fg label="Storage Location" full>
        <Fi list="recv-loc-list" placeholder="Select or type location…" value={f.location} onChange={e=>s("location",e.target.value)}/>
        <datalist id="recv-loc-list">{existingLocs.map(l=><option key={l} value={l}/>)}</datalist>
      </Fg>
      {!part?.invPartId&&(
        <label style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",cursor:"pointer",marginTop:"4px"}}>
          <input type="checkbox" checked={f.addToInventory} onChange={e=>s("addToInventory",e.target.checked)} style={{accentColor:"var(--amber)",width:"15px",height:"15px"}}/>
          Add to Parts Inventory
        </label>
      )}
    </div>
    <div className="modal-footer">
      <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" onClick={()=>onSave(part.id,f)}>✓ Receive</button>
    </div>
  </div></div></div>);
}

// ── Price Search Modal ────────────────────────────────────────────
function PriceSearchMo({part,partsInventory,orderHistory,onApply,onClose}){
  const q=((part?.desc||"")+" "+(part?.num||"")).toLowerCase().trim();
  // Search inventory part numbers
  const invMatches=[];
  (partsInventory||[]).forEach(inv=>{
    (inv.partNumbers||[]).forEach(pn=>{
      if(!pn.unitCost) return;
      const match=(pn.num&&(part?.num||"").toLowerCase()&&pn.num.toLowerCase().includes((part?.num||"").toLowerCase()))||(inv.name&&q&&inv.name.toLowerCase().includes(q.split(" ")[0]));
      if(match) invMatches.push({source:"Inventory",name:inv.name,num:pn.num,vendor:pn.vendor,cost:pn.unitCost});
    });
  });
  // Search order history
  const histMatches=[];
  const seen=new Set();
  [...(orderHistory||[])].sort((a,b)=>(b.receivedDate||"").localeCompare(a.receivedDate||"")).forEach(h=>{
    const numMatch=part?.num&&h.num&&h.num.toLowerCase()===part.num.toLowerCase();
    const descMatch=part?.desc&&h.desc&&h.desc.toLowerCase().includes(part.desc.toLowerCase().split(" ")[0]);
    if((numMatch||descMatch)&&h.unitCost){
      const key=`${h.num}__${h.vendor}__${h.unitCost}`;
      if(!seen.has(key)){seen.add(key);histMatches.push({source:"Order History",name:h.desc,num:h.num,vendor:h.vendor,cost:h.unitCost,date:h.receivedDate});}
    }
  });
  const results=[...invMatches,...histMatches].slice(0,10);
  return(<div className="sl"><div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}>
    <div className="modal-hdr"><div className="modal-title">💲 Price Lookup</div><button className="modal-close" onClick={onClose}>✕</button></div>
    <div className="modal-body">
      <div style={{fontSize:"13px",color:"var(--text-dim)",marginBottom:"10px"}}>
        Searching for: <strong>{part?.desc||""}{part?.num?" #"+part.num:""}</strong>
      </div>
      {results.length===0&&(
        <div style={{textAlign:"center",padding:"24px",color:"var(--text-dim)"}}>
          <div style={{fontSize:"28px",marginBottom:"8px"}}>🔍</div>
          <div>No price history found for this part.</div>
          <div style={{fontSize:"12px",marginTop:"4px"}}>Prices are tracked from received orders and inventory.</div>
        </div>
      )}
      {results.map((r,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",border:"1px solid var(--border)",borderRadius:"6px",marginBottom:"6px",gap:"10px"}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,fontSize:"13px"}}>{r.name||r.num||"Part"}</div>
            <div style={{fontSize:"11px",color:"var(--text-dim)",marginTop:"2px"}}>
              {r.source}{r.vendor&&` · ${r.vendor}`}{r.num&&` · #${r.num}`}{r.date&&` · ${r.date}`}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:"15px",fontWeight:700,color:"var(--green)"}}>${r.cost}</span>
            <button className="btn btn-primary btn-sm" onClick={()=>onApply(r.cost)}>Apply</button>
          </div>
        </div>
      ))}
    </div>
    <div className="modal-footer"><button className="btn btn-ghost" onClick={onClose}>Close</button></div>
  </div></div></div>);
}

// ── Add Parts to Service Modal ────────────────────────────────────
function AddToServiceMo({parts,vehicles,onSave,onClose}){
  const[f,setF]=useState({vehicleId:parts.find(p=>p.vehicleId&&p.vehicleId!=="__stock__")?.vehicleId||"",date:today(),type:"Repair",notes:"",tech:"",hours:""});
  const[qtys,setQtys]=useState(Object.fromEntries(parts.map(p=>[p.id,p.qty||"1"])));
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const totalCost=parts.reduce((sum,p)=>{const q=parseInt(qtys[p.id])||1;return sum+(parseFloat(p.unitCost)||0)*q;},0);
  return(<div className="sl"><div className="modal-overlay" onClick={onClose}><div className="modal" style={{maxWidth:"620px"}} onClick={e=>e.stopPropagation()}>
    <div className="modal-hdr"><div className="modal-title">Add Parts to Service Record</div><button className="modal-close" onClick={onClose}>✕</button></div>
    <div className="modal-body">
      {/* Parts list */}
      <div style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:"4px",padding:"10px 12px",marginBottom:"4px"}}>
        <div style={{fontWeight:700,fontSize:"12px",color:"var(--text-dim)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"8px"}}>Parts</div>
        {parts.map(p=>(
          <div key={p.id} style={{display:"flex",alignItems:"center",gap:"10px",padding:"5px 0",borderBottom:"1px solid var(--border)"}}>
            <div style={{flex:1}}>
              <span style={{fontWeight:600,fontSize:"13px"}}>{p.desc||""}</span>
              {p.num&&<span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:"11px",color:"var(--amber-dim)",marginLeft:"8px"}}>{p.num}</span>}
              {p.vendor&&<span style={{fontSize:"11px",color:"var(--text-dim)",marginLeft:"6px"}}>{p.vendor}</span>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"4px"}}>
              <span style={{fontSize:"11px",color:"var(--text-dim)"}}>Qty:</span>
              <input type="number" min="1" value={qtys[p.id]||"1"} onChange={e=>setQtys(q=>({...q,[p.id]:e.target.value}))} style={{width:"55px",padding:"3px 6px",border:"1px solid var(--border2)",borderRadius:"4px",fontSize:"12px",fontFamily:"'Barlow',sans-serif"}}/>
            </div>
            {p.unitCost&&<span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:"12px",color:"var(--green)"}}>
              ${((parseFloat(p.unitCost)||0)*(parseInt(qtys[p.id])||1)).toFixed(2)}
            </span>}
          </div>
        ))}
        {totalCost>0&&<div style={{textAlign:"right",fontWeight:700,fontSize:"13px",color:"var(--green)",marginTop:"6px"}}>Total: ${totalCost.toFixed(2)}</div>}
      </div>
      <Fg label="Vehicle *" full><Fs value={f.vehicleId} onChange={e=>s("vehicleId",e.target.value)}><option value="">— Select vehicle —</option>{[...vehicles].sort((a,b)=>a.name.localeCompare(b.name)).map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</Fs></Fg>
      <div className="form-row">
        <Fg label="Date"><Fi type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></Fg>
        <Fg label="Service Type"><Fi list="svc-types-ats" value={f.type} onChange={e=>s("type",e.target.value)}/><datalist id="svc-types-ats">{["Oil Change","Filter Replacement","Tire Service","Brake Service","Hydraulic Service","Belt/Chain Replacement","Coolant Service","Fuel System","Battery/Electrical","Inspection","Repair","Other"].map(t=><option key={t} value={t}/>)}</datalist></Fg>
        <Fg label="Technician"><Fi value={f.tech} onChange={e=>s("tech",e.target.value)} placeholder="Self, Dealer…"/></Fg>
        <Fg label="Hrs/Miles"><Fi type="number" value={f.hours} onChange={e=>s("hours",e.target.value)}/></Fg>
      </div>
      <Fg label="Notes" full><textarea className="form-textarea" value={f.notes} onChange={e=>s("notes",e.target.value)} placeholder="Work done, observations…"/></Fg>
    </div>
    <div className="modal-footer">
      <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" onClick={()=>{if(!f.vehicleId)return alert("Select a vehicle.");const partsArr=parts.map(p=>({...p,qty:qtys[p.id]||p.qty||"1"}));onSave(f.vehicleId,f.date,f.type,f.notes,f.tech,f.hours,partsArr);}}>Create Service Record</button>
    </div>
  </div></div></div>);
}
