/* ============================================================
   Earthory Pages Layer — 静态页共用脚本
   仅供 how.html / privacy.html / careers.html 使用。
   提供：图标 sprite 注入 + 与 React 版视觉一致的「早期体验」弹窗。
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. 图标 sprite（从 earthory.js 中提取的 Phosphor regular 字重） ---------- */
  var SPRITE = "<svg xmlns=\"http://www.w3.org/2000/svg\" style=\"display:none\" aria-hidden=\"true\"><symbol id=\"eo-arrow-left\" viewBox=\"0 0 256 256\"><path d=\"M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z\"/></symbol><symbol id=\"eo-arrow-right\" viewBox=\"0 0 256 256\"><path d=\"M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z\"/></symbol><symbol id=\"eo-battery-charging\" viewBox=\"0 0 256 256\"><path d=\"M200,56H32A24,24,0,0,0,8,80v96a24,24,0,0,0,24,24H200a24,24,0,0,0,24-24V80A24,24,0,0,0,200,56Zm8,120a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8H200a8,8,0,0,1,8,8Zm48-80v64a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0ZM138.81,123.79a8,8,0,0,1,.35,7.79l-16,32a8,8,0,0,1-14.32-7.16L119.06,136H100a8,8,0,0,1-7.16-11.58l16-32a8,8,0,1,1,14.32,7.16L112.94,120H132A8,8,0,0,1,138.81,123.79Z\"/></symbol><symbol id=\"eo-check-circle\" viewBox=\"0 0 256 256\"><path d=\"M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z\"/></symbol><symbol id=\"eo-clock\" viewBox=\"0 0 256 256\"><path d=\"M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z\"/></symbol><symbol id=\"eo-cube\" viewBox=\"0 0 256 256\"><path d=\"M223.68,66.15,135.68,18h0a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32h0l80.34,44L128,120,47.66,76ZM40,90l80,43.78v85.79L40,175.82Zm96,129.57V133.82L216,90v85.78Z\"/></symbol><symbol id=\"eo-eye\" viewBox=\"0 0 256 256\"><path d=\"M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z\"/></symbol><symbol id=\"eo-fingerprint\" viewBox=\"0 0 256 256\"><path d=\"M72,128a134.63,134.63,0,0,1-14.16,60.47,8,8,0,1,1-14.32-7.12A118.8,118.8,0,0,0,56,128,71.73,71.73,0,0,1,83,71.8,8,8,0,1,1,93,84.29,55.76,55.76,0,0,0,72,128Zm56-8a8,8,0,0,0-8,8,184.12,184.12,0,0,1-23,89.1,8,8,0,0,0,14,7.76A200.19,200.19,0,0,0,136,128,8,8,0,0,0,128,120Zm0-32a40,40,0,0,0-40,40,8,8,0,0,0,16,0,24,24,0,0,1,48,0,214.09,214.09,0,0,1-20.51,92A8,8,0,1,0,146,226.83,230,230,0,0,0,168,128,40,40,0,0,0,128,88Zm0-64A104.11,104.11,0,0,0,24,128a87.76,87.76,0,0,1-5,29.33,8,8,0,0,0,15.09,5.33A103.9,103.9,0,0,0,40,128a88,88,0,0,1,176,0,282.24,282.24,0,0,1-5.29,54.45,8,8,0,0,0,6.3,9.4,8.22,8.22,0,0,0,1.55.15,8,8,0,0,0,7.84-6.45A298.37,298.37,0,0,0,232,128,104.12,104.12,0,0,0,128,24ZM94.4,152.17A8,8,0,0,0,85,158.42a151,151,0,0,1-17.21,45.44,8,8,0,0,0,13.86,8,166.67,166.67,0,0,0,19-50.25A8,8,0,0,0,94.4,152.17ZM128,56a72.85,72.85,0,0,0-9,.56,8,8,0,0,0,2,15.87A56.08,56.08,0,0,1,184,128a252.12,252.12,0,0,1-1.92,31A8,8,0,0,0,189,168a8.39,8.39,0,0,0,1,.06,8,8,0,0,0,7.92-7,266.48,266.48,0,0,0,2-33A72.08,72.08,0,0,0,128,56Zm57.93,128.25a8,8,0,0,0-9.75,5.75c-1.46,5.69-3.15,11.4-5,17a8,8,0,0,0,5,10.13,7.88,7.88,0,0,0,2.55.42,8,8,0,0,0,7.58-5.46c2-5.92,3.79-12,5.35-18.05A8,8,0,0,0,185.94,184.26Z\"/></symbol><symbol id=\"eo-globe-hemisphere-west\" viewBox=\"0 0 256 256\"><path d=\"M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm88,104a87.62,87.62,0,0,1-6.4,32.94l-44.7-27.49a15.92,15.92,0,0,0-6.24-2.23l-22.82-3.08a16.11,16.11,0,0,0-16,7.86h-8.72l-3.8-7.86a15.91,15.91,0,0,0-11-8.67l-8-1.73L96.14,104h16.71a16.06,16.06,0,0,0,7.73-2l12.25-6.76a16.62,16.62,0,0,0,3-2.14l26.91-24.34A15.93,15.93,0,0,0,166,49.1l-.36-.65A88.11,88.11,0,0,1,216,128ZM143.31,41.34,152,56.9,125.09,81.24,112.85,88H96.14a16,16,0,0,0-13.88,8l-8.73,15.23L63.38,84.19,74.32,58.32a87.87,87.87,0,0,1,69-17ZM40,128a87.53,87.53,0,0,1,8.54-37.8l11.34,30.27a16,16,0,0,0,11.62,10l21.43,4.61L96.74,143a16.09,16.09,0,0,0,14.4,9h1.48l-7.23,16.23a16,16,0,0,0,2.86,17.37l.14.14L128,205.94l-1.94,10A88.11,88.11,0,0,1,40,128Zm102.58,86.78,1.13-5.81a16.09,16.09,0,0,0-4-13.9,1.85,1.85,0,0,1-.14-.14L120,174.74,133.7,144l22.82,3.08,45.72,28.12A88.18,88.18,0,0,1,142.58,214.78Z\"/></symbol><symbol id=\"eo-house\" viewBox=\"0 0 256 256\"><path d=\"M219.31,108.68l-80-80a16,16,0,0,0-22.62,0l-80,80A15.87,15.87,0,0,0,32,120v96a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V160h32v56a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V120A15.87,15.87,0,0,0,219.31,108.68ZM208,208H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48V120l80-80,80,80Z\"/></symbol><symbol id=\"eo-key\" viewBox=\"0 0 256 256\"><path d=\"M216.57,39.43A80,80,0,0,0,83.91,120.78L28.69,176A15.86,15.86,0,0,0,24,187.31V216a16,16,0,0,0,16,16H72a8,8,0,0,0,8-8V208H96a8,8,0,0,0,8-8V184h16a8,8,0,0,0,5.66-2.34l9.56-9.57A79.73,79.73,0,0,0,160,176h.1A80,80,0,0,0,216.57,39.43ZM224,98.1c-1.09,34.09-29.75,61.86-63.89,61.9H160a63.7,63.7,0,0,1-23.65-4.51,8,8,0,0,0-8.84,1.68L116.69,168H96a8,8,0,0,0-8,8v16H72a8,8,0,0,0-8,8v16H40V187.31l58.83-58.82a8,8,0,0,0,1.68-8.84A63.72,63.72,0,0,1,96,95.92c0-34.14,27.81-62.8,61.9-63.89A64,64,0,0,1,224,98.1ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z\"/></symbol><symbol id=\"eo-lock-key\" viewBox=\"0 0 256 256\"><path d=\"M128,112a28,28,0,0,0-8,54.83V184a8,8,0,0,0,16,0V166.83A28,28,0,0,0,128,112Zm0,40a12,12,0,1,1,12-12A12,12,0,0,1,128,152Zm80-72H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96ZM208,208H48V96H208V208Z\"/></symbol><symbol id=\"eo-magnet\" viewBox=\"0 0 256 256\"><path d=\"M207,50.25A87.46,87.46,0,0,0,144.6,24h-.33A87.48,87.48,0,0,0,82,49.81L20.61,112a16,16,0,0,0,.06,22.56l28.66,28.66a15.92,15.92,0,0,0,11.32,4.69h.09a16,16,0,0,0,11.36-4.82L133,100.69a16.08,16.08,0,0,1,22.41-.21,15.6,15.6,0,0,1,4.73,11.19,16.89,16.89,0,0,1-4.85,12L93,183.88a16,16,0,0,0-.17,22.79l28.66,28.66a16.06,16.06,0,0,0,22.52.12L205.81,175C240.26,140.5,240.79,84.56,207,50.25ZM60.65,151.89,32,123.24,55.8,99.12l28.52,28.52ZM132.79,224l-28.68-28.65,24.38-23.57L157,200.32Zm61.76-60.44-26.11,25.54L140,160.68l26.44-25.57.1-.09a33,33,0,0,0,9.57-23.5A31.44,31.44,0,0,0,166.47,89a32.2,32.2,0,0,0-44.9.5L95.49,116.18,67,87.74,93.35,61.09A71.51,71.51,0,0,1,144.27,40h.27a71.55,71.55,0,0,1,51.05,21.48C223.25,89.55,222.75,135.38,194.55,163.58Z\"/></symbol><symbol id=\"eo-map-pin\" viewBox=\"0 0 256 256\"><path d=\"M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z\"/></symbol><symbol id=\"eo-microphone\" viewBox=\"0 0 256 256\"><path d=\"M128,176a48.05,48.05,0,0,0,48-48V64a48,48,0,0,0-96,0v64A48.05,48.05,0,0,0,128,176ZM96,64a32,32,0,0,1,64,0v64a32,32,0,0,1-64,0Zm40,143.6V240a8,8,0,0,1-16,0V207.6A80.11,80.11,0,0,1,48,128a8,8,0,0,1,16,0,64,64,0,0,0,128,0,8,8,0,0,1,16,0A80.11,80.11,0,0,1,136,207.6Z\"/></symbol><symbol id=\"eo-pause\" viewBox=\"0 0 256 256\"><path d=\"M200,32H160a16,16,0,0,0-16,16V208a16,16,0,0,0,16,16h40a16,16,0,0,0,16-16V48A16,16,0,0,0,200,32Zm0,176H160V48h40ZM96,32H56A16,16,0,0,0,40,48V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V48A16,16,0,0,0,96,32Zm0,176H56V48H96Z\"/></symbol><symbol id=\"eo-person\" viewBox=\"0 0 256 256\"><path d=\"M160,40a32,32,0,1,0-32,32A32,32,0,0,0,160,40ZM128,56a16,16,0,1,1,16-16A16,16,0,0,1,128,56Zm90.34,78.05L173.17,82.83a32,32,0,0,0-24-10.83H106.83a32,32,0,0,0-24,10.83L37.66,134.05a20,20,0,0,0,28.13,28.43l16.3-13.08L65.55,212.28A20,20,0,0,0,102,228.8l26-44.87,26,44.87a20,20,0,0,0,36.41-16.52L173.91,149.4l16.3,13.08a20,20,0,0,0,28.13-28.43Zm-11.51,16.77a4,4,0,0,1-5.66,0c-.21-.2-.42-.4-.65-.58L165,121.76A8,8,0,0,0,152.26,130L175.14,217a7.72,7.72,0,0,0,.48,1.35,4,4,0,1,1-7.25,3.38,6.25,6.25,0,0,0-.33-.63L134.92,164a8,8,0,0,0-13.84,0L88,221.05a6.25,6.25,0,0,0-.33.63,4,4,0,0,1-2.26,2.07,4,4,0,0,1-5-5.45,7.72,7.72,0,0,0,.48-1.35L103.74,130A8,8,0,0,0,91,121.76L55.48,150.24c-.23.18-.44.38-.65.58a4,4,0,1,1-5.66-5.65c.12-.12.23-.24.34-.37L94.83,93.41a16,16,0,0,1,12-5.41h42.34a16,16,0,0,1,12,5.41l45.32,51.39c.11.13.22.25.34.37A4,4,0,0,1,206.83,150.82Z\"/></symbol><symbol id=\"eo-shield-check\" viewBox=\"0 0 256 256\"><path d=\"M208,40H48A16,16,0,0,0,32,56v56c0,52.72,25.52,84.67,46.93,102.19,23.06,18.86,46,25.26,47,25.53a8,8,0,0,0,4.2,0c1-.27,23.91-6.67,47-25.53C198.48,196.67,224,164.72,224,112V56A16,16,0,0,0,208,40Zm0,72c0,37.07-13.66,67.16-40.6,89.42A129.3,129.3,0,0,1,128,223.62a128.25,128.25,0,0,1-38.92-21.81C61.82,179.51,48,149.3,48,112l0-56,160,0ZM82.34,141.66a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32l-56,56a8,8,0,0,1-11.32,0Z\"/></symbol><symbol id=\"eo-sparkle\" viewBox=\"0 0 256 256\"><path d=\"M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z\"/></symbol><symbol id=\"eo-trash\" viewBox=\"0 0 256 256\"><path d=\"M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z\"/></symbol><symbol id=\"eo-x\" viewBox=\"0 0 256 256\"><path d=\"M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z\"/></symbol></svg>";
  var holder = document.createElement('div');
  holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  holder.innerHTML = SPRITE;
  document.body.insertBefore(holder, document.body.firstChild);

  /* ---------- 2. 早期体验弹窗 ---------- */
  var open = null;

  function icon(id) {
    return '<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256">' +
      '<use href="#' + id + '"/></svg>';
  }

  function close() {
    if (!open) return;
    var node = open;
    open = null;
    document.body.style.overflow = '';
    node.style.transition = 'opacity .25s ease';
    node.style.opacity = '0';
    setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 250);
  }

  function success(modal) {
    modal.innerHTML =
      "<button class=\"modal-close\" aria-label=\"Close\">" + icon('eo-x') + '</button>' +
      '<div class="success">' + icon('eo-check-circle') +
      "<h3>Received</h3>" +
      "<p>Thanks for reaching out. We will get back to you shortly.</p>" +
      "<button class=\"primary\" type=\"button\">Done</button>" +
      '</div>';
    modal.querySelector('.modal-close').addEventListener('click', close);
    modal.querySelector('.success .primary').addEventListener('click', close);
  }

  function show(opts) {
    if (open) return;
    opts = opts || {};
    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true">' +
        "<button class=\"modal-close\" aria-label=\"Close\">" + icon('eo-x') + '</button>' +
        '<span class="eyebrow">' + (opts.eyebrow || 'STAY IN TOUCH') + '</span>' +
        '<h3>' + (opts.title || "Get in touch") + '</h3>' +
        '<p>' + (opts.note || "When a new build, an open slot or an engineering prototype becomes available, you will hear from us first.") + '</p>' +
        '<form>' +
          "<label>Name<input required placeholder=\"Your name\"></label>" +
          "<label>Email or phone<input required placeholder=\"Email or phone number\"></label>" +
          '<label>' + (opts.field || "What would you most like to get back? (optional)") +
            '<textarea placeholder="' +
            (opts.placeholder || "For example: family milestones, commitments made at work, where you put something.") +
            '"></textarea></label>' +
          "<button class=\"primary\" type=\"submit\">Submit</button>" +
        '</form>' +
      '</div>';

    var modal = backdrop.querySelector('.modal');
    backdrop.addEventListener('mousedown', function (e) { if (e.target === backdrop) close(); });
    backdrop.querySelector('.modal-close').addEventListener('click', close);
    backdrop.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      success(modal);
    });

    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';
    open = backdrop;
    var first = backdrop.querySelector('input');
    if (first) first.focus();
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });

  /* 任何带 data-join 的按钮都会唤起弹窗；可用 data-* 定制文案 */
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-join]') : null;
    if (!t) return;
    e.preventDefault();
    show({
      eyebrow: t.getAttribute('data-eyebrow'),
      title: t.getAttribute('data-title'),
      note: t.getAttribute('data-note'),
      field: t.getAttribute('data-field'),
      placeholder: t.getAttribute('data-placeholder')
    });
  });

  /* 顶部导航的 CTA 与页面内 CTA 共用同一个弹窗 */
  var cta = document.querySelector('.nav-cta');
  if (cta && cta.tagName !== 'A' && !cta.hasAttribute('data-join')) cta.setAttribute('data-join', '');

  /* ---------- 3. 岗位链接：补上邮件主题 ---------- */
  /* 直接写在 href 里会带来编码问题，改为运行时拼接；
     即使脚本未执行，链接本身仍是一个可用的 mailto。 */
  var roles = document.querySelectorAll('a[data-role][href^="mailto:"]');
  for (var i = 0; i < roles.length; i++) {
    var a = roles[i];
    a.href = a.getAttribute('href') +
      '?subject=' + encodeURIComponent("Applying for: " + a.getAttribute('data-role'));
  }

  /* ---------- 4. 加入我们：对接表单 ---------- */

  /* ┌ 部署后把这一行填上 ┐
     Supabase Edge Function 的地址，形如：
       https://<项目 ref>.supabase.co/functions/v1/join
     留空则退回「整理好内容让对方自己复制发邮件」的模式，
     所以后端没上线之前页面也不会坏。 */
  var JOIN_API = 'https://bferzqerttgoiznbcopo.supabase.co/functions/v1/join';

  var joinForm = document.querySelector('.join-form');
  if (joinForm) {

    /* 各条通道底部的按钮跳到表单时，顺手把「关系类型」选好，
       省得对方滚到底还要自己再找一遍。 */
    var jumps = document.querySelectorAll('a[data-relation][href="#contact"]');
    for (var j = 0; j < jumps.length; j++) {
      jumps[j].addEventListener('click', function () {
        var want = this.getAttribute('data-relation');
        var radios = joinForm.querySelectorAll('input[name="relation"]');
        for (var r = 0; r < radios.length; r++) {
          if (radios[r].value === want) { radios[r].checked = true; break; }
        }
      });
    }

    function field(name) {
      var el = joinForm.elements[name];
      return el && el.value ? el.value.trim() : '';
    }
    function relation() {
      var picked = joinForm.querySelector('input[name="relation"]:checked');
      return picked ? picked.value : "Other";
    }

    /* 结果区：成功、失败、以及没配后端时的复制方案都用它 */
    function panel() {
      var box = joinForm.querySelector('.join-result');
      if (!box) {
        box = document.createElement('div');
        box.className = 'join-result';
        joinForm.appendChild(box);
      }
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return box;
    }

    function showError(msg) {
      var box = panel();
      box.className = 'join-result is-error';
      box.innerHTML = "<h3>Could not submit</h3><p></p>";
      box.querySelector('p').textContent =
        msg + " You can also write to us directly at hello@earthory.com.";
    }

    function showDone() {
      var box = panel();
      box.className = 'join-result is-done';
      box.innerHTML =
        "<h3>Got it</h3>" +
        "<p>We will get back to you shortly. To add anything, write to " +
        "<a href=\"mailto:hello@earthory.com\">hello@earthory.com</a>.</p>";
    }

    /* 没配后端时的退路：把内容整理好让对方自己复制。
       早期版本试过塞进 mailto 的 body，但中文经百分号编码后一个字
       占 9 个字节，两百来字就超出邮件客户端的地址长度上限被静默截断。
       渠道页丢掉半封信比没有表单还糟，所以改成显式复制。 */
    function showCopy() {
      var text = [
        "Relationship: " + relation(), '',
        "Name: " + (field('name') || "(not provided)"),
        "Company / organisation: " + (field('org') || "(not provided)"),
        "Country / region: " + (field('region') || "(not provided)"),
        "Email: " + (field('email') || "(not provided)"),
        "Website / LinkedIn: " + (field('link') || "(not provided)"), '',
        "── What you bring to Earthory ──", field('bring') || "(not provided)", '',
        "── What you'd like to build together ──", field('goal') || "(not provided)", '',
        "── Relevant work, cases or resources ──", field('work') || "(not provided)"
      ].join('\n');

      var box = panel();
      box.className = 'join-result';
      box.innerHTML =
        "<h3>Your message is ready</h3>" +
        "<p>Please send the text below to <a href=\"mailto:hello@earthory.com\">hello@earthory.com</a>.</p>" +
        '<textarea readonly rows="12"></textarea>' +
        '<div class="join-result-actions">' +
        "<button type=\"button\" class=\"copy\">Copy</button>" +
        "<a class=\"mailto\" href=\"mailto:hello@earthory.com\">Open mail client</a>" +
        '</div>';
      box.querySelector('textarea').value = text;
      box.querySelector('.copy').addEventListener('click', function () {
        var ta = box.querySelector('textarea');
        var btn = this;
        function ok() {
          btn.textContent = "Copied";
          setTimeout(function () { btn.textContent = "Copy"; }, 2200);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(ta.value).then(ok, function () { ta.select(); });
        } else {
          ta.select();
          try { document.execCommand('copy'); ok(); } catch (err) { /* 让用户自己复制 */ }
        }
      });
    }

    joinForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!joinForm.reportValidity()) return;

      if (!JOIN_API) { showCopy(); return; }

      var btn = joinForm.querySelector('button[type="submit"]');
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = "Submitting…"; }

      fetch(JOIN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relation: relation(),
          name: field('name'),
          email: field('email'),
          org: field('org'),
          region: field('region'),
          link: field('link'),
          bring: field('bring'),
          goal: field('goal'),
          work: field('work'),
          company_website: field('company_website'),
          consent: true,
          source: location.pathname
        })
      }).then(function (res) {
        return res.json().then(function (data) { return { res: res, data: data }; });
      }).then(function (r) {
        if (r.res.ok && r.data && r.data.ok) {
          showDone();
          joinForm.reset();
        } else {
          showError((r.data && r.data.error) || "The service is not responding right now.");
        }
      }).catch(function () {
        showError("No network connection.");
      }).then(function () {
        if (btn) { btn.disabled = false; btn.textContent = label; }
      });
    });
  }

  /* ============================================================
     5. 定价页（pricing.html）

     页面里一个价格数字都没有写死——全部来自 pricing-config.json，
     运行时 fetch。改价格只改那个文件，不用碰 HTML，也不用发版。
     以后要挪到 Supabase 之类的后台，只改下面 CONFIG_URL 一行。

     配置器的算价公式也在同一个文件的 formula 段里。那套系数拟合了
     五档标价套餐，最大偏差 0.9%；改系数请同时复核这五档还对不对得上。
     ============================================================ */
  /* 中文站在 /zh/ 下，读中文那份配置。绝对路径，
     因为同一个脚本会被根目录和 /zh/ 两处加载。 */
  var CONFIG_URL = /^\/zh(\/|$)/.test(location.pathname)
    ? '/pricing-config.zh.json'
    : '/pricing-config.json';
  var SALES_API = 'https://bferzqerttgoiznbcopo.supabase.co/functions/v1/sales';

  var pricingRoot = document.querySelector('.pr-cards');
  if (pricingRoot) {
    var CFG = null;
    var cycle = 'monthly';
    var scene = 'personal';

    /* ---------- 工具 ---------- */

    function money(n) {
      if (n == null || isNaN(n)) return null;
      var r = Math.round(n * 100) / 100;
      /* 12.90 要显示两位小数，99 就不用拖个 .00 */
      return CFG.symbol + (r % 1 === 0 ? r.toFixed(0) : r.toFixed(2));
    }

    /* 年付：按 yearly_months_charged 个月的钱买 12 个月，
       卡面上仍然显示「每月多少」，另起一行写清全年总额。 */
    function cycled(monthly) {
      if (monthly == null) return null;
      if (cycle === 'monthly') return monthly;
      return monthly * CFG.yearly_months_charged / 12;
    }

    function yearlyTotal(monthly) {
      return monthly == null ? null : monthly * CFG.yearly_months_charged;
    }

    function esc(s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function el(tag, cls, html) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (html != null) n.innerHTML = html;
      return n;
    }

    var ARROW = '<svg class="ic" viewBox="0 0 256 256"><use href="#eo-arrow-right"/></svg>';
    var TICK = '<svg class="ic" viewBox="0 0 256 256"><use href="#eo-check-circle"/></svg>';

    /* ---------- 阶梯储存费 ---------- */
    /* 按边际费率算，和云厂商的阶梯计价一个道理：
       前 100GB 一个价，超出的部分逐级便宜。 */
    function storageCost(gb) {
      var tiers = CFG.formula.storage_tiers, total = 0, prev = 0;
      for (var i = 0; i < tiers.length; i++) {
        var cap = tiers[i].up_to_gb, rate = tiers[i].per_gb;
        if (cap == null || gb <= cap) { total += (gb - prev) * rate; break; }
        total += (cap - prev) * rate;
        prev = cap;
      }
      return total;
    }

    /* ---------- 算价 ---------- */
    /* 任何一个维度选了 Custom / Enterprise（值为 null）就不出价，
       整块切换成「按需报价」——瞎报一个数比不报更糟。 */
    function calc(cfg) {
      if (cfg.gb == null || cfg.days == null || cfg.devices == null || cfg.users == null) return null;
      var f = CFG.formula;
      var base = f.scene_base[cfg.scene];
      if (base == null) return null;               /* enterprise 没有基础费，只报价 */

      var retention = f.retention_factor[String(cfg.days)];
      var aiFee = f.ai_memory_fee[String(cfg.years)];
      if (retention == null || aiFee == null) return null;

      var extraDev = Math.max(0, cfg.devices - f.included_devices[cfg.scene]);
      var extraUsr = Math.max(0, cfg.users - f.included_users[cfg.scene]);
      var mult = f.ai_processing_multiplier[cfg.tier] || 1;

      return (base
        + storageCost(cfg.gb) * retention
        + aiFee
        + extraDev * f.device_price
        + extraUsr * f.user_price) * mult;
    }

    /* ---------- 场景切换条 ---------- */
    /* 只在第一次建按钮，之后原地改状态。
       每次点击都重建 innerHTML 的话，被点的那个按钮会被换成新节点，
       键盘用户按完 Enter 焦点就没了。 */
    function renderScenes() {
      var host = document.querySelector('.pr-scenes');
      if (!host) return;

      if (!host.children.length) {
        CFG.scenes.forEach(function (s) {
          var b = el('button', '', esc(s.name) + '<i>' + esc(s.zh) + '</i>');
          b.type = 'button';
          b.setAttribute('role', 'tab');
          b.dataset.scene = s.id;
          host.appendChild(b);
        });
      }

      var btns = host.children;
      for (var i = 0; i < btns.length; i++) {
        var on = btns[i].dataset.scene === scene;
        btns[i].classList.toggle('is-on', on);
        btns[i].setAttribute('aria-selected', on ? 'true' : 'false');
      }
    }

    /* ---------- 套餐卡 ---------- */
    /* 第一眼只给五个数字：价格 + 四项核心配额。
       功能明细收在 See all features 后面，第一屏塞满了反而什么都记不住。 */
    function renderCards() {
      pricingRoot.innerHTML = '';
      CFG.plans.forEach(function (p) {
        var card = el('article', 'pr-card' + (p.featured ? ' is-featured' : '')
          + (p.plan_id === scene ? ' is-active' : ''));
        card.dataset.plan = p.plan_id;

        var priceHtml;
        if (p.is_custom || p.monthly_price == null) {
          priceHtml = '<div class="pr-price"><b>' + esc(p.price_label || 'Custom') + '</b></div>'
            + '<div class="pr-price-sub">' + esc(p.price_label_zh || '') + '</div>';
        } else {
          var per = cycled(p.monthly_price);
          priceHtml = '<div class="pr-price"><b>' + money(per) + '</b><span>/ month</span></div>'
            + '<div class="pr-price-sub">'
            + (cycle === 'yearly'
                ? "Billed annually " + money(yearlyTotal(p.monthly_price)) + " / year"
                : "Billed monthly, cancel anytime")
            + '</div>';
        }

        var facts = p.headline.map(function (h) {
          return '<div><b>' + esc(h.value) + '</b><span>' + esc(h.label)
            + '<i>' + esc(h.label_zh) + '</i></span></div>';
        }).join('');

        var scenes = p.scene_type.map(function (t) {
          return '<span>' + esc(t) + '</span>';
        }).join('');

        var feats = p.features.map(function (t) {
          return '<li>' + TICK + esc(t) + '</li>';
        }).join('');

        card.innerHTML =
          '<header>'
          + '<h3>' + esc(p.plan_name) + '<i>' + esc(p.plan_name_zh) + '</i></h3>'
          + '<p class="pr-tagline">' + esc(p.tagline_zh) + '</p>'
          + '</header>'
          + priceHtml
          + '<div class="pr-facts">' + facts + '</div>'
          + '<div class="pr-scenetags">' + scenes + '</div>'
          + '<button type="button" class="pr-cta' + (p.cta_type === 'quote' ? ' is-quote' : '')
          + '" data-sales-plan="' + esc(p.plan_id) + '">' + esc(p.cta) + ARROW + '</button>'
          + "<details class=\"pr-feats\"><summary>See all features<i></i></summary>"
          + '<ul>' + feats + '</ul></details>';

        pricingRoot.appendChild(card);
      });

      var note = document.querySelector('.pr-disclaimer');
      if (note) note.textContent = CFG.disclaimer_zh;
    }

    /* ---------- 配置器 ---------- */

    /* 设备数和用户数用数字输入框，不用下拉。
       配置说明里那个例子是「12 台设备」，而给的下拉选项是
       1/2/5/10/20/50/100，根本选不出 12 来。 */
    function control(label, zh, id, optsHtml, isNumber, value, max) {
      if (isNumber) {
        return '<label class="pr-ctl"><span>' + esc(label) + '<i>' + esc(zh) + '</i></span>'
          + '<input type="number" id="' + id + '" min="1" max="' + max + '" step="1" value="' + value + '"></label>';
      }
      return '<label class="pr-ctl"><span>' + esc(label) + '<i>' + esc(zh) + '</i></span>'
        + '<select id="' + id + '">' + optsHtml + '</select></label>';
    }

    function opts(list, key, selected) {
      return list.map(function (o, i) {
        var v = o[key];
        return '<option value="' + (v == null ? '' : v) + '"'
          + (i === selected ? ' selected' : '') + '>' + esc(o.label) + '</option>';
      }).join('');
    }

    function renderBuilder() {
      var form = document.querySelector('.pr-controls');
      if (!form) return;
      var c = CFG.configurator;

      form.innerHTML =
        "<label class=\"pr-ctl\"><span>Scene<i></i></span><select id=\"pr-scene\">"
        + CFG.scenes.map(function (s) {
            return '<option value="' + s.id + '">' + esc(s.name) + ' · ' + esc(s.zh) + '</option>';
          }).join('')
        + '</select></label>'
        + control('Storage', "Storage", 'pr-gb', opts(c.storage, 'gb', 3), false)
        + control('Original Content Retention', "Original content retention", 'pr-days', opts(c.original_retention, 'days', 3), false)
        + control('AI Memory Retention', "AI Memory retention", 'pr-years', opts(c.ai_memory, 'years', 2), false)
        + control('Devices', "Devices", 'pr-dev', '', true, 10, 9999)
        + control('Users', "Users", 'pr-usr', '', true, 10, 9999)
        + control('AI Processing', "AI processing", 'pr-tier', opts(c.ai_processing, 'tier', 0), false);

      var sceneSel = form.querySelector('#pr-scene');
      if (sceneSel) sceneSel.value = scene === 'enterprise' ? 'enterprise' : scene;
      updateQuote();
    }

    function readBuilder() {
      function num(id) {
        var n = document.getElementById(id);
        if (!n) return null;
        return n.value === '' ? null : Number(n.value);
      }
      return {
        scene: (document.getElementById('pr-scene') || {}).value || 'business',
        gb: num('pr-gb'),
        days: num('pr-days'),
        years: num('pr-years'),
        devices: num('pr-dev'),
        users: num('pr-usr'),
        tier: (document.getElementById('pr-tier') || {}).value || 'standard'
      };
    }

    function labelFor(list, key, val) {
      var hit = null;
      list.forEach(function (o) { if (o[key] === val) hit = o.label; });
      return hit || (val == null ? 'Custom' : String(val));
    }

    function updateQuote() {
      var box = document.querySelector('.pr-quote');
      if (!box || !CFG) return;
      var cfg = readBuilder();
      var c = CFG.configurator;
      var raw = calc(cfg);
      var per = raw == null ? null : cycled(raw);
      var sceneName = 'Custom';
      CFG.scenes.forEach(function (s) { if (s.id === cfg.scene) sceneName = s.name; });

      var rows = [
        ['Storage', "Storage", labelFor(c.storage, 'gb', cfg.gb)],
        ['Original Content', "Original content", labelFor(c.original_retention, 'days', cfg.days)],
        ['AI Memory', "AI Memory", labelFor(c.ai_memory, 'years', cfg.years)],
        ['Devices', "Devices", cfg.devices == null ? 'Custom' : String(cfg.devices)],
        ['Users', "Users", cfg.users == null ? 'Custom' : String(cfg.users)],
        ['AI Processing', "AI processing", labelFor(c.ai_processing, 'tier', cfg.tier)]
      ].map(function (r) {
        return '<div><span>' + esc(r[0]) + '<i>' + esc(r[1]) + '</i></span><b>' + esc(r[2]) + '</b></div>';
      }).join('');

      var priceBlock, cta;
      if (per == null) {
        priceBlock = '<div class="pr-quote-price is-custom"><b>Custom</b>'
          + "<span>This configuration needs a custom quote</span></div>";
        cta = '<button type="button" class="primary" data-sales-build="1">Request Quote</button>';
      } else {
        priceBlock = '<div class="pr-quote-price"><b>' + money(per) + '</b><span>/ month</span>'
          + (cycle === 'yearly'
              ? "<em>Billed annually " + money(yearlyTotal(raw)) + " / year</em>"
              : "<em>Billed monthly</em>")
          + '</div>';
        cta = '<button type="button" class="primary" data-sales-build="1">Continue</button>';
      }

      box.innerHTML =
        '<div class="pr-quote-head"><span class="eyebrow">YOUR PLAN</span>'
        + '<h3>' + esc(sceneName) + '</h3></div>'
        + '<div class="pr-quote-rows">' + rows + '</div>'
        + "<div class=\"pr-quote-label\">Estimated Monthly Price<i></i></div>"
        + priceBlock + cta
        + '<p class="pr-quote-note">' + esc(CFG.disclaimer_zh) + '</p>';

      syncSticky(per, sceneName);
    }

    /* ---------- 手机端底部价格条 ---------- */
    /* 配置器在手机上要滚很长，价格在屏幕外就等于没有。
       钉一条在底部，改一个选项立刻能看到钱怎么变。 */
    function syncSticky(per, sceneName) {
      var bar = document.querySelector('.pr-sticky');
      if (!bar) return;
      var b = bar.querySelector('b'), s = bar.querySelector('span');
      var act = bar.querySelector('.pr-sticky-cta');
      if (per == null) {
        b.textContent = 'Custom';
        s.textContent = sceneName + " · custom quote";
        if (act) act.textContent = 'Request Quote';
      } else {
        b.textContent = money(per) + ' / month';
        s.textContent = sceneName + (cycle === 'yearly' ? " · yearly" : " · monthly");
        if (act) act.textContent = 'Continue';
      }
    }

    function watchSticky() {
      var bar = document.querySelector('.pr-sticky');
      var build = document.getElementById('build');
      if (!bar || !build || !window.IntersectionObserver) return;
      /* 只在配置器露出来的时候才钉，别一进页面就挡着 */
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { bar.hidden = !e.isIntersecting; });
      }, { rootMargin: '-40% 0px -20% 0px' }).observe(build);
    }

    /* ---------- 保存周期时间轴 ---------- */
    function renderTimelines() {
      var host = document.querySelector('.pr-timelines');
      if (!host) return;
      var t = CFG.timeline;

      function line(d, cls, extra) {
        return '<article class="pr-line ' + cls + '">'
          + '<h3>' + esc(d.title) + '<i>' + esc(d.title_zh) + '</i></h3>'
          + '<p>' + esc(d.note_zh) + '</p>'
          + '<div class="pr-track">'
          + d.marks.map(function (m, i) {
              return '<span style="--i:' + i + '">' + esc(m) + '</span>';
            }).join('')
          + '</div>'
          + '<div class="pr-kinds">'
          + d.kinds.map(function (k) { return '<span>' + esc(k) + '</span>'; }).join('')
          + '</div>' + (extra || '') + '</article>';
      }

      var endings = "<div class=\"pr-endings\"><b>On expiry</b>"
        + t.original.endings.map(function (e) { return '<span>' + esc(e) + '</span>'; }).join('')
        + '</div>';

      host.innerHTML = line(t.original, 'is-original', endings)
        + line(t.memory, 'is-memory', '');
    }

    /* ---------- 加购 ---------- */
    function renderAddons() {
      var host = document.querySelector('.pr-addons');
      if (!host) return;
      host.innerHTML = CFG.addons.map(function (g) {
        return '<article class="pr-addon">'
          + '<h3>' + esc(g.title) + '<i>' + esc(g.title_zh) + '</i></h3>'
          + '<ul>' + g.items.map(function (it) {
              var right = it.from == null
                ? (it.note ? esc(it.note) : "On request")
                : (it.from === 0 ? "Included" : 'From ' + money(it.from));
              return '<li><span>' + esc(it.label) + '</span><b>' + right + '</b></li>';
            }).join('') + '</ul></article>';
      }).join('');
    }

    /* ---------- 销售对接窗口 ---------- */
    /* 原来所有 CTA 都指向 careers.html#contact——想买东西的人被丢进
       招聘表单，问的还是「你想以什么身份加入」。这里是独立的窗口，
       写进独立的 sales_enquiries 表，跟招聘线索完全分开。

       窗口带着用户刚才配的东西一起提交（哪一档、多少存储、留多久、
       几台设备、页面上显示的预估价），销售不用再回头问一遍。 */

    var salesCtx = null;
    var salesOpener = null;

    /* 从一张套餐卡取配置快照 */
    function ctxFromPlan(planId) {
      var hit = null;
      CFG.plans.forEach(function (p) { if (p.plan_id === planId) hit = p; });
      if (!hit) return { plan: planId };
      return {
        plan: hit.plan_id,
        planName: hit.plan_name,
        billing_cycle: cycle,
        storage_gb: hit.storage_gb,
        retention_days: hit.original_retention_days,
        memory_years: hit.ai_memory_retention_years,
        devices: hit.device_limit,
        seats: hit.user_limit,
        ai_tier: 'standard',
        est_price: hit.monthly_price == null ? null : cycled(hit.monthly_price)
      };
    }

    /* 从配置器取配置快照 */
    function ctxFromBuilder() {
      var c = readBuilder();
      var raw = calc(c);
      var name = 'Custom';
      CFG.scenes.forEach(function (x) { if (x.id === c.scene) name = x.name; });
      return {
        plan: c.scene,
        planName: name,
        billing_cycle: cycle,
        storage_gb: c.gb,
        retention_days: c.days,
        memory_years: c.years,
        devices: c.devices,
        seats: c.users,
        ai_tier: c.tier,
        est_price: raw == null ? null : cycled(raw)
      };
    }

    function ctxSummary(ctx) {
      var cc = CFG.configurator;
      var rows = [
        ["Plan", ctx.planName || ctx.plan],
        ["Storage", ctx.storage_gb == null ? "TBD" : labelFor(cc.storage, 'gb', ctx.storage_gb)],
        ["Original content", ctx.retention_days == null ? "TBD" : labelFor(cc.original_retention, 'days', ctx.retention_days)],
        ["AI Memory", ctx.memory_years == null ? "TBD" : labelFor(cc.ai_memory, 'years', ctx.memory_years)],
        ["Devices / Users", (ctx.devices == null ? "TBD" : ctx.devices) + ' / ' + (ctx.seats == null ? "TBD" : ctx.seats)],
        ["Billing", ctx.billing_cycle === 'yearly' ? "Yearly" : "Monthly"],
        ["Estimated monthly", ctx.est_price == null ? "Custom quote" : money(ctx.est_price)]
      ];
      return rows.map(function (r) {
        return '<div><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>';
      }).join('');
    }

    function salesModal() {
      var m = document.getElementById('eo-sales');
      if (m) return m;

      m = el('div', 'eo-sales');
      m.id = 'eo-sales';
      m.setAttribute('role', 'dialog');
      m.setAttribute('aria-modal', 'true');
      m.setAttribute('aria-labelledby', 'eo-sales-h');
      m.innerHTML =
        '<div class="eo-sales-back" data-sales-close="1"></div>'
        + '<div class="eo-sales-panel">'
        + "<button type=\"button\" class=\"eo-sales-x\" data-sales-close=\"1\" aria-label=\"Close\">"
        + '<svg class="ic" viewBox="0 0 256 256"><use href="#eo-x"/></svg></button>'
        + '<span class="eyebrow">TALK TO SALES</span>'
        + "<h2 id=\"eo-sales-h\">Tell us about your site</h2>"
        + "<p class=\"eo-sales-lead\">The configuration you just built comes with it, so there is no need to describe it again. "
        + "We will come back with a workable configuration and a quote, and say so plainly if it is not a fit.</p>"
        + '<div class="eo-sales-ctx"></div>'
        /* 只问四件事。配置那一块已经把「要什么」说清楚了，
           这里再摆一屏公司职位地区，只会让人关掉窗口。 */
        + '<form class="eo-sales-form" novalidate>'
        + '<div class="field-grid">'
        + "<label class=\"field\">Name *<input name=\"name\" required autocomplete=\"name\"></label>"
        + "<label class=\"field\">Email *<input name=\"email\" type=\"email\" required autocomplete=\"email\"></label>"
        + '</div>'
        + "<label class=\"field stack\">How to reach you"
        + "<input name=\"phone\" autocomplete=\"tel\" placeholder=\"Phone / WhatsApp / WeChat — whichever suits you\">"
        + '</label>'
        + "<label class=\"field stack\">What you need it for"
        + "<textarea name=\"message\" rows=\"4\" placeholder=\"What setting, roughly what scale. A sentence or two is enough.\"></textarea></label>"
        /* 蜜罐：移出视口而不是 display:none——有些机器人会跳过被隐藏的字段 */
        + "<div class=\"hp\" aria-hidden=\"true\"><label>Company website"
        + '<input name="company_website" tabindex="-1" autocomplete="off"></label></div>'
        + '<label class="consent"><input type="checkbox" name="consent" required>'
        + "<span>I agree that Earthory may store and use the information above to contact me. See "
        + "<a href=\"privacy.html\">Privacy &amp; Security</a>.</span></label>"
        + "<button type=\"submit\" class=\"primary\">Send</button>"
        + '<div class="eo-sales-result" hidden></div>'
        + '</form></div>';
      document.body.appendChild(m);
      return m;
    }

    function closeSales() {
      var m = document.getElementById('eo-sales');
      if (!m || !m.classList.contains('is-open')) return;
      m.classList.remove('is-open');
      document.documentElement.classList.remove('eo-mnav-lock');
      if (salesOpener && salesOpener.focus) salesOpener.focus();
      salesOpener = null;
      if (location.hash === '#sales') {
        history.replaceState(null, '', location.pathname + location.search);
      }
    }

    function openSales(ctx, opener) {
      salesCtx = ctx;
      var m = salesModal();
      m.querySelector('.eo-sales-ctx').innerHTML = ctxSummary(ctx);
      var res = m.querySelector('.eo-sales-result');
      res.hidden = true;
      res.className = 'eo-sales-result';
      m.querySelector('.eo-sales-form').hidden = false;
      m.classList.add('is-open');
      /* 复用移动端菜单那把滚动锁，样式已经有了 */
      document.documentElement.classList.add('eo-mnav-lock');
      salesOpener = opener || null;
      var first = m.querySelector('input[name="name"]');
      if (first) first.focus();
    }

    function submitSales(form) {
      var m = document.getElementById('eo-sales');
      var res = m.querySelector('.eo-sales-result');
      var btn = form.querySelector('button[type="submit"]');
      var data = {};
      ['name', 'email', 'phone', 'message', 'company_website']
        .forEach(function (k) {
          var n = form.querySelector('[name="' + k + '"]');
          data[k] = n ? n.value.trim() : '';
        });

      if (!data.name) { showSales(res, 'is-error', "One more thing", "Please tell us your name."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        showSales(res, 'is-error', "One more thing", "That email does not look right, so we would not be able to reply."); return;
      }
      if (!form.querySelector('[name="consent"]').checked) {
        showSales(res, 'is-error', "One more thing", "Please tick the box so we can store your contact details."); return;
      }

      /* 配置快照跟着一起走，销售不用回头再问一遍 */
      data.plan = salesCtx.plan;
      data.billing_cycle = salesCtx.billing_cycle;
      data.storage_gb = salesCtx.storage_gb;
      data.retention_days = salesCtx.retention_days;
      data.memory_years = salesCtx.memory_years;
      data.devices = salesCtx.devices;
      data.seats = salesCtx.seats;
      data.ai_tier = salesCtx.ai_tier;
      data.est_price = salesCtx.est_price;
      data.currency = CFG.currency;
      data.consent = true;
      data.source = location.pathname;

      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Sending…";

      fetch(SALES_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        return r.json().then(function (j) { return { ok: r.ok, body: j }; });
      }).then(function (r) {
        if (r.ok && r.body && r.body.ok) {
          form.hidden = true;
          showSales(res, 'is-done', "Got it",
            "We will reply within a working day or two. If it is urgent, write to sales@earthory.com.");
        } else {
          showSales(res, 'is-error', "Could not send",
            (r.body && r.body.error) || "The service is not responding. Please try again shortly.");
        }
      }).catch(function () {
        showSales(res, 'is-error', "Could not send", "No network connection.");
      }).then(function () {
        btn.disabled = false;
        btn.textContent = label;
      });
    }

    function showSales(res, cls, title, text) {
      res.className = 'eo-sales-result ' + cls;
      res.innerHTML = '<h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>';
      res.hidden = false;
    }

    /* ---------- 事件 ---------- */
    document.addEventListener('click', function (e) {
      var t = e.target;

      var cyc = t.closest ? t.closest('.pr-cycle button') : null;
      if (cyc) {
        cycle = cyc.dataset.cycle;
        var btns = document.querySelectorAll('.pr-cycle button');
        for (var i = 0; i < btns.length; i++) {
          var on = btns[i] === cyc;
          btns[i].classList.toggle('is-on', on);
          btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
        }
        renderCards();
        updateQuote();
        return;
      }

      /* 套餐卡上的按钮 */
      var pc = t.closest ? t.closest('[data-sales-plan]') : null;
      if (pc) { openSales(ctxFromPlan(pc.dataset.salesPlan), pc); return; }

      /* 配置器和底部固定条上的按钮 */
      var bc = t.closest ? t.closest('[data-sales-build]') : null;
      if (bc) { openSales(ctxFromBuilder(), bc); return; }

      if (t.closest && t.closest('[data-sales-close]')) { closeSales(); return; }

      var tab = t.closest ? t.closest('.pr-scenes button') : null;
      if (tab) {
        scene = tab.dataset.scene;
        renderScenes();
        renderCards();
        var sel = document.getElementById('pr-scene');
        if (sel && scene !== 'enterprise') { sel.value = scene; updateQuote(); }
        return;
      }
    });

    document.addEventListener('submit', function (e) {
      if (e.target.classList && e.target.classList.contains('eo-sales-form')) {
        e.preventDefault();
        submitSales(e.target);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) closeSales();
    });

    document.addEventListener('change', function (e) {
      if (e.target.closest && e.target.closest('.pr-controls')) updateQuote();
    });
    document.addEventListener('input', function (e) {
      if (e.target.closest && e.target.closest('.pr-controls')) updateQuote();
    });

    /* ---------- 启动 ---------- */
    function boot(data) {
      CFG = data;
      renderScenes();
      renderCards();
      renderBuilder();
      renderTimelines();
      renderAddons();
      watchSticky();
      /* 从别处链过来的 pricing.html#sales 直接把窗口打开 */
      if (location.hash === '#sales') openSales(ctxFromBuilder(), null);
      /* 内容是后插的，让进场动效重新扫一遍 */
      if (window.EarthoryMotion && window.EarthoryMotion.rescan) window.EarthoryMotion.rescan();
    }

    fetch(CONFIG_URL, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(boot)
      .catch(function (err) {
        /* file:// 打开时 fetch 会被浏览器挡掉，本地预览要起个 http 服务 */
        pricingRoot.innerHTML =
          "<p class=\"pr-note\">Pricing could not be loaded (" + esc(err.message) + ")."
          + "For local preview run <code>python -m http.server</code>, "
          + "Opening the HTML file directly blocks the browser from reading the config.<br>"
          + "For a quote, write to <a href=\"mailto:sales@earthory.com\">sales@earthory.com</a>.</p>";
      });
  }

})();
