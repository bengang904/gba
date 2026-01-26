"use strict";

/* ================= 工具函数 ================= */

function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
}

function downloadFile(url, callback) {
    var ajax = new XMLHttpRequest();
    ajax.onload = callback;
    ajax.open("GET", url, true);
    ajax.responseType = "arraybuffer";
    ajax.overrideMimeType("text/plain; charset=x-user-defined");
    ajax.send(null);
}

function processDownload(xhr, attachHandler) {
    try {
        attachHandler(new Uint8Array(xhr.response));
    } catch (e) {
        var data = xhr.responseText;
        var arr = [];
        for (var i = 0; i < data.length; i++) {
            arr[i] = data.charCodeAt(i) & 0xff;
        }
        attachHandler(arr);
    }
}

/* ================= GBA 加载 ================= */

function attachBIOS(data) {
    Iodine.attachBIOS(data);
}

function attachROM(data) {
    Iodine.attachROM(data);
}

/* ================= 全局变量 ================= */

var Iodine = null;
var Blitter = null;
var Mixer = null;
var MixerInput = null;
var timerID = null;

/* ================= 页面入口 ================= */

window.onload = function () {
    var romUrl = getQueryParam("url");
    if (!romUrl) {
        alert("Missing ?url=xxx.gba");
        return;
    }

    Iodine = new GameBoyAdvanceEmulator();

    registerBlitterHandler();
    registerAudioHandler();
    registerGUIEvents();

    Iodine.enableAudio();

    showTempString("Loading BIOS...");
    downloadBIOS(romUrl);
};

/* ================= BIOS ================= */

function downloadBIOS(romUrl) {
    downloadFile("Binaries/gba_bios.bin", function () {
        processDownload(this, attachBIOS);
        downloadROM(romUrl);
    });
}

/* ================= ROM ================= */

function downloadROM(url) {
    Iodine.pause();
    showTempString("Downloading ROM...");
    downloadFile(url, registerROM);
}

function registerROM() {
    clearTempString();
    processDownload(this, attachROM);

    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        Iodine.disableAudio();
    }

    document.title = "GBA Emulator";
    Iodine.play();
}

/* ================= 图像 ================= */

function registerBlitterHandler() {
    Blitter = new GlueCodeGfx();
    Blitter.attachCanvas(document.getElementById("emulator_target"));
    Blitter.setSmoothScaling(false);

    Iodine.attachGraphicsFrameHandler(function (buffer) {
        Blitter.copyBuffer(buffer);
    });
}

/* ================= 音频 ================= */

function registerAudioHandler() {
    Mixer = new GlueCodeMixer();
    MixerInput = new GlueCodeMixerInput(Mixer);
    Iodine.attachAudioHandler(MixerInput);
}

/* ================= 输入 & UI ================= */

function registerGUIEvents() {
    addEvent("keydown", document, keyDown);
    addEvent("keyup", document, keyUpPreprocess);
    addEvent("unload", window, ExportSave);

    Iodine.attachSpeedHandler(function (speed) {
        document.title = "GBA Emulator - " + speed;
    });
}

/* ================= 提示文本 ================= */

function showTempString(text) {
    var el = document.getElementById("tempMessage");
    if (!el) return;
    el.style.display = "block";
    el.textContent = text;
}

function clearTempString() {
    var el = document.getElementById("tempMessage");
    if (!el) return;
    el.style.display = "none";
}

/* ================= 事件兼容 ================= */

function addEvent(event, element, handler) {
    try {
        element.addEventListener(event, handler, false);
    } catch (e) {
        element.attachEvent("on" + event, handler);
    }
}

function removeEvent(event, element, handler) {
    try {
        element.removeEventListener(event, handler, false);
    } catch (e) {
        element.detachEvent("on" + event, handler);
    }
}
