<template>
  <div class="browser-view" style="position: absolute; inset: 0; display: flex; flex-direction: column; background: #1a1a1f;">
    <div class="browser-toolbar d-flex align-items-center gap-1 px-2 py-1" style="background: #0d0d12; border-bottom: 1px solid rgba(255,255,255,0.06); min-height: 36px;">
      <button class="btn btn-icon btn-sm text-white" title="Back to Player" @click="$emit('back')">
        <IconArrowLeft />
      </button>
      <button class="btn btn-icon btn-sm text-white-50" title="Back" :disabled="!activeTab?.canGoBack" @click="goBack">
        <IconArrowNarrowLeft />
      </button>
      <button class="btn btn-icon btn-sm text-white-50" title="Forward" :disabled="!activeTab?.canGoForward" @click="goForward">
        <IconArrowNarrowRight />
      </button>
      <button class="btn btn-icon btn-sm text-white-50" title="Refresh" @click="reload">
        <IconRefresh />
      </button>
      <div class="flex-grow-1 position-relative mx-2">
        <input
          ref="urlInput"
          class="form-control form-control-sm"
          style="--tblr-form-control-bg: #111; --tblr-form-control-color: #fff; --tblr-form-control-border-color: #333; border-radius: 16px; padding: 2px 12px; font-size: 13px;"
          :value="urlInputValue"
          @keydown.enter="navigate"
          @focus="$event.target.select()"
          @input="urlInputValue = $event.target.value"
        />
        <div v-if="activeTab?.isLoading" class="position-absolute" style="right: 10px; top: 50%; transform: translateY(-50%);">
          <div class="spinner-border spinner-border-sm text-primary" style="width: 12px; height: 12px;" role="status"></div>
        </div>
      </div>
      <button class="btn btn-icon btn-sm text-white-50" title="New Tab" @click="addTab">
        <IconPlus />
      </button>
    </div>

    <div class="browser-tabs d-flex align-items-end" style="background: #0d0d12; min-height: 32px; overflow-x: auto; border-bottom: 1px solid rgba(255,255,255,0.04);">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="browser-tab d-flex align-items-center gap-1 px-2 py-1"
        :class="{ active: tab.id === activeTabId }"
        style="cursor: pointer; max-width: 180px; min-width: 80px; border-radius: 4px 4px 0 0; margin: 2px 1px 0; font-size: 12px; user-select: none;"
        :style="tab.id === activeTabId ? 'background: #1a1a1f; color: #fff;' : 'color: rgba(255,255,255,0.5);'"
        @click="activeTabId = tab.id"
        @mousedown.middle.prevent="closeTab(tab.id)"
      >
        <IconWorld size="14" class="flex-shrink-0" />
        <span class="text-truncate">{{ tab.title || 'New Tab' }}</span>
        <button class="btn btn-icon btn-sm p-0 tab-close" style="width: 16px; height: 16px; opacity: 0.6;" @click.stop="closeTab(tab.id)">×</button>
      </div>
    </div>

    <div class="flex-grow-1 position-relative" style="background: #fff;">
      <webview
        v-for="tab in tabs"
        :key="tab.id"
        :ref="(el) => setWebviewRef(tab.id, el)"
        v-show="tab.id === activeTabId"
        :src="tab.url || 'about:blank'"
        :partition="tab.partition"
        allowpopups
        style="position: absolute; inset: 0; width: 100%; height: 100%;"
      ></webview>
      <div v-if="tabs.length === 0" class="d-flex flex-column align-items-center justify-content-center h-100 text-muted gap-3" style="background: #1a1a1f;">
        <IconWorld size="48" style="opacity: 0.3;" />
        <span>No tabs open</span>
        <button class="btn btn-primary btn-sm" @click="addTab">New Tab</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import {
  IconArrowLeft, IconArrowNarrowLeft, IconArrowNarrowRight,
  IconRefresh, IconPlus, IconWorld
} from '@tabler/icons-vue';

const emit = defineEmits(['back']);

const tabs = ref([]);
const activeTabId = ref(null);
const urlInputValue = ref('');
const webviewRefs = {};
let tabCounter = 0;

const activeTab = computed(() => tabs.value.find(t => t.id === activeTabId.value));

function setWebviewRef(id, el) {
  if (el) {
    webviewRefs[id] = el;
    el.addEventListener('did-start-loading', () => onLoading(id, true));
    el.addEventListener('did-stop-loading', () => onLoading(id, false));
    el.addEventListener('page-title-updated', (e) => onTitle(id, e.title));
    el.addEventListener('did-navigate', (e) => onNavigate(id, e.url));
    el.addEventListener('did-navigate-in-page', (e) => { if (e.isMainFrame) onNavigateInPage(id, e.url); });
  } else {
    delete webviewRefs[id];
  }
}

watch(activeTabId, (newId) => {
  if (newId) {
    const tab = tabs.value.find(t => t.id === newId);
    if (tab) urlInputValue.value = tab.url || '';
  }
});

function addTab(url) {
  const id = ++tabCounter;
  tabs.value.push({
    id,
    url: url || '',
    title: '',
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    partition: 'persist:browser'
  });
  activeTabId.value = id;
  urlInputValue.value = url || '';
}

function closeTab(id) {
  const idx = tabs.value.findIndex(t => t.id === id);
  if (idx === -1) return;
  delete webviewRefs[id];
  tabs.value.splice(idx, 1);
  if (tabs.value.length === 0) {
    activeTabId.value = null;
    urlInputValue.value = '';
    return;
  }
  if (activeTabId.value === id) {
    const newIdx = Math.min(idx, tabs.value.length - 1);
    activeTabId.value = tabs.value[newIdx].id;
  }
}

function getWebview(id) {
  return webviewRefs[id];
}

function navigate() {
  const tab = activeTab.value;
  if (!tab) return;
  let url = urlInputValue.value.trim();
  if (!url) return;
  if (!url.includes('://')) {
    if (url.includes('.') && !url.includes(' ')) url = 'https://' + url;
    else url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
  }
  tab.url = url;
  urlInputValue.value = url;
  const wv = getWebview(tab.id);
  if (wv) wv.loadURL(url);
}

function goBack() {
  const wv = getWebview(activeTabId.value);
  if (wv?.canGoBack()) wv.goBack();
}

function goForward() {
  const wv = getWebview(activeTabId.value);
  if (wv?.canGoForward()) wv.goForward();
}

function reload() {
  const wv = getWebview(activeTabId.value);
  if (wv) wv.reload();
}

function onLoading(id, val) {
  const tab = tabs.value.find(t => t.id === id);
  if (tab) tab.isLoading = val;
}

function onTitle(id, title) {
  const tab = tabs.value.find(t => t.id === id);
  if (tab) tab.title = title;
}

function onNavigate(id, url) {
  const tab = tabs.value.find(t => t.id === id);
  if (tab) {
    tab.url = url;
    tab.canGoBack = getWebview(id)?.canGoBack() ?? false;
    tab.canGoForward = getWebview(id)?.canGoForward() ?? false;
    if (id === activeTabId.value) urlInputValue.value = url;
  }
}

function onNavigateInPage(id, url) {
  const tab = tabs.value.find(t => t.id === id);
  if (tab && id === activeTabId.value) urlInputValue.value = url;
}

function openBrowser(url) {
  if (tabs.value.length === 0) {
    addTab(url);
  } else {
    if (url) {
      const tab = activeTab.value;
      if (tab) {
        tab.url = url;
        urlInputValue.value = url;
        const wv = getWebview(tab.id);
        if (wv) wv.loadURL(url);
      }
    }
  }
}

defineExpose({ addTab, openBrowser });
</script>

<style scoped>
.browser-tab:hover { background: rgba(255,255,255,0.05); }
.tab-close:hover { opacity: 1 !important; background: rgba(255,255,255,0.1); border-radius: 2px; }
</style>
