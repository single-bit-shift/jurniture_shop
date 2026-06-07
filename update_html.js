const fs = require('fs');
['categories.html', 'product.html', 'admin.html'].forEach(f => {
    let p = 'public/' + f;
    let html = fs.readFileSync(p, 'utf8');
    html = html.replace('</body></html>', `<script src="/js/api.js"></script><script src="/js/${f.replace('.html', '.js')}"></script></body></html>`);
    fs.writeFileSync(p, html);
});
console.log('HTML files updated with scripts.');
