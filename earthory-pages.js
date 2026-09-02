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
      '<button class="modal-close" aria-label="关闭">' + icon('eo-x') + '</button>' +
      '<div class="success">' + icon('eo-check-circle') +
      '<h3>已收到</h3>' +
      '<p>感谢你留下联系方式，我们会尽快与你联系。</p>' +
      '<button class="primary" type="button">完成</button>' +
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
        '<button class="modal-close" aria-label="关闭">' + icon('eo-x') + '</button>' +
        '<span class="eyebrow">' + (opts.eyebrow || 'STAY IN TOUCH') + '</span>' +
        '<h3>' + (opts.title || '留下联系方式') + '</h3>' +
        '<p>' + (opts.note || '新版本、开放名额或工程样机可以体验时，我们会第一时间通知你。') + '</p>' +
        '<form>' +
          '<label>称呼<input required placeholder="你的姓名"></label>' +
          '<label>邮箱或手机<input required placeholder="邮箱或手机号"></label>' +
          '<label>' + (opts.field || '你最希望找回什么（选填）') +
            '<textarea placeholder="' +
            (opts.placeholder || '例如：家人的重要时刻、工作中的约定、物品放在哪里……') +
            '"></textarea></label>' +
          '<button class="primary" type="submit">提交</button>' +
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
      '?subject=' + encodeURIComponent('应聘：' + a.getAttribute('data-role'));
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
      return picked ? picked.value : '其他';
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
      box.innerHTML = '<h3>没有提交成功</h3><p></p>';
      box.querySelector('p').textContent =
        msg + '　你也可以直接写信到 hello@earthory.com。';
    }

    function showDone() {
      var box = panel();
      box.className = 'join-result is-done';
      box.innerHTML =
        '<h3>收到了</h3>' +
        '<p>我们会尽快与你联系。想补充材料的话，直接写信到 ' +
        '<a href="mailto:hello@earthory.com">hello@earthory.com</a> 即可。</p>';
    }

    /* 没配后端时的退路：把内容整理好让对方自己复制。
       早期版本试过塞进 mailto 的 body，但中文经百分号编码后一个字
       占 9 个字节，两百来字就超出邮件客户端的地址长度上限被静默截断。
       渠道页丢掉半封信比没有表单还糟，所以改成显式复制。 */
    function showCopy() {
      var text = [
        '关系类型：' + relation(), '',
        '姓名：' + (field('name') || '（未填）'),
        '公司 / 机构：' + (field('org') || '（未填）'),
        '国家 / 地区：' + (field('region') || '（未填）'),
        '电子邮箱：' + (field('email') || '（未填）'),
        '主页 / LinkedIn：' + (field('link') || '（未填）'), '',
        '── 能为 Earthory 带来什么 ──', field('bring') || '（未填）', '',
        '── 希望一起完成什么 ──', field('goal') || '（未填）', '',
        '── 相关案例、作品或资源 ──', field('work') || '（未填）'
      ].join('\n');

      var box = panel();
      box.className = 'join-result';
      box.innerHTML =
        '<h3>内容已整理好</h3>' +
        '<p>请把下面的内容发到 <a href="mailto:hello@earthory.com">hello@earthory.com</a>。</p>' +
        '<textarea readonly rows="12"></textarea>' +
        '<div class="join-result-actions">' +
        '<button type="button" class="copy">复制内容</button>' +
        '<a class="mailto" href="mailto:hello@earthory.com">打开邮件客户端</a>' +
        '</div>';
      box.querySelector('textarea').value = text;
      box.querySelector('.copy').addEventListener('click', function () {
        var ta = box.querySelector('textarea');
        var btn = this;
        function ok() {
          btn.textContent = '已复制';
          setTimeout(function () { btn.textContent = '复制内容'; }, 2200);
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
      if (btn) { btn.disabled = true; btn.textContent = '提交中…'; }

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
          showError((r.data && r.data.error) || '服务暂时没有响应。');
        }
      }).catch(function () {
        showError('网络没有连上。');
      }).then(function () {
        if (btn) { btn.disabled = false; btn.textContent = label; }
      });
    });
  }
})();
