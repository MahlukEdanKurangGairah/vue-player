import { createApp } from 'vue';
import App from './App.vue';

// Tabler CSS
import '@tabler/core/dist/css/tabler.min.css';
// Bootstrap JS (tooltips, offcanvas, toast)
import 'bootstrap';

const app = createApp(App);
app.mount('#app');
