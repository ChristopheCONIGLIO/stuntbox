const map = document.createElement('script');
map.type = 'importmap';
map.textContent = JSON.stringify({ imports: globalThis.stuntboxImports });
document.head.append(map);
delete globalThis.stuntboxImports;
import('stuntbox/js/ui/workshop.js').catch(error => {
  document.getElementById('status').textContent = error.message;
  console.error(error);
});
