const https = require('https');
const fs = require('fs');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

const main = async () => {
  if (!fs.existsSync('public')) fs.mkdirSync('public');
  if (!fs.existsSync('public/css')) fs.mkdirSync('public/css');
  if (!fs.existsSync('public/js')) fs.mkdirSync('public/js');
  if (!fs.existsSync('public/uploads')) fs.mkdirSync('public/uploads');

  await download('https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1MWZlODVjYjA0ODQwMWE2MmQ1ZDk3MDMxOGYzEgsSBxC4meW4_hkYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMwMjQ5OTUwNjU2ODc3MTcwOQ&filename=&opi=89354086', 'public/index.html');
  await download('https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1MWZlN2Y1YTVhNzUwMzMyZmEwZTZiMTk4YTViEgsSBxC4meW4_hkYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMwMjQ5OTUwNjU2ODc3MTcwOQ&filename=&opi=89354086', 'public/login.html');
  await download('https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1MWZlODVhNWUzNGUwMmE5YjY3Y2QxMTE5ZWU2EgsSBxC4meW4_hkYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMwMjQ5OTUwNjU2ODc3MTcwOQ&filename=&opi=89354086', 'public/categories.html');
  await download('https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1MWZlODViYTMyYzQwNTQ5ZDFkYjJlMmEwMzljEgsSBxC4meW4_hkYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMwMjQ5OTUwNjU2ODc3MTcwOQ&filename=&opi=89354086', 'public/product.html');
  await download('https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1MWZlN2ZhYmUxMWMwMzMyZWQyZmM5MWMyNDk0EgsSBxC4meW4_hkYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMwMjQ5OTUwNjU2ODc3MTcwOQ&filename=&opi=89354086', 'public/admin.html');
  console.log('Downloaded all HTML files.');
};

main();
